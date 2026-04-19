<?php

namespace App\Service\User;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

class QuotaManager
{
    public function __construct(
        private EntityManagerInterface $em
    ) {}

    /**
     * Vérifie si l'utilisateur a assez d'espace pour le fichier.
     * Retourne true si OK, false si quota dépassé.
     */
    public function checkQuota(User $user, int $fileSize): bool
    {
        return ($user->getQuotaUsed() + $fileSize) <= $user->getQuotaLimit();
    }

    /**
     * Met à jour le quota utilisé.
     * $sizeChange positif = upload, négatif = suppression.
     */
    public function updateQuota(User $user, int $sizeChange): void
    {
        $newQuota = (int) $user->getQuotaUsed() + $sizeChange;
        // Sécurité : ne jamais passer en dessous de 0
        $user->setQuotaUsed((string) max(0, $newQuota));
        $this->em->flush();
    }
}