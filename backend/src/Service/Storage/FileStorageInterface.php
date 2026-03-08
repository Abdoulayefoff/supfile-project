<?php

namespace App\Service\Storage;

use App\Entity\File;
use App\Entity\User;
use Symfony\Component\HttpFoundation\File\UploadedFile;

interface FileStorageInterface
{
    public function storeFile(UploadedFile $uploadedFile, User $owner): string;
    public function getFilePath(File $file): string;
    public function deleteFile(File $file): bool;
}