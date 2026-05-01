<?php

namespace App\Tests\Functional;

use App\Entity\File;
use App\Entity\Folder;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

abstract class AbstractFunctionalTest extends WebTestCase
{
    protected KernelBrowser $client;
    protected EntityManagerInterface $em;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $this->em = static::getContainer()->get(EntityManagerInterface::class);

        $schemaTool = new SchemaTool($this->em);
        $metadata   = $this->em->getMetadataFactory()->getAllMetadata();
        $schemaTool->dropSchema($metadata);
        $schemaTool->createSchema($metadata);
    }

    /**
     * Crée un utilisateur en base avec mot de passe hashé.
     */
    protected function createUser(
        string $email = 'test@example.com',
        string $plainPassword = 'password123',
        ?string $firstName = 'Test',
        ?string $lastName = 'User'
    ): User {
        $hasher = static::getContainer()->get(UserPasswordHasherInterface::class);

        $user = new User();
        $user->setEmail($email);
        $user->setPassword($hasher->hashPassword($user, $plainPassword));
        $user->setFirstName($firstName);
        $user->setLastName($lastName);
        $user->setRoles(['ROLE_USER']);

        $this->em->persist($user);
        $this->em->flush();

        return $user;
    }

    /**
     * Obtient un JWT valide via le JWTTokenManager du container de test (pas via HTTP).
     */
    protected function getToken(User $user): string
    {
        $jwtManager = static::getContainer()->get(JWTTokenManagerInterface::class);
        return $jwtManager->create($user);
    }

    /**
     * Effectue une requête JSON authentifiée.
     */
    protected function authJson(
        string $method,
        string $url,
        array $data = [],
        string $token = ''
    ): void {
        $this->client->request(
            $method,
            $url,
            [],
            [],
            [
                'CONTENT_TYPE'  => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
            ],
            $data ? json_encode($data) : null
        );
    }

    /**
     * Effectue une requête JSON sans token (route publique).
     */
    protected function publicJson(string $method, string $url, array $data = []): void
    {
        $this->client->request(
            $method,
            $url,
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            $data ? json_encode($data) : null
        );
    }

    /**
     * Crée un UploadedFile contenant un vrai GIF 1x1 pixel (pour tester uploadAvatar).
     * getMimeType() sniffe le contenu réel — du texte retournerait text/plain.
     */
    protected function createTinyImageFile(string $originalName = 'avatar.gif'): UploadedFile
    {
        // GIF89a 1x1 pixel transparent — format minimal valide
        $gifBinary = base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
        $tmpPath   = tempnam(sys_get_temp_dir(), 'supfile_img_') . '.gif';
        file_put_contents($tmpPath, $gifBinary);

        return new UploadedFile($tmpPath, $originalName, 'image/gif', null, true);
    }

    /**
     * Crée un fichier temporaire UploadedFile pour les tests d'upload.
     */
    protected function createTempFile(
        string $content = 'hello world',
        string $originalName = 'test.txt',
        string $mimeType = 'text/plain'
    ): UploadedFile {
        $tmpPath = tempnam(sys_get_temp_dir(), 'supfile_test_');
        file_put_contents($tmpPath, $content);

        return new UploadedFile(
            $tmpPath,
            $originalName,
            $mimeType,
            null,
            true // test mode — skip is_uploaded_file check
        );
    }

    /**
     * Crée un fichier en base de données ET un fichier physique réel sur le disque.
     * Nécessaire pour tester preview/download qui vérifient file_exists().
     */
    protected function createFileEntityWithRealFile(
        User $owner,
        string $name = 'test.txt',
        string $content = 'hello test content',
        string $mimeType = 'text/plain',
        ?Folder $folder = null
    ): File {
        $storageDir = '/var/www/html/storage/test_' . $owner->getId();
        if (!is_dir($storageDir)) {
            mkdir($storageDir, 0755, true);
        }
        $filename = bin2hex(random_bytes(8)) . '_' . $name;
        $path     = $storageDir . '/' . $filename;
        file_put_contents($path, $content);

        $file = new File();
        $file->setName($name);
        $file->setPath($path);
        $file->setSize((string) strlen($content));
        $file->setMimeType($mimeType);
        $file->setOwner($owner);
        $file->setFolder($folder);

        $this->em->persist($file);
        $this->em->flush();

        return $file;
    }

    /**
     * Crée un fichier en base de données (sans fichier physique).
     */
    protected function createFileEntity(
        User $owner,
        string $name = 'document.pdf',
        ?Folder $folder = null,
        bool $deleted = false
    ): File {
        $file = new File();
        $file->setName($name);
        $file->setPath('/tmp/fake_' . uniqid() . '.pdf');
        $file->setSize('1024');
        $file->setMimeType('application/pdf');
        $file->setOwner($owner);
        $file->setFolder($folder);

        if ($deleted) {
            $file->softDelete();
        }

        $this->em->persist($file);
        $this->em->flush();

        return $file;
    }

    /**
     * Crée un dossier en base de données.
     */
    protected function createFolderEntity(
        User $owner,
        string $name = 'Mon dossier',
        ?Folder $parent = null,
        bool $deleted = false
    ): Folder {
        $folder = new Folder();
        $folder->setName($name);
        $folder->setOwner($owner);
        $folder->setParent($parent);

        if ($deleted) {
            $folder->softDelete();
        }

        $this->em->persist($folder);
        $this->em->flush();

        return $folder;
    }

    /**
     * Décode la réponse JSON du client.
     */
    protected function getResponseData(): array
    {
        return json_decode($this->client->getResponse()->getContent(), true) ?? [];
    }

    /**
     * Retourne le code de statut HTTP de la dernière réponse.
     */
    protected function getStatusCode(): int
    {
        return $this->client->getResponse()->getStatusCode();
    }
}
