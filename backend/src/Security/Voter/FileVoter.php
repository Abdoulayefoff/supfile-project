<?php

namespace App\Security\Voter;

use App\Entity\File;
use App\Entity\User;
use App\Repository\ShareRepository;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

class FileVoter extends Voter
{
    public const VIEW   = 'FILE_VIEW';
    public const EDIT   = 'FILE_EDIT';
    public const DELETE = 'FILE_DELETE';

    public function __construct(
        private ShareRepository $shareRepository,
    ) {}

    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::EDIT, self::DELETE])
            && $subject instanceof File;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }

        /** @var File $file */
        $file = $subject;

        return match ($attribute) {
            self::VIEW   => $this->canView($file, $user),
            self::EDIT   => $this->canEdit($file, $user),
            self::DELETE => $this->canDelete($file, $user),
            default      => false,
        };
    }

    private function canView(File $file, User $user): bool
    {
        // Le propriétaire peut toujours voir
        if ($file->getOwner() === $user) {
            return true;
        }

        // Vérifier si le fichier est directement partagé avec l'utilisateur
        if ($this->shareRepository->findValidShareForFile($user, $file) !== null) {
            return true;
        }

        // Vérifier si le fichier se trouve dans un dossier partagé avec l'utilisateur
        $folder = $file->getFolder();
        if ($folder !== null && $this->shareRepository->findValidShareForFolder($user, $folder) !== null) {
            return true;
        }

        return false;
    }

    private function canEdit(File $file, User $user): bool
    {
        // Seul le propriétaire peut modifier
        if ($file->getOwner() !== $user) {
            return false;
        }

        // Un fichier dans la corbeille ne peut plus être modifié
        if ($file->isDeleted()) {
            return false;
        }

        return true;
    }

    private function canDelete(File $file, User $user): bool
    {
        // Seul le propriétaire peut supprimer, et une seule fois
        return $file->getOwner() === $user && !$file->isDeleted();
    }
}
