<?php

namespace App\Tests\Unit\Service\Share;

use App\Entity\File;
use App\Entity\Folder;
use App\Entity\Share;
use App\Entity\User;
use App\Repository\ShareRepository;
use App\Service\Share\ShareManager;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class ShareManagerTest extends TestCase
{
    private EntityManagerInterface&MockObject $em;
    private ShareRepository&MockObject $shareRepository;
    private ShareManager $shareManager;

    protected function setUp(): void
    {
        $this->em = $this->createMock(EntityManagerInterface::class);
        $this->shareRepository = $this->createMock(ShareRepository::class);
        $this->shareManager = new ShareManager($this->em, $this->shareRepository);
    }

    private function buildUser(string $email = 'user@example.com'): User
    {
        $user = new User();
        $user->setEmail($email);
        return $user;
    }

    // ─── Happy Path — createPublicShare 

    public function testCreatePublicShareForFilePersistsAndFlushes(): void
    {
        $creator = $this->buildUser();
        $file = new File();

        $this->em->expects($this->once())->method('persist')->with($this->isInstanceOf(Share::class));
        $this->em->expects($this->once())->method('flush');

        $share = $this->shareManager->createPublicShare($creator, $file);

        $this->assertInstanceOf(Share::class, $share);
        $this->assertTrue($share->isPublic());
        $this->assertSame($creator, $share->getCreatedBy());
        $this->assertSame($file, $share->getFile());
    }

    public function testCreatePublicShareForFolderSetsFolder(): void
    {
        $creator = $this->buildUser();
        $folder = new Folder();

        $this->em->method('persist');
        $this->em->method('flush');

        $share = $this->shareManager->createPublicShare($creator, $folder);

        $this->assertSame($folder, $share->getFolder());
        $this->assertNull($share->getFile());
    }

    public function testCreatePublicShareWithExpiryDateSetsExpiry(): void
    {
        $creator = $this->buildUser();
        $file = new File();
        $expiresAt = new \DateTimeImmutable('+7 days');

        $this->em->method('persist');
        $this->em->method('flush');

        $share = $this->shareManager->createPublicShare($creator, $file, $expiresAt);

        $this->assertSame($expiresAt, $share->getExpiresAt());
    }

    public function testCreatePublicShareWithPasswordHashesIt(): void
    {
        $creator = $this->buildUser();
        $file = new File();
        $plainPassword = 'SecretPass123';

        $this->em->method('persist');
        $this->em->method('flush');

        $share = $this->shareManager->createPublicShare($creator, $file, null, $plainPassword);

        // Le mot de passe stocké ne doit pas être en clair
        $this->assertNotSame($plainPassword, $share->getPassword());
        // Vérification que c'est bien un hash bcrypt
        $this->assertTrue(password_verify($plainPassword, $share->getPassword()));
    }

    public function testCreatePublicShareWithoutPasswordHasNullPassword(): void
    {
        $creator = $this->buildUser();
        $file = new File();

        $this->em->method('persist');
        $this->em->method('flush');

        $share = $this->shareManager->createPublicShare($creator, $file);

        $this->assertNull($share->getPassword());
        $this->assertFalse($share->hasPassword());
    }

    // ─── Happy Path — createPrivateShare 

    public function testCreatePrivateSharePersistsNewShare(): void
    {
        $creator = $this->buildUser('creator@example.com');
        $recipient = $this->buildUser('recipient@example.com');
        $file = new File();

        $this->shareRepository->method('findExistingPrivateShare')->willReturn(null);
        $this->em->expects($this->once())->method('persist')->with($this->isInstanceOf(Share::class));
        $this->em->expects($this->once())->method('flush');

        $share = $this->shareManager->createPrivateShare($creator, $file, $recipient);

        $this->assertFalse($share->isPublic());
        $this->assertSame($creator, $share->getCreatedBy());
        $this->assertSame($recipient, $share->getSharedWith());
        $this->assertSame($file, $share->getFile());
    }

    public function testCreatePrivateShareReturnsExistingIfAlreadyShared(): void
    {
        $creator = $this->buildUser();
        $recipient = $this->buildUser('recipient@example.com');
        $file = new File();
        $existing = new Share();

        $this->shareRepository->method('findExistingPrivateShare')->willReturn($existing);
        $this->em->expects($this->never())->method('persist');

        $result = $this->shareManager->createPrivateShare($creator, $file, $recipient);

        $this->assertSame($existing, $result);
    }

    // ─── Happy Path — validateShare 

    public function testValidateShareReturnsTrueForValidPublicShareWithoutPassword(): void
    {
        $share = new Share();
        $share->setIsPublic(true);
        // expiresAt null → non expiré

        $result = $this->shareManager->validateShare($share, null);

        $this->assertTrue($result);
    }

    public function testValidateShareReturnsTrueWithCorrectPassword(): void
    {
        $plainPassword = 'correct_password';
        $share = new Share();
        $share->setIsPublic(true);
        $share->setPassword(password_hash($plainPassword, PASSWORD_BCRYPT));

        $result = $this->shareManager->validateShare($share, $plainPassword);

        $this->assertTrue($result);
    }

    // ─── Sécurité — validateShare 

    public function testValidateShareReturnsFalseWhenExpired(): void
    {
        $share = new Share();
        $share->setIsPublic(true);
        $share->setExpiresAt(new \DateTimeImmutable('-1 day')); // déjà expiré

        $result = $this->shareManager->validateShare($share);

        $this->assertFalse($result);
    }

    public function testValidateShareReturnsFalseWhenPasswordRequiredButNotProvided(): void
    {
        $share = new Share();
        $share->setIsPublic(true);
        $share->setPassword(password_hash('secret', PASSWORD_BCRYPT));

        $result = $this->shareManager->validateShare($share, null);

        $this->assertFalse($result);
    }

    public function testValidateShareReturnsFalseWithWrongPassword(): void
    {
        $share = new Share();
        $share->setIsPublic(true);
        $share->setPassword(password_hash('correct', PASSWORD_BCRYPT));

        $result = $this->shareManager->validateShare($share, 'wrong_password');

        $this->assertFalse($result);
    }

    public function testValidateShareReturnsFalseWhenTokenIsNull(): void
    {
        // Un Share avec token null est invalide (isValid() retourne false)
        $share = new Share();
        $share->setToken(''); // setToken force un token, donc on teste via isValid indirectement

        // Forcer token à null via réflexion
        $refl = new \ReflectionProperty(Share::class, 'token');
        $refl->setValue($share, null);

        $result = $this->shareManager->validateShare($share);

        $this->assertFalse($result);
    }

    // ─── revokeShare 

    public function testRevokeShareRemovesAndFlushes(): void
    {
        $share = new Share();

        $this->em->expects($this->once())->method('remove')->with($share);
        $this->em->expects($this->once())->method('flush');

        $this->shareManager->revokeShare($share);
    }

    // ─── getSharesByUser 

    public function testGetSharesByUserDelegatestoRepository(): void
    {
        $user = $this->buildUser();
        $shares = [new Share(), new Share()];

        $this->shareRepository
            ->expects($this->once())
            ->method('findBy')
            ->with(['createdBy' => $user], ['createdAt' => 'DESC'])
            ->willReturn($shares);

        $result = $this->shareManager->getSharesByUser($user);

        $this->assertSame($shares, $result);
    }

    // ─── findByToken 

    public function testFindByTokenReturnsShareWhenFound(): void
    {
        $share = new Share();
        $this->shareRepository
            ->method('findOneBy')
            ->with(['token' => 'abc123'])
            ->willReturn($share);

        $result = $this->shareManager->findByToken('abc123');

        $this->assertSame($share, $result);
    }

    public function testFindByTokenReturnsNullWhenNotFound(): void
    {
        $this->shareRepository->method('findOneBy')->willReturn(null);

        $result = $this->shareManager->findByToken('nonexistent_token');

        $this->assertNull($result);
    }

    // ─── Cas limites 

    public function testCreatePublicShareWithFutureExpiryIsValid(): void
    {
        $creator = $this->buildUser();
        $file = new File();
        $future = new \DateTimeImmutable('+30 days');

        $this->em->method('persist');
        $this->em->method('flush');

        $share = $this->shareManager->createPublicShare($creator, $file, $future);

        $this->assertFalse($share->isExpired());
        $this->assertTrue($share->isValid());
    }

    public function testCreatePublicShareWithNullExpiryNeverExpires(): void
    {
        $creator = $this->buildUser();
        $file = new File();

        $this->em->method('persist');
        $this->em->method('flush');

        $share = $this->shareManager->createPublicShare($creator, $file, null);

        $this->assertNull($share->getExpiresAt());
        $this->assertFalse($share->isExpired());
    }
}
