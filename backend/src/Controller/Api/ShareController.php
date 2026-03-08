<?php

namespace App\Controller\Api;

use App\Entity\File;
use App\Entity\Folder;
use App\Entity\Share;
use App\Repository\FileRepository;
use App\Repository\FolderRepository;
use App\Repository\ShareRepository;
use App\Repository\UserRepository;
use App\Service\Folder\ZipGenerator;
use App\Service\Share\ShareManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/shares', name: 'api_shares_')]
class ShareController extends AbstractController
{
    public function __construct(
        private ShareManager $shareManager,
        private ShareRepository $shareRepository,
        private FileRepository $fileRepository,
        private FolderRepository $folderRepository,
        private UserRepository $userRepository,
        private ZipGenerator $zipGenerator,
    ) {}

    /**
     * POST /api/shares
     * Créer un partage public ou privé
     */
    #[Route('', name: 'create', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['type']) || !in_array($data['type'], ['file', 'folder'])) {
            return $this->json(['error' => 'Le champ "type" est requis (file ou folder)'], Response::HTTP_BAD_REQUEST);
        }

        if (!isset($data['resourceId'])) {
            return $this->json(['error' => 'Le champ "resourceId" est requis'], Response::HTTP_BAD_REQUEST);
        }

        /** @var \App\Entity\User $currentUser */
        $currentUser = $this->getUser();

        $resource = null;
        if ($data['type'] === 'file') {
            $resource = $this->fileRepository->find($data['resourceId']);
            if (!$resource || $resource->getOwner() !== $currentUser) {
                return $this->json(['error' => 'Fichier introuvable'], Response::HTTP_NOT_FOUND);
            }
        } else {
            $resource = $this->folderRepository->find($data['resourceId']);
            if (!$resource || $resource->getOwner() !== $currentUser) {
                return $this->json(['error' => 'Dossier introuvable'], Response::HTTP_NOT_FOUND);
            }
        }

        $expiresAt = null;
        if (!empty($data['expiresAt'])) {
            try {
                $expiresAt = new \DateTimeImmutable($data['expiresAt']);
            } catch (\Exception $e) {
                return $this->json(['error' => 'Format de date invalide'], Response::HTTP_BAD_REQUEST);
            }
        }

        // Partage privé
        if (!empty($data['sharedWithEmail'])) {
            $sharedWith = $this->userRepository->findOneBy(['email' => $data['sharedWithEmail']]);
            if (!$sharedWith) {
                return $this->json(['error' => 'Utilisateur introuvable'], Response::HTTP_NOT_FOUND);
            }
            if ($sharedWith === $currentUser) {
                return $this->json(['error' => 'Vous ne pouvez pas partager avec vous-même'], Response::HTTP_BAD_REQUEST);
            }

            $share = $this->shareManager->createPrivateShare($currentUser, $resource, $sharedWith, $expiresAt);
            return $this->json($this->formatShare($share), Response::HTTP_CREATED);
        }

        // Partage public
        $password = $data['password'] ?? null;
        $share = $this->shareManager->createPublicShare($currentUser, $resource, $expiresAt, $password);

        return $this->json($this->formatShare($share), Response::HTTP_CREATED);
    }

    /**
     * GET /api/shares
     * Liste tous les partages de l'utilisateur connecté
     */
    #[Route('', name: 'list', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function list(): JsonResponse
    {
        /** @var \App\Entity\User $currentUser */
        $currentUser = $this->getUser();

        $shares = $this->shareManager->getSharesByUser($currentUser);

        return $this->json(array_map(fn(Share $s) => $this->formatShare($s), $shares));
    }

    /**
     * GET /api/shares/public/{token}
     * Accès public à un partage via token (pas besoin d'être connecté)
     */
    #[Route('/public/{token}', name: 'public_access', methods: ['GET'])]
    public function publicAccess(string $token): JsonResponse
    {
        $share = $this->shareManager->findByToken($token);

        if (!$share || !$share->isPublic()) {
            return $this->json(['error' => 'Partage introuvable'], Response::HTTP_NOT_FOUND);
        }

        if ($share->isExpired()) {
            return $this->json(['error' => 'Ce partage a expiré'], Response::HTTP_GONE);
        }

        if ($share->hasPassword()) {
            return $this->json([
                'protected' => true,
                'token' => $share->getToken(),
                'resourceType' => $share->getResourceType(),
            ]);
        }

        return $this->json($this->formatShare($share));
    }

    /**
     * POST /api/shares/public/{token}/validate
     * Valider le mot de passe d'un partage protégé
     */
    #[Route('/public/{token}/validate', name: 'public_validate', methods: ['POST'])]
    public function validatePassword(string $token, Request $request): JsonResponse
    {
        $share = $this->shareManager->findByToken($token);

        if (!$share || !$share->isPublic()) {
            return $this->json(['error' => 'Partage introuvable'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        $password = $data['password'] ?? null;

        if (!$this->shareManager->validateShare($share, $password)) {
            return $this->json(['error' => 'Mot de passe incorrect ou partage invalide'], Response::HTTP_UNAUTHORIZED);
        }

        return $this->json($this->formatShare($share));
    }

    /**
     * GET /api/shares/public/{token}/download
     * Télécharge la ressource d'un partage public sans compte requis.
     * Pour un partage protégé par mot de passe : ?password=xxx
     */
    #[Route('/public/{token}/download', name: 'public_download', methods: ['GET'])]
    public function publicDownload(string $token, Request $request): BinaryFileResponse|JsonResponse
    {
        $share = $this->shareManager->findByToken($token);

        if (!$share || !$share->isPublic()) {
            return $this->json(['error' => 'Partage introuvable'], Response::HTTP_NOT_FOUND);
        }

        if ($share->isExpired()) {
            return $this->json(['error' => 'Ce partage a expiré'], Response::HTTP_GONE);
        }

        if ($share->hasPassword()) {
            $password = $request->query->get('password');
            if (!$this->shareManager->validateShare($share, $password)) {
                return $this->json(['error' => 'Mot de passe incorrect ou manquant'], Response::HTTP_UNAUTHORIZED);
            }
        }

        $resource = $share->getSharedResource();

        if ($resource instanceof File) {
            $path = $resource->getPath();
            if (!file_exists($path)) {
                return $this->json(['error' => 'Fichier introuvable sur le serveur'], Response::HTTP_NOT_FOUND);
            }
            $response = new BinaryFileResponse($path);
            $response->setContentDisposition(
                ResponseHeaderBag::DISPOSITION_ATTACHMENT,
                $resource->getName()
            );
            return $response;
        }

        if ($resource instanceof Folder) {
            try {
                $zipPath = $this->zipGenerator->generateFolderZip($resource);
            } catch (\RuntimeException $e) {
                return $this->json(['error' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
            }
            $response = new BinaryFileResponse($zipPath);
            $response->setContentDisposition(
                ResponseHeaderBag::DISPOSITION_ATTACHMENT,
                $resource->getName() . '.zip'
            );
            $response->headers->set('Content-Type', 'application/zip');
            $response->deleteFileAfterSend(true);
            return $response;
        }

        return $this->json(['error' => 'Ressource introuvable'], Response::HTTP_NOT_FOUND);
    }

    /**
     * GET /api/shares/public/{token}/preview
     * Prévisualise inline un fichier d'un partage public sans compte requis.
     * Pour un partage protégé par mot de passe : ?password=xxx
     */
    #[Route('/public/{token}/preview', name: 'public_preview', methods: ['GET'])]
    public function publicPreview(string $token, Request $request): BinaryFileResponse|JsonResponse
    {
        $share = $this->shareManager->findByToken($token);

        if (!$share || !$share->isPublic()) {
            return $this->json(['error' => 'Partage introuvable'], Response::HTTP_NOT_FOUND);
        }

        if ($share->isExpired()) {
            return $this->json(['error' => 'Ce partage a expiré'], Response::HTTP_GONE);
        }

        if ($share->hasPassword()) {
            $password = $request->query->get('password');
            if (!$this->shareManager->validateShare($share, $password)) {
                return $this->json(['error' => 'Mot de passe incorrect ou manquant'], Response::HTTP_UNAUTHORIZED);
            }
        }

        $resource = $share->getSharedResource();

        if (!$resource instanceof File) {
            return $this->json(['error' => 'La prévisualisation n\'est disponible que pour les fichiers'], Response::HTTP_BAD_REQUEST);
        }

        $path = $resource->getPath();
        if (!file_exists($path)) {
            return $this->json(['error' => 'Fichier introuvable sur le serveur'], Response::HTTP_NOT_FOUND);
        }

        $response = new BinaryFileResponse($path);
        $response->headers->set('Content-Type', $resource->getMimeType());
        $response->headers->set('Accept-Ranges', 'bytes');
        $response->setContentDisposition(
            ResponseHeaderBag::DISPOSITION_INLINE,
            $resource->getName()
        );
        $response->prepare($request);

        return $response;
    }

    /**
     * GET /api/shares/received
     * Liste les partages privés reçus par l'utilisateur connecté.
     */
    #[Route('/received', name: 'received', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function received(): JsonResponse
    {
        /** @var \App\Entity\User $currentUser */
        $currentUser = $this->getUser();

        $shares = $this->shareRepository->findPrivateSharesReceivedByUser($currentUser);

        return $this->json(array_map(fn(Share $s) => $this->formatShare($s), $shares));
    }

    /**
     * DELETE /api/shares/{id}
     * Supprimer un partage
     */
    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_USER')]
    public function delete(int $id): JsonResponse
    {
        /** @var \App\Entity\User $currentUser */
        $currentUser = $this->getUser();

        $share = $this->shareRepository->find($id);

        if (!$share) {
            return $this->json(['error' => 'Partage introuvable'], Response::HTTP_NOT_FOUND);
        }

        if ($share->getCreatedBy() !== $currentUser) {
            return $this->json(['error' => 'Accès refusé'], Response::HTTP_FORBIDDEN);
        }

        $this->shareManager->revokeShare($share);

        return $this->json(['message' => 'Partage supprimé avec succès']);
    }

    /**
     * Formate un partage pour la réponse JSON
     */
    private function formatShare(Share $share): array
    {
        $resource = $share->getSharedResource();
        $resourceData = null;

        if ($resource instanceof File) {
            $resourceData = [
                'id' => $resource->getId(),
                'name' => $resource->getName(),
                'mimeType' => $resource->getMimeType(),
                'size' => $resource->getSize(),
            ];
        } elseif ($resource instanceof Folder) {
            $resourceData = [
                'id' => $resource->getId(),
                'name' => $resource->getName(),
            ];
        }

        return [
            'id' => $share->getId(),
            'token' => $share->getToken(),
            'isPublic' => $share->isPublic(),
            'hasPassword' => $share->hasPassword(),
            'expiresAt' => $share->getExpiresAt()?->format('c'),
            'createdAt' => $share->getCreatedAt()->format('c'),
            'resourceType' => $share->getResourceType(),
            'resource' => $resourceData,
            'sharedWith' => $share->getSharedWith() ? [
                'id' => $share->getSharedWith()->getId(),
                'email' => $share->getSharedWith()->getEmail(),
                'fullName' => $share->getSharedWith()->getFullName(),
            ] : null,
        ];
    }
}