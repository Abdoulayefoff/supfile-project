<?php

namespace App\Repository;

use App\Entity\PasswordResetToken;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class PasswordResetTokenRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PasswordResetToken::class);
    }

    /**
     * Recherche un token valide : non expiré ET non encore utilisé.
     *
     * Trois conditions doivent être vraies simultanément :
     *   1. Le token correspond exactement à la valeur stockée en base
     *   2. La date d'expiration est dans le futur (token pas encore périmé)
     *   3. usedAt est NULL (token pas encore consommé)
     *
     * Retourne null si le token est invalide, expiré ou déjà utilisé.
     */
    public function findValidToken(string $token): ?PasswordResetToken
    {
        return $this->createQueryBuilder('t')
            ->where('t.token = :token')
            ->andWhere('t.expiresAt > :now')
            ->andWhere('t.usedAt IS NULL')
            ->setParameter('token', $token)
            ->setParameter('now', new \DateTimeImmutable())
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Supprime tous les tokens dont la date d'expiration est dépassée.
     *
     * Cette méthode peut être appelée depuis une commande Symfony planifiée
     * (cron) pour garder la table propre et éviter qu'elle grossisse indéfiniment.
     *
     * Retourne le nombre de tokens supprimés.
     */
    public function deleteExpiredTokens(): int
    {
        return $this->createQueryBuilder('t')
            ->delete()
            ->where('t.expiresAt < :now')
            ->setParameter('now', new \DateTimeImmutable())
            ->getQuery()
            ->execute();
    }
}