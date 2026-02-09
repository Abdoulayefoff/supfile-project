<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Entité représentant un dossier partagé en interne avec un autre utilisateur.
 * Sert à la collaboration entre utilisateurs.
 */
#[ORM\Entity]
#[ORM\Table(name: 'shared_folders')]
class SharedFolder
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    // Dossier partagé
    #[ORM\ManyToOne(targetEntity: Folder::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Folder $folder;

    // Utilisateur avec qui le dossier est partagé
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private User $sharedWith;

    // Permissions (lecture seule par défaut)
    #[ORM\Column]
    private string $permission = 'read';

    // --- Getters & setters ---
}
