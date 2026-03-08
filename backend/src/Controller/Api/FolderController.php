<?php

namespace App\Controller\Api;

use App\Entity\Folder;
use App\Entity\Share;
use App\Repository\FolderRepository;
use App\Repository\ShareRepository;
use App\Security\Voter\FolderVoter;
use App\Service\Folder\FolderManager;
use App\Service\Folder\NavigationService;
use App\Service\Folder\ZipGenerator;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/folders', name: 'api_folders_')]
class FolderController extends AbstractController
{
    public function __construct(
        private FolderManager $folderManager,
        private NavigationService $navigationService,
        private FolderRepository $folderRepository,
        private ShareRepository $shareRepository,
        private EntityManagerInterface $em,
        private ZipGenerator $zipGenerator,
    ) {}

    /**
     * GET /api/folders
     * Liste les dossiers de l'utilisateur connecté.
     * Paramètre optionnel : ?parentId=X pour lister les sous-dossiers
     */
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $user = $this->getUser();
        $parentId = $request->query->get('parentId');

        $parent = null;
        if ($parentId) {
            $parent = $this->folderRepository->find($parentId);
            if (!$parent) {
                return $this->json(['error' => 'Dossier parent introuvable.'], 404);
            }
            // Le voter vérifie que l'utilisateur est propriétaire OU bénéficiaire d'un partage
            $this->denyAccessUnlessGranted(FolderVoter::VIEW, $parent);
        }

        // Dans un dossier partagé, on liste tous les sous-dossiers du propriétaire du dossier
        // Dans un dossier personnel (ou à la racine), on liste uniquement les dossiers de l'utilisateur
        if ($parent !== null && $parent->getOwner() !== $user) {
            $folders = $this->folderRepository->findBy([
                'parent'    => $parent,
                'isDeleted' => false,
            ]);
        } else {
            $folders = $this->folderRepository->findBy([
                'owner'     => $user,
                'parent'    => $parent,
                'isDeleted' => false,
            ]);
        }

        $data = array_map(fn(Folder $f) => $this->serializeFolder($f), $folders);

        // À la racine uniquement, on inclut les dossiers partagés avec l'utilisateur
        if ($parent === null) {
            $sharedShares = $this->shareRepository->findSharedFoldersWithUser($user);
            foreach ($sharedShares as $share) {
                $sharedFolder = $share->getFolder();
                if ($sharedFolder && !$sharedFolder->isDeleted()) {
                    $data[] = $this->serializeFolder($sharedFolder, $share);
                }
            }
        }

