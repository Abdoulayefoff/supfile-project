<?php

namespace App\Service;

use ZipArchive;

/**
 * Service pour créer des fichiers ZIP à la volée.
 * Utilisé pour télécharger des dossiers complets.
 */
class ZipService
{
    // Crée un ZIP à partir d'un tableau [nom => chemin physique]
    public function createZip(string $zipPath, array $files): void
    {
        $zip = new ZipArchive();
        $zip->open($zipPath, ZipArchive::CREATE);

        foreach ($files as $name => $path) {
            $zip->addFile($path, $name);
        }

        $zip->close();
    }
}
