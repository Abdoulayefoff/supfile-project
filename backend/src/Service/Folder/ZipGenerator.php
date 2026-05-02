<?php

namespace App\Service\Folder;

use App\Entity\Folder;
use App\Entity\User;
use App\Repository\FileRepository;
use App\Repository\FolderRepository;

class ZipGenerator
{
    public function __construct(
        private FileRepository $fileRepository,
        private FolderRepository $folderRepository,
    ) {}

    /**
     * Génère un fichier ZIP d'un dossier et retourne le chemin du fichier temporaire
     */
    public function generateFolderZip(Folder $folder): string
    {
        if (!class_exists('\ZipArchive')) {
            throw new \RuntimeException('L\'extension PHP ZipArchive n\'est pas disponible');
        }

        $tmpDir = sys_get_temp_dir();
        if (!is_dir($tmpDir)) {
            mkdir($tmpDir, 0755, true);
        }

        $zipFilename = $tmpDir . '/' . uniqid('zip_') . '_' . $folder->getName() . '.zip';

        $zip = new \ZipArchive();
        if ($zip->open($zipFilename, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
            throw new \RuntimeException('Impossible de créer le fichier ZIP');
        }

        $this->addFolderToZip($zip, $folder, $folder->getName());

        $zip->close();

        return $zipFilename;
    }

    /**
     * Ajoute récursivement le contenu d'un dossier dans le ZIP
     */
    private function addFolderToZip(\ZipArchive $zip, Folder $folder, string $zipPath): void
    {
        // Ajouter un dossier vide dans le ZIP
        $zip->addEmptyDir($zipPath);

        // Ajouter les fichiers du dossier courant
        $files = $this->fileRepository->findBy([
            'folder' => $folder,
            'isDeleted' => false,
        ]);

        foreach ($files as $file) {
            $physicalPath = $file->getPath();
            if (file_exists($physicalPath)) {
                $zip->addFile($physicalPath, $zipPath . '/' . $file->getName());
            }
        }

        // Ajouter récursivement les sous-dossiers
        $subFolders = $this->folderRepository->findBy([
            'parent' => $folder,
            'isDeleted' => false,
        ]);

        foreach ($subFolders as $subFolder) {
            $this->addFolderToZip($zip, $subFolder, $zipPath . '/' . $subFolder->getName());
        }
    }
}