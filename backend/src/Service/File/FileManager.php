<?php

namespace App\Service\File;

use App\Entity\File;
use App\Entity\Folder;
use App\Entity\User;
use App\Service\Storage\FileStorageInterface;
use App\Service\User\QuotaManager;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class FileManager
{
    public function __construct(
        private EntityManagerInterface $em,
        private FileStorageInterface $fileStorage,
        private QuotaManager $quotaManager
    ) {}

    /**
     * Upload un fichier : vérifie le quota, stocke physiquement,
     * puis persiste l'entité File en base.
     */
    public function uploadFile(
        UploadedFile $uploadedFile,
        User $owner,
        ?Folder $folder = null
    ): File {
        // 1. Vérifier le quota
        if (!$this->quotaManager->checkQuota($owner, $uploadedFile->getSize())) {
            throw new \RuntimeException('Quota de stockage dépassé.');
        }

        // 2. Récupérer les métadonnées AVANT de déplacer le fichier
        //    (après move(), le fichier temp n'existe plus et getMimeType() échouerait)
        $originalName = $uploadedFile->getClientOriginalName();
        $fileSize     = $uploadedFile->getSize();
        $mimeType     = $uploadedFile->getMimeType() ?? 'application/octet-stream';

        // 3. Stocker le fichier physiquement
        $path = $this->fileStorage->storeFile($uploadedFile, $owner);

        // 4. Créer l'entité File
        $file = new File();
        $file->setName($originalName);
        $file->setPath($path);
        $file->setSize($fileSize);
        $file->setMimeType($mimeType);
        $file->setOwner($owner);
        $file->setFolder($folder);

        // 4. Persister en base
        $this->em->persist($file);
        $this->em->flush();

        // 5. Mettre à jour le quota
        $this->quotaManager->updateQuota($owner, $fileSize);

        return $file;
    }

    /**
     * Soft delete : marque le fichier comme supprimé (corbeille).
     */
    public function deleteFile(File $file): void
    {
        $file->softDelete();
        $this->em->flush();
    }

    /**
     * Restaure un fichier depuis la corbeille.
     */
    public function restoreFile(File $file): void
    {
        $file->restore();
        $this->em->flush();
    }

    /**
     * Renomme un fichier.
     */
    public function renameFile(File $file, string $newName): void
    {
        $file->setName($newName);
        $this->em->flush();
    }

    /**
     * Déplace un fichier vers un autre dossier (ou à la racine si null).
     */
    public function moveFile(File $file, ?Folder $targetFolder): void
    {
        $file->setFolder($targetFolder);
        $this->em->flush();
    }

    /**
     * Suppression définitive : supprime le fichier physiquement
     * et libère le quota.
     */
    public function permanentDeleteFile(File $file): void
    {
        $size = $file->getSize();
        $owner = $file->getOwner();

        // Supprimer physiquement
        $this->fileStorage->deleteFile($file);

        // Supprimer de la base
        $this->em->remove($file);
        $this->em->flush();

        // Libérer le quota
        $this->quotaManager->updateQuota($owner, -$size);
    }
}