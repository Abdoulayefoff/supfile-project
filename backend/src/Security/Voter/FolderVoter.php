<?php

namespace App\Security\Voter;

use App\Entity\Folder;
use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

class FolderVoter extends Voter
{
    public const VIEW = 'FOLDER_VIEW';
    public const EDIT = 'FOLDER_EDIT';
    public const DELETE = 'FOLDER_DELETE';

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
            self::VIEW => $this->canView($folder, $user),
            self::EDIT => $this->canEdit($folder, $user),
            self::DELETE => $this->canDelete($folder, $user),
            default => false,
        };
    }

    private function canView(Folder $folder, User $user): bool
    {
        // Le propriétaire peut toujours voir
        if ($folder->getOwner() === $user) {
            return true;
        }

        // Vérifier les partages (sera complété au Sprint 5-6)
        return false;
    }

    private function canEdit(Folder $folder, User $user): bool
    {
        // Le propriétaire peut toujours éditer
        if ($folder->getOwner() === $user) {
            return true;
        }

        // Vérifier les partages avec permission write (Sprint 5-6)
        return false;
    }

    private function canDelete(Folder $folder, User $user): bool
    {
        // Seul le propriétaire peut supprimer
        return $folder->getOwner() === $user;
    }
}
