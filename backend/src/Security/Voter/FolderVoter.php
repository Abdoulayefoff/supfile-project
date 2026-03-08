<?php

namespace App\Security\Voter;

use App\Entity\Folder;
use App\Entity\User;
use App\Repository\ShareRepository;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

class FolderVoter extends Voter
{
    public const VIEW   = 'FOLDER_VIEW';
    public const EDIT   = 'FOLDER_EDIT';
    public const DELETE = 'FOLDER_DELETE';

    public function __construct(
        private ShareRepository $shareRepository,
    ) {}

    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::EDIT, self::DELETE])
            && $subject instanceof Folder;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }

        /** @var Folder $folder */
        $folder = $subject;

        return match ($attribute) {
            self::VIEW   => $this->canView($folder, $user),
            self::EDIT   => $this->canEdit($folder, $user),
            self::DELETE => $this->canDelete($folder, $user),
            default      => false,
        };
    }

    private function canView(Folder $folder, User $user): bool
    {
        // Le propriétaire peut toujours voir
        if ($folder->getOwner() === $user) {
            return true;
        }

        // Vérifier si le dossier est partagé avec l'utilisateur
        return $this->shareRepository->findValidShareForFolder($user, $folder) !== null;
    }

    private function canEdit(Folder $folder, User $user): bool
    {
        // Seul le propriétaire peut modifier
        if ($folder->getOwner() !== $user) {
            return false;
        }

        // Un dossier dans la corbeille ne peut plus être modifié
        if ($folder->isDeleted()) {
            return false;
        }

        return true;
    }

    private function canDelete(Folder $folder, User $user): bool
    {
        // Seul le propriétaire peut supprimer, et une seule fois
        return $folder->getOwner() === $user && !$folder->isDeleted();
    }
}
