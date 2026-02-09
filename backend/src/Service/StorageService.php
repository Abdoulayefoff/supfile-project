<?php

namespace App\Service;

use App\Entity\User;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\Uid\Uuid;

/**
 * Service central pour gérer le stockage physique des fichiers.
 * Les fichiers sont stockés sur le disque dans /storage/users/{userId}/files
 */
class StorageService
{
    // Chemin racine du stockage
    private string $basePath = '/var/www/storage/users';

    // Retourne le chemin complet pour un utilisateur
    public function getUserPath(User $user): string
    {
        return $this->basePath . '/' . $user->getId() . '/files';
    }

    // Stocke un fichier uploadé sur le disque et retourne les métadonnées
    public function storeFile(User $user, UploadedFile $file): array
    {
        $storageName = Uuid::v4()->toRfc4122(); // UUID unique
        $userPath = $this->getUserPath($user);

        if (!is_dir($userPath)) {
            mkdir($userPath, 0775, true); // Crée le dossier si inexistant
        }

        // Déplacement du fichier vers le stockage physique
        $file->move($userPath, $storageName);

        return [
            'storageName' => $storageName,
            'size' => filesize($userPath . '/' . $storageName),
            'mime' => mime_content_type($userPath . '/' . $storageName),
        ];
    }

    // Retourne le chemin complet vers un fichier existant
    public function getFilePath(User $user, string $storageName): string
    {
        return $this->getUserPath($user) . '/' . $storageName;
    }
}
