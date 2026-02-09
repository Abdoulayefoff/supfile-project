<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Entité représentant un dossier SUPFILE.
 * Les dossiers peuvent être imbriqués (relation parent/enfant) et appartiennent à un utilisateur.
 */
#[ORM\Entity]
#[ORM\Table(name: 'folders')]
class Folder
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    // Nom du dossier
    #[ORM\Column]
    private string $name;

    // Propriétaire du dossier
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private User $owner;

    // Dossier parent (nullable pour les racines)
    #[ORM\ManyToOne(targetEntity: Folder::class)]
    #[ORM\JoinColumn(onDelete: 'CASCADE')]
    private ?Folder $parent = null;

    // Date de création
    #[ORM\Column(type: 'datetime')]
    private \DateTimeInterface $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
    }

    // --- Getters & setters ---
}
