<?php

namespace App\Controller;

use App\Repository\FileRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Controller pour gérer la recherche de fichiers.
 */
class SearchController extends AbstractController
{
    /**
     * Recherche fichiers par nom, type ou date.
     * GET /api/search?q=&type=&since=
     */
    #[Route('/api/search', methods: ['GET'])]
    public function search(Request $request, FileRepository $repo): JsonResponse
    {
        $user = $this->getUser();

        $filters = [
            'q' => $request->query->get('q'),        // Recherche par nom
            'type' => $request->query->get('type'),  // Filtre par type MIME
            'since' => $request->query->get('since') // Filtre par date
        ];

        $files = $repo->search($user, $filters);

        // Prépare le JSON pour le frontend
        $result = array_map(fn($f) => [
            'id' => $f->getId(),
            'name' => $f->getOriginalName(),
            'mime' => $f->getMimeType(),
            'size' => $f->getSize(),
            'updatedAt' => $f->getUpdatedAt()->format(DATE_ATOM)
        ], $files);

        return new JsonResponse($result);
    }
}
