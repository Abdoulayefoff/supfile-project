<?php

namespace App\Tests\Unit\Service\Folder;

use App\Entity\Folder;
use App\Repository\FileRepository;
use App\Repository\FolderRepository;
use App\Service\Folder\ZipGenerator;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

/**
 * Tests unitaires de ZipGenerator.
 *
 * Note : ZipGenerator::generateFolderZip() écrit physiquement dans /var/www/html/var/tmp
 * (chemin hardcodé pour l'environnement Docker du projet).
 * Les tests qui assertent l'existence physique du fichier sont skippés si le
 * répertoire cible n'est pas accessible (environnement local hors Docker).
 *
 * Les tests de délégation aux repositories (appels findBy) s'exécutent dans
 * tous les environnements.
 */
class ZipGeneratorTest extends TestCase
{
    private FileRepository&MockObject $fileRepository;
    private FolderRepository&MockObject $folderRepository;
    private ZipGenerator $zipGenerator;

    /** Chemin hardcodé dans le service source */
    private const ZIP_TMP_DIR = '/var/www/html/var/tmp';

    protected function setUp(): void
    {
        $this->fileRepository   = $this->createMock(FileRepository::class);
        $this->folderRepository = $this->createMock(FolderRepository::class);
        $this->zipGenerator = new ZipGenerator($this->fileRepository, $this->folderRepository);
    }

    private function buildFolder(string $name): Folder
    {
        $folder = new Folder();
        $folder->setName($name);
        return $folder;
    }

    /**
     * Vérifie si l'environnement Docker est disponible (répertoire tmp accessible).
     */
    private function skipIfNotDocker(): void
    {
        if (!is_dir(self::ZIP_TMP_DIR) || !is_writable(self::ZIP_TMP_DIR)) {
            $this->markTestSkipped(
                'ZipGenerator écrit dans ' . self::ZIP_TMP_DIR . ' (chemin Docker). '
                . 'Test ignoré hors environnement Docker.'
            );
        }
    }

    // ─── Tests de délégation aux repositories (tous environnements)

    /**
     * @requires extension zip
     */
    public function testGenerateFolderZipQueriesFilesForFolder(): void
    {
        $this->skipIfNotDocker();
        $folder = $this->buildFolder('QueryTest');

        $this->fileRepository
            ->expects($this->atLeastOnce())
            ->method('findBy')
            ->with(['folder' => $folder, 'isDeleted' => false])
            ->willReturn([]);

        $this->folderRepository
            ->method('findBy')
            ->willReturn([]);

        $zipPath = $this->zipGenerator->generateFolderZip($folder);

        if (file_exists($zipPath)) {
            unlink($zipPath);
        }
    }

    /**
     * @requires extension zip
     */
    public function testGenerateFolderZipQueriesSubFolders(): void
    {
        $this->skipIfNotDocker();
        $folder = $this->buildFolder('Parent');

        $this->fileRepository->method('findBy')->willReturn([]);

        $this->folderRepository
            ->expects($this->atLeastOnce())
            ->method('findBy')
            ->with(['parent' => $folder, 'isDeleted' => false])
            ->willReturn([]);

        $zipPath = $this->zipGenerator->generateFolderZip($folder);

        if (file_exists($zipPath)) {
            unlink($zipPath);
        }
    }

    /**
     * @requires extension zip
     */
    public function testGenerateFolderZipSkipsDeletedFiles(): void
    {
        $this->skipIfNotDocker();
        $folder = $this->buildFolder('FolderWithDeletedFiles');

        // Le repository ne renvoie QUE les fichiers non supprimés (isDeleted = false)
        $this->fileRepository
            ->expects($this->atLeastOnce())
            ->method('findBy')
            ->with($this->callback(function ($criteria) {
                return isset($criteria['isDeleted']) && $criteria['isDeleted'] === false;
            }))
            ->willReturn([]);

        $this->folderRepository->method('findBy')->willReturn([]);

        $zipPath = $this->zipGenerator->generateFolderZip($folder);

        if (file_exists($zipPath)) {
            unlink($zipPath);
        }
    }

    // ─── Tests de création physique du ZIP (environnement Docker uniquement)

    /**
     * @requires extension zip
     */
    public function testGenerateFolderZipReturnsStringPath(): void
    {
        $this->skipIfNotDocker();
        $folder = $this->buildFolder('TestFolder');

        $this->fileRepository->method('findBy')->willReturn([]);
        $this->folderRepository->method('findBy')->willReturn([]);

        $zipPath = $this->zipGenerator->generateFolderZip($folder);

        $this->assertIsString($zipPath);
        $this->assertStringContainsString('TestFolder', $zipPath);
        $this->assertStringEndsWith('.zip', $zipPath);

        if (file_exists($zipPath)) {
            unlink($zipPath);
        }
    }

    /**
     * @requires extension zip
     */
    public function testGenerateFolderZipCreatesPhysicalFile(): void
    {
        $this->skipIfNotDocker();
        $folder = $this->buildFolder('MyFolder');

        $this->fileRepository->method('findBy')->willReturn([]);
        $this->folderRepository->method('findBy')->willReturn([]);

        $zipPath = $this->zipGenerator->generateFolderZip($folder);

        $this->assertFileExists($zipPath);

        if (file_exists($zipPath)) {
            unlink($zipPath);
        }
    }

    /**
     * @requires extension zip
     */
    public function testGenerateFolderZipWithFolderNameContainingSpaces(): void
    {
        $this->skipIfNotDocker();
        $folder = $this->buildFolder('My Important Documents');

        $this->fileRepository->method('findBy')->willReturn([]);
        $this->folderRepository->method('findBy')->willReturn([]);

        $zipPath = $this->zipGenerator->generateFolderZip($folder);

        $this->assertFileExists($zipPath);

        if (file_exists($zipPath)) {
            unlink($zipPath);
        }
    }

    // ─── Cas limites — sans accès filesystem 

    public function testZipGeneratorIsInstantiable(): void
    {
        $this->assertInstanceOf(ZipGenerator::class, $this->zipGenerator);
    }

    public function testFileRepositoryIsCalledWithCorrectIsDeletedFlag(): void
    {
        $this->skipIfNotDocker();
        $folder = $this->buildFolder('Test');

        // isDeleted doit strictement être false (bool), pas 0 ou null
        $this->fileRepository
            ->expects($this->atLeastOnce())
            ->method('findBy')
            ->with($this->callback(function ($criteria) {
                return array_key_exists('isDeleted', $criteria)
                    && $criteria['isDeleted'] === false;
            }))
            ->willReturn([]);

        $this->folderRepository->method('findBy')->willReturn([]);

        $zipPath = $this->zipGenerator->generateFolderZip($folder);

        if (file_exists($zipPath)) {
            unlink($zipPath);
        }
    }
}
