<?php

namespace App\Repository;

use App\Entity\Share;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use App\Entity\File;
use App\Entity\Folder;
use App\Entity\User;

/**
 * @extends ServiceEntityRepository<Share>
 */
class ShareRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Share::class);
    }
    public function findExistingPrivateShare(User $creator, File|Folder $resource, User $sharedWith): ?Share
    {
        $qb = $this->createQueryBuilder('s')
            ->where('s.createdBy = :creator')
            ->andWhere('s.sharedWith = :sharedWith')
            ->andWhere('s.isPublic = false')
            ->setParameter('creator', $creator)
            ->setParameter('sharedWith', $sharedWith);

        if ($resource instanceof File) {
            $qb->andWhere('s.file = :resource');
        } else {
            $qb->andWhere('s.folder = :resource');
        }

        $qb->setParameter('resource', $resource);

        return $qb->getQuery()->getOneOrNullResult();
    }

    /**
     * Retourne les partages de dossiers reçus par un utilisateur (partage interne).
     *
     * @return Share[]
     */
    public function findSharedFoldersWithUser(User $user): array
    {
        return $this->createQueryBuilder('s')
            ->where('s.sharedWith = :user')
            ->andWhere('s.isPublic = false')
            ->andWhere('s.folder IS NOT NULL')
            ->setParameter('user', $user)
            ->getQuery()
            ->getResult();
    }

    /**
     * Retourne tous les partages privés reçus par un utilisateur.
     *
     * @return Share[]
     */
    public function findPrivateSharesReceivedByUser(User $user): array
    {
        return $this->createQueryBuilder('s')
            ->where('s.sharedWith = :user')
            ->andWhere('s.isPublic = false')
            ->setParameter('user', $user)
            ->getQuery()
            ->getResult();
    }

    /**
     * Retourne un partage privé valide (non expiré) pour un fichier spécifique.
     * Utilisé par le FileVoter pour autoriser VIEW sur les fichiers partagés.
     */
    public function findValidShareForFile(User $user, File $file): ?Share
    {
        return $this->createQueryBuilder('s')
            ->where('s.sharedWith = :user')
            ->andWhere('s.file = :file')
            ->andWhere('s.isPublic = false')
            ->andWhere('s.expiresAt IS NULL OR s.expiresAt > :now')
            ->setParameter('user', $user)
            ->setParameter('file', $file)
            ->setParameter('now', new \DateTimeImmutable())
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Retourne un partage privé valide (non expiré) pour un dossier spécifique.
     * Utilisé par le FolderVoter et le FileVoter (fichiers dans un dossier partagé).
     */
    public function findValidShareForFolder(User $user, Folder $folder): ?Share
    {
        return $this->createQueryBuilder('s')
            ->where('s.sharedWith = :user')
            ->andWhere('s.folder = :folder')
            ->andWhere('s.isPublic = false')
            ->andWhere('s.expiresAt IS NULL OR s.expiresAt > :now')
            ->setParameter('user', $user)
            ->setParameter('folder', $folder)
            ->setParameter('now', new \DateTimeImmutable())
            ->getQuery()
            ->getOneOrNullResult();
    }
    //    /**
    //     * @return Share[] Returns an array of Share objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('s')
    //            ->andWhere('s.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('s.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?Share
    //    {
    //        return $this->createQueryBuilder('s')
    //            ->andWhere('s.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }
}
