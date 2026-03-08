<?php

namespace App\Service\Storage;

use App\Entity\File;
use App\Entity\User;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class LocalFileStorage implements FileStorageInterface
{
    private string $storagePath;

    public function __construct(string $projectDir)
    {
        $this->storagePath = $projectDir . '/storage';
    }

    private function ensureDirectoryExists(string $path): void
    {
        if (!is_dir($path)) {
            mkdir($path, 0755, true);
        }
    }

    public function storeFile(UploadedFile $uploadedFile, User $owner): string
    {
        $userDir = $this->storagePath . '/' . $owner->getId();
        $this->ensureDirectoryExists($userDir);

        $filename = uniqid() . '_' . $uploadedFile->getClientOriginalName();
        $uploadedFile->move($userDir, $filename);

        return $userDir . '/' . $filename;
    }

    public function getFilePath(File $file): string
    {
        return $file->getPath();
    }

    public function deleteFile(File $file): bool
    {
        $path = $this->getFilePath($file);
        if (file_exists($path)) {
            unlink($path);
        }
        return true;
    }
}