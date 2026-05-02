<?php

namespace App\Tests\Unit\Service\OAuth;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\OAuth\OAuthService;
use Doctrine\ORM\EntityManagerInterface;
use KnpU\OAuth2ClientBundle\Client\ClientRegistry;
use KnpU\OAuth2ClientBundle\Client\OAuth2ClientInterface;
use League\OAuth2\Client\Provider\GoogleUser;
use League\OAuth2\Client\Provider\GithubResourceOwner;
use League\OAuth2\Client\Token\AccessToken;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Contracts\HttpClient\ResponseInterface;

class OAuthServiceTest extends TestCase
{
    private EntityManagerInterface&MockObject $em;
    private UserRepository&MockObject $userRepository;
    private UserPasswordHasherInterface&MockObject $passwordHasher;
    private JWTTokenManagerInterface&MockObject $jwtManager;
    private ClientRegistry&MockObject $clientRegistry;
    private LoggerInterface&MockObject $logger;
    private HttpClientInterface&MockObject $httpClient;
    private OAuthService $oauthService;

    protected function setUp(): void
    {
        $this->em             = $this->createMock(EntityManagerInterface::class);
        $this->userRepository = $this->createMock(UserRepository::class);
        $this->passwordHasher = $this->createMock(UserPasswordHasherInterface::class);
        $this->jwtManager     = $this->createMock(JWTTokenManagerInterface::class);
        $this->clientRegistry = $this->createMock(ClientRegistry::class);
        $this->logger         = $this->createMock(LoggerInterface::class);
        $this->httpClient     = $this->createMock(HttpClientInterface::class);

        $this->oauthService = new OAuthService(
            $this->em,
            $this->userRepository,
            $this->passwordHasher,
            $this->jwtManager,
            $this->clientRegistry,
            $this->logger,
            $this->httpClient,
        );
    }

    private function buildGoogleUser(
        string $email = 'google@example.com',
        string $id = 'google_123',
        ?string $firstName = 'Abdoulaye',
        ?string $lastName = 'FOFANA',
        ?string $avatar = 'https://avatar.example.com/photo.jpg'
    ): GoogleUser&MockObject {
        $googleUser = $this->createMock(GoogleUser::class);
        $googleUser->method('getEmail')->willReturn($email);
        $googleUser->method('getId')->willReturn($id);
        $googleUser->method('getFirstName')->willReturn($firstName);
        $googleUser->method('getLastName')->willReturn($lastName);
        $googleUser->method('getAvatar')->willReturn($avatar);
        return $googleUser;
    }

    private function buildGoogleClient(GoogleUser $googleUser): OAuth2ClientInterface&MockObject
    {
        $client = $this->createMock(OAuth2ClientInterface::class);
        $client->method('fetchUser')->willReturn($googleUser);
        return $client;
    }

    private function buildGithubUser(
        string $email = 'github@example.com',
        string $id = '456',
        ?string $name = 'Abdou FOF',
        ?string $nickname = 'abdoufof',
        string $url = 'https://github.com/janedoe'
    ): GithubResourceOwner&MockObject {
        $githubUser = $this->createMock(GithubResourceOwner::class);
        $githubUser->method('getEmail')->willReturn($email);
        $githubUser->method('getId')->willReturn($id);
        $githubUser->method('getName')->willReturn($name);
        $githubUser->method('getNickname')->willReturn($nickname);
        $githubUser->method('getUrl')->willReturn($url);
        $githubUser->method('toArray')->willReturn(['email' => $email]);
        return $githubUser;
    }

    // ─── Happy Path — Google 

    public function testHandleGoogleAuthCreatesNewUserWhenNotFound(): void
    {
        $googleUser = $this->buildGoogleUser();
        $client = $this->buildGoogleClient($googleUser);

        $this->clientRegistry->method('getClient')->with('google')->willReturn($client);
        $this->userRepository->method('findOneBy')->willReturn(null);
        $this->passwordHasher->method('hashPassword')->willReturn('hashed_random');
        $this->em->expects($this->once())->method('persist')->with($this->isInstanceOf(User::class));
        $this->em->expects($this->atLeastOnce())->method('flush');
        $this->jwtManager->method('create')->willReturn('jwt_token_here');

        $result = $this->oauthService->handleGoogleAuth();

        $this->assertArrayHasKey('token', $result);
        $this->assertArrayHasKey('user', $result);
        $this->assertSame('jwt_token_here', $result['token']);
        $this->assertInstanceOf(User::class, $result['user']);
    }

