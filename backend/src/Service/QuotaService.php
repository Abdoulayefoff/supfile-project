<?php

namespace App\Service;

use App\Entity\User;
use App\Repository\FileRepository;

/**
 * Service pour calculer l'espace utilisé et vérifier les quotas.
 */
class QuotaService
{
    public function __construct(private FileRepository $fileRepository) {}

    // Retourne l'espace disque utilisé par un utilisateur
    public function getUsedSpace(User $user): int
    {
        return (int) $this->fileRepository->sumUserFilesSize($user);
    }

    // Vérifie si un fichier peut être uploadé sans dépasser le quota
    public function canUpload(User $user, int $fileSize): bool
    {
        return ($this->getUsedSpace($user) + $fileSize) <= $user->getQuota();
    }
}
