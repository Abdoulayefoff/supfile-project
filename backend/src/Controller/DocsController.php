<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/docs', name: 'docs_')]
class DocsController extends AbstractController
{
    private const DOCS_DIR = '/var/www/docs';

    /**
     * GET /docs
     * Affiche la liste des PDF et le viewer.
     */
    #[Route('', name: 'index', methods: ['GET'])]
    public function index(): Response
    {
        $files = glob(self::DOCS_DIR . '/*.pdf') ?: [];

        $documents = array_map(fn(string $path) => [
            'name'  => basename($path),
            'label' => pathinfo($path, PATHINFO_FILENAME),
            'size'  => $this->formatSize(filesize($path)),
        ], $files);

        usort($documents, fn($a, $b) => strcmp($a['label'], $b['label']));

        return $this->render('docs/index.html.twig', [
            'documents' => $documents,
        ]);
    }

    /**
     * GET /docs/view/{filename}
     * Sert le fichier PDF brut pour l'affichage dans l'iframe.
     */
    #[Route('/view/{filename}', name: 'view', methods: ['GET'])]
    public function view(string $filename): Response
    {
        // Sécurité : uniquement les .pdf, pas de traversal
        if (!preg_match('/^[\w\s\-]+\.pdf$/i', $filename)) {
            throw $this->createNotFoundException('Document introuvable.');
        }

        $path = self::DOCS_DIR . '/' . $filename;

        if (!file_exists($path)) {
            throw $this->createNotFoundException('Document introuvable.');
        }

        $response = new BinaryFileResponse($path);
        $response->headers->set('Content-Type', 'application/pdf');
        $response->setContentDisposition(ResponseHeaderBag::DISPOSITION_INLINE, $filename);

        return $response;
    }

    private function formatSize(int $bytes): string
    {
        if ($bytes >= 1048576) {
            return round($bytes / 1048576, 1) . ' Mo';
        }
        if ($bytes >= 1024) {
            return round($bytes / 1024, 1) . ' Ko';
        }
        return $bytes . ' o';
    }
}
