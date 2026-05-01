<?php

namespace App\Tests\Unit\Service\File;

use App\Entity\File;
use App\Entity\Folder;
use App\Entity\Share;
use App\Entity\User;
use App\Service\File\FileManager;
use App\Service\Storage\FileStorageInterface;
use App\Service\User\QuotaManager;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\EntityRepository;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class FileManagerTest extends TestCase
{
    private EntityManagerInterface&MockObject $em;
    private FileStorageInterface&MockObject $fileStorage;
    private QuotaManager&MockObject $quotaManager;
    private FileManager $fileManager;

    protected function setUp(): void
    {
        $this->em = $this->createMock(EntityManagerInterface::class);
        $this->fileStorage = $this->createMock(FileStorageInterface::class);
        $this->quotaManager = $this->createMock(QuotaManager::class);
        $this->fileManager = new FileManager($this->em, $this->fileStorage, $this->quotaManager);
    }

    private function buildUploadedFile(string $name = 'test.pdf', int $size = 1024, string $mime = 'application/pdf'): UploadedFile&MockObject
    {
        $file = $this->createMock(UploadedFile::class);
        $file->method('getClientOriginalName')->willReturn($name);
        $file->method('getSize')->willReturn($size);
        $file->method('getMimeType')->willReturn($mime);
        return $file;
    }

    private function buildUser(): User
    {
        $user = new User();
        $user->setEmail('owner@example.com');
        $user->setQuotaUsed('0');
        $user->setQuotaLimit('32212254720');
        return $user;
    }

    // ─── Happy Path

    public function testUploadFilePersistsFileEntity(): void
    {
        $user = $this->buildUser();
        $uploadedFile = $this->buildUploadedFile();

        $this->quotaManager->method('checkQuota')->willReturn(true);
        $this->fileStorage->method('storeFile')->willReturn('/storage/1/abc_test.pdf');
        $this->em->expects($this->once())->method('persist')->with($this->isInstanceOf(File::class));
        $this->em->expects($this->once())->method('flush');
        $this->quotaManager->expects($this->once())->method('updateQuota')->with($user, 1024);

        $file = $this->fileManager->uploadFile($uploadedFile, $user);

        $this->assertInstanceOf(File::class, $file);
    }

    public function testUploadFileSetsCorrectMetadata(): void
    {
        $user = $this->buildUser();
        $uploadedFile = $this->buildUploadedFile('document.pdf', 2048, 'application/pdf');

        $this->quotaManager->method('checkQuota')->willReturn(true);
        $this->fileStorage->method('storeFile')->willReturn('/storage/1/xyz_document.pdf');
        $this->em->method('persist');
        $this->em->method('flush');
        $this->quotaManager->method('updateQuota');

        $file = $this->fileManager->uploadFile($uploadedFile, $user);

        $this->assertSame('document.pdf', $file->getName());
        $this->assertSame('2048', $file->getSize());
        $this->assertSame('application/pdf', $file->getMimeType());
        $this->assertSame('/storage/1/xyz_document.pdf', $file->getPath());
    }

    public function testUploadFileAssignsOwner(): void
    {
        $user = $this->buildUser();
        $uploadedFile = $this->buildUploadedFile();

        $this->quotaManager->method('checkQuota')->willReturn(true);
        $this->fileStorage->method('storeFile')->willReturn('/storage/1/file');
        $this->em->method('persist');
        $this->em->method('flush');
        $this->quotaManager->method('updateQuota');

        $file = $this->fileManager->uploadFile($uploadedFile, $user);

        $this->assertSame($user, $file->getOwner());
    }

    public function testUploadFileAssignsFolderWhenProvided(): void
    {
        $user = $this->buildUser();
        $folder = new Folder();
        $uploadedFile = $this->buildUploadedFile();

        $this->quotaManager->method('checkQuota')->willReturn(true);
        $this->fileStorage->method('storeFile')->willReturn('/storage/1/file');
        $this->em->method('persist');
        $this->em->method('flush');
        $this->quotaManager->method('updateQuota');

        $file = $this->fileManager->uploadFile($uploadedFile, $user, $folder);

        $this->assertSame($folder, $file->getFolder());
    }

    public function testDeleteFileSoftDeletesFile(): void
    {
        $file = new File();
        $file->setName('test.pdf');
        $file->setPath('/storage/1/test.pdf');
        $file->setSize('1024');
        $file->setMimeType('application/pdf');

        $this->em->expects($this->once())->method('flush');

        $this->fileManager->deleteFile($file);

        $this->assertTrue($file->isDeleted());
        $this->assertNotNull($file->getDeletedAt());
    }

    public function testRestoreFileUndoesSoftDelete(): void
    {
        $file = new File();
        $file->softDelete();

        $this->em->expects($this->once())->method('flush');

        $this->fileManager->restoreFile($file);

        $this->assertFalse($file->isDeleted());
        $this->assertNull($file->getDeletedAt());
    }

    public function testRenameFileUpdatesName(): void
    {
        $file = new File();
        $file->setName('old_name.pdf');

        $this->em->expects($this->once())->method('flush');

        $this->fileManager->renameFile($file, 'new_name.pdf');

        $this->assertSame('new_name.pdf', $file->getName());
    }

    public function testMoveFileUpdatesFolder(): void
    {
        $file = new File();
        $targetFolder = new Folder();

        $this->em->expects($this->once())->method('flush');

        $this->fileManager->moveFile($file, $targetFolder);

        $this->assertSame($targetFolder, $file->getFolder());
    }

    public function testMoveFileToRootSetsNullFolder(): void
    {
        $folder = new Folder();
        $file = new File();
        $file->setFolder($folder);

        $this->em->expects($this->once())->method('flush');

        $this->fileManager->moveFile($file, null);

        $this->assertNull($file->getFolder());
    }

    // ─── Sécurité — quota dépassé

    public function testUploadFileThrowsWhenQuotaExceeded(): void
    {
        $user = $this->buildUser();
        $uploadedFile = $this->buildUploadedFile('huge.zip', 999999999);

        $this->quotaManager->method('checkQuota')->willReturn(false);
        $this->fileStorage->expects($this->never())->method('storeFile');
        $this->em->expects($this->never())->method('persist');

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Quota de stockage dépassé.');

        $this->fileManager->uploadFile($uploadedFile, $user);
    }

    // ─── Suppression définitive

    public function testPermanentDeleteFileRemovesSharesAndFile(): void
    {
        $user = $this->buildUser();
        $file = new File();
        $file->setName('test.pdf');
        $file->setPath('/storage/1/test.pdf');
        $file->setSize('1024');
        $file->setMimeType('application/pdf');
        $file->setOwner($user);

        $share1 = new Share();

        $shareRepo = $this->createMock(EntityRepository::class);
        $shareRepo->method('findBy')->with(['file' => $file])->willReturn([$share1]);

        $this->em
            ->method('getRepository')
            ->with(Share::class)
            ->willReturn($shareRepo);

        $this->fileStorage->expects($this->once())->method('deleteFile')->with($file);
        $this->em->expects($this->atLeastOnce())->method('remove');
        $this->em->expects($this->once())->method('flush');
        $this->quotaManager->expects($this->once())->method('updateQuota')->with($user, -'1024');

        $this->fileManager->permanentDeleteFile($file);
    }

    // ─── Cas limites

    public function testUploadFileFallsBackToOctetStreamWhenMimeIsNull(): void
    {
        $user = $this->buildUser();

        $uploadedFile = $this->createMock(UploadedFile::class);
        $uploadedFile->method('getClientOriginalName')->willReturn('unknown');
        $uploadedFile->method('getSize')->willReturn(512);
        $uploadedFile->method('getMimeType')->willReturn(null); // mime inconnu

        $this->quotaManager->method('checkQuota')->willReturn(true);
        $this->fileStorage->method('storeFile')->willReturn('/storage/1/unknown');
        $this->em->method('persist');
        $this->em->method('flush');
        $this->quotaManager->method('updateQuota');

        $file = $this->fileManager->uploadFile($uploadedFile, $user);

        $this->assertSame('application/octet-stream', $file->getMimeType());
    }
}
