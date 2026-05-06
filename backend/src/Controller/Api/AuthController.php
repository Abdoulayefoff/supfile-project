<?php

namespace App\Controller\Api;

use App\Entity\User;
use App\Service\User\UserManager;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;

#[Route('/api/auth', name: 'api_auth_')]
class AuthController extends AbstractController
{
    public function __construct(
        private UserManager $userManager,
        private JWTTokenManagerInterface $jwtManager,
        private EntityManagerInterface $em
    ) {
    }

    #[Route('/register', name: 'register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['email']) || !isset($data['password'])) {
            return new JsonResponse(['error' => 'Email and password are required'], 400);
        }

        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            return new JsonResponse(['error' => 'Format d\'email invalide'], 400);
        }

        if (strlen($data['password']) < 8) {
            return new JsonResponse(['error' => 'Le mot de passe doit contenir au moins 8 caractères'], 400);
        }

        if (empty($data['consent'])) {
            return new JsonResponse(['error' => 'Vous devez accepter les conditions d\'utilisation'], 422);
        }

        $existingUser = $this->em->getRepository(User::class)->findOneBy(['email' => $data['email']]);
        if ($existingUser) {
            return new JsonResponse(['error' => 'Email already exists'], 409);
        }

        $user = $this->userManager->createUser(
            $data['email'],
            $data['password'],
            $data['firstName'] ?? null,
            $data['lastName'] ?? null
        );
        $user->setConsentAcceptedAt(new \DateTimeImmutable());

        $token = $this->jwtManager->create($user);

        return new JsonResponse([
            'token' => $token,
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'firstName' => $user->getFirstName(),
                'lastName' => $user->getLastName(),
                'avatar' => $user->getAvatar(),
                'quotaUsed' => $user->getQuotaUsed(),
                'quotaLimit' => $user->getQuotaLimit(),
                'theme' => $user->getTheme(),
            ]
        ], 201);
    }

    #[Route('/login', name: 'login', methods: ['POST'])]
    public function login(): JsonResponse
    {
        return new JsonResponse(['error' => 'Invalid credentials'], 401);
    }
}
