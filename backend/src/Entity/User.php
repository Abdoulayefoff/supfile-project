<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;

/**
 * Entité représentant un utilisateur SUPFILE.
 * Contient email, mot de passe, rôle, quota et préférences.
 */
#[ORM\Entity]
#[ORM\Table(name: "users")]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    // Email unique utilisé pour l'identification
    #[ORM\Column(unique: true)]
    private string $email;

    // Mot de passe hashé
    #[ORM\Column(nullable: true)]
    private ?string $password = null;

    // Rôles de l'utilisateur (ROLE_USER par défaut)
    #[ORM\Column]
    private array $roles = ['ROLE_USER'];

    // Quota maximal en octets (30 Go par défaut)
    #[ORM\Column]
    private int $quota = 32212254720;

    // Préférences UI stockées en JSON (thème clair/sombre, etc.)
    #[ORM\Column(type: 'json', nullable: true)]
    private ?array $preferences = [];

    // URL ou nom de fichier de l'avatar
    #[ORM\Column(nullable: true)]
    private ?string $avatar = null;

    // --- Getters et setters ---
    public function getId(): ?int { return $this->id; }
    public function getUserIdentifier(): string { return $this->email; }
    public function getRoles(): array { return $this->roles; }
    public function eraseCredentials(): void {}
    public function getPassword(): ?string { return $this->password; }
    public function setPassword(?string $password): self { $this->password = $password; return $this; }
    public function setEmail(string $email): self { $this->email = $email; return $this; }
    public function setPreferences(array $prefs): self { $this->preferences = $prefs; return $this; }
    public function setAvatar(?string $avatar): self { $this->avatar = $avatar; return $this; }
}
