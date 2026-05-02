<?php

namespace App\Tests\Functional\Controller;

use App\Entity\Share;
use App\Tests\Functional\AbstractFunctionalTest;

/**
 * Tests fonctionnels pour ShareController.
 *
 * Couverture :
 *   Happy path    : créer partage public (fichier), public (dossier), avec password, avec expiry,
 *                   partage privé, list partages, accès public, validate password, received, delete
 *   Validation    : type manquant, resourceId manquant, partage avec soi-même → 400
 *   Sécurité OWASP: sans token → 401 (A07), ressource d'un autre user → 404 (A01),
 *                   token inexistant → 404, token expiré → 410, IDOR delete → 403,
 *                   mauvais password → 401, protected → retourne {protected: true}
 *   Cas limites   : partage d'un utilisateur inexistant (email introuvable)
 */
class ShareControllerTest extends AbstractFunctionalTest
{
    // POST /api/shares — Happy Path
    public function testCreatePublicShareForFileSucceeds(): void
    {
        $user  = $this->createUser('owner@example.com', 'password123');
        $token = $this->getToken($user);
        $file  = $this->createFileEntity($user, 'shared.pdf');

        $this->authJson('POST', '/api/shares', [
            'type'       => 'file',
            'resourceId' => $file->getId(),
        ], $token);

        $this->assertSame(201, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertTrue($data['isPublic']);
        $this->assertArrayHasKey('token', $data);
        $this->assertSame('file', $data['resourceType']);
    }

    public function testCreatePublicShareForFolderSucceeds(): void
    {
        $user   = $this->createUser('owner@example.com', 'password123');
        $token  = $this->getToken($user);
        $folder = $this->createFolderEntity($user, 'SharedFolder');

        $this->authJson('POST', '/api/shares', [
            'type'       => 'folder',
            'resourceId' => $folder->getId(),
        ], $token);

        $this->assertSame(201, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertTrue($data['isPublic']);
        $this->assertSame('folder', $data['resourceType']);
    }

    public function testCreatePublicShareWithPasswordSucceeds(): void
    {
        $user  = $this->createUser('owner@example.com', 'password123');
        $token = $this->getToken($user);
        $file  = $this->createFileEntity($user, 'secure.pdf');

        $this->authJson('POST', '/api/shares', [
            'type'       => 'file',
            'resourceId' => $file->getId(),
            'password'   => 'mySecretPass',
        ], $token);

        $this->assertSame(201, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertTrue($data['hasPassword']);
    }

    public function testCreatePublicShareWithExpirySucceeds(): void
    {
        $user  = $this->createUser('owner@example.com', 'password123');
        $token = $this->getToken($user);
        $file  = $this->createFileEntity($user, 'expiring.pdf');

        $this->authJson('POST', '/api/shares', [
            'type'       => 'file',
            'resourceId' => $file->getId(),
            'expiresAt'  => (new \DateTimeImmutable('+7 days'))->format('c'),
        ], $token);

        $this->assertSame(201, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertNotNull($data['expiresAt']);
    }

    public function testCreatePrivateShareSucceeds(): void
    {
        $owner = $this->createUser('owner@example.com', 'password123');
        $this->createUser('receiver@example.com', 'password123');
        $token = $this->getToken($owner);
        $file  = $this->createFileEntity($owner, 'private.pdf');

        $this->authJson('POST', '/api/shares', [
            'type'            => 'file',
            'resourceId'      => $file->getId(),
            'sharedWithEmail' => 'receiver@example.com',
        ], $token);

        $this->assertSame(201, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertFalse($data['isPublic']);
        $this->assertSame('receiver@example.com', $data['sharedWith']['email']);
    }

    // POST /api/shares — Validation
    public function testCreateShareWithoutTypeReturns400(): void
    {
        $user  = $this->createUser('owner@example.com', 'password123');
        $token = $this->getToken($user);

        $this->authJson('POST', '/api/shares', ['resourceId' => 1], $token);

        $this->assertSame(400, $this->getStatusCode());
    }

    public function testCreateShareWithoutResourceIdReturns400(): void
    {
        $user  = $this->createUser('owner@example.com', 'password123');
        $token = $this->getToken($user);

        $this->authJson('POST', '/api/shares', ['type' => 'file'], $token);

        $this->assertSame(400, $this->getStatusCode());
    }

    public function testCreateShareWithSelfReturns400(): void
    {
        $user  = $this->createUser('self@example.com', 'password123');
        $token = $this->getToken($user);
        $file  = $this->createFileEntity($user, 'myfile.pdf');

        $this->authJson('POST', '/api/shares', [
            'type'            => 'file',
            'resourceId'      => $file->getId(),
            'sharedWithEmail' => 'self@example.com',
        ], $token);

        $this->assertSame(400, $this->getStatusCode());
    }

    // POST /api/shares — Sécurité OWASP A01
    public function testCreateShareForAnotherUsersFileReturns404(): void
    {
        $owner    = $this->createUser('owner@example.com', 'password123');
        $attacker = $this->createUser('attacker@example.com', 'password123');
        $file     = $this->createFileEntity($owner, 'victim.pdf');
        $token    = $this->getToken($attacker);

        $this->authJson('POST', '/api/shares', [
            'type'       => 'file',
            'resourceId' => $file->getId(),
        ], $token);

        $this->assertSame(404, $this->getStatusCode());
    }

    public function testCreateShareForNonExistentUserEmailReturns404(): void
    {
        $user  = $this->createUser('owner@example.com', 'password123');
        $token = $this->getToken($user);
        $file  = $this->createFileEntity($user, 'file.pdf');

        $this->authJson('POST', '/api/shares', [
            'type'            => 'file',
            'resourceId'      => $file->getId(),
            'sharedWithEmail' => 'nobody@nowhere.com',
        ], $token);

        $this->assertSame(404, $this->getStatusCode());
    }

    // POST /api/shares — Sécurité A07
    public function testCreateShareWithoutTokenReturns401(): void
    {
        $this->publicJson('POST', '/api/shares', ['type' => 'file', 'resourceId' => 1]);
        $this->assertSame(401, $this->getStatusCode());
    }

    // GET /api/shares — Happy Path
    public function testListSharesReturnsUserShares(): void
    {
        $user  = $this->createUser('owner@example.com', 'password123');
        $token = $this->getToken($user);
        $file  = $this->createFileEntity($user, 'shared.pdf');

        // Créer un partage via la route
        $this->authJson('POST', '/api/shares', [
            'type'       => 'file',
            'resourceId' => $file->getId(),
        ], $token);

        $this->authJson('GET', '/api/shares', [], $token);

        $this->assertSame(200, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertIsArray($data);
        $this->assertCount(1, $data);
    }

    // GET /api/shares — Sécurité A07
    public function testListSharesWithoutTokenReturns401(): void
    {
        $this->client->request('GET', '/api/shares');
        $this->assertSame(401, $this->getStatusCode());
    }

    // GET /api/shares/public/{token} — Happy Path
    public function testPublicAccessWithValidTokenReturnsShareData(): void
    {
        $user  = $this->createUser('owner@example.com', 'password123');
        $file  = $this->createFileEntity($user, 'public.pdf');
        $share = $this->createPublicShare($user, $file);

        $this->client->request('GET', '/api/shares/public/' . $share->getToken());

        $this->assertSame(200, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertArrayHasKey('token', $data);
    }

    public function testPublicAccessWithPasswordProtectedShareReturnsProtectedFlag(): void
    {
        $user  = $this->createUser('owner@example.com', 'password123');
        $file  = $this->createFileEntity($user, 'protected.pdf');
        $share = $this->createPublicShareWithPassword($user, $file, 'secretpass');

        $this->client->request('GET', '/api/shares/public/' . $share->getToken());

        $this->assertSame(200, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertTrue($data['protected']);
        $this->assertArrayHasKey('token', $data);
    }

    // GET /api/shares/public/{token} — Cas limites
    public function testPublicAccessWithNonExistentTokenReturns404(): void
    {
        $this->client->request('GET', '/api/shares/public/nonexistenttoken123456789');

        $this->assertSame(404, $this->getStatusCode());
    }

    public function testPublicAccessWithExpiredShareReturns410(): void
    {
        $user  = $this->createUser('owner@example.com', 'password123');
        $file  = $this->createFileEntity($user, 'expired.pdf');
        $share = $this->createExpiredShare($user, $file);

        $this->client->request('GET', '/api/shares/public/' . $share->getToken());

        $this->assertSame(410, $this->getStatusCode());
    }

    // POST /api/shares/public/{token}/validate — Happy Path
    public function testValidatePasswordWithCorrectPasswordReturns200(): void
    {
        $user  = $this->createUser('owner@example.com', 'password123');
        $file  = $this->createFileEntity($user, 'protected.pdf');
        $share = $this->createPublicShareWithPassword($user, $file, 'correctpass');

        $this->publicJson('POST', '/api/shares/public/' . $share->getToken() . '/validate', [
            'password' => 'correctpass',
        ]);

        $this->assertSame(200, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertArrayHasKey('token', $data);
    }

    // POST /api/shares/public/{token}/validate — Sécurité OWASP A07
    public function testValidatePasswordWithWrongPasswordReturns401(): void
    {
        $user  = $this->createUser('owner@example.com', 'password123');
        $file  = $this->createFileEntity($user, 'protected.pdf');
        $share = $this->createPublicShareWithPassword($user, $file, 'correctpass');

        $this->publicJson('POST', '/api/shares/public/' . $share->getToken() . '/validate', [
            'password' => 'wrongpassword',
        ]);

        $this->assertSame(401, $this->getStatusCode());
    }

    // GET /api/shares/received — Happy Path
    public function testReceivedSharesReturnsPrivateSharesForCurrentUser(): void
    {
        $owner    = $this->createUser('owner@example.com', 'password123');
        $receiver = $this->createUser('receiver@example.com', 'password123');
        $token    = $this->getToken($receiver);
        $file     = $this->createFileEntity($owner, 'shared.pdf');

        $this->createPrivateShare($owner, $file, $receiver);

        $this->authJson('GET', '/api/shares/received', [], $token);

        $this->assertSame(200, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertCount(1, $data);
    }

    // DELETE /api/shares/{id} — Happy Path
    public function testDeleteOwnShareSucceeds(): void
    {
        $user  = $this->createUser('owner@example.com', 'password123');
        $token = $this->getToken($user);
        $file  = $this->createFileEntity($user, 'to-delete.pdf');
        $share = $this->createPublicShare($user, $file);

        $this->authJson('DELETE', '/api/shares/' . $share->getId(), [], $token);

        $this->assertSame(200, $this->getStatusCode());
    }

    // DELETE /api/shares/{id} — Sécurité OWASP A01 — IDOR
    public function testDeleteShareOfAnotherUserReturns403(): void
    {
        $owner    = $this->createUser('owner@example.com', 'password123');
        $attacker = $this->createUser('attacker@example.com', 'password123');
        $file     = $this->createFileEntity($owner, 'victim.pdf');
        $share    = $this->createPublicShare($owner, $file);
        $token    = $this->getToken($attacker);

        $this->authJson('DELETE', '/api/shares/' . $share->getId(), [], $token);

        $this->assertSame(403, $this->getStatusCode());
    }

    // Helpers de création de partages directement en BDD
    private function createPublicShare($user, $resource): Share
    {
        $share = new Share();
        $share->setCreatedBy($user);
        $share->setIsPublic(true);

        if ($resource instanceof \App\Entity\File) {
            $share->setFile($resource);
        } else {
            $share->setFolder($resource);
        }

        $this->em->persist($share);
        $this->em->flush();

        return $share;
    }

    private function createPublicShareWithPassword($user, $resource, string $password): Share
    {
        $share = new Share();
        $share->setCreatedBy($user);
        $share->setIsPublic(true);
        $share->setPassword(password_hash($password, PASSWORD_BCRYPT));

        if ($resource instanceof \App\Entity\File) {
            $share->setFile($resource);
        } else {
            $share->setFolder($resource);
        }

        $this->em->persist($share);
        $this->em->flush();

        return $share;
    }

    // POST /api/shares/public/{token}/download — Happy Path & Sécurité
    public function testPublicDownloadFileReturns200(): void
    {
        $user  = $this->createUser('owner@example.com', 'password123');
        $file  = $this->createFileEntityWithRealFile($user, 'shared.txt', 'shared content');
        $share = $this->createPublicShare($user, $file);

        $this->publicJson('POST', '/api/shares/public/' . $share->getToken() . '/download');

        $this->assertSame(200, $this->getStatusCode());
        $this->assertStringContainsString('attachment', $this->client->getResponse()->headers->get('Content-Disposition'));
    }

    public function testPublicDownloadExpiredShareReturns410(): void
    {
        $user  = $this->createUser('owner@example.com', 'password123');
        $file  = $this->createFileEntityWithRealFile($user, 'expired.txt');
        $share = $this->createExpiredShare($user, $file);

        $this->publicJson('POST', '/api/shares/public/' . $share->getToken() . '/download');

        $this->assertSame(410, $this->getStatusCode());
    }

    public function testPublicDownloadWithWrongPasswordReturns401(): void
    {
        $user  = $this->createUser('owner@example.com', 'password123');
        $file  = $this->createFileEntityWithRealFile($user, 'locked.txt');
        $share = $this->createPublicShareWithPassword($user, $file, 'secret123');

        $this->publicJson('POST', '/api/shares/public/' . $share->getToken() . '/download', [
            'password' => 'wrong-password',
        ]);

        $this->assertSame(401, $this->getStatusCode());
    }

    public function testPublicDownloadWithCorrectPasswordReturns200(): void
    {
        $user  = $this->createUser('owner@example.com', 'password123');
        $file  = $this->createFileEntityWithRealFile($user, 'locked.txt', 'locked content');
        $share = $this->createPublicShareWithPassword($user, $file, 'secret123');

        $this->publicJson('POST', '/api/shares/public/' . $share->getToken() . '/download', [
            'password' => 'secret123',
        ]);

        $this->assertSame(200, $this->getStatusCode());
    }

    public function testPublicDownloadFolderReturnsZip(): void
    {
        $user   = $this->createUser('owner@example.com', 'password123');
        $folder = $this->createFolderEntity($user, 'shared-folder');
        $this->createFileEntityWithRealFile($user, 'inside.txt', 'folder content', 'text/plain', $folder);
        $share = $this->createPublicShare($user, $folder);

        $this->publicJson('POST', '/api/shares/public/' . $share->getToken() . '/download');

        $this->assertSame(200, $this->getStatusCode());
        $this->assertStringContainsString('application/zip', $this->client->getResponse()->headers->get('Content-Type'));
    }

    // GET /api/shares/public/{token}/preview — Happy Path & Sécurité
    public function testPublicPreviewFileReturns200(): void
    {
        $user  = $this->createUser('owner@example.com', 'password123');
        $file  = $this->createFileEntityWithRealFile($user, 'preview.txt', 'preview content', 'text/plain');
        $share = $this->createPublicShare($user, $file);

        $this->client->request('GET', '/api/shares/public/' . $share->getToken() . '/preview');

        $this->assertSame(200, $this->getStatusCode());
        $this->assertStringContainsString('text/plain', $this->client->getResponse()->headers->get('Content-Type'));
    }

    public function testPublicPreviewExpiredShareReturns410(): void
    {
        $user  = $this->createUser('owner@example.com', 'password123');
        $file  = $this->createFileEntityWithRealFile($user, 'expired.txt');
        $share = $this->createExpiredShare($user, $file);

        $this->client->request('GET', '/api/shares/public/' . $share->getToken() . '/preview');

        $this->assertSame(410, $this->getStatusCode());
    }

    public function testPublicPreviewFolderReturns400(): void
    {
        $user   = $this->createUser('owner@example.com', 'password123');
        $folder = $this->createFolderEntity($user, 'preview-folder');
        $share  = $this->createPublicShare($user, $folder);

        $this->client->request('GET', '/api/shares/public/' . $share->getToken() . '/preview');

        $this->assertSame(400, $this->getStatusCode());
    }

    private function createExpiredShare($user, $resource): Share
    {
        $share = new Share();
        $share->setCreatedBy($user);
        $share->setIsPublic(true);
        $share->setExpiresAt(new \DateTimeImmutable('-1 day'));

        if ($resource instanceof \App\Entity\File) {
            $share->setFile($resource);
        } else {
            $share->setFolder($resource);
        }

        $this->em->persist($share);
        $this->em->flush();

        return $share;
    }

    private function createPrivateShare($owner, $resource, $sharedWith): Share
    {
        $share = new Share();
        $share->setCreatedBy($owner);
        $share->setIsPublic(false);
        $share->setSharedWith($sharedWith);

        if ($resource instanceof \App\Entity\File) {
            $share->setFile($resource);
        } else {
            $share->setFolder($resource);
        }

        $this->em->persist($share);
        $this->em->flush();

        return $share;
    }
}
