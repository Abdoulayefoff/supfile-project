<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Entité représentant un lien de partage public.
 * Un lien peut pointer soit vers un fichier, soit vers un dossier.
 * Peut être protégé par mot de passe et avoir une date d'expiration.
 */
#[ORM\Entity]
#[ORM\Table(name: 'share_links')]
class ShareLink
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    // Token unique pour l'accès public
    #[ORM\Column(unique: true)]
    private string $token;

    // Propriétaire du partage
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private User $owner;

    // Fichier partagé (nullable si dossier)
    #[ORM\ManyToOne(targetEntity: File::class)]
    #[ORM\JoinColumn(onDelete: 'CASCADE')]
    private ?File $file = null;

    // Dossier partagé (nullable si fichier)
    #[ORM\ManyToOne(targetEntity: Folder::class)]
    #[ORM\JoinColumn(onDelete: 'CASCADE')]
    private ?Folder $folder = null;

    // Mot de passe hashé (nullable)
    #[ORM\Column(nullable: true)]
    private ?string $password = null;

    // Date d'expiration du lien (nullable)
    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTimeInterface $expiresAt = null;

    // Date de création
    #[ORM\Column(type: 'datetime')]
    private \DateTimeInterface $createdAt;

    public function __construct()
    {
        // Génération du token unique
        $this->token = bin2hex(random_bytes(32));
        $this->createdAt = new \DateTime();
    }

    // --- Getters & setters ---
}
