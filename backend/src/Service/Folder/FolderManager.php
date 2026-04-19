<?php

namespace App\Service\Folder;

use App\Entity\File;
use App\Entity\Folder;
use App\Entity\Share;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

class FolderManager
{
    public function __construct(
        private EntityManagerInterface $em
    ) {}

    /**
     * Crée un nouveau dossier.
     * $parent = null signifie que c'est un dossier racine.
     */
    public function createFolder(string $name, User $owner, ?Folder $parent = null): Folder
    {
        // Vérifier qu'un dossier du même nom n'existe pas déjà au même niveau
        $existing = $this->em->getRepository(Folder::class)->findOneBy([
            'name'   => $name,
            'owner'  => $owner,
            'parent' => $parent,
            'isDeleted' => false,
        ]);

        if ($existing) {
            throw new \RuntimeException('Un dossier avec ce nom existe déjà à cet emplacement.');
        }

        $folder = new Folder();
        $folder->setName($name);
        $folder->setOwner($owner);
        $folder->setParent($parent);

        $this->em->persist($folder);
        $this->em->flush();

        return $folder;
    }

    /**
     * Renomme un dossier.
     */
    public function renameFolder(Folder $folder, string $newName): void
    {
        $folder->setName($newName);
        $this->em->flush();
    }

    /**
     * Déplace un dossier vers un autre dossier parent (ou à la racine si null).
     */
    public function moveFolder(Folder $folder, ?Folder $targetParent): void
    {
        // Sécurité : interdire de déplacer un dossier dans lui-même ou dans un de ses enfants
        if ($targetParent !== null && $this->isDescendant($targetParent, $folder)) {
            throw new \RuntimeException('Impossible de déplacer un dossier dans lui-même ou dans un de ses sous-dossiers.');
        }

        $folder->setParent($targetParent);
        $this->em->flush();
    }

    /**
     * Soft delete : envoie le dossier à la corbeille.
     */
    public function deleteFolder(Folder $folder): void
    {
        $folder->softDelete();
        $this->em->flush();
    }

    /**
     * Restaure un dossier depuis la corbeille.
     */
    public function restoreFolder(Folder $folder): void
    {
        $folder->restore();
        $this->em->flush();
    }

    /**
     * Suppression définitive depuis la corbeille (hard delete).
     * Le dossier doit déjà être soft-deleted avant d'appeler cette méthode.
     *
     * Supprime d'abord tous les partages et fichiers liés pour éviter
     * les violations de contraintes FK.
     */
    public function permanentDeleteFolder(Folder $folder): void
    {
        // 1. Supprimer les partages qui ciblent ce dossier (FK: shares.folder_id → folders.id)
        $folderShares = $this->em->getRepository(Share::class)->findBy(['folder' => $folder]);
        foreach ($folderShares as $share) {
            $this->em->remove($share);
        }

        // 2. Supprimer les fichiers soft-deleted du dossier et leurs partages
        $files = $this->em->getRepository(File::class)->findBy(['folder' => $folder]);
        foreach ($files as $file) {
            $fileShares = $this->em->getRepository(Share::class)->findBy(['file' => $file]);
            foreach ($fileShares as $share) {
                $this->em->remove($share);
            }
            $this->em->remove($file);
        }

        // 3. Supprimer le dossier lui-même
        $this->em->remove($folder);
        $this->em->flush();
    }

    /**
     * Vérifie si $potentialChild est un descendant de $folder.
     * Utilisé pour empêcher les déplacements circulaires.
     */
    private function isDescendant(Folder $potentialChild, Folder $folder): bool
    {
        if ($potentialChild->getId() === $folder->getId()) {
            return true;
        }

        $parent = $potentialChild->getParent();
        while ($parent !== null) {
            if ($parent->getId() === $folder->getId()) {
                return true;
            }
            $parent = $parent->getParent();
        }

        return false;
    }
}