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
 * ZipGenerator::generateFolderZip() écrit dans sys_get_temp_dir() (portable,
 * fonctionne en local, CI et Docker).
 */
class ZipGeneratorTest extends TestCase
{
    private FileRepository&MockObject $fileRepository;
    private FolderRepository&MockObject $folderRepository;
    private ZipGenerator $zipGenerator;

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

    // ─── Tests de délégation aux repositories

    /**
     * @requires extension zip
     */
    public function testGenerateFolderZipQueriesFilesForFolder(): void
    {
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

    // ─── Tests de création physique du ZIP

    /**
     * @requires extension zip
     */
    public function testGenerateFolderZipReturnsStringPath(): void
    {
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
        $folder = $this->buildFolder('My Important Documents');

        $this->fileRepository->method('findBy')->willReturn([]);
        $this->folderRepository->method('findBy')->willReturn([]);

        $zipPath = $this->zipGenerator->generateFolderZip($folder);

        $this->assertFileExists($zipPath);

        if (file_exists($zipPath)) {
            unlink($zipPath);
        }
    }

    // ─── Cas limites

    public function testZipGeneratorIsInstantiable(): void
    {
        $this->assertInstanceOf(ZipGenerator::class, $this->zipGenerator);
    }

    /**
     * @requires extension zip
     */
    public function testFileRepositoryIsCalledWithCorrectIsDeletedFlag(): void
    {
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
