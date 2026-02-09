<?php

namespace App\Controller\Api;

use App\Service\OAuth\OAuthService;
use KnpU\OAuth2ClientBundle\Client\ClientRegistry;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/auth/oauth', name: 'api_oauth_')]
class OAuthController extends AbstractController
{
    public function __construct(
        private ClientRegistry $clientRegistry,
        private OAuthService $oauthService
    ) {
    }

    // GOOGLE OAUTH
    /**
     * Route pour démarrer l'authentification Google
     * Redirige l'utilisateur vers Google pour se connecter
     */
    #[Route('/google', name: 'google', methods: ['GET'])]
    public function connectGoogle(): RedirectResponse
    {
        return $this->clientRegistry
            ->getClient('google')
            ->redirect(['email', 'profile'], []);
    }

    /**
     * Callback Google - Redirection (pour web)
     * Après authentification, Google redirige ici
     */
    #[Route('/google/check', name: 'google_check', methods: ['GET'])]
    public function checkGoogle(Request $request): RedirectResponse
    {
        try {
            $result = $this->oauthService->handleGoogleAuth();
            
            // Récupérer l'URL de redirection (frontend)
            $redirectUri = $request->query->get('redirect_uri', 'http://localhost:3000/auth/callback');
            
            // Rediriger vers le frontend avec le token
            return new RedirectResponse($redirectUri . '?token=' . $result['token']);
            
        } catch (\Exception $e) {
            // En cas d'erreur, rediriger vers le frontend avec l'erreur
            $redirectUri = $request->query->get('redirect_uri', 'http://localhost:3000/auth/callback');
            return new RedirectResponse($redirectUri . '?error=' . urlencode($e->getMessage()));
        }
    }

    /**
     * Callback Google - JSON (pour mobile)
     * Retourne le token JWT en JSON
     */
    #[Route('/google/check-json', name: 'google_check_json', methods: ['GET'])]
    public function checkGoogleJson(): JsonResponse
    {
        try {
            $result = $this->oauthService->handleGoogleAuth();
            
            return new JsonResponse([
                'success' => true,
                'token' => $result['token'],
                'user' => [
                    'id' => $result['user']->getId(),
                    'email' => $result['user']->getEmail(),
                    'firstName' => $result['user']->getFirstName(),
                    'lastName' => $result['user']->getLastName(),
                    'avatar' => $result['user']->getAvatar(),
                ]
            ]);
            
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => $e->getMessage()
            ], 400);
        }
    }

    // GITHUB OAUTH

    /**
     * Route pour démarrer l'authentification GitHub
     * Redirige l'utilisateur vers GitHub pour se connecter
     */
    #[Route('/github', name: 'github', methods: ['GET'])]
    public function connectGithub(): RedirectResponse
    {
        return $this->clientRegistry
            ->getClient('github')
            ->redirect(['user:email'], []);
    }

    /**
     * Callback GitHub - Redirection (pour web)
     * Après authentification, GitHub redirige ici
     */
    #[Route('/github/check', name: 'github_check', methods: ['GET'])]
    public function checkGithub(Request $request): RedirectResponse
    {
        try {
            $result = $this->oauthService->handleGithubAuth();
            
            // Récupérer l'URL de redirection (frontend)
            $redirectUri = $request->query->get('redirect_uri', 'http://localhost:3000/auth/callback');
            
            // Rediriger vers le frontend avec le token
            return new RedirectResponse($redirectUri . '?token=' . $result['token']);
            
        } catch (\Exception $e) {
            // En cas d'erreur, rediriger vers le frontend avec l'erreur
            $redirectUri = $request->query->get('redirect_uri', 'http://localhost:3000/auth/callback');
            return new RedirectResponse($redirectUri . '?error=' . urlencode($e->getMessage()));
        }
    }

    /**
     * Callback GitHub - JSON (pour mobile)
     * Retourne le token JWT en JSON
     */
    #[Route('/github/check-json', name: 'github_check_json', methods: ['GET'])]
    public function checkGithubJson(): JsonResponse
    {
        try {
            $result = $this->oauthService->handleGithubAuth();
            
            return new JsonResponse([
                'success' => true,
                'token' => $result['token'],
                'user' => [
                    'id' => $result['user']->getId(),
                    'email' => $result['user']->getEmail(),
                    'firstName' => $result['user']->getFirstName(),
                    'lastName' => $result['user']->getLastName(),
                    'avatar' => $result['user']->getAvatar(),
                ]
            ]);
            
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => $e->getMessage()
            ], 400);
        }
    }

    // MICROSOFT OAUTH

    /**
     * Route pour démarrer l'authentification Microsoft
     * Redirige l'utilisateur vers Microsoft pour se connecter
     */
    #[Route('/microsoft', name: 'microsoft', methods: ['GET'])]
    public function connectMicrosoft(): RedirectResponse
    {
        return $this->clientRegistry
            ->getClient('microsoft')
            ->redirect(['openid', 'email', 'profile'], []);
    }

    /**
     * Callback Microsoft - Redirection (pour web)
     * Après authentification, Microsoft redirige ici
     */
    #[Route('/microsoft/check', name: 'microsoft_check', methods: ['GET'])]
    public function checkMicrosoft(Request $request): RedirectResponse
    {
        try {
            $result = $this->oauthService->handleMicrosoftAuth();
            
            // Récupérer l'URL de redirection (frontend)
            $redirectUri = $request->query->get('redirect_uri', 'http://localhost:3000/auth/callback');
            
            // Rediriger vers le frontend avec le token
            return new RedirectResponse($redirectUri . '?token=' . $result['token']);
            
        } catch (\Exception $e) {
            // En cas d'erreur, rediriger vers le frontend avec l'erreur
            $redirectUri = $request->query->get('redirect_uri', 'http://localhost:3000/auth/callback');
            return new RedirectResponse($redirectUri . '?error=' . urlencode($e->getMessage()));
        }
    }

    /**
     * Callback Microsoft - JSON (pour mobile)
     * Retourne le token JWT en JSON
     */
    #[Route('/microsoft/check-json', name: 'microsoft_check_json', methods: ['GET'])]
    public function checkMicrosoftJson(): JsonResponse
    {
        try {
            $result = $this->oauthService->handleMicrosoftAuth();
            
            return new JsonResponse([
                'success' => true,
                'token' => $result['token'],
                'user' => [
                    'id' => $result['user']->getId(),
                    'email' => $result['user']->getEmail(),
                    'firstName' => $result['user']->getFirstName(),
                    'lastName' => $result['user']->getLastName(),
                    'avatar' => $result['user']->getAvatar(),
                ]
            ]);
            
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => $e->getMessage()
            ], 400);
        }
    }
}