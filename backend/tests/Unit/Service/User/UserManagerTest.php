<?php

namespace App\Tests\Unit\Service\User;

use App\Entity\User;
use App\Service\User\UserManager;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class UserManagerTest extends TestCase
{
    private EntityManagerInterface&MockObject $em;
    private UserPasswordHasherInterface&MockObject $passwordHasher;
    private UserManager $userManager;

    protected function setUp(): void
    {
        $this->em = $this->createMock(EntityManagerInterface::class);
        $this->passwordHasher = $this->createMock(UserPasswordHasherInterface::class);
        $this->userManager = new UserManager($this->em, $this->passwordHasher);
    }

    // ─── Happy Path 

    public function testCreateUserPersistsAndFlushes(): void
    {
        $this->passwordHasher
            ->expects($this->once())
            ->method('hashPassword')
            ->willReturn('hashed_password');

        $this->em->expects($this->once())->method('persist');
        $this->em->expects($this->once())->method('flush');

        $user = $this->userManager->createUser('test@example.com', 'password123');

        $this->assertInstanceOf(User::class, $user);
    }

    public function testCreateUserSetsEmailCorrectly(): void
    {
        $this->passwordHasher->method('hashPassword')->willReturn('hashed');
        $this->em->method('persist');
        $this->em->method('flush');

        $user = $this->userManager->createUser('test@example.com', 'password123');

        $this->assertSame('test@example.com', $user->getEmail());
    }

    public function testCreateUserSetsHashedPassword(): void
    {
        $this->passwordHasher
            ->method('hashPassword')
            ->willReturn('$2y$hashed_password');
        $this->em->method('persist');
        $this->em->method('flush');

        $user = $this->userManager->createUser('test@example.com', 'password123');

        $this->assertSame('$2y$hashed_password', $user->getPassword());
    }

    public function testCreateUserSetsFirstNameAndLastName(): void
    {
        $this->passwordHasher->method('hashPassword')->willReturn('hashed');
        $this->em->method('persist');
        $this->em->method('flush');

        $user = $this->userManager->createUser('test@example.com', 'password123', 'Abdoulaye', 'FOFANA');

        $this->assertSame('Abdoulaye', $user->getFirstName());
        $this->assertSame('FOFANA', $user->getLastName());
    }

    public function testCreateUserSetsDefaultQuotaLimit(): void
    {
        $this->passwordHasher->method('hashPassword')->willReturn('hashed');
        $this->em->method('persist');
        $this->em->method('flush');

        $user = $this->userManager->createUser('test@example.com', 'password123');

        // 30 Go
        $this->assertSame('32212254720', $user->getQuotaLimit());
    }

    public function testCreateUserSetsQuotaUsedToZero(): void
    {
        $this->passwordHasher->method('hashPassword')->willReturn('hashed');
        $this->em->method('persist');
        $this->em->method('flush');

        $user = $this->userManager->createUser('test@example.com', 'password123');

        $this->assertSame('0', $user->getQuotaUsed());
    }

    public function testCreateUserAssignsRoleUser(): void
    {
        $this->passwordHasher->method('hashPassword')->willReturn('hashed');
        $this->em->method('persist');
        $this->em->method('flush');

        $user = $this->userManager->createUser('test@example.com', 'password123');

        $this->assertContains('ROLE_USER', $user->getRoles());
    }

    public function testUpdateUserUpdatesFirstName(): void
    {
        $user = new User();
        $user->setFirstName('OldName');

        $this->em->expects($this->once())->method('flush');

        $result = $this->userManager->updateUser($user, ['firstName' => 'NewName']);

        $this->assertSame('NewName', $result->getFirstName());
    }

    public function testUpdateUserUpdatesLastName(): void
    {
        $user = new User();
        $user->setLastName('OldLast');

        $this->em->expects($this->once())->method('flush');

        $result = $this->userManager->updateUser($user, ['lastName' => 'NewLast']);

        $this->assertSame('NewLast', $result->getLastName());
    }

    public function testUpdateUserUpdatesTheme(): void
    {
        $user = new User();

        $this->em->expects($this->once())->method('flush');

        $result = $this->userManager->updateUser($user, ['theme' => 'dark']);

        $this->assertSame('dark', $result->getTheme());
    }

    // ─── Cas limites

    public function testCreateUserWithNullNamesDoesNotFail(): void
    {
        $this->passwordHasher->method('hashPassword')->willReturn('hashed');
        $this->em->method('persist');
        $this->em->method('flush');

        $user = $this->userManager->createUser('test@example.com', 'password123', null, null);

        $this->assertNull($user->getFirstName());
        $this->assertNull($user->getLastName());
    }

    public function testUpdateUserIgnoresUnknownKeys(): void
    {
        $user = new User();
        $user->setFirstName('Abdoul');

        $this->em->expects($this->once())->method('flush');

        // 'email' n'est pas géré dans updateUser, ne doit pas planter
        $result = $this->userManager->updateUser($user, ['email' => 'changed@example.com']);

        // firstName inchangé car 'firstName' n'est pas dans $data
        $this->assertSame('Abdoul', $result->getFirstName());
    }

    public function testUpdateUserWithEmptyDataStillFlushes(): void
    {
        $user = new User();

        $this->em->expects($this->once())->method('flush');

        $this->userManager->updateUser($user, []);
    }

    // ─── Sécurité 

    public function testCreateUserHashesPasswordBeforePersist(): void
    {
        $plainPassword = 'MyP@ssw0rd!';
        $hashedPassword = '$2y$13$somehashedvalue';

        $this->passwordHasher
            ->expects($this->once())
            ->method('hashPassword')
            ->with($this->isInstanceOf(User::class), $plainPassword)
            ->willReturn($hashedPassword);

        $this->em->method('persist');
        $this->em->method('flush');

        $user = $this->userManager->createUser('test@example.com', $plainPassword);

        // Le mot de passe stocké ne doit jamais être le mot de passe en clair
        $this->assertNotSame($plainPassword, $user->getPassword());
        $this->assertSame($hashedPassword, $user->getPassword());
    }
}
