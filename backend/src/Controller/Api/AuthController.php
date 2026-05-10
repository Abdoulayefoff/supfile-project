<?php

namespace App\Controller\Api;

use App\Entity\User;
use App\Service\User\UserManager;
use App\Service\Auth\PasswordResetService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Component\RateLimiter\RateLimiterFactory;

#[Route('/api/auth', name: 'api_auth_')]
class AuthController extends AbstractController
{
    public function __construct(
        private UserManager $userManager,
        private JWTTokenManagerInterface $jwtManager,
        private EntityManagerInterface $em,
        private PasswordResetService $passwordResetService, // Logique reset mot de passe
        private RateLimiterFactory $forgotPasswordLimiter, // protection anti-spam
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

    /**
     * Étape 1 du flux — L'utilisateur saisit son email pour recevoir le lien.
     *
     * SÉCURITÉ — anti-énumération : retourne toujours HTTP 200 même si l'email
     * n'existe pas en base. Le client ne peut jamais savoir si un compte existe.
     *
     * SÉCURITÉ — rate limiting : limité à 3 requêtes par IP toutes les 15 minutes
     * pour éviter le spam d'emails et la saturation du quota Brevo.
     */
    #[Route('/forgot-password', name: 'forgot_password', methods: ['POST'])]
    public function forgotPassword(Request $request): JsonResponse
    {
        // Vérifier la limite de taux par IP avant tout traitement
        $limiter = $this->forgotPasswordLimiter->create($request->getClientIp());
        if (!$limiter->consume(1)->isAccepted()) {
            return new JsonResponse([
                'error' => 'Trop de tentatives. Veuillez réessayer dans quelques minutes.',
            ], 429);
        }

        // Extraire et nettoyer l'email de la requête
        $data  = json_decode($request->getContent(), true);
        $email = trim($data['email'] ?? '');

        // Validation basique du format email côté backend
        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return new JsonResponse(['error' => 'Email invalide.'], 400);
        }

        try {
            // Le service gère silencieusement le cas où l'email n'existe pas
            $this->passwordResetService->requestReset($email);
        } catch (\Exception) {
            // On absorbe toute exception pour ne jamais révéler d'information
            // sur l'état interne du système (anti-énumération renforcé)
        }

        // Toujours retourner le même message, qu'un email ait été envoyé ou non
        return new JsonResponse([
            'message' => 'Si cet email est associé à un compte, vous recevrez un lien de réinitialisation.',
        ]);
    }

    /**
     * Étape 2 du flux — L'utilisateur soumet son nouveau mot de passe avec le token.
     *
     * Le token a été extrait de l'URL par le frontend et transmis dans le body JSON.
     * Le service vérifie que le token est valide, non expiré et non encore utilisé.
     */
    #[Route('/reset-password', name: 'reset_password', methods: ['POST'])]
    public function resetPassword(Request $request): JsonResponse
    {
        // Extraire et nettoyer les données de la requête
        $data     = json_decode($request->getContent(), true);
        $token    = trim($data['token']    ?? '');
        $password = trim($data['password'] ?? '');

        // Validation du token — ne doit pas être vide
        if (empty($token)) {
            return new JsonResponse(['error' => 'Token manquant.'], 400);
        }

        // Validation de la longueur du mot de passe (double validation : aussi côté frontend)
        if (strlen($password) < 8) {
            return new JsonResponse([
                'error' => 'Le mot de passe doit contenir au moins 8 caractères.',
            ], 400);
        }

        try {
            // Le service lève une InvalidArgumentException si le token est invalide
            $this->passwordResetService->resetPassword($token, $password);
        } catch (\InvalidArgumentException $e) {
            // On retourne le message d'erreur du service (token invalide ou expiré)
            return new JsonResponse(['error' => $e->getMessage()], 400);
        }

        return new JsonResponse(['message' => 'Mot de passe réinitialisé avec succès.']);
    }
}
