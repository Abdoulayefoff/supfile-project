<?php

namespace App\Service\Storage;

use App\Entity\File;
use App\Entity\User;
use MicrosoftAzure\Storage\Blob\BlobRestProxy;
use MicrosoftAzure\Storage\Blob\Models\CreateBlockBlobOptions;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class AzureBlobStorage implements FileStorageInterface
{
    /**
     * Le client est initialisé en lazy (à la première utilisation).
     * En développement local, la connection string est vide —
     * BlobRestProxy::createBlobService('') lèverait une exception au démarrage.
     * Avec le lazy init, aucune erreur n'est levée tant qu'on n'utilise pas Azure.
     */
    private ?BlobRestProxy $client = null;

    public function __construct(
        private string $connectionString,
        private string $container
    ) {}

    private function getClient(): BlobRestProxy
    {
        if ($this->client === null) {
            if (empty($this->connectionString)) {
                throw new \RuntimeException(
                    'Azure Blob Storage non configuré. ' .
                    'Définis AZURE_STORAGE_CONNECTION_STRING dans les variables d\'environnement.'
                );
            }
            $this->client = BlobRestProxy::createBlobService($this->connectionString);
        }
        return $this->client;
    }

    public function storeFile(UploadedFile $uploadedFile, User $owner): string
    {
        // Nom du blob : {userId}/{random}_{nom_fichier_sanitisé}
        $randomPrefix   = bin2hex(random_bytes(16));
        $safeClientName = preg_replace('/[^a-zA-Z0-9._-]/', '_', $uploadedFile->getClientOriginalName());
        $blobName       = $owner->getId() . '/' . $randomPrefix . '_' . $safeClientName;

        $stream  = fopen($uploadedFile->getPathname(), 'rb');
        $options = new CreateBlockBlobOptions();
        $options->setContentType($uploadedFile->getMimeType() ?? 'application/octet-stream');

        $this->getClient()->createBlockBlob($this->container, $blobName, $stream, $options);

        if (is_resource($stream)) {
            fclose($stream);
        }

        // On retourne le blobName — il sera stocké dans la colonne `path` en base de données
        return $blobName;
    }

    public function getFilePath(File $file): string
    {
        // Retourne le blobName tel qu'il est stocké en base
        return $file->getPath();
    }

    public function deleteFile(File $file): bool
    {
        try {
            $this->getClient()->deleteBlob($this->container, $file->getPath());
        } catch (\Exception) {
            // Le blob n'existe peut-être plus — on ignore l'erreur silencieusement
        }
        return true;
    }

    public function exists(File $file): bool
    {
        try {
            $this->getClient()->getBlobMetadata($this->container, $file->getPath());
            return true;
        } catch (\Exception) {
            return false;
        }
    }

    public function getStream(File $file): mixed
    {
        $result = $this->getClient()->getBlob($this->container, $file->getPath());
        return $result->getContentStream();
    }
}