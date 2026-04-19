<?php

namespace App\Controller\Api;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\User\UserManager;
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
        private UserManager $userManager,
        private UserRepository $userRepository,
        private JWTTokenManagerInterface $jwtManager,
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
     * Upload d'avatar
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

        // Vérifier que c'est bien une image
        $allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($file->getMimeType(), $allowedMimes)) {
            return $this->json(
                ['error' => 'Format non supporté. Utilisez JPEG, PNG, GIF ou WebP'],
                Response::HTTP_BAD_REQUEST
            );
        }

        // Vérifier la taille (max 2 Mo)
        if ($file->getSize() > 2 * 1024 * 1024) {
            return $this->json(
                ['error' => 'L\'avatar ne doit pas dépasser 2 Mo'],
                Response::HTTP_BAD_REQUEST
            );
        }

        // Supprimer l'ancien avatar si existant
        if ($user->getAvatar()) {
            $oldPath = '/var/www/html/public/storage/avatars/' . $user->getAvatar();
            if (file_exists($oldPath)) {
                unlink($oldPath);
            }
        }

        // Sauvegarder le nouvel avatar dans le répertoire public (accessible directement par le navigateur)
        $avatarDir = '/var/www/html/public/storage/avatars/';
        if (!is_dir($avatarDir)) {
            mkdir($avatarDir, 0755, true);
        }

        $filename = bin2hex(random_bytes(16)) . '_' . $user->getId() . '.' . $file->guessExtension();
        $file->move($avatarDir, $filename);

        $user->setAvatar($filename);
        $this->em->flush();

        return $this->json([
            'message' => 'Avatar mis à jour avec succès',
            'user'    => $this->formatUser($user),
        ]);
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
            'avatar' => $user->getAvatar() ? '/storage/avatars/' . $user->getAvatar() : null,
            'quotaUsed' => $user->getQuotaUsed(),
            'quotaLimit' => $user->getQuotaLimit(),
            'quotaPercentage' => $user->getQuotaPercentage(),
            'theme' => $user->getTheme(),
            'roles' => $user->getRoles(),
            'createdAt' => $user->getCreatedAt()->format('c'),
        ];
    }
}