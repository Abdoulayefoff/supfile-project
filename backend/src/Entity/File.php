<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Entité représentant un fichier SUPFILE.
 * Contient métadonnées et pointeur vers stockage physique.
 */
#[ORM\Entity]
#[ORM\Table(name: 'files')]
class File
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    // Nom original affiché à l'utilisateur
    #[ORM\Column]
    private string $originalName;

    // Nom de stockage unique (UUID) utilisé sur le disque
    #[ORM\Column(unique: true)]
    private string $storageName;

    // Type MIME (image/png, application/pdf...)
    #[ORM\Column]
    private string $mimeType;

    // Taille en octets
    #[ORM\Column(type: 'bigint')]
    private int $size;

    // Dossier parent (nullable pour racine)
    #[ORM\ManyToOne(targetEntity: Folder::class)]
    #[ORM\JoinColumn(onDelete: 'SET NULL')]
    private ?Folder $folder = null;

    // Propriétaire
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private User $owner;

    #[ORM\Column(type: 'datetime')]
    private \DateTimeInterface $createdAt;

    #[ORM\Column(type: 'datetime')]
    private \DateTimeInterface $updatedAt;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
        $this->updatedAt = new \DateTime();
    }

    // --- Getters & setters ---
}
