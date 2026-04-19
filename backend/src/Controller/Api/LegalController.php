<?php

namespace App\Controller\Api;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/legal', name: 'api_legal_')]
class LegalController extends AbstractController
{
    /** Slugs autorisés → nom du fichier .md correspondant */
    private const ALLOWED_SLUGS = [
        'privacy' => 'privacy.md',
        'terms'   => 'terms.md',
        'help'    => 'help.md',
    ];

    #[Route('/{slug}', name: 'show', methods: ['GET'], requirements: ['slug' => 'privacy|terms|help'])]
    public function show(string $slug): JsonResponse
    {
        $filename = self::ALLOWED_SLUGS[$slug];
        $filePath = $this->getParameter('kernel.project_dir') . '/legal/' . $filename;

        if (!file_exists($filePath)) {
            return new JsonResponse(['error' => 'Document introuvable'], 404);
        }

        $content = file_get_contents($filePath);

        return new JsonResponse([
            'slug'    => $slug,
            'content' => $content,
        ]);
    }
}