        return $this->json($data);
    }

    /**
     * POST /api/folders
     * Crée un nouveau dossier.
     * Body JSON : { "name": "Mon dossier", "parentId": null }
     */
    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (empty($data['name'])) {
            return $this->json(['error' => 'Le nom est obligatoire.'], 400);
        }

        $parent = null;
        if (!empty($data['parentId'])) {
            $parent = $this->folderRepository->find($data['parentId']);
            if (!$parent || $parent->getOwner() !== $this->getUser()) {
                return $this->json(['error' => 'Dossier parent introuvable.'], 404);
            }
        }

        try {
            $folder = $this->folderManager->createFolder(
                $data['name'],
                $this->getUser(),
                $parent
            );
        } catch (\RuntimeException $e) {
            return $this->json(['error' => $e->getMessage()], 409);
        }

        return $this->json($this->serializeFolder($folder), 201);
    }

    /**
     * GET /api/folders/{id}
     * Informations d'un dossier.
     */
    #[Route('/{id}', name: 'show', methods: ['GET'])]
    public function show(Folder $folder): JsonResponse
    {
        $this->denyAccessUnlessGranted(FolderVoter::VIEW, $folder);

        return $this->json($this->serializeFolder($folder));
    }

    /**
     * PATCH /api/folders/{id}
     * Renomme un dossier.
     * Body JSON : { "name": "Nouveau nom" }
     */
    #[Route('/{id}', name: 'rename', methods: ['PATCH'])]
    public function rename(Folder $folder, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted(FolderVoter::EDIT, $folder);

        $data = json_decode($request->getContent(), true);

        if (empty($data['name'])) {
            return $this->json(['error' => 'Le nom est obligatoire.'], 400);
        }

        $this->folderManager->renameFolder($folder, $data['name']);

        return $this->json($this->serializeFolder($folder));
    }

    /**
     * DELETE /api/folders/{id}
     * Soft delete (envoie à la corbeille).
     */
    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(Folder $folder): JsonResponse
    {
        $this->denyAccessUnlessGranted(FolderVoter::DELETE, $folder);

        $this->folderManager->deleteFolder($folder);

        return $this->json(['message' => 'Dossier déplacé dans la corbeille.']);
    }

    /**
     * PATCH /api/folders/{id}/move
     * Déplace un dossier.
     * Body JSON : { "targetParentId": 5 } ou { "targetParentId": null } pour racine
     */
    #[Route('/{id}/move', name: 'move', methods: ['PATCH'])]
    public function move(Folder $folder, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted(FolderVoter::EDIT, $folder);

        $data = json_decode($request->getContent(), true);

        $targetParent = null;
        if (!empty($data['targetParentId'])) {
            $targetParent = $this->folderRepository->find($data['targetParentId']);
            if (!$targetParent || $targetParent->getOwner() !== $this->getUser()) {
                return $this->json(['error' => 'Dossier cible introuvable.'], 404);
            }
        }

        try {
            $this->folderManager->moveFolder($folder, $targetParent);
        } catch (\RuntimeException $e) {
            return $this->json(['error' => $e->getMessage()], 400);
        }

        return $this->json($this->serializeFolder($folder));
    }

    /**
     * GET /api/folders/{id}/breadcrumbs
     * Retourne le fil d'Ariane du dossier.
     */
    #[Route('/{id}/breadcrumbs', name: 'breadcrumbs', methods: ['GET'])]
    public function breadcrumbs(Folder $folder): JsonResponse
    {
        $this->denyAccessUnlessGranted(FolderVoter::VIEW, $folder);

        return $this->json($this->navigationService->getBreadcrumbs($folder));
    }

    /**
     * GET /api/folders/{id}/download
     * Télécharge un dossier en ZIP.
     */
    #[Route('/{id}/download', name: 'download', methods: ['GET'])]
    public function download(int $id): BinaryFileResponse|JsonResponse
    {
        $folder = $this->folderRepository->find($id);

        if (!$folder) {
            return $this->json(['error' => 'Dossier introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $this->denyAccessUnlessGranted(FolderVoter::VIEW, $folder);

        if ($folder->isDeleted()) {
            return $this->json(['error' => 'Ce dossier est dans la corbeille.'], Response::HTTP_BAD_REQUEST);
        }

        try {
            $zipPath = $this->zipGenerator->generateFolderZip($folder);
        } catch (\RuntimeException $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        $response = new BinaryFileResponse($zipPath);
        $response->setContentDisposition(
            ResponseHeaderBag::DISPOSITION_ATTACHMENT,
            $folder->getName() . '.zip'
        );
        $response->headers->set('Content-Type', 'application/zip');
        $response->deleteFileAfterSend(true);

        return $response;
    }

    /**
     * Sérialise un dossier en tableau pour la réponse JSON.
     * Si un partage est fourni, le dossier est marqué comme partagé avec l'utilisateur.
     */
    private function serializeFolder(Folder $folder, ?Share $share = null): array
    {
        return [
            'id'        => $folder->getId(),
            'name'      => $folder->getName(),
            'parentId'  => $folder->getParent()?->getId(),
            'isDeleted' => $folder->isDeleted(),
            'createdAt' => $folder->getCreatedAt()?->format('c'),
            'updatedAt' => $folder->getUpdatedAt()?->format('c'),
            'isShared'  => $share !== null,
            'sharedBy'  => $share !== null ? [
                'id'       => $share->getCreatedBy()->getId(),
                'email'    => $share->getCreatedBy()->getEmail(),
                'fullName' => $share->getCreatedBy()->getFullName(),
            ] : null,
        ];
    }
}