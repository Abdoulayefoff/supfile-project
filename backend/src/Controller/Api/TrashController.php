<?php

namespace App\Controller\Api;

use App\Entity\File;
use App\Entity\Folder;
use App\Repository\FileRepository;
use App\Repository\FolderRepository;
use App\Service\File\FileManager;
use App\Service\Folder\FolderManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/trash', name: 'api_trash_')]
class TrashController extends AbstractController
{
    public function __construct(
        private FileManager $fileManager,
        private FolderManager $folderManager,
        private FileRepository $fileRepository,
        private FolderRepository $folderRepository
    ) {}

    /**
     * GET /api/trash
     * Liste tous les fichiers et dossiers dans la corbeille.
     */
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $user = $this->getUser();

        $files = $this->fileRepository->findBy([
            'owner'     => $user,
            'isDeleted' => true,
        ]);

        $folders = $this->folderRepository->findBy([
            'owner'     => $user,
            'isDeleted' => true,
        ]);

        return $this->json([
            'files'   => array_map(fn(File $f) => [
                'id'        => $f->getId(),
                'name'      => $f->getName(),
                'size'      => $f->getSize(),
                'mimeType'  => $f->getMimeType(),
                'deletedAt' => $f->getDeletedAt()?->format('c'),
            ], $files),
            'folders' => array_map(fn(Folder $f) => [
                'id'        => $f->getId(),
                'name'      => $f->getName(),
                'deletedAt' => $f->getDeletedAt()?->format('c'),
            ], $folders),
        ]);
    }

    /**
     * POST /api/trash/files/{id}/restore
     * Restaure un fichier depuis la corbeille.
     */
    #[Route('/files/{id}/restore', name: 'restore_file', methods: ['POST'])]
    public function restoreFile(File $file): JsonResponse
    {
        if ($file->getOwner() !== $this->getUser()) {
            return $this->json(['error' => 'Accès refusé.'], 403);
        }

        $this->fileManager->restoreFile($file);

        return $this->json(['message' => 'Fichier restauré.']);
    }

    /**
     * POST /api/trash/folders/{id}/restore
     * Restaure un dossier depuis la corbeille.
     */
    #[Route('/folders/{id}/restore', name: 'restore_folder', methods: ['POST'])]
    public function restoreFolder(Folder $folder): JsonResponse
    {
        if ($folder->getOwner() !== $this->getUser()) {
            return $this->json(['error' => 'Accès refusé.'], 403);
        }

        $this->folderManager->restoreFolder($folder);

        return $this->json(['message' => 'Dossier restauré.']);
    }

    /**
     * DELETE /api/trash/files/{id}
     * Suppression définitive d'un fichier.
     */
    #[Route('/files/{id}', name: 'delete_file', methods: ['DELETE'])]
    public function deleteFile(File $file): JsonResponse
    {
        if ($file->getOwner() !== $this->getUser()) {
            return $this->json(['error' => 'Accès refusé.'], 403);
        }

        if (!$file->isDeleted()) {
            return $this->json(['error' => 'Le fichier n\'est pas dans la corbeille.'], 400);
        }

        $this->fileManager->permanentDeleteFile($file);

        return $this->json(['message' => 'Fichier supprimé définitivement.']);
    }

    /**
     * DELETE /api/trash/folders/{id}
     * Suppression définitive d'un dossier.
     */
    #[Route('/folders/{id}', name: 'delete_folder', methods: ['DELETE'])]
    public function deleteFolder(Folder $folder): JsonResponse
    {
        if ($folder->getOwner() !== $this->getUser()) {
            return $this->json(['error' => 'Accès refusé.'], 403);
        }

        if (!$folder->isDeleted()) {
            return $this->json(['error' => 'Le dossier n\'est pas dans la corbeille.'], 400);
        }

        $this->folderManager->permanentDeleteFolder($folder);

        return $this->json(['message' => 'Dossier supprimé définitivement.']);
    }
}