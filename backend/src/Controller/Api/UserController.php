<?php

namespace App\Controller\Api;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\Storage\FileStorageInterface;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/user', name: 'api_user_')]
#[IsGranted('ROLE_USER')]
class UserController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private UserPasswordHasherInterface $passwordHasher,
        private UserRepository $userRepository,
        private JWTTokenManagerInterface $jwtManager,
        private FileStorageInterface $fileStorage,
    ) {}

    /**
     * GET /api/user/me
     * Retourne le profil de l'utilisateur connecté
     */
    #[Route('/me', name: 'me', methods: ['GET'])]
    public function me(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        return $this->json(['user' => $this->formatUser($user)]);
    }

    /**
     * PATCH /api/user/me
     * Mise à jour du profil (firstName, lastName, theme)
     */
    #[Route('/me', name: 'update', methods: ['PATCH'])]
    public function update(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        $data = json_decode($request->getContent(), true);

        $emailChanged = false;

        if (isset($data['email'])) {
            $newEmail = trim($data['email']);
            if (!filter_var($newEmail, FILTER_VALIDATE_EMAIL)) {
                return $this->json(['error' => 'Format d\'email invalide.'], Response::HTTP_BAD_REQUEST);
            }
            $existing = $this->userRepository->findOneBy(['email' => $newEmail]);
            if ($existing && $existing->getId() !== $user->getId()) {
                return $this->json(['error' => 'Cet email est déjà utilisé.'], Response::HTTP_CONFLICT);
            }
            if ($user->getEmail() !== $newEmail) {
                $user->setEmail($newEmail);
                $emailChanged = true;
            }
        }

        if (isset($data['firstName'])) {
            $user->setFirstName($data['firstName']);
        }

        if (isset($data['lastName'])) {
            $user->setLastName($data['lastName']);
        }

        if (isset($data['theme'])) {
            if (!in_array($data['theme'], ['light', 'dark'], true)) {
                return $this->json(['error' => 'Valeur de thème invalide. Valeurs autorisées : light, dark'], Response::HTTP_BAD_REQUEST);
            }
            $user->setTheme($data['theme']);
        }

        $this->em->flush();

        $response = ['user' => $this->formatUser($user)];

        // Si l'email a changé, on génère un nouveau token JWT pour éviter l'invalidation
        if ($emailChanged) {
            $response['token'] = $this->jwtManager->create($user);
        }

        return $this->json($response);
    }

    /**
     * POST /api/user/me/password
     * Changement de mot de passe
     */
    #[Route('/me/password', name: 'password', methods: ['POST'])]
    public function changePassword(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        $data = json_decode($request->getContent(), true);

        if (empty($data['currentPassword']) || empty($data['newPassword'])) {
            return $this->json(
                ['error' => 'Les champs "currentPassword" et "newPassword" sont requis'],
                Response::HTTP_BAD_REQUEST
            );
        }

        // Vérifier l'ancien mot de passe
        if (!$this->passwordHasher->isPasswordValid($user, $data['currentPassword'])) {
            return $this->json(
                ['error' => 'Mot de passe actuel incorrect'],
                Response::HTTP_BAD_REQUEST
            );
        }

        // Vérifier la longueur du nouveau mot de passe
        if (strlen($data['newPassword']) < 8) {
            return $this->json(
                ['error' => 'Le nouveau mot de passe doit contenir au moins 8 caractères'],
                Response::HTTP_BAD_REQUEST
            );
        }

        // Hasher et sauvegarder le nouveau mot de passe
        $hashedPassword = $this->passwordHasher->hashPassword($user, $data['newPassword']);
        $user->setPassword($hashedPassword);
        $this->em->flush();

        return $this->json(['message' => 'Mot de passe modifié avec succès']);
    }

    /**
     * POST /api/user/me/avatar
     * Upload d'avatar — redimensionné à 200×200 et stocké en base64 en base de données.
     * Aucune dépendance filesystem : fonctionne identiquement en local et en production Azure.
     */
    #[Route('/me/avatar', name: 'avatar', methods: ['POST'])]
    public function uploadAvatar(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        $file = $request->files->get('avatar');

        if (!$file) {
            return $this->json(
                ['error' => 'Aucun fichier envoyé (champ "avatar" requis)'],
                Response::HTTP_BAD_REQUEST
            );
        }

        $allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($file->getMimeType(), $allowedMimes)) {
            return $this->json(
                ['error' => 'Format non supporté. Utilisez JPEG, PNG, GIF ou WebP'],
                Response::HTTP_BAD_REQUEST
            );
        }

        if ($file->getSize() > 2 * 1024 * 1024) {
            return $this->json(
                ['error' => 'L\'avatar ne doit pas dépasser 2 Mo'],
                Response::HTTP_BAD_REQUEST
            );
        }

        // Lire et décoder l'image avec GD (supporte JPEG, PNG, GIF, WebP)
        $imageContent = file_get_contents($file->getPathname());
        if ($imageContent === false) {
            return $this->json(['error' => 'Impossible de lire l\'image'], Response::HTTP_BAD_REQUEST);
        }

        $source = imagecreatefromstring($imageContent);
        if ($source === false) {
            return $this->json(['error' => 'Format d\'image invalide'], Response::HTTP_BAD_REQUEST);
        }

        // Calculer les dimensions cibles (max 200×200, ratio conservé)
        $origWidth  = imagesx($source);
        $origHeight = imagesy($source);
        $maxSize    = 200;

        if ($origWidth >= $origHeight) {
            $newWidth  = $maxSize;
            $newHeight = (int) max(1, round($maxSize * $origHeight / $origWidth));
        } else {
            $newHeight = $maxSize;
            $newWidth  = (int) max(1, round($maxSize * $origWidth / $origHeight));
        }

        // Créer le canvas avec fond blanc (évite les artefacts noirs sur PNG/WebP transparents)
        $canvas = imagecreatetruecolor($newWidth, $newHeight);
        $white  = imagecolorallocate($canvas, 255, 255, 255);
        imagefill($canvas, 0, 0, $white);

        imagecopyresampled($canvas, $source, 0, 0, 0, 0, $newWidth, $newHeight, $origWidth, $origHeight);
        imagedestroy($source);

        // Encoder en JPEG (qualité 85) et capturer le résultat en mémoire
        ob_start();
        imagejpeg($canvas, null, 85);
        $jpeg = ob_get_clean();
        imagedestroy($canvas);

        if ($jpeg === false || $jpeg === '') {
            return $this->json(['error' => 'Erreur lors de l\'encodage de l\'image'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        // Stocker directement en base de données en tant que data URI base64
        $user->setAvatar('data:image/jpeg;base64,' . base64_encode($jpeg));
        $this->em->flush();

        return $this->json([
            'message' => 'Avatar mis à jour avec succès',
            'user'    => $this->formatUser($user),
        ]);
    }

    /**
     * DELETE /api/user/me
     * Supprime définitivement le compte et toutes les données associées (RGPD).
     */
    #[Route('/me', name: 'delete', methods: ['DELETE'])]
    public function deleteAccount(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        // 1. Supprimer les fichiers physiques du stockage
        foreach ($user->getFiles() as $file) {
            try {
                $this->fileStorage->deleteFile($file);
            } catch (\Throwable) {
                // On continue même si un fichier est introuvable en stockage
            }
        }

        // 2. Supprimer les partages (FK → users + files + folders)
        $this->em->createQuery('DELETE FROM App\Entity\Share s WHERE s.createdBy = :user')
            ->setParameter('user', $user)
            ->execute();

        // 3. Supprimer les fichiers (FK → users + folders)
        $this->em->createQuery('DELETE FROM App\Entity\File f WHERE f.owner = :user')
            ->setParameter('user', $user)
            ->execute();

        // 4. Casser les relations parent/enfant (FK auto-référentielle folders)
        $this->em->createQuery('UPDATE App\Entity\Folder fo SET fo.parent = NULL WHERE fo.owner = :user')
            ->setParameter('user', $user)
            ->execute();

        // 5. Supprimer les dossiers
        $this->em->createQuery('DELETE FROM App\Entity\Folder fo WHERE fo.owner = :user')
            ->setParameter('user', $user)
            ->execute();

        // 6. Supprimer l'utilisateur
        $this->em->remove($user);
        $this->em->flush();

        return $this->json(['message' => 'Compte supprimé avec succès'], Response::HTTP_OK);
    }

    /**
     * Formate un utilisateur pour la réponse JSON
     */
    private function formatUser(User $user): array
    {
        return [
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'firstName' => $user->getFirstName(),
            'lastName' => $user->getLastName(),
            'fullName' => $user->getFullName(),
            'avatar' => $user->getAvatar(),
            'quotaUsed' => $user->getQuotaUsed(),
            'quotaLimit' => $user->getQuotaLimit(),
            'quotaPercentage' => $user->getQuotaPercentage(),
            'theme' => $user->getTheme(),
            'roles' => $user->getRoles(),
            'createdAt' => $user->getCreatedAt()->format('c'),
        ];
    }
}