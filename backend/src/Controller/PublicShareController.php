<?php

namespace App\Controller;

use App\Entity\ShareLink;
use App\Service\StorageService;
use App\Service\ZipService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Controller pour gérer l'accès public via un lien de partage.
 */
class PublicShareController
{
    /**
     * Accès à un fichier ou dossier partagé publiquement.
     * Vérifie mot de passe et expiration.
     */
    #[Route('/api/public/share/{token}', methods: ['GET'])]
    public function access(
        string $token,
        Request $request,
        EntityManagerInterface $em,
        StorageService $storage,
        ZipService $zip
    ): Response {
        $share = $em->getRepository(ShareLink::class)
            ->findOneBy(['token' => $token]);

        if (!$share) {
            return new Response('Not found', 404);
        }

        // Vérifie si le lien est expiré
        if ($share->getExpiresAt() && $share->getExpiresAt() < new \DateTime()) {
            return new Response('Link expired', 403);
        }

        // Vérifie mot de passe si défini
        if ($share->getPassword()) {
            $password = $request->headers->get('X-Share-Password');
            if (!$password || !password_verify($password, $share->getPassword())) {
                return new Response('Unauthorized', 401);
            }
        }

        // Si c'est un fichier
        if ($share->getFile()) {
            $file = $share->getFile();
            return new BinaryFileResponse(
                $storage->getFilePath($file->getOwner(), $file->getStorageName()),
                200,
                [
                    'Content-Disposition' =>
                        'attachment; filename="' . $file->getOriginalName() . '"'
                ]
            );
        }

        // Si c'est un dossier → crée un ZIP temporaire
        $folder = $share->getFolder();
        $zipPath = sys_get_temp_dir() . '/share_' . $folder->getId() . '.zip';

        $files = [];
        foreach ($folder->getFiles() as $file) {
            $files[$file->getOriginalName()] =
                $storage->getFilePath($file->getOwner(), $file->getStorageName());
        }

        $zip->createZip($zipPath, $files);

        return new BinaryFileResponse($zipPath);
    }
}
