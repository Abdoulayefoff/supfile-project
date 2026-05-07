<?php

namespace App\Controller\Api;

use App\Entity\File;
use App\Repository\FileRepository;
use App\Repository\FolderRepository;
use App\Security\Voter\FileVoter;
use App\Security\Voter\FolderVoter;
use App\Service\File\FileManager;
use App\Service\Storage\FileStorageInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/files', name: 'api_files_')]
class FileController extends AbstractController
{
    public function __construct(
        private FileManager $fileManager,
        private FileRepository $fileRepository,
        private FolderRepository $folderRepository,
        private FileStorageInterface $fileStorage
    ) {}

    /**
     * GET /api/files
     * Liste les fichiers de l'utilisateur.
     * Paramètre optionnel : ?folderId=X
     */
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $user = $this->getUser();
        $folderId = $request->query->get('folderId');

        $folder = null;
        if ($folderId) {
            $folder = $this->folderRepository->find($folderId);
            if (!$folder) {
                return $this->json(['error' => 'Dossier introuvable.'], 404);
            }
            // Le voter vérifie que l'utilisateur est propriétaire OU bénéficiaire d'un partage
            $this->denyAccessUnlessGranted(FolderVoter::VIEW, $folder);
        }

        $search = trim((string) $request->query->get('search', ''));

        // Dans un dossier partagé, on liste tous les fichiers du dossier (propriétaire réel)
        // Dans un dossier personnel (ou à la racine), on liste uniquement les fichiers de l'utilisateur
        if ($folder !== null && $folder->getOwner() !== $user) {
            $files = $this->fileRepository->findByFolderAndSearch($folder, null, $search);
        } elseif ($search !== '' && $folder === null) {
            // Recherche globale (tous dossiers confondus) dans les fichiers de l'utilisateur
            $files = $this->fileRepository->findByFolderAndSearch(null, $user, $search, true);
        } else {
            $files = $this->fileRepository->findByFolderAndSearch($folder, $user, $search);
        }

