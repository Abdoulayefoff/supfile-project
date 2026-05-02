<?php

namespace App\Tests\Unit\Service\Folder;

use App\Entity\File;
use App\Entity\Folder;
use App\Entity\Share;
use App\Entity\User;
use App\Service\Folder\FolderManager;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\EntityRepository;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class FolderManagerTest extends TestCase
{
    private EntityManagerInterface&MockObject $em;
    private FolderManager $folderManager;

    protected function setUp(): void
    {
        $this->em = $this->createMock(EntityManagerInterface::class);
        $this->folderManager = new FolderManager($this->em);
    }

    private function buildUser(): User
    {
        $user = new User();
        $user->setEmail('owner@example.com');
        return $user;
    }

    private function buildFolder(string $name = 'MyFolder', ?Folder $parent = null): Folder
    {
        $folder = new Folder();
        $folder->setName($name);
        $folder->setParent($parent);
        return $folder;
    }

    // ─── Happy Path

    public function testCreateFolderPersistsAndFlushes(): void
    {
        $user = $this->buildUser();

        $folderRepo = $this->createMock(EntityRepository::class);
        $folderRepo->method('findOneBy')->willReturn(null);
        $this->em->method('getRepository')->with(Folder::class)->willReturn($folderRepo);

        $this->em->expects($this->once())->method('persist')->with($this->isInstanceOf(Folder::class));
        $this->em->expects($this->once())->method('flush');

        $folder = $this->folderManager->createFolder('Documents', $user);

        $this->assertInstanceOf(Folder::class, $folder);
        $this->assertSame('Documents', $folder->getName());
        $this->assertSame($user, $folder->getOwner());
    }

    public function testCreateFolderAtRootHasNullParent(): void
    {
        $user = $this->buildUser();

        $folderRepo = $this->createMock(EntityRepository::class);
        $folderRepo->method('findOneBy')->willReturn(null);
        $this->em->method('getRepository')->willReturn($folderRepo);
        $this->em->method('persist');
        $this->em->method('flush');

        $folder = $this->folderManager->createFolder('Root', $user, null);

        $this->assertNull($folder->getParent());
    }

    public function testCreateFolderWithParentAssignsParent(): void
    {
        $user = $this->buildUser();
        $parent = $this->buildFolder('Parent');

        $folderRepo = $this->createMock(EntityRepository::class);
        $folderRepo->method('findOneBy')->willReturn(null);
        $this->em->method('getRepository')->willReturn($folderRepo);
        $this->em->method('persist');
        $this->em->method('flush');

        $folder = $this->folderManager->createFolder('Child', $user, $parent);

        $this->assertSame($parent, $folder->getParent());
    }

    public function testRenameFolderUpdatesName(): void
    {
        $folder = $this->buildFolder('OldName');

        $this->em->expects($this->once())->method('flush');

        $this->folderManager->renameFolder($folder, 'NewName');

        $this->assertSame('NewName', $folder->getName());
    }

    public function testMoveFolderUpdatesParent(): void
    {
        $folder = $this->buildFolder('Source');
        $target = $this->buildFolder('Target');

        // Affecter des IDs distincts pour que isDescendant ne confonde pas les deux
        $reflId = new \ReflectionProperty(Folder::class, 'id');
        $reflId->setValue($folder, 10);
        $reflId->setValue($target, 20);

        $this->em->expects($this->once())->method('flush');

        $this->folderManager->moveFolder($folder, $target);

        $this->assertSame($target, $folder->getParent());
    }

    public function testMoveFolderToRootSetsNullParent(): void
    {
        $parent = $this->buildFolder('Parent');
        $folder = $this->buildFolder('Child', $parent);

        $this->em->expects($this->once())->method('flush');

        $this->folderManager->moveFolder($folder, null);

        $this->assertNull($folder->getParent());
    }

    public function testDeleteFolderSoftDeletesIt(): void
    {
        $folder = $this->buildFolder('ToDelete');

        $this->em->expects($this->once())->method('flush');

        $this->folderManager->deleteFolder($folder);

        $this->assertTrue($folder->isDeleted());
        $this->assertNotNull($folder->getDeletedAt());
    }

    public function testRestoreFolderUndoesSoftDelete(): void
    {
        $folder = $this->buildFolder('Deleted');
        $folder->softDelete();

        $this->em->expects($this->once())->method('flush');

        $this->folderManager->restoreFolder($folder);

        $this->assertFalse($folder->isDeleted());
        $this->assertNull($folder->getDeletedAt());
    }

    // ─── Sécurité — déplacement circulaire

    public function testMoveFolderThrowsWhenMovingIntoItself(): void
    {
        $folder = $this->buildFolder('Folder');

        // Simuler un getId() pour la comparaison dans isDescendant
        // On utilise la réflexion pour affecter l'id privé
        $reflId = new \ReflectionProperty(Folder::class, 'id');
        $reflId->setValue($folder, 1);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Impossible de déplacer un dossier dans lui-même');

        $this->folderManager->moveFolder($folder, $folder);
    }

    public function testMoveFolderThrowsWhenMovingIntoDescendant(): void
    {
        $parent = $this->buildFolder('Parent');
        $child = $this->buildFolder('Child', $parent);

        $reflId = new \ReflectionProperty(Folder::class, 'id');
        $reflId->setValue($parent, 1);
        $reflId->setValue($child, 2);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Impossible de déplacer un dossier dans lui-même');

        // On essaie de déplacer parent dans child (child est enfant de parent)
        $this->folderManager->moveFolder($parent, $child);
    }

    // ─── Validation

    public function testCreateFolderThrowsWhenDuplicateNameAtSameLevel(): void
    {
        $user = $this->buildUser();
        $existingFolder = $this->buildFolder('Documents');

        $folderRepo = $this->createMock(EntityRepository::class);
        $folderRepo->method('findOneBy')->willReturn($existingFolder);
        $this->em->method('getRepository')->willReturn($folderRepo);

        $this->em->expects($this->never())->method('persist');

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Un dossier avec ce nom existe déjà à cet emplacement.');

        $this->folderManager->createFolder('Documents', $user);
    }

    // ─── Suppression définitive

    public function testPermanentDeleteFolderRemovesSharesFilesAndFolder(): void
    {
        $folder = $this->buildFolder('ToDelete');
        $file = new File();
        $folderShare = new Share();
        $fileShare = new Share();

        $folderRepo = $this->createMock(EntityRepository::class);
        $folderRepo->method('findBy')->willReturn([]);

        $shareRepo = $this->createMock(EntityRepository::class);
        $shareRepo
            ->method('findBy')
            ->willReturnCallback(function ($criteria) use ($folderShare, $fileShare) {
                if (isset($criteria['folder'])) return [$folderShare];
                if (isset($criteria['file'])) return [$fileShare];
                return [];
            });

        $fileRepo = $this->createMock(EntityRepository::class);
        $fileRepo->method('findBy')->with(['folder' => $folder])->willReturn([$file]);

        $this->em
            ->method('getRepository')
            ->willReturnCallback(function ($class) use ($shareRepo, $fileRepo, $folderRepo) {
                return match ($class) {
                    Share::class  => $shareRepo,
                    File::class   => $fileRepo,
                    Folder::class => $folderRepo,
                    default       => null,
                };
            });

        $this->em->expects($this->atLeast(3))->method('remove');
        $this->em->expects($this->once())->method('flush');

        $this->folderManager->permanentDeleteFolder($folder);
    }

    // ─── Cas limites

    public function testMoveFolderToNullTargetDoesNotCallIsDescendant(): void
    {
        $folder = $this->buildFolder('Folder');

        $this->em->expects($this->once())->method('flush');

        // Pas d'exception car targetParent === null → isDescendant non appelé
        $this->folderManager->moveFolder($folder, null);

        $this->assertNull($folder->getParent());
    }
}