    public function testHandleGoogleAuthReturnsExistingUserByOAuthId(): void
    {
        $existingUser = new User();
        $existingUser->setEmail('google@example.com');
        $existingUser->setOauthProvider('google');
        $existingUser->setOauthId('google_123');

        $googleUser = $this->buildGoogleUser();
        $client = $this->buildGoogleClient($googleUser);

        $this->clientRegistry->method('getClient')->willReturn($client);
        $this->userRepository
            ->method('findOneBy')
            ->willReturnCallback(function ($criteria) use ($existingUser) {
                if (isset($criteria['oauthProvider'])) {
                    return $existingUser; // trouvé par oauthProvider + oauthId
                }
                return null;
            });

        $this->em->expects($this->never())->method('persist');
        $this->jwtManager->method('create')->willReturn('token');

        $result = $this->oauthService->handleGoogleAuth();

        $this->assertSame($existingUser, $result['user']);
    }

    public function testHandleGoogleAuthLinksOauthToExistingEmailAccount(): void
    {
        $existingUser = new User();
        $existingUser->setEmail('google@example.com');
        // Pas encore de provider OAuth lié

        $googleUser = $this->buildGoogleUser('google@example.com', 'google_999');
        $client = $this->buildGoogleClient($googleUser);

        $this->clientRegistry->method('getClient')->willReturn($client);
        $this->userRepository
            ->method('findOneBy')
            ->willReturnCallback(function ($criteria) use ($existingUser) {
                if (isset($criteria['oauthProvider'])) return null; // pas trouvé par OAuth
                if (isset($criteria['email'])) return $existingUser; // trouvé par email
                return null;
            });

        $this->em->expects($this->never())->method('persist');
        $this->em->expects($this->once())->method('flush');
        $this->jwtManager->method('create')->willReturn('token');

        $result = $this->oauthService->handleGoogleAuth();

        $this->assertSame('google', $result['user']->getOauthProvider());
        $this->assertSame('google_999', $result['user']->getOauthId());
    }

    public function testHandleGoogleAuthGeneratesJwtToken(): void
    {
        $googleUser = $this->buildGoogleUser();
        $client = $this->buildGoogleClient($googleUser);

        $this->clientRegistry->method('getClient')->willReturn($client);
        $this->userRepository->method('findOneBy')->willReturn(null);
        $this->passwordHasher->method('hashPassword')->willReturn('hashed');
        $this->em->method('persist');
        $this->em->method('flush');
        $this->jwtManager
            ->expects($this->once())
            ->method('create')
            ->willReturn('valid.jwt.token');

        $result = $this->oauthService->handleGoogleAuth();

        $this->assertSame('valid.jwt.token', $result['token']);
    }

    // ─── Sécurité — email manquant 

    public function testHandleGoogleAuthThrowsWhenEmailIsMissing(): void
    {
        $googleUserNull = $this->createMock(GoogleUser::class);
        $googleUserNull->method('getEmail')->willReturn(null);
        $googleUserNull->method('getId')->willReturn('123');

        $client = $this->createMock(OAuth2ClientInterface::class);
        $client->method('fetchUser')->willReturn($googleUserNull);

        $this->clientRegistry->method('getClient')->willReturn($client);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Email is required for OAuth authentication');

        $this->oauthService->handleGoogleAuth();
    }

    // ─── Happy Path — GitHub 

    public function testHandleGithubAuthCreatesNewUser(): void
    {
        $githubUser = $this->buildGithubUser('github@example.com', '789', 'Abdoulaye FOFANA');

        $client = $this->createMock(OAuth2ClientInterface::class);
        $client->method('fetchUser')->willReturn($githubUser);

        $this->clientRegistry->method('getClient')->with('github')->willReturn($client);
        $this->userRepository->method('findOneBy')->willReturn(null);
        $this->passwordHasher->method('hashPassword')->willReturn('hashed');
        $this->em->method('persist');
        $this->em->method('flush');
        $this->jwtManager->method('create')->willReturn('github_jwt');

        $result = $this->oauthService->handleGithubAuth();

        $this->assertArrayHasKey('token', $result);
        $this->assertArrayHasKey('user', $result);
        $this->assertSame('github', $result['user']->getOauthProvider());
    }

    public function testHandleGithubAuthSplitsNameIntoFirstAndLast(): void
    {
        $githubUser = $this->buildGithubUser('github@example.com', '789', 'Abdoulaye FOFANA');

        $client = $this->createMock(OAuth2ClientInterface::class);
        $client->method('fetchUser')->willReturn($githubUser);

        $this->clientRegistry->method('getClient')->willReturn($client);
        $this->userRepository->method('findOneBy')->willReturn(null);
        $this->passwordHasher->method('hashPassword')->willReturn('hashed');
        $this->em->method('persist');
        $this->em->method('flush');
        $this->jwtManager->method('create')->willReturn('token');

        $result = $this->oauthService->handleGithubAuth();

        $this->assertSame('Abdoulaye', $result['user']->getFirstName());
        $this->assertSame('FOFANA', $result['user']->getLastName());
    }

