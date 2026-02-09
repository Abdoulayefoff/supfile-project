<?php

namespace App\Controller;

use App\Entity\ShareLink;
use App\Entity\File;
use App\Entity\Folder;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;

/**
 * Controller pour gérer les partages publics et la génération de liens.
 */
class ShareController extends AbstractController
{
    /**
     * Crée un lien de partage public pour un fichier ou un dossier.
     * Le lien peut être protégé par mot de passe et avoir une date d'expiration.
     */
    #[Route('/api/share', methods: ['POST'])]
    public function create(
        Request $request,
        EntityManagerInterface $em,
        UserPasswordHasherInterface $hasher
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);
        $user = $this->getUser();

        $share = new ShareLink();
        $share->setOwner($user);

        // Vérifie si on partage un fichier
        if (isset($data['fileId'])) {
            $file = $em->getRepository(File::class)->find($data['fileId']);
            $this->denyAccessUnlessGranted('FILE_VIEW', $file);
            $share->setFile($file);

        // Vérifie si on partage un dossier
        } elseif (isset($data['folderId'])) {
            $folder = $em->getRepository(Folder::class)->find($data['folderId']);
            $this->denyAccessUnlessGranted('FOLDER_VIEW', $folder);
            $share->setFolder($folder);

        } else {
            return new JsonResponse(['error' => 'Target missing'], 400);
        }

        // Si un mot de passe est fourni, on le hash
        if (!empty($data['password'])) {
            $share->setPassword(
                password_hash($data['password'], PASSWORD_BCRYPT)
            );
        }

        // Date d'expiration facultative
        if (!empty($data['expiresAt'])) {
            $share->setExpiresAt(new \DateTime($data['expiresAt']));
        }

        // Sauvegarde en base
        $em->persist($share);
        $em->flush();

        // Retour du token et URL pour l'accès public
        return new JsonResponse([
            'token' => $share->getToken(),
            'url' => '/api/public/share/' . $share->getToken()
        ], 201);
    }
}
