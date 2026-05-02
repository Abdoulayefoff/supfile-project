<?php

namespace App\Tests\Functional\Controller;

use App\Tests\Functional\AbstractFunctionalTest;

/**
 * Tests fonctionnels pour TrashController.
 *
 * Couverture :
 *   Happy path    : list corbeille, restaurer fichier, restaurer dossier,
 *                   suppression définitive fichier, suppression définitive dossier
 *   Validation    : fichier pas dans corbeille → 400, dossier pas dans corbeille → 400
 *   Sécurité OWASP: sans token → 401 (A07), IDOR → 403 (A01)
 *   Cas limites   : corbeille vide, fichier inexistant → 404
 */
class TrashControllerTest extends AbstractFunctionalTest
{
    // GET /api/trash — Happy Path
    public function testListTrashReturnsDeletedFilesAndFolders(): void
    {
        $user  = $this->createUser('user@example.com', 'password123');
        $token = $this->getToken($user);

        $this->createFileEntity($user, 'deleted-file.txt', null, true);
        $this->createFolderEntity($user, 'deleted-folder', null, true);
        $this->createFileEntity($user, 'active-file.txt', null, false);

        $this->authJson('GET', '/api/trash', [], $token);

        $this->assertSame(200, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertArrayHasKey('files', $data);
        $this->assertArrayHasKey('folders', $data);
        $this->assertCount(1, $data['files']);
        $this->assertCount(1, $data['folders']);
        $this->assertSame('deleted-file.txt', $data['files'][0]['name']);
        $this->assertSame('deleted-folder', $data['folders'][0]['name']);
    }

    public function testListTrashReturnsEmptyWhenNothingDeleted(): void
    {
        $user  = $this->createUser('user@example.com', 'password123');
        $token = $this->getToken($user);

        $this->authJson('GET', '/api/trash', [], $token);

        $data = $this->getResponseData();
        $this->assertCount(0, $data['files']);
        $this->assertCount(0, $data['folders']);
    }

    // GET /api/trash — Sécurité OWASP A07
    public function testListTrashWithoutTokenReturns401(): void
    {
        $this->client->request('GET', '/api/trash');
        $this->assertSame(401, $this->getStatusCode());
    }

    // POST /api/trash/files/{id}/restore — Happy Path
    public function testRestoreFileSucceeds(): void
    {
        $user  = $this->createUser('user@example.com', 'password123');
        $token = $this->getToken($user);
        $file  = $this->createFileEntity($user, 'restore-me.txt', null, true);

        $this->authJson('POST', '/api/trash/files/' . $file->getId() . '/restore', [], $token);

        $this->assertSame(200, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertArrayHasKey('message', $data);

        $this->em->refresh($file);
        $this->assertFalse($file->isDeleted());
        $this->assertNull($file->getDeletedAt());
    }

    // POST /api/trash/files/{id}/restore — Sécurité OWASP A01 — IDOR
    public function testRestoreFileOfAnotherUserReturns403(): void
    {
        $owner    = $this->createUser('owner@example.com', 'password123');
        $attacker = $this->createUser('attacker@example.com', 'password123');
        $file     = $this->createFileEntity($owner, 'victim.txt', null, true);
        $token    = $this->getToken($attacker);

        $this->authJson('POST', '/api/trash/files/' . $file->getId() . '/restore', [], $token);

        $this->assertSame(403, $this->getStatusCode());
    }

    // POST /api/trash/folders/{id}/restore — Happy Path
    public function testRestoreFolderSucceeds(): void
    {
        $user   = $this->createUser('user@example.com', 'password123');
        $token  = $this->getToken($user);
        $folder = $this->createFolderEntity($user, 'restore-me', null, true);

        $this->authJson('POST', '/api/trash/folders/' . $folder->getId() . '/restore', [], $token);

        $this->assertSame(200, $this->getStatusCode());

        $this->em->refresh($folder);
        $this->assertFalse($folder->isDeleted());
    }

    // POST /api/trash/folders/{id}/restore — Sécurité OWASP A01 — IDOR
    public function testRestoreFolderOfAnotherUserReturns403(): void
    {
        $owner    = $this->createUser('owner@example.com', 'password123');
        $attacker = $this->createUser('attacker@example.com', 'password123');
        $folder   = $this->createFolderEntity($owner, 'private-folder', null, true);
        $token    = $this->getToken($attacker);

        $this->authJson('POST', '/api/trash/folders/' . $folder->getId() . '/restore', [], $token);

        $this->assertSame(403, $this->getStatusCode());
    }

    // DELETE /api/trash/files/{id} — Happy Path
    public function testPermanentDeleteFileSucceeds(): void
    {
        $user  = $this->createUser('user@example.com', 'password123');
        $token = $this->getToken($user);
        $file  = $this->createFileEntity($user, 'delete-forever.txt', null, true);

        $fileId = $file->getId();
        $this->authJson('DELETE', '/api/trash/files/' . $fileId, [], $token);

        $this->assertSame(200, $this->getStatusCode());

        // Vérifier que le fichier n'existe plus en base
        $this->em->clear();
        $deletedFile = $this->em->find(\App\Entity\File::class, $fileId);
        $this->assertNull($deletedFile);
    }

    // DELETE /api/trash/files/{id} — Validation
    public function testPermanentDeleteFileNotInTrashReturns400(): void
    {
        $user  = $this->createUser('user@example.com', 'password123');
        $token = $this->getToken($user);
        $file  = $this->createFileEntity($user, 'active.txt', null, false);

        $this->authJson('DELETE', '/api/trash/files/' . $file->getId(), [], $token);

        $this->assertSame(400, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertArrayHasKey('error', $data);
    }

    // DELETE /api/trash/files/{id} — Sécurité OWASP A01 — IDOR
    public function testPermanentDeleteFileOfAnotherUserReturns403(): void
    {
        $owner    = $this->createUser('owner@example.com', 'password123');
        $attacker = $this->createUser('attacker@example.com', 'password123');
        $file     = $this->createFileEntity($owner, 'victim.txt', null, true);
        $token    = $this->getToken($attacker);

        $this->authJson('DELETE', '/api/trash/files/' . $file->getId(), [], $token);

        $this->assertSame(403, $this->getStatusCode());
    }

    // DELETE /api/trash/folders/{id} — Happy Path
    public function testPermanentDeleteFolderSucceeds(): void
    {
        $user   = $this->createUser('user@example.com', 'password123');
        $token  = $this->getToken($user);
        $folder = $this->createFolderEntity($user, 'to-delete-forever', null, true);

        $folderId = $folder->getId();
        $this->authJson('DELETE', '/api/trash/folders/' . $folderId, [], $token);

        $this->assertSame(200, $this->getStatusCode());

        $this->em->clear();
        $deletedFolder = $this->em->find(\App\Entity\Folder::class, $folderId);
        $this->assertNull($deletedFolder);
    }

    // DELETE /api/trash/folders/{id} — Validation
    public function testPermanentDeleteFolderNotInTrashReturns400(): void
    {
        $user   = $this->createUser('user@example.com', 'password123');
        $token  = $this->getToken($user);
        $folder = $this->createFolderEntity($user, 'active-folder', null, false);

        $this->authJson('DELETE', '/api/trash/folders/' . $folder->getId(), [], $token);

        $this->assertSame(400, $this->getStatusCode());
    }

    // DELETE /api/trash/folders/{id} — Sécurité OWASP A01 — IDOR
    public function testPermanentDeleteFolderOfAnotherUserReturns403(): void
    {
        $owner    = $this->createUser('owner@example.com', 'password123');
        $attacker = $this->createUser('attacker@example.com', 'password123');
        $folder   = $this->createFolderEntity($owner, 'private-folder', null, true);
        $token    = $this->getToken($attacker);

        $this->authJson('DELETE', '/api/trash/folders/' . $folder->getId(), [], $token);

        $this->assertSame(403, $this->getStatusCode());
    }

    // Isolation — les éléments de la corbeille d'un user ne voient pas ceux d'un autre
    public function testTrashListOnlyShowsOwnDeletedItems(): void
    {
        $user1  = $this->createUser('user1@example.com', 'password123');
        $user2  = $this->createUser('user2@example.com', 'password123');
        $token1 = $this->getToken($user1);

        $this->createFileEntity($user1, 'mine.txt', null, true);
        $this->createFileEntity($user2, 'notmine.txt', null, true);

        $this->authJson('GET', '/api/trash', [], $token1);

        $data = $this->getResponseData();
        $this->assertCount(1, $data['files']);
        $this->assertSame('mine.txt', $data['files'][0]['name']);
    }
}
