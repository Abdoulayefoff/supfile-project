<?php

namespace App\Repository;

use App\Entity\File;
use App\Entity\Folder;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<File>
 */
class FileRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, File::class);
    }

    /**
     * Liste les fichiers avec filtrage optionnel par dossier, propriétaire et recherche.
     *
     * @param Folder|null $folder    Dossier cible (null = racine ou global si $globalSearch)
     * @param User|null   $owner     Propriétaire (null = pas de filtre propriétaire)
     * @param string      $search    Terme de recherche sur le nom ou l'extension
     * @param bool        $globalSearch Si true, ignore le filtre folder et cherche dans tous les dossiers
     * @return File[]
     */
    public function findByFolderAndSearch(
        ?Folder $folder,
        ?User   $owner,
        string  $search = '',
        bool    $globalSearch = false,
    ): array {
        $qb = $this->createQueryBuilder('f')
            ->where('f.isDeleted = false');

        if ($owner !== null) {
            $qb->andWhere('f.owner = :owner')->setParameter('owner', $owner);
        }

        if (!$globalSearch) {
            // En SQL, "= NULL" est toujours faux — il faut IS NULL pour les racines.
            if ($folder === null) {
                $qb->andWhere('f.folder IS NULL');
            } else {
                $qb->andWhere('f.folder = :folder')->setParameter('folder', $folder);
            }
        }

        if ($search !== '') {
            $qb->andWhere(
                $qb->expr()->orX(
                    $qb->expr()->like('LOWER(f.name)', ':search'),
                    $qb->expr()->like('LOWER(f.name)', ':searchExt'),
                )
            )
            ->setParameter('search', '%' . strtolower($search) . '%')
            ->setParameter('searchExt', '%.' . ltrim(strtolower($search), '.') . '%');
        }

        return $qb->orderBy('f.updatedAt', 'DESC')->getQuery()->getResult();
    }
}
