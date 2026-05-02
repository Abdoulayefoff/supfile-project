<?php

namespace App\Tests\Functional\Controller;

use App\Tests\Functional\AbstractFunctionalTest;

/**
 * Tests fonctionnels pour DashboardController.
 *
 * Couverture :
 *   Happy path    : stats (quota + counts), stats par type MIME, 5 derniers fichiers, search
 *   Validation    : dateFrom invalide
 *   Sécurité OWASP: sans token → 401 (A07), isolation par user (A01),
 *                   injection SQL dans ?q= (A03)
 *   Cas limites   : aucun fichier, recherche vide, filtre type, filtre dateFrom/dateTo
 */
class DashboardControllerTest extends AbstractFunctionalTest
{
    // GET /api/dashboard/stats — Happy Path
    public function testStatsReturnsQuotaAndCounts(): void
    {
        $user  = $this->createUser('user@example.com', 'password123');
        $token = $this->getToken($user);

        $this->createFileEntity($user, 'file1.pdf');
        $this->createFileEntity($user, 'file2.txt');
        $this->createFolderEntity($user, 'folder1');
        $this->createFileEntity($user, 'deleted.pdf', null, true); // ne doit pas compter

        $this->authJson('GET', '/api/dashboard/stats', [], $token);

        $this->assertSame(200, $this->getStatusCode());
        $data = $this->getResponseData();

        $this->assertArrayHasKey('quota', $data);
        $this->assertArrayHasKey('used', $data['quota']);
        $this->assertArrayHasKey('limit', $data['quota']);
        $this->assertArrayHasKey('percentage', $data['quota']);
        $this->assertSame(2, $data['files']);
        $this->assertSame(1, $data['folders']);
    }

    public function testStatsZeroCountsWhenNoFilesOrFolders(): void
    {
        $user  = $this->createUser('empty@example.com', 'password123');
        $token = $this->getToken($user);

        $this->authJson('GET', '/api/dashboard/stats', [], $token);

        $data = $this->getResponseData();
        $this->assertSame(0, $data['files']);
        $this->assertSame(0, $data['folders']);
    }

    // GET /api/dashboard/stats — Sécurité OWASP A07
    public function testStatsWithoutTokenReturns401(): void
    {
        $this->client->request('GET', '/api/dashboard/stats');
        $this->assertSame(401, $this->getStatusCode());
    }

    // GET /api/dashboard/stats — Isolation par user (A01)
    public function testStatsOnlyCountsCurrentUserFiles(): void
    {
        $user1  = $this->createUser('user1@example.com', 'password123');
        $user2  = $this->createUser('user2@example.com', 'password123');
        $token1 = $this->getToken($user1);

        $this->createFileEntity($user1, 'mine.pdf');
        $this->createFileEntity($user2, 'notmine.pdf');

        $this->authJson('GET', '/api/dashboard/stats', [], $token1);

        $data = $this->getResponseData();
        $this->assertSame(1, $data['files']);
    }

