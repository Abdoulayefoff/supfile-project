<?php

namespace App\Service\Folder;

use App\Entity\Folder;
use App\Repository\FileRepository;
use App\Repository\FolderRepository;
use App\Service\Storage\FileStorageInterface;

class ZipGenerator
{
    public function __construct(
        private FileRepository $fileRepository,
        private FolderRepository $folderRepository,
        private FileStorageInterface $fileStorage,
    ) {}

    /**
     * Génère un fichier ZIP d'un dossier et retourne le chemin du fichier temporaire.
     * Fonctionne avec le stockage local ET Azure Blob Storage.
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
     * Ajoute récursivement le contenu d'un dossier dans le ZIP.
     * Utilise FileStorageInterface pour supporter local et Azure Blob Storage.
     */
    private function addFolderToZip(\ZipArchive $zip, Folder $folder, string $zipPath): void
    {
        $zip->addEmptyDir($zipPath);

        $files = $this->fileRepository->findBy([
            'folder'    => $folder,
            'isDeleted' => false,
        ]);

        foreach ($files as $file) {
            if (!$this->fileStorage->exists($file)) {
                continue;
            }

            $stream = $this->fileStorage->getStream($file);

            if (is_resource($stream)) {
                $content = stream_get_contents($stream);
                fclose($stream);
            } elseif ($stream instanceof \Psr\Http\Message\StreamInterface) {
                $content = $stream->getContents();
            } else {
                continue;
            }

            if ($content !== false && $content !== '') {
                $zip->addFromString($zipPath . '/' . $file->getName(), $content);
            }
        }

        $subFolders = $this->folderRepository->findBy([
            'parent'    => $folder,
            'isDeleted' => false,
        ]);

        foreach ($subFolders as $subFolder) {
            $this->addFolderToZip($zip, $subFolder, $zipPath . '/' . $subFolder->getName());
        }
    }
}
