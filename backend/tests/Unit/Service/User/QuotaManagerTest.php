<?php

namespace App\Tests\Unit\Service\User;

use App\Entity\User;
use App\Service\User\QuotaManager;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class QuotaManagerTest extends TestCase
{
    private EntityManagerInterface&MockObject $em;
    private QuotaManager $quotaManager;

    protected function setUp(): void
    {
        $this->em = $this->createMock(EntityManagerInterface::class);
        $this->quotaManager = new QuotaManager($this->em);
    }

    // ─── Happy Path 

    public function testCheckQuotaReturnsTrueWhenSpaceAvailable(): void
    {
        $user = new User();
        $user->setQuotaUsed('1000000');
        $user->setQuotaLimit('32212254720'); // 30 Go

        $result = $this->quotaManager->checkQuota($user, 500000);

        $this->assertTrue($result);
    }

    public function testCheckQuotaReturnsTrueWhenExactlyAtLimit(): void
    {
        $user = new User();
        $user->setQuotaUsed('0');
        $user->setQuotaLimit('1000');

        // 0 + 1000 = 1000 <= 1000 → should return true
        $result = $this->quotaManager->checkQuota($user, 1000);

        $this->assertTrue($result);
    }

    public function testUpdateQuotaIncreasesUsedSpaceOnUpload(): void
    {
        $user = new User();
        $user->setQuotaUsed('1000000');

        $this->em->expects($this->once())->method('flush');

        $this->quotaManager->updateQuota($user, 500000);

        $this->assertSame('1500000', $user->getQuotaUsed());
    }

    public function testUpdateQuotaDecreasesUsedSpaceOnDelete(): void
    {
        $user = new User();
        $user->setQuotaUsed('1000000');

        $this->em->expects($this->once())->method('flush');

        $this->quotaManager->updateQuota($user, -500000);

        $this->assertSame('500000', $user->getQuotaUsed());
    }

    // ─── Validation / Cas d'erreur 

    public function testCheckQuotaReturnsFalseWhenQuotaExceeded(): void
    {
        $user = new User();
        $user->setQuotaUsed('32000000000'); // proche de la limite
        $user->setQuotaLimit('32212254720');

        $result = $this->quotaManager->checkQuota($user, 500000000); // trop gros

        $this->assertFalse($result);
    }

    public function testCheckQuotaReturnsFalseWhenAlreadyFull(): void
    {
        $user = new User();
        $user->setQuotaUsed('32212254720');
        $user->setQuotaLimit('32212254720');

        $result = $this->quotaManager->checkQuota($user, 1);

        $this->assertFalse($result);
    }

    // ─── Cas limites 

    public function testUpdateQuotaNeverGoesNegative(): void
    {
        $user = new User();
        $user->setQuotaUsed('100');

        $this->em->expects($this->once())->method('flush');

        // On tente de libérer plus qu'utilisé
        $this->quotaManager->updateQuota($user, -500);

        $this->assertSame('0', $user->getQuotaUsed());
    }

    public function testUpdateQuotaWithZeroChangeDoesNotAlterValue(): void
    {
        $user = new User();
        $user->setQuotaUsed('5000');

        $this->em->expects($this->once())->method('flush');

        $this->quotaManager->updateQuota($user, 0);

        $this->assertSame('5000', $user->getQuotaUsed());
    }

    public function testCheckQuotaWithZeroFileSizeAlwaysReturnsTrue(): void
    {
        $user = new User();
        $user->setQuotaUsed('32212254720');
        $user->setQuotaLimit('32212254720');

        // Fichier vide : 0 + limit = limit <= limit
        $result = $this->quotaManager->checkQuota($user, 0);

        $this->assertTrue($result);
    }

    public function testUpdateQuotaCallsFlush(): void
    {
        $user = new User();
        $user->setQuotaUsed('0');

        $this->em->expects($this->once())->method('flush');

        $this->quotaManager->updateQuota($user, 1024);
    }
}
