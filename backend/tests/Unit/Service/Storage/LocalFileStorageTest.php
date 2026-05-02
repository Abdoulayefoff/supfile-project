<?php

namespace App\Tests\Unit\Service\Storage;

use App\Entity\File;
use App\Entity\User;
use App\Service\Storage\LocalFileStorage;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class LocalFileStorageTest extends TestCase
{
    private string $tmpProjectDir;
    private LocalFileStorage $storage;

    protected function setUp(): void
    {
        $this->tmpProjectDir = sys_get_temp_dir() . '/supfile_test_' . uniqid();
        mkdir($this->tmpProjectDir, 0755, true);
        $this->storage = new LocalFileStorage($this->tmpProjectDir);
    }

    protected function tearDown(): void
    {
        // Nettoyage récursif du répertoire de test
        $this->removeDir($this->tmpProjectDir);
    }

    private function removeDir(string $dir): void
    {
        if (!is_dir($dir)) return;
        foreach (scandir($dir) as $item) {
            if ($item === '.' || $item === '..') continue;
            $path = $dir . '/' . $item;
            is_dir($path) ? $this->removeDir($path) : unlink($path);
        }
        rmdir($dir);
    }

    private function buildUser(int $id = 42): User
    {
        $user = new User();
        $user->setEmail('user@example.com');
        $refl = new \ReflectionProperty(User::class, 'id');
        $refl->setValue($user, $id);
        return $user;
    }

    private function buildUploadedFile(string $content = 'file content', string $name = 'test.txt', string $mime = 'text/plain'): UploadedFile
    {
        $tmpPath = tempnam(sys_get_temp_dir(), 'upload_');
        file_put_contents($tmpPath, $content);
        return new UploadedFile($tmpPath, $name, $mime, null, true);
    }

    // ─── Happy Path

    public function testStoreFileReturnsStringPath(): void
    {
        $user = $this->buildUser(1);
        $uploadedFile = $this->buildUploadedFile('hello', 'document.txt', 'text/plain');

        $path = $this->storage->storeFile($uploadedFile, $user);

        $this->assertIsString($path);
        $this->assertFileExists($path);
    }

    public function testStoreFileCreatesUserDirectory(): void
    {
        $user = $this->buildUser(99);
        $uploadedFile = $this->buildUploadedFile();

        $this->storage->storeFile($uploadedFile, $user);

        $this->assertDirectoryExists($this->tmpProjectDir . '/storage/99');
    }

    public function testStoreFilePathContainsUserDirectory(): void
    {
        $user = $this->buildUser(7);
        $uploadedFile = $this->buildUploadedFile('data', 'file.txt', 'text/plain');

        $path = $this->storage->storeFile($uploadedFile, $user);

        $this->assertStringContainsString('/7/', $path);
    }

    public function testGetFilePathReturnsFileEntityPath(): void
    {
        $file = new File();
        $file->setPath('/storage/42/abc_document.pdf');

        $path = $this->storage->getFilePath($file);

        $this->assertSame('/storage/42/abc_document.pdf', $path);
    }

    public function testDeleteFileReturnsTrueAndRemovesPhysicalFile(): void
    {
        // Créer un fichier physique
        $storagePath = $this->tmpProjectDir . '/storage/1';
        mkdir($storagePath, 0755, true);
        $physicalPath = $storagePath . '/test_file.txt';
        file_put_contents($physicalPath, 'content');

        $file = new File();
        $file->setPath($physicalPath);

        $result = $this->storage->deleteFile($file);

        $this->assertTrue($result);
        $this->assertFileDoesNotExist($physicalPath);
    }

    public function testDeleteFileReturnsTrueEvenWhenFileDoesNotExist(): void
    {
        $file = new File();
        $file->setPath('/nonexistent/path/file.txt');

        $result = $this->storage->deleteFile($file);

        $this->assertTrue($result);
    }

    // ─── Sécurité — nom de fichier 

    public function testStoreFileRenamesWithRandomPrefix(): void
    {
        $user = $this->buildUser(1);
        $uploadedFile = $this->buildUploadedFile('data', 'original.txt', 'text/plain');

        $path1 = $this->storage->storeFile($uploadedFile, $user);

        // Recréer un fichier et tester qu'un second upload génère un nom différent
        $uploadedFile2 = $this->buildUploadedFile('data2', 'original.txt', 'text/plain');
        $path2 = $this->storage->storeFile($uploadedFile2, $user);

        $this->assertNotSame($path1, $path2);
    }

    public function testStoreFileSanitizesSpecialCharactersInName(): void
    {
        $user = $this->buildUser(1);
        $maliciousName = '../../../etc/passwd; rm -rf /';
        $uploadedFile = $this->buildUploadedFile('data', $maliciousName, 'text/plain');

        $path = $this->storage->storeFile($uploadedFile, $user);

        // Le chemin ne doit pas contenir de séquences de traversal de répertoire
        $filename = basename($path);
        $this->assertStringNotContainsString('..', $filename);
        $this->assertStringNotContainsString('/', $filename);
        $this->assertStringNotContainsString(';', $filename);
        $this->assertFileExists($path);
    }

    public function testStoreFileDoesNotKeepOriginalNameDirectly(): void
    {
        $user = $this->buildUser(1);
        $uploadedFile = $this->buildUploadedFile('data', 'secret_internal_doc.txt', 'text/plain');

        $path = $this->storage->storeFile($uploadedFile, $user);

        // Le chemin final doit contenir un préfixe aléatoire (pas seulement le nom original)
        $filename = basename($path);
        $this->assertGreaterThan(strlen('secret_internal_doc.txt'), strlen($filename));
    }

    // ─── Cas limites 

    public function testStoreFileCreatesStorageDirectoryIfNotExists(): void
    {
        $newProjectDir = sys_get_temp_dir() . '/supfile_new_' . uniqid();
        $storage = new LocalFileStorage($newProjectDir);
        $user = $this->buildUser(1);
        $uploadedFile = $this->buildUploadedFile();

        $path = $storage->storeFile($uploadedFile, $user);

        $this->assertFileExists($path);

        $this->removeDir($newProjectDir);
    }
}
