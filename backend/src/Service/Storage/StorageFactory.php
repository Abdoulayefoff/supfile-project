<?php

namespace App\Service\Storage;

/**
 * Choisit l'implémentation de stockage selon la variable d'environnement STORAGE_DRIVER.
 *
 * STORAGE_DRIVER=local  → LocalFileStorage  (développement local)
 * STORAGE_DRIVER=azure  → AzureBlobStorage  (production Azure)
 */
class StorageFactory
{
    public function __construct(
        private LocalFileStorage $localFileStorage,
        private AzureBlobStorage $azureBlobStorage,
        private string $storageDriver
    ) {}

    public function create(): FileStorageInterface
    {
        return match ($this->storageDriver) {
            'azure'  => $this->azureBlobStorage,
            default  => $this->localFileStorage,
        };
    }
}