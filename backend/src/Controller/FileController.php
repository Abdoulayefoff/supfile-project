<?php

namespace App\Controller;

use App\Entity\File;
use App\Entity\Folder;
use App\Service\StorageService;
use App\Service\QuotaService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;

/**
 * Controller pour gérer les fichiers : upload, download, streaming, ZIP.
 */
class FileController extends AbstractController
{
    /**
     * Upload d'un fichier.
     * Vérifie le quota et déplace le fichier sur disque.
     */
    #[Route('/api/files/upload', methods: ['POST'])]
    public function upload(
        Request $request,
        StorageService $storage,
        QuotaService $quota,
        EntityManagerInterface $em
    ): JsonResponse {
        $user = $this->getUser();
        $uploadedFile = $request->files->get('file');

        if (!$uploadedFile) {
            return new JsonResponse(['error' => 'No file'], 400);
        }

        // Vérifie si l'utilisateur peut uploader
        if (!$quota->canUpload($user, $uploadedFile->getSize())) {
            return new JsonResponse(['error' => 'Quota exceeded'], 403);
        }

        $folder = null;
        if ($request->get('folderId')) {
            $folder = $em->getRepository(Folder::class)
                ->find($request->get('folderId'));
        }

        // Stockage physique
        $stored = $storage->storeFile($user, $uploadedFile);

        // Création de l'entité File
        $file = new File();
        $file->setOriginalName($uploadedFile->getClientOriginalName());
        $file->setStorageName($stored['storageName']);
        $file->setMimeType($stored['mime']);
        $file->setSize($stored['size']);
        $file->setOwner($user);
        $file->setFolder($folder);

        $em->persist($file);
        $em->flush();

        return new JsonResponse([
            'id' => $file->getId(),
            'name' => $file->getOriginalName()
        ], 201);
    }

    // Méthodes download, preview et streaming suivent le même principe
}