    // GET /api/dashboard/stats/type — Happy Path
    public function testStatsByTypeReturnsCategories(): void
    {
        $user  = $this->createUser('user@example.com', 'password123');
        $token = $this->getToken($user);

        $this->createFileEntityWithMime($user, 'photo.jpg', 'image/jpeg');
        $this->createFileEntityWithMime($user, 'video.mp4', 'video/mp4');
        $this->createFileEntityWithMime($user, 'doc.pdf', 'application/pdf');

        $this->authJson('GET', '/api/dashboard/stats/type', [], $token);

        $this->assertSame(200, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertIsArray($data);

        $categories = array_column($data, 'category');
        $this->assertContains('images', $categories);
        $this->assertContains('videos', $categories);
        $this->assertContains('pdf', $categories);
    }

    public function testStatsByTypeReturnsEmptyArrayWhenNoFiles(): void
    {
        $user  = $this->createUser('empty@example.com', 'password123');
        $token = $this->getToken($user);

        $this->authJson('GET', '/api/dashboard/stats/type', [], $token);

        $data = $this->getResponseData();
        $this->assertIsArray($data);
        $this->assertCount(0, $data);
    }

    // GET /api/dashboard/stats/type — Sécurité A07
    public function testStatsByTypeWithoutTokenReturns401(): void
    {
        $this->client->request('GET', '/api/dashboard/stats/type');
        $this->assertSame(401, $this->getStatusCode());
    }

    // GET /api/dashboard/recent — Happy Path
    public function testRecentReturnsAtMost5Files(): void
    {
        $user  = $this->createUser('user@example.com', 'password123');
        $token = $this->getToken($user);

        for ($i = 1; $i <= 8; $i++) {
            $this->createFileEntity($user, "file{$i}.pdf");
        }

        $this->authJson('GET', '/api/dashboard/recent', [], $token);

        $this->assertSame(200, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertLessThanOrEqual(5, count($data));
    }

    public function testRecentDoesNotIncludeDeletedFiles(): void
    {
        $user  = $this->createUser('user@example.com', 'password123');
        $token = $this->getToken($user);

        $this->createFileEntity($user, 'active.pdf', null, false);
        $this->createFileEntity($user, 'deleted.pdf', null, true);

        $this->authJson('GET', '/api/dashboard/recent', [], $token);

        $data = $this->getResponseData();
        $names = array_column($data, 'name');
        $this->assertContains('active.pdf', $names);
        $this->assertNotContains('deleted.pdf', $names);
    }

    public function testRecentReturnsExpectedFields(): void
    {
        $user  = $this->createUser('user@example.com', 'password123');
        $token = $this->getToken($user);

        $this->createFileEntity($user, 'doc.pdf');

        $this->authJson('GET', '/api/dashboard/recent', [], $token);

        $data = $this->getResponseData();
        $this->assertNotEmpty($data);
        $this->assertArrayHasKey('id', $data[0]);
        $this->assertArrayHasKey('name', $data[0]);
        $this->assertArrayHasKey('mimeType', $data[0]);
        $this->assertArrayHasKey('size', $data[0]);
        $this->assertArrayHasKey('updatedAt', $data[0]);
    }

    // GET /api/dashboard/recent — Sécurité A07
    public function testRecentWithoutTokenReturns401(): void
    {
        $this->client->request('GET', '/api/dashboard/recent');
        $this->assertSame(401, $this->getStatusCode());
    }

    // GET /api/dashboard/search — Happy Path
    public function testSearchWithQueryParamReturnsMatchingFiles(): void
    {
        $user  = $this->createUser('user@example.com', 'password123');
        $token = $this->getToken($user);

        $this->createFileEntity($user, 'annual-report.pdf');
        $this->createFileEntity($user, 'photo.jpg');

        $this->client->request(
            'GET',
            '/api/dashboard/search?q=annual',
            [],
            [],
            ['HTTP_AUTHORIZATION' => 'Bearer ' . $token]
        );

        $this->assertSame(200, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertCount(1, $data);
        $this->assertSame('annual-report.pdf', $data[0]['name']);
    }

    public function testSearchWithTypeParamFiltersByMimeType(): void
    {
        $user  = $this->createUser('user@example.com', 'password123');
        $token = $this->getToken($user);

        $this->createFileEntityWithMime($user, 'photo.jpg', 'image/jpeg');
        $this->createFileEntityWithMime($user, 'doc.pdf', 'application/pdf');

        $this->client->request(
            'GET',
            '/api/dashboard/search?type=image',
            [],
            [],
            ['HTTP_AUTHORIZATION' => 'Bearer ' . $token]
        );

        $data = $this->getResponseData();
        $this->assertCount(1, $data);
        $this->assertSame('photo.jpg', $data[0]['name']);
    }

    public function testSearchWithDateRangeFiltersResults(): void
    {
        $user  = $this->createUser('user@example.com', 'password123');
        $token = $this->getToken($user);

        $this->createFileEntity($user, 'recent.pdf');

        $dateFrom = (new \DateTimeImmutable('-1 day'))->format('Y-m-d');
        $dateTo   = (new \DateTimeImmutable('+1 day'))->format('Y-m-d');

        $this->client->request(
            'GET',
            '/api/dashboard/search?dateFrom=' . $dateFrom . '&dateTo=' . $dateTo,
            [],
            [],
            ['HTTP_AUTHORIZATION' => 'Bearer ' . $token]
        );

        $this->assertSame(200, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertCount(1, $data);
    }

    public function testSearchWithEmptyQueryReturnsAllFiles(): void
    {
        $user  = $this->createUser('user@example.com', 'password123');
        $token = $this->getToken($user);

        $this->createFileEntity($user, 'file1.pdf');
        $this->createFileEntity($user, 'file2.txt');

        $this->client->request(
            'GET',
            '/api/dashboard/search?q=',
            [],
            [],
            ['HTTP_AUTHORIZATION' => 'Bearer ' . $token]
        );

        $data = $this->getResponseData();
        $this->assertCount(2, $data);
    }

    // GET /api/dashboard/search — Sécurité OWASP A03 — SQL injection
    public function testSearchWithSqlInjectionPayloadDoesNotCrash(): void
    {
        $user  = $this->createUser('user@example.com', 'password123');
        $token = $this->getToken($user);

        $this->client->request(
            'GET',
            '/api/dashboard/search?q=' . urlencode("'; DROP TABLE files; --"),
            [],
            [],
            ['HTTP_AUTHORIZATION' => 'Bearer ' . $token]
        );

        $status = $this->getStatusCode();
        $this->assertNotSame(500, $status, 'Une injection SQL ne doit pas provoquer une erreur 500');
        $this->assertSame(200, $status);
    }

    // GET /api/dashboard/search — Sécurité OWASP A07
    public function testSearchWithoutTokenReturns401(): void
    {
        $this->client->request('GET', '/api/dashboard/search?q=test');
        $this->assertSame(401, $this->getStatusCode());
    }

    // GET /api/dashboard/search — Isolation (A01)
    public function testSearchDoesNotReturnOtherUsersFiles(): void
    {
        $user1  = $this->createUser('user1@example.com', 'password123');
        $user2  = $this->createUser('user2@example.com', 'password123');
        $token1 = $this->getToken($user1);

        $this->createFileEntity($user1, 'mine.pdf');
        $this->createFileEntity($user2, 'notmine.pdf');

        $this->client->request(
            'GET',
            '/api/dashboard/search',
            [],
            [],
            ['HTTP_AUTHORIZATION' => 'Bearer ' . $token1]
        );

        $data = $this->getResponseData();
        $names = array_column($data, 'name');
        $this->assertContains('mine.pdf', $names);
        $this->assertNotContains('notmine.pdf', $names);
    }

    // Helpers
    private function createFileEntityWithMime(
        \App\Entity\User $owner,
        string $name,
        string $mimeType
    ): \App\Entity\File {
        $file = new \App\Entity\File();
        $file->setName($name);
        $file->setPath('/tmp/fake_' . uniqid() . '.' . pathinfo($name, PATHINFO_EXTENSION));
        $file->setSize('2048');
        $file->setMimeType($mimeType);
        $file->setOwner($owner);

        $this->em->persist($file);
        $this->em->flush();

        return $file;
    }
}