        return $this->json(array_map(fn(File $f) => $this->serializeFile($f), $files));
    }

    /**
     * POST /api/files
     * Upload un fichier.
     * Form-data : file (binary), folderId (optionnel)
     */
    #[Route('', name: 'upload', methods: ['POST'])]
    public function upload(Request $request): JsonResponse
    {
        $uploadedFile = $request->files->get('file');

        if (!$uploadedFile) {
            return $this->json(['error' => 'Aucun fichier reçu.'], 400);
        }

        $folder = null;
        $folderId = $request->request->get('folderId');
        if ($folderId) {
            $folder = $this->folderRepository->find($folderId);
            if (!$folder || $folder->getOwner() !== $this->getUser()) {
                return $this->json(['error' => 'Dossier introuvable.'], 404);
            }
        }

        try {
            $file = $this->fileManager->uploadFile(
                $uploadedFile,
                $this->getUser(),
                $folder
            );
        } catch (\RuntimeException $e) {
            return $this->json(['error' => $e->getMessage()], 400);
        }

        return $this->json($this->serializeFile($file), 201);
    }

    /**
     * GET /api/files/{id}/info
     * Informations d'un fichier.
     */
    #[Route('/{id}/info', name: 'info', methods: ['GET'])]
    public function info(File $file): JsonResponse
    {
        $this->denyAccessUnlessGranted(FileVoter::VIEW, $file);

        return $this->json($this->serializeFile($file));
    }

    /**
     * GET /api/files/{id}/preview
     * Prévisualisation en ligne d'un fichier (images, PDF, textes, audio, vidéo).
     * Supporte le header Range pour le streaming audio/vidéo.
     */
    #[Route('/{id}/preview', name: 'preview', methods: ['GET'])]
    public function preview(File $file): Response
    {
        $this->denyAccessUnlessGranted(FileVoter::VIEW, $file);

        if (!$this->fileStorage->exists($file)) {
            throw $this->createNotFoundException('Fichier introuvable sur le serveur.');
        }

        $stream   = $this->fileStorage->getStream($file);
        $mimeType = $file->getMimeType();
        $name     = $file->getName();

        $response = new StreamedResponse(static function () use ($stream): void {
            if (is_resource($stream)) {
                // LocalFileStorage — resource PHP natif
                fpassthru($stream);
                fclose($stream);
            } elseif ($stream instanceof \Psr\Http\Message\StreamInterface) {
                // AzureBlobStorage — PSR-7 StreamInterface (GuzzleHttp)
                while (!$stream->eof()) {
                    echo $stream->read(8192);
                }
            }
        });

        $response->headers->set('Content-Type', $mimeType);
        $response->headers->set('Content-Disposition',
            'inline; filename="' . addslashes($name) . '"'
        );
        $response->headers->set('Content-Length', (string) $file->getSize());
        $response->headers->set('Accept-Ranges', 'bytes');

        return $response;
    }

    /**
     * GET /api/files/{id}
     * Télécharge un fichier.
     */
    #[Route('/{id}', name: 'download', methods: ['GET'])]
    public function download(File $file): Response
    {
        $this->denyAccessUnlessGranted(FileVoter::VIEW, $file);

        if (!$this->fileStorage->exists($file)) {
            throw $this->createNotFoundException('Fichier introuvable sur le serveur.');
        }

        $stream = $this->fileStorage->getStream($file);
        $name   = $file->getName();

        $response = new StreamedResponse(static function () use ($stream): void {
            if (is_resource($stream)) {
                // LocalFileStorage — resource PHP natif
                fpassthru($stream);
                fclose($stream);
            } elseif ($stream instanceof \Psr\Http\Message\StreamInterface) {
                // AzureBlobStorage — PSR-7 StreamInterface (GuzzleHttp)
                while (!$stream->eof()) {
                    echo $stream->read(8192);
                }
            }
        });

        $response->headers->set('Content-Type', $file->getMimeType());
        $response->headers->set('Content-Disposition',
            ResponseHeaderBag::DISPOSITION_ATTACHMENT . '; filename="' . addslashes($name) . '"'
        );
        $response->headers->set('Content-Length', (string) $file->getSize());

        return $response;
    }

    /**
     * PATCH /api/files/{id}
     * Renomme un fichier.
     * Body JSON : { "name": "nouveau-nom.pdf" }
     */
    #[Route('/{id}', name: 'rename', methods: ['PATCH'])]
    public function rename(File $file, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted(FileVoter::EDIT, $file);

        $data = json_decode($request->getContent(), true);

        if (empty($data['name'])) {
            return $this->json(['error' => 'Le nom est obligatoire.'], 400);
        }

        $this->fileManager->renameFile($file, $data['name']);

        return $this->json($this->serializeFile($file));
    }

    /**
     * DELETE /api/files/{id}
     * Soft delete (envoie à la corbeille).
     */
    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(File $file): JsonResponse
    {
        $this->denyAccessUnlessGranted(FileVoter::DELETE, $file);

        $this->fileManager->deleteFile($file);

        return $this->json(['message' => 'Fichier déplacé dans la corbeille.']);
    }

    /**
     * PATCH /api/files/{id}/move
     * Déplace un fichier vers un autre dossier.
     * Body JSON : { "targetFolderId": 3 } ou { "targetFolderId": null } pour racine
     */
    #[Route('/{id}/move', name: 'move', methods: ['PATCH'])]
    public function move(File $file, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted(FileVoter::EDIT, $file);

        $data = json_decode($request->getContent(), true);

        $targetFolder = null;
        if (!empty($data['targetFolderId'])) {
            $targetFolder = $this->folderRepository->find($data['targetFolderId']);
            if (!$targetFolder || $targetFolder->getOwner() !== $this->getUser()) {
                return $this->json(['error' => 'Dossier cible introuvable.'], 404);
            }
        }

        $this->fileManager->moveFile($file, $targetFolder);

        return $this->json($this->serializeFile($file));
    }

    /**
     * Sérialise un fichier en tableau pour la réponse JSON.
     */
    private function serializeFile(File $file): array
    {
        return [
            'id'        => $file->getId(),
            'name'      => $file->getName(),
            'size'      => $file->getSize(),
            'mimeType'  => $file->getMimeType(),
            'folderId'  => $file->getFolder()?->getId(),
            'owner'     => $file->getOwner()->getFullName(),
            'isDeleted' => $file->isDeleted(),
            'createdAt' => $file->getCreatedAt()?->format('c'),
            'updatedAt' => $file->getUpdatedAt()?->format('c'),
        ];
    }
}