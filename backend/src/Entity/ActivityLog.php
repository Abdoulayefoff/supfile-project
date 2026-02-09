<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Entité représentant une activité utilisateur (upload, delete, share…)
 * Utilisée pour le dashboard et l'historique.
 */
#[ORM\Entity]
#[ORM\Table(name: 'activity_logs')]
class ActivityLog
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    // Utilisateur ayant effectué l'action
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private User $user;

    // Action réalisée (upload, delete, move, share, restore)
    #[ORM\Column]
    private string $action;

    // Nom du fichier/dossier cible (nullable)
    #[ORM\Column(nullable: true)]
    private ?string $targetName = null;

    // Date de l'activité
    #[ORM\Column(type: 'datetime')]
    private \DateTimeInterface $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
    }

    // --- Getters & setters ---
}