    public function testHandleGithubAuthThrowsWhenEmailMissing(): void
    {
        $githubUser = $this->createMock(GithubResourceOwner::class);
        $githubUser->method('getEmail')->willReturn(null);
        $githubUser->method('getId')->willReturn('000');
        $githubUser->method('getName')->willReturn('NoEmail User');
        $githubUser->method('getNickname')->willReturn('noemail');
        $githubUser->method('getUrl')->willReturn('https://github.com/noemail');
        $githubUser->method('toArray')->willReturn(['email' => null]); // email null dans toArray aussi

        $client = $this->createMock(OAuth2ClientInterface::class);
        $client->method('fetchUser')->willReturn($githubUser);

        $this->clientRegistry->method('getClient')->willReturn($client);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Email is required for OAuth authentication');

        $this->oauthService->handleGithubAuth();
    }

    // ─── Happy Path — Microsoft 

    private function buildMicrosoftClient(array $graphData): OAuth2ClientInterface&MockObject
    {
        $accessToken = $this->createMock(AccessToken::class);
        $accessToken->method('getToken')->willReturn('ms_access_token_xyz');

        $client = $this->createMock(OAuth2ClientInterface::class);
        $client->method('getAccessToken')->willReturn($accessToken);

        $httpResponse = $this->createMock(ResponseInterface::class);
        $httpResponse->method('toArray')->willReturn($graphData);

        $this->httpClient
            ->method('request')
            ->with('GET', 'https://graph.microsoft.com/v1.0/me', $this->anything())
            ->willReturn($httpResponse);

        return $client;
    }

    public function testHandleMicrosoftAuthCreatesNewUser(): void
    {
        $client = $this->buildMicrosoftClient([
            'id'          => 'ms_id_123',
            'mail'        => 'ms@example.com',
            'displayName' => 'Abdoulaye MS',
            'givenName'   => 'Abdoulaye',
            'surname'     => 'MS',
        ]);

        $this->clientRegistry->method('getClient')->with('microsoft')->willReturn($client);
        $this->userRepository->method('findOneBy')->willReturn(null);
        $this->passwordHasher->method('hashPassword')->willReturn('hashed');
        $this->em->method('persist');
        $this->em->method('flush');
        $this->jwtManager->method('create')->willReturn('ms_jwt');

        $result = $this->oauthService->handleMicrosoftAuth();

        $this->assertArrayHasKey('token', $result);
        $this->assertSame('microsoft', $result['user']->getOauthProvider());
    }

    public function testHandleMicrosoftAuthThrowsWhenEmailMissing(): void
    {
        $client = $this->buildMicrosoftClient([
            'id'                => 'ms_id_456',
            'mail'              => null,
            'userPrincipalName' => null,
        ]);

        $this->clientRegistry->method('getClient')->willReturn($client);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Email is required for OAuth authentication');

        $this->oauthService->handleMicrosoftAuth();
    }

    // ─── Sécurité — mot de passe aléatoire pour OAuth 

    public function testNewOAuthUserGetsRandomHashedPassword(): void
    {
        $googleUser = $this->buildGoogleUser('newuser@example.com');
        $client = $this->buildGoogleClient($googleUser);

        $this->clientRegistry->method('getClient')->willReturn($client);
        $this->userRepository->method('findOneBy')->willReturn(null);

        // Le passwordHasher doit être appelé une fois avec un mot de passe aléatoire non vide
        $this->passwordHasher
            ->expects($this->once())
            ->method('hashPassword')
            ->with(
                $this->isInstanceOf(User::class),
                $this->callback(static fn($pwd) => is_string($pwd) && $pwd !== '')
            )
            ->willReturn('hashed_random_password');

        $this->em->method('persist');
        $this->em->method('flush');
        $this->jwtManager->method('create')->willReturn('token');

        $result = $this->oauthService->handleGoogleAuth();

        $this->assertSame('hashed_random_password', $result['user']->getPassword());
    }

    // ─── Cas limites 

    public function testNewOAuthUserHasDefaultQuota(): void
    {
        $googleUser = $this->buildGoogleUser();
        $client = $this->buildGoogleClient($googleUser);

        $this->clientRegistry->method('getClient')->willReturn($client);
        $this->userRepository->method('findOneBy')->willReturn(null);
        $this->passwordHasher->method('hashPassword')->willReturn('hashed');
        $this->em->method('persist');
        $this->em->method('flush');
        $this->jwtManager->method('create')->willReturn('token');

        $result = $this->oauthService->handleGoogleAuth();

        $this->assertSame('32212254720', $result['user']->getQuotaLimit());
        $this->assertSame('0', $result['user']->getQuotaUsed());
    }

    public function testNewOAuthUserHasRoleUser(): void
    {
        $googleUser = $this->buildGoogleUser();
        $client = $this->buildGoogleClient($googleUser);

        $this->clientRegistry->method('getClient')->willReturn($client);
        $this->userRepository->method('findOneBy')->willReturn(null);
        $this->passwordHasher->method('hashPassword')->willReturn('hashed');
        $this->em->method('persist');
        $this->em->method('flush');
        $this->jwtManager->method('create')->willReturn('token');

        $result = $this->oauthService->handleGoogleAuth();

        $this->assertContains('ROLE_USER', $result['user']->getRoles());
    }
}
