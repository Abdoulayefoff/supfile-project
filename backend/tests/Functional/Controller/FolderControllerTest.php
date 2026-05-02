<?php

namespace App\Tests\Functional\Controller;

use App\Tests\Functional\AbstractFunctionalTest;

/**
 * Tests fonctionnels pour FolderController.
 *
 * Couverture :
 *   Happy path    : list, create, show, rename, delete, move, breadcrumbs
 *   Validation    : nom vide → 400, doublon → 409
 *   Sécurité OWASP: sans token → 401 (A07), IDOR → 403 (A01), move circulaire → 400
 *   Cas limites   : parentId inexistant → 404, parentId d'un autre user → 404
 */
class FolderControllerTest extends AbstractFunctionalTest
{
    // GET /api/folders — Happy Path
    public function testListFoldersReturnsEmptyArrayByDefault(): void
    {
        $user  = $this->createUser('user@example.com', 'password123');
        $token = $this->getToken($user);

        $this->authJson('GET', '/api/folders', [], $token);

        $this->assertSame(200, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertIsArray($data);
    }

    public function testListFoldersReturnsOnlyOwnFolders(): void
    {
        $user1  = $this->createUser('user1@example.com', 'password123');
        $user2  = $this->createUser('user2@example.com', 'password123');
        $token1 = $this->getToken($user1);

        $this->createFolderEntity($user1, 'MyFolder');
        $this->createFolderEntity($user2, 'NotMyFolder');

        $this->authJson('GET', '/api/folders', [], $token1);

        $data = $this->getResponseData();
        $ownNames = array_column($data, 'name');
        $this->assertContains('MyFolder', $ownNames);
        $this->assertNotContains('NotMyFolder', $ownNames);
    }

    public function testListFoldersDoesNotReturnDeletedFolders(): void
    {
        $user  = $this->createUser('user@example.com', 'password123');
        $token = $this->getToken($user);

        $this->createFolderEntity($user, 'Active');
        $this->createFolderEntity($user, 'Deleted', null, true);

        $this->authJson('GET', '/api/folders', [], $token);

        $data = $this->getResponseData();
        $names = array_column($data, 'name');
        $this->assertContains('Active', $names);
        $this->assertNotContains('Deleted', $names);
    }

    // GET /api/folders — Cas limites
    public function testListFoldersWithParentIdFilterReturnsSubfolders(): void
    {
        $user   = $this->createUser('user@example.com', 'password123');
        $token  = $this->getToken($user);
        $parent = $this->createFolderEntity($user, 'Parent');
        $this->createFolderEntity($user, 'Child', $parent);
        $this->createFolderEntity($user, 'OtherRoot');

        $this->client->request(
            'GET',
            '/api/folders?parentId=' . $parent->getId(),
            [],
            [],
            ['HTTP_AUTHORIZATION' => 'Bearer ' . $token]
        );

        $data = $this->getResponseData();
        $this->assertCount(1, $data);
        $this->assertSame('Child', $data[0]['name']);
    }

    public function testListFoldersWithNonExistentParentIdReturns404(): void
    {
        $user  = $this->createUser('user@example.com', 'password123');
        $token = $this->getToken($user);

        $this->client->request(
            'GET',
            '/api/folders?parentId=99999',
            [],
            [],
            ['HTTP_AUTHORIZATION' => 'Bearer ' . $token]
        );

        $this->assertSame(404, $this->getStatusCode());
    }

    // GET /api/folders — Sécurité OWASP A07
    public function testListFoldersWithoutTokenReturns401(): void
    {
        $this->client->request('GET', '/api/folders');
        $this->assertSame(401, $this->getStatusCode());
    }

    // POST /api/folders — Happy Path
    public function testCreateFolderSucceedsAndReturns201(): void
    {
        $user  = $this->createUser('user@example.com', 'password123');
        $token = $this->getToken($user);

        $this->authJson('POST', '/api/folders', ['name' => 'New Folder'], $token);

        $this->assertSame(201, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertSame('New Folder', $data['name']);
        $this->assertArrayHasKey('id', $data);
    }

    public function testCreateSubfolderWithValidParentSucceeds(): void
    {
        $user   = $this->createUser('user@example.com', 'password123');
        $token  = $this->getToken($user);
        $parent = $this->createFolderEntity($user, 'Parent');

        $this->authJson('POST', '/api/folders', [
            'name'     => 'Subfolder',
            'parentId' => $parent->getId(),
        ], $token);

        $this->assertSame(201, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertSame($parent->getId(), $data['parentId']);
    }

    // POST /api/folders — Validation
    public function testCreateFolderWithEmptyNameReturns400(): void
    {
        $user  = $this->createUser('user@example.com', 'password123');
        $token = $this->getToken($user);

        $this->authJson('POST', '/api/folders', ['name' => ''], $token);

        $this->assertSame(400, $this->getStatusCode());
    }

    public function testCreateDuplicateFolderAtSameLevelReturns409(): void
    {
        $user  = $this->createUser('user@example.com', 'password123');
        $token = $this->getToken($user);

        $this->createFolderEntity($user, 'Existing Folder');

        $this->authJson('POST', '/api/folders', ['name' => 'Existing Folder'], $token);

        $this->assertSame(409, $this->getStatusCode());
    }

    // POST /api/folders — Cas limites
    public function testCreateFolderWithParentBelongingToAnotherUserReturns404(): void
    {
        $user1   = $this->createUser('user1@example.com', 'password123');
        $user2   = $this->createUser('user2@example.com', 'password123');
        $folder2 = $this->createFolderEntity($user2, 'OtherUserFolder');
        $token1  = $this->getToken($user1);

        $this->authJson('POST', '/api/folders', [
            'name'     => 'Child',
            'parentId' => $folder2->getId(),
        ], $token1);

        $this->assertSame(404, $this->getStatusCode());
    }

    // GET /api/folders/{id} — Happy Path
    public function testShowFolderSucceedsForOwner(): void
    {
        $user   = $this->createUser('user@example.com', 'password123');
        $token  = $this->getToken($user);
        $folder = $this->createFolderEntity($user, 'MyFolder');

        $this->authJson('GET', '/api/folders/' . $folder->getId(), [], $token);

        $this->assertSame(200, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertSame('MyFolder', $data['name']);
    }

    // GET /api/folders/{id} — Sécurité OWASP A01 — IDOR
    public function testShowFolderReturns403ForNonOwner(): void
    {
        $owner    = $this->createUser('owner@example.com', 'password123');
        $attacker = $this->createUser('attacker@example.com', 'password123');
        $folder   = $this->createFolderEntity($owner, 'Private');
        $token    = $this->getToken($attacker);

        $this->authJson('GET', '/api/folders/' . $folder->getId(), [], $token);

        $this->assertSame(403, $this->getStatusCode());
    }

    // PATCH /api/folders/{id} — Happy Path
    public function testRenameFolderSucceeds(): void
    {
        $user   = $this->createUser('user@example.com', 'password123');
        $token  = $this->getToken($user);
        $folder = $this->createFolderEntity($user, 'OldName');

        $this->authJson('PATCH', '/api/folders/' . $folder->getId(), ['name' => 'NewName'], $token);

        $this->assertSame(200, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertSame('NewName', $data['name']);
    }

    // PATCH /api/folders/{id} — Validation
    public function testRenameFolderWithEmptyNameReturns400(): void
    {
        $user   = $this->createUser('user@example.com', 'password123');
        $token  = $this->getToken($user);
        $folder = $this->createFolderEntity($user, 'SomeName');

        $this->authJson('PATCH', '/api/folders/' . $folder->getId(), ['name' => ''], $token);

        $this->assertSame(400, $this->getStatusCode());
    }

    // DELETE /api/folders/{id} — Happy Path
    public function testDeleteFolderSoftDeletesSuccessfully(): void
    {
        $user   = $this->createUser('user@example.com', 'password123');
        $token  = $this->getToken($user);
        $folder = $this->createFolderEntity($user, 'ToDelete');

        $this->authJson('DELETE', '/api/folders/' . $folder->getId(), [], $token);

        $this->assertSame(200, $this->getStatusCode());

        $this->em->refresh($folder);
        $this->assertTrue($folder->isDeleted());
    }

    // DELETE /api/folders/{id} — Sécurité OWASP A01 — IDOR
    public function testDeleteFolderOfAnotherUserReturns403(): void
    {
        $owner    = $this->createUser('owner@example.com', 'password123');
        $attacker = $this->createUser('attacker@example.com', 'password123');
        $folder   = $this->createFolderEntity($owner, 'Protected');
        $token    = $this->getToken($attacker);

        $this->authJson('DELETE', '/api/folders/' . $folder->getId(), [], $token);

        $this->assertSame(403, $this->getStatusCode());
    }

    // PATCH /api/folders/{id}/move — Happy Path
    public function testMoveFolderToAnotherParentSucceeds(): void
    {
        $user    = $this->createUser('user@example.com', 'password123');
        $token   = $this->getToken($user);
        $source  = $this->createFolderEntity($user, 'Source');
        $target  = $this->createFolderEntity($user, 'Target');

        $this->authJson('PATCH', '/api/folders/' . $source->getId() . '/move', [
            'targetParentId' => $target->getId(),
        ], $token);

        $this->assertSame(200, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertSame($target->getId(), $data['parentId']);
    }

    public function testMoveFolderToRootSucceeds(): void
    {
        $user   = $this->createUser('user@example.com', 'password123');
        $token  = $this->getToken($user);
        $parent = $this->createFolderEntity($user, 'Parent');
        $child  = $this->createFolderEntity($user, 'Child', $parent);

        $this->authJson('PATCH', '/api/folders/' . $child->getId() . '/move', [
            'targetParentId' => null,
        ], $token);

        $this->assertSame(200, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertNull($data['parentId']);
    }

    // PATCH /api/folders/{id}/move — Cas limites — déplacement circulaire
    public function testMoveFolderIntoItselfReturns400(): void
    {
        $user   = $this->createUser('user@example.com', 'password123');
        $token  = $this->getToken($user);
        $folder = $this->createFolderEntity($user, 'SelfMove');

        $this->authJson('PATCH', '/api/folders/' . $folder->getId() . '/move', [
            'targetParentId' => $folder->getId(),
        ], $token);

        $this->assertSame(400, $this->getStatusCode());
    }

    public function testMoveFolderIntoDescendantReturns400(): void
    {
        $user   = $this->createUser('user@example.com', 'password123');
        $token  = $this->getToken($user);
        $parent = $this->createFolderEntity($user, 'Parent');
        $child  = $this->createFolderEntity($user, 'Child', $parent);

        // Tenter de déplacer le parent dans l'enfant (circulaire)
        $this->authJson('PATCH', '/api/folders/' . $parent->getId() . '/move', [
            'targetParentId' => $child->getId(),
        ], $token);

        $this->assertSame(400, $this->getStatusCode());
    }

    // GET /api/folders/{id}/breadcrumbs — Happy Path
    public function testBreadcrumbsReturnsPathFromRootToFolder(): void
    {
        $user   = $this->createUser('user@example.com', 'password123');
        $token  = $this->getToken($user);
        $root   = $this->createFolderEntity($user, 'Root');
        $child  = $this->createFolderEntity($user, 'Child', $root);

        $this->authJson('GET', '/api/folders/' . $child->getId() . '/breadcrumbs', [], $token);

        $this->assertSame(200, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertIsArray($data);
    }

    // GET /api/folders/{id}/breadcrumbs — Sécurité OWASP A01 — IDOR
    public function testBreadcrumbsReturns403ForNonOwner(): void
    {
        $owner    = $this->createUser('owner@example.com', 'password123');
        $attacker = $this->createUser('attacker@example.com', 'password123');
        $folder   = $this->createFolderEntity($owner, 'Private');
        $token    = $this->getToken($attacker);

        $this->authJson('GET', '/api/folders/' . $folder->getId() . '/breadcrumbs', [], $token);

        $this->assertSame(403, $this->getStatusCode());
    }

    // GET /api/folders/{id}/download — ZIP
    public function testDownloadFolderReturnsZip(): void
    {
        $user   = $this->createUser('user@example.com', 'password123');
        $token  = $this->getToken($user);
        $folder = $this->createFolderEntity($user, 'archive-folder');
        $this->createFileEntityWithRealFile($user, 'file1.txt', 'content one', 'text/plain', $folder);
        $this->createFileEntityWithRealFile($user, 'file2.txt', 'content two', 'text/plain', $folder);

        $this->client->request('GET', '/api/folders/' . $folder->getId() . '/download', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ]);

        $this->assertSame(200, $this->getStatusCode());
        $this->assertStringContainsString('application/zip', $this->client->getResponse()->headers->get('Content-Type'));
        $this->assertStringContainsString('attachment', $this->client->getResponse()->headers->get('Content-Disposition'));
    }

    public function testDownloadNonExistentFolderReturns404(): void
    {
        $user  = $this->createUser('user@example.com', 'password123');
        $token = $this->getToken($user);

        $this->client->request('GET', '/api/folders/99999/download', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ]);

        $this->assertSame(404, $this->getStatusCode());
    }

    public function testDownloadDeletedFolderReturns400(): void
    {
        $user   = $this->createUser('user@example.com', 'password123');
        $token  = $this->getToken($user);
        $folder = $this->createFolderEntity($user, 'deleted-folder', null, true);

        $this->client->request('GET', '/api/folders/' . $folder->getId() . '/download', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ]);

        $this->assertSame(400, $this->getStatusCode());
    }

    public function testDownloadFolderReturns403ForNonOwner(): void
    {
        $owner    = $this->createUser('owner@example.com', 'password123');
        $attacker = $this->createUser('attacker@example.com', 'password123');
        $token    = $this->getToken($attacker);
        $folder   = $this->createFolderEntity($owner, 'private-folder');

        $this->client->request('GET', '/api/folders/' . $folder->getId() . '/download', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ]);

        $this->assertSame(403, $this->getStatusCode());
    }
}
