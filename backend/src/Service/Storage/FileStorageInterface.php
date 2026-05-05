<?php

namespace App\Service\Storage;

use App\Entity\File;
use App\Entity\User;
use Symfony\Component\HttpFoundation\File\UploadedFile;

interface FileStorageInterface
{
    /**
     * Stocke le fichier physiquement et retourne son identifiant de stockage
     * (chemin local complet OU nom de blob Azure).
     */
    public function storeFile(UploadedFile $uploadedFile, User $owner): string;

    /**
     * Retourne l'identifiant de stockage brut
     * (chemin local complet OU nom de blob Azure).
     */
    public function getFilePath(File $file): string;

    /**
     * Supprime le fichier du stockage physique.
     */
    public function deleteFile(File $file): bool;

    /**
     * Vérifie que le fichier existe dans le stockage.
     */
    public function exists(File $file): bool;

    /**
     * Retourne un flux pour lire le contenu du fichier.
     * - LocalFileStorage  → resource PHP natif (fopen)
     * - AzureBlobStorage  → PSR-7 StreamInterface (GuzzleHttp)
     * Utilisé par FileController pour servir downloads et previews.
     */
    public function getStream(File $file): mixed;
}