<?php

namespace App\Service\Share;

use App\Entity\File;
use App\Entity\Folder;
use App\Entity\Share;
use App\Entity\User;
use App\Repository\ShareRepository;
use Doctrine\ORM\EntityManagerInterface;

class ShareManager
{
    public function __construct(
        private EntityManagerInterface $em,
        private ShareRepository $shareRepository,
    ) {}

    /**
     * Crée un partage public (accessible via token)
     */
    public function createPublicShare(
        User $creator,
        File|Folder $resource,
        ?\DateTimeImmutable $expiresAt = null,
        ?string $password = null
    ): Share {
        $share = new Share();
        $share->setCreatedBy($creator);
        $share->setIsPublic(true);

        if ($resource instanceof File) {
            $share->setFile($resource);
        } else {
            $share->setFolder($resource);
        }

        if ($expiresAt !== null) {
            $share->setExpiresAt($expiresAt);
        }

        if ($password !== null) {
            // password_hash/password_verify est le standard PHP pour les mots de passe
            // d'accès à une ressource (≠ mots de passe utilisateur gérés par Symfony)
            $share->setPassword(password_hash($password, PASSWORD_BCRYPT));
        }

        $this->em->persist($share);
        $this->em->flush();

        return $share;
    }

    /**
     * Crée un partage privé (accessible uniquement par un utilisateur spécifique)
     */
    public function createPrivateShare(
        User $creator,
        File|Folder $resource,
        User $sharedWith,
        ?\DateTimeImmutable $expiresAt = null
    ): Share {
        // Vérifier si un partage existe déjà entre ces deux utilisateurs pour cette ressource
        $existing = $this->shareRepository->findExistingPrivateShare($creator, $resource, $sharedWith);
        if ($existing !== null) {
            return $existing;
        }

        $share = new Share();
        $share->setCreatedBy($creator);
        $share->setIsPublic(false);
        $share->setSharedWith($sharedWith);

        if ($resource instanceof File) {
            $share->setFile($resource);
        } else {
            $share->setFolder($resource);
        }

        if ($expiresAt !== null) {
            $share->setExpiresAt($expiresAt);
        }

        $this->em->persist($share);
        $this->em->flush();

        return $share;
    }

    /**
     * Valide un partage public (vérifie mot de passe et expiration)
     */
    public function validateShare(Share $share, ?string $password = null): bool
    {
        if (!$share->isValid()) {
            return false;
        }

        if ($share->hasPassword()) {
            if ($password === null) {
                return false;
            }
            return password_verify($password, $share->getPassword());
        }

        return true;
    }

    /**
     * Révoque (supprime) un partage
     */
    public function revokeShare(Share $share): void
    {
        $this->em->remove($share);
        $this->em->flush();
    }

    /**
     * Récupère tous les partages créés par un utilisateur
     */
    public function getSharesByUser(User $user): array
    {
        return $this->shareRepository->findBy(
            ['createdBy' => $user],
            ['createdAt' => 'DESC']
        );
    }

    /**
     * Récupère un partage par son token
     */
    public function findByToken(string $token): ?Share
    {
        return $this->shareRepository->findOneBy(['token' => $token]);
    }
}