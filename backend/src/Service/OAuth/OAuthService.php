<?php

namespace App\Service\OAuth;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use KnpU\OAuth2ClientBundle\Client\ClientRegistry;
use League\OAuth2\Client\Provider\GoogleUser;
use League\OAuth2\Client\Provider\GithubResourceOwner;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class OAuthService
{
    public function __construct(
        private EntityManagerInterface $em,
        private UserRepository $userRepository,
        private UserPasswordHasherInterface $passwordHasher,
        private JWTTokenManagerInterface $jwtManager,
        private ClientRegistry $clientRegistry
    ) {
    }

    /**
     * Gère l'authentification Google OAuth
     */
    public function handleGoogleAuth(): array
    {
        $client = $this->clientRegistry->getClient('google');
        
        /** @var GoogleUser $googleUser */
        $googleUser = $client->fetchUser();
        
        // Récupérer les données utilisateur
        $email = $googleUser->getEmail();
        $oauthId = $googleUser->getId();
        $firstName = $googleUser->getFirstName();
        $lastName = $googleUser->getLastName();
        $avatar = $googleUser->getAvatar();
        
        if (!$email) {
            throw new \Exception('Email is required for OAuth authentication');
        }
        
        // Trouver ou créer l'utilisateur
        $user = $this->findOrCreateOAuthUser(
            email: $email,
            oauthProvider: 'google',
            oauthId: $oauthId,
            firstName: $firstName,
            lastName: $lastName,
            avatar: $avatar
        );
        
        // Générer le token JWT
        $token = $this->jwtManager->create($user);
        
        return [
            'token' => $token,
            'user' => $user
        ];
    }

    /**
     * Gère l'authentification GitHub OAuth
     */
    public function handleGithubAuth(): array
    {
        $client = $this->clientRegistry->getClient('github');
        
        /** @var GithubResourceOwner $githubUser */
        $githubUser = $client->fetchUser();
        
        // Récupérer les données utilisateur
        $email = $githubUser->getEmail();
        $oauthId = (string) $githubUser->getId();
        $name = $githubUser->getName() ?? $githubUser->getNickname();
        $avatar = $githubUser->getUrl() . '.png'; // GitHub avatar URL
        
        // Pour GitHub, l'email peut être null si l'utilisateur n'a pas rendu son email public
        // Dans ce cas, on doit faire une requête supplémentaire pour récupérer l'email
        if (!$email) {
            // Récupérer l'email depuis l'API GitHub
            $emails = $githubUser->toArray()['email'] ?? null;
            if (!$emails) {
                throw new \Exception('Email is required for OAuth authentication. Please make your email public on GitHub.');
            }
            $email = $emails;
        }
        
        // Séparer le nom complet en firstName et lastName
        $nameParts = explode(' ', $name ?? '', 2);
        $firstName = $nameParts[0] ?? null;
        $lastName = $nameParts[1] ?? null;
        
        // Trouver ou créer l'utilisateur
        $user = $this->findOrCreateOAuthUser(
            email: $email,
            oauthProvider: 'github',
            oauthId: $oauthId,
            firstName: $firstName,
            lastName: $lastName,
            avatar: $avatar
        );
        
        // Générer le token JWT
        $token = $this->jwtManager->create($user);
        
        return [
            'token' => $token,
            'user' => $user
        ];
    }

    /**
     * Gère l'authentification Microsoft OAuth
     */
    public function handleMicrosoftAuth(): array
    {
        $client = $this->clientRegistry->getClient('microsoft');
        
        $microsoftUser = $client->fetchUser();
        
        // Récupérer les données utilisateur
        $microsoftData = $microsoftUser->toArray();
        $email = $microsoftData['mail'] ?? $microsoftData['userPrincipalName'] ?? null;
        $oauthId = $microsoftUser->getId();
        
        // Microsoft retourne le nom complet dans 'displayName'
        $displayName = $microsoftData['displayName'] ?? '';
        $firstName = $microsoftData['givenName'] ?? null;
        $lastName = $microsoftData['surname'] ?? null;
        
        // Si firstName et lastName ne sont pas disponibles, les extraire du displayName
        if (!$firstName && !$lastName && $displayName) {
            $nameParts = explode(' ', $displayName, 2);
            $firstName = $nameParts[0] ?? null;
            $lastName = $nameParts[1] ?? null;
        }
        
        if (!$email) {
            throw new \Exception('Email is required for OAuth authentication');
        }
        
        // Trouver ou créer l'utilisateur
        $user = $this->findOrCreateOAuthUser(
            email: $email,
            oauthProvider: 'microsoft',
            oauthId: $oauthId,
            firstName: $firstName,
            lastName: $lastName,
            avatar: null // Microsoft ne fournit pas d'avatar par défaut
        );
        
        // Générer le token JWT
        $token = $this->jwtManager->create($user);
        
        return [
            'token' => $token,
            'user' => $user
        ];
    }

    /**
     * Trouve un utilisateur existant ou en crée un nouveau pour OAuth
     * 
     * Logique :
     * 1. Chercher par oauthProvider + oauthId (compte OAuth déjà lié)
     * 2. Sinon, chercher par email (compte existant à lier)
     * 3. Sinon, créer un nouveau compte
     */
    private function findOrCreateOAuthUser(
        string $email,
        string $oauthProvider,
        string $oauthId,
        ?string $firstName = null,
        ?string $lastName = null,
        ?string $avatar = null
    ): User {
        // 1. Vérifier si un compte OAuth existe déjà
        $user = $this->userRepository->findOneBy([
            'oauthProvider' => $oauthProvider,
            'oauthId' => $oauthId
        ]);
        
        if ($user) {
            // Compte OAuth trouvé, on le retourne
            return $user;
        }
        
        // 2. Vérifier si un compte avec cet email existe déjà
        $user = $this->userRepository->findOneBy(['email' => $email]);
        
        if ($user) {
            // Compte existant trouvé, on lie le compte OAuth
            $user->setOauthProvider($oauthProvider);
            $user->setOauthId($oauthId);
            
            // Mettre à jour l'avatar si fourni et si l'utilisateur n'en a pas
            if ($avatar && !$user->getAvatar()) {
                $user->setAvatar($avatar);
            }
            
            $user->setUpdatedAt(new \DateTimeImmutable());
            $this->em->flush();
            
            return $user;
        }
        
        // 3. Créer un nouveau compte
        $user = new User();
        $user->setEmail($email);
        $user->setOauthProvider($oauthProvider);
        $user->setOauthId($oauthId);
        $user->setFirstName($firstName);
        $user->setLastName($lastName);
        $user->setAvatar($avatar);
        
        // Générer un mot de passe aléatoire (ne sera jamais utilisé)
        $randomPassword = bin2hex(random_bytes(32));
        $user->setPassword($this->passwordHasher->hashPassword($user, $randomPassword));
        
        // Configuration par défaut
        $user->setQuotaLimit(32212254720); // 30 Go
        $user->setQuotaUsed(0);
        $user->setRoles(['ROLE_USER']);
        $user->setCreatedAt(new \DateTimeImmutable());
        $user->setUpdatedAt(new \DateTimeImmutable());
        
        $this->em->persist($user);
        $this->em->flush();
        
        return $user;
    }
}