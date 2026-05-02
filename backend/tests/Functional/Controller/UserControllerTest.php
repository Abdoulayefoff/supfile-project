<?php

namespace App\Tests\Functional\Controller;

use App\Tests\Functional\AbstractFunctionalTest;

/**
 * Tests fonctionnels pour UserController.
 *
 * Couverture :
 *   Happy path    : profil, update firstName/lastName/theme, changement password, avatar
 *   Validation    : email invalide → 400, thème invalide → 400,
 *                   currentPassword incorrect → 400, newPassword < 8 chars → 400,
 *                   avatar sans fichier → 400, mauvais mime → 400, trop grand → 400
 *   Sécurité OWASP: sans token → 401 (A07), email déjà pris → 409 (A01),
 *                   changement email → nouveau JWT
 *   Cas limites   : update sans changement d'email, mettre à jour uniquement le thème
 */
class UserControllerTest extends AbstractFunctionalTest
{
    // GET /api/user/me — Happy Path
    public function testGetProfileReturnsAuthenticatedUserData(): void
    {
        $user  = $this->createUser('me@example.com', 'password123', 'Jean', 'Dupont');
        $token = $this->getToken($user);

        $this->authJson('GET', '/api/user/me', [], $token);

        $this->assertSame(200, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertArrayHasKey('user', $data);
        $this->assertSame('me@example.com', $data['user']['email']);
        $this->assertSame('Jean', $data['user']['firstName']);
        $this->assertSame('Dupont', $data['user']['lastName']);
    }

    public function testGetProfileReturnsQuotaInfo(): void
    {
        $user  = $this->createUser('quota@example.com', 'password123');
        $token = $this->getToken($user);

        $this->authJson('GET', '/api/user/me', [], $token);

        $data = $this->getResponseData();
        $this->assertArrayHasKey('quotaUsed', $data['user']);
        $this->assertArrayHasKey('quotaLimit', $data['user']);
        $this->assertArrayHasKey('quotaPercentage', $data['user']);
    }

    // GET /api/user/me — Sécurité A07
    public function testGetProfileWithoutTokenReturns401(): void
    {
        $this->client->request('GET', '/api/user/me');
        $this->assertSame(401, $this->getStatusCode());
    }

    // PATCH /api/user/me — Happy Path
    public function testUpdateFirstNameAndLastNameSucceeds(): void
    {
        $user  = $this->createUser('user@example.com', 'password123', 'Old', 'Name');
        $token = $this->getToken($user);

        $this->authJson('PATCH', '/api/user/me', [
            'firstName' => 'New',
            'lastName'  => 'Name',
        ], $token);

        $this->assertSame(200, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertSame('New', $data['user']['firstName']);
        $this->assertSame('Name', $data['user']['lastName']);
    }

    public function testUpdateThemeToLightSucceeds(): void
    {
        $user  = $this->createUser('user@example.com', 'password123');
        $token = $this->getToken($user);

        $this->authJson('PATCH', '/api/user/me', ['theme' => 'light'], $token);

        $this->assertSame(200, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertSame('light', $data['user']['theme']);
    }

    public function testUpdateThemeToDarkSucceeds(): void
    {
        $user  = $this->createUser('user@example.com', 'password123');
        $token = $this->getToken($user);

        $this->authJson('PATCH', '/api/user/me', ['theme' => 'dark'], $token);

        $this->assertSame(200, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertSame('dark', $data['user']['theme']);
    }

    public function testUpdateEmailGeneratesNewJwtToken(): void
    {
        $user  = $this->createUser('old@example.com', 'password123');
        $token = $this->getToken($user);

        $this->authJson('PATCH', '/api/user/me', ['email' => 'new@example.com'], $token);

        $this->assertSame(200, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertArrayHasKey('token', $data, 'Un nouveau token JWT doit être retourné lors du changement d\'email');
        $this->assertNotEmpty($data['token']);
    }

    // PATCH /api/user/me — Validation
    public function testUpdateWithInvalidEmailFormatReturns400(): void
    {
        $user  = $this->createUser('user@example.com', 'password123');
        $token = $this->getToken($user);

        $this->authJson('PATCH', '/api/user/me', ['email' => 'not-an-email'], $token);

        $this->assertSame(400, $this->getStatusCode());
    }

    public function testUpdateWithInvalidThemeReturns400(): void
    {
        $user  = $this->createUser('user@example.com', 'password123');
        $token = $this->getToken($user);

        $this->authJson('PATCH', '/api/user/me', ['theme' => 'invalid-theme'], $token);

        $this->assertSame(400, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertArrayHasKey('error', $data);
    }

    // PATCH /api/user/me — Sécurité OWASP A01 — email déjà pris
    public function testUpdateWithAlreadyTakenEmailReturns409(): void
    {
        $user1 = $this->createUser('user1@example.com', 'password123');
        $this->createUser('user2@example.com', 'password123');
        $token = $this->getToken($user1);

        $this->authJson('PATCH', '/api/user/me', ['email' => 'user2@example.com'], $token);

        $this->assertSame(409, $this->getStatusCode());
    }

    // POST /api/user/me/password — Happy Path
    public function testChangePasswordWithValidDataSucceeds(): void
    {
        $user  = $this->createUser('user@example.com', 'currentpassword');
        $token = $this->getToken($user);

        $this->authJson('POST', '/api/user/me/password', [
            'currentPassword' => 'currentpassword',
            'newPassword'     => 'newpassword123',
        ], $token);

        $this->assertSame(200, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertArrayHasKey('message', $data);
    }

    // POST /api/user/me/password — Validation
    public function testChangePasswordWithWrongCurrentPasswordReturns400(): void
    {
        $user  = $this->createUser('user@example.com', 'realpassword');
        $token = $this->getToken($user);

        $this->authJson('POST', '/api/user/me/password', [
            'currentPassword' => 'wrongpassword',
            'newPassword'     => 'newpassword123',
        ], $token);

        $this->assertSame(400, $this->getStatusCode());
    }

    public function testChangePasswordWithNewPasswordShorterThan8CharsReturns400(): void
    {
        $user  = $this->createUser('user@example.com', 'currentpassword');
        $token = $this->getToken($user);

        $this->authJson('POST', '/api/user/me/password', [
            'currentPassword' => 'currentpassword',
            'newPassword'     => '1234567',
        ], $token);

        $this->assertSame(400, $this->getStatusCode());
    }

    public function testChangePasswordWithMissingFieldsReturns400(): void
    {
        $user  = $this->createUser('user@example.com', 'currentpassword');
        $token = $this->getToken($user);

        $this->authJson('POST', '/api/user/me/password', [
            'currentPassword' => 'currentpassword',
        ], $token);

        $this->assertSame(400, $this->getStatusCode());
    }

    // POST /api/user/me/password — Sécurité OWASP A07
    public function testChangePasswordWithoutTokenReturns401(): void
    {
        $this->publicJson('POST', '/api/user/me/password', [
            'currentPassword' => 'old',
            'newPassword'     => 'newpassword123',
        ]);

        $this->assertSame(401, $this->getStatusCode());
    }

    // POST /api/user/me/avatar — Validation
    public function testUploadAvatarWithoutFileReturns400(): void
    {
        $user  = $this->createUser('user@example.com', 'password123');
        $token = $this->getToken($user);

        $this->client->request(
            'POST',
            '/api/user/me/avatar',
            [],
            [],
            [
                'CONTENT_TYPE'       => 'multipart/form-data',
                'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
            ]
        );

        $this->assertSame(400, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertArrayHasKey('error', $data);
    }

    public function testUploadAvatarWithInvalidMimeTypeReturns400(): void
    {
        $user  = $this->createUser('user@example.com', 'password123');
        $token = $this->getToken($user);

        // Fichier PHP renommé en jpg (OWASP A08 — upload malveillant)
        $maliciousContent = '<?php system($_GET["cmd"]); ?>';
        $file = $this->createTempFile($maliciousContent, 'photo.jpg', 'application/x-php');

        $this->client->request(
            'POST',
            '/api/user/me/avatar',
            [],
            ['avatar' => $file],
            ['HTTP_AUTHORIZATION' => 'Bearer ' . $token]
        );

        $this->assertSame(400, $this->getStatusCode());
    }

    public function testUploadAvatarExceedingMaxSizeReturns400(): void
    {
        $user  = $this->createUser('user@example.com', 'password123');
        $token = $this->getToken($user);

        // GIF valide + padding null pour dépasser 2 Mo
        // getMimeType() sniffe le contenu réel (pas le clientMimeType) — le header GIF
        // garantit la détection 'image/gif', le check MIME passe, le check taille renvoie 400.
        $gifHeader = base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
        $tmpPath   = tempnam(sys_get_temp_dir(), 'supfile_large_') . '.gif';
        file_put_contents($tmpPath, $gifHeader . str_repeat("\x00", 3 * 1024 * 1024));
        $file = new \Symfony\Component\HttpFoundation\File\UploadedFile($tmpPath, 'large.gif', 'image/gif', null, true);

        $this->client->request(
            'POST',
            '/api/user/me/avatar',
            [],
            ['avatar' => $file],
            ['HTTP_AUTHORIZATION' => 'Bearer ' . $token]
        );

        $this->assertSame(400, $this->getStatusCode());
    }

    // POST /api/user/me/avatar — Sécurité OWASP A07
    public function testUploadAvatarWithoutTokenReturns401(): void
    {
        $this->client->request('POST', '/api/user/me/avatar');
        $this->assertSame(401, $this->getStatusCode());
    }

    public function testUploadAvatarSucceedsAndReturns200(): void
    {
        $user  = $this->createUser('user@example.com', 'password123');
        $token = $this->getToken($user);
        $file  = $this->createTinyImageFile('avatar.gif');

        $this->client->request(
            'POST',
            '/api/user/me/avatar',
            [],
            ['avatar' => $file],
            ['HTTP_AUTHORIZATION' => 'Bearer ' . $token]
        );

        $this->assertSame(200, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertArrayHasKey('user', $data);
        $this->assertNotNull($data['user']['avatar']);
    }

    public function testUploadAvatarReplacesExistingAvatar(): void
    {
        $user  = $this->createUser('user@example.com', 'password123');
        $token = $this->getToken($user);

        // Premier upload
        $file1 = $this->createTinyImageFile('first.gif');
        $this->client->request('POST', '/api/user/me/avatar', [], ['avatar' => $file1], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ]);
        $this->assertSame(200, $this->getStatusCode());
        $firstAvatar = $this->getResponseData()['user']['avatar'];

        // Deuxième upload — doit remplacer le premier
        $file2 = $this->createTinyImageFile('second.gif');
        $this->client->request('POST', '/api/user/me/avatar', [], ['avatar' => $file2], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ]);
        $this->assertSame(200, $this->getStatusCode());
        $secondAvatar = $this->getResponseData()['user']['avatar'];

        $this->assertNotSame($firstAvatar, $secondAvatar);
    }
}
