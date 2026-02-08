<?php

namespace App\Security\Voter;

use App\Entity\File;
use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

class FileVoter extends Voter
{
    public const VIEW = 'FILE_VIEW';
    public const EDIT = 'FILE_EDIT';
    public const DELETE = 'FILE_DELETE';

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
            self::VIEW => $this->canView($file, $user),
            self::EDIT => $this->canEdit($file, $user),
            self::DELETE => $this->canDelete($file, $user),
            default => false,
        };
    }

    private function canView(File $file, User $user): bool
    {
        // Le propriétaire peut toujours voir
        if ($file->getOwner() === $user) {
            return true;
        }

        // Vérifier les partages (sera complété au Sprint 5-6)
        return false;
    }

    private function canEdit(File $file, User $user): bool
    {
        // Le propriétaire peut toujours éditer
        if ($file->getOwner() === $user) {
            return true;
        }

        // Vérifier les partages avec permission write (Sprint 5-6)
        return false;
    }

    private function canDelete(File $file, User $user): bool
    {
        // Seul le propriétaire peut supprimer
        return $file->getOwner() === $user;
    }
}
