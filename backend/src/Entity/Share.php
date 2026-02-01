<?php

namespace App\Entity;

use App\Repository\ShareRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: ShareRepository::class)]
#[ORM\Table(name: 'shares')]
#[ORM\UniqueConstraint(name: 'UNIQ_IDENTIFIER_TOKEN', fields: ['token'])]
#[ORM\HasLifecycleCallbacks]
class Share
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['share:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 64, unique: true)]
    #[Groups(['share:read'])]
    private ?string $token = null;

    #[ORM\Column(options: ['default' => false])]
    #[Groups(['share:read', 'share:write'])]
    private bool $isPublic = false;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['share:write'])]
    private ?string $password = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['share:read', 'share:write'])]
    private ?\DateTimeImmutable $expiresAt = null;

    #[ORM\Column]
    #[Groups(['share:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\ManyToOne]
    #[Groups(['share:read', 'share:write'])]
    private ?File $file = null;

    #[ORM\ManyToOne]
    #[Groups(['share:read', 'share:write'])]
    private ?Folder $folder = null;

    #[ORM\ManyToOne]
    #[Groups(['share:read', 'share:write'])]
    private ?User $sharedWith = null;

    #[ORM\ManyToOne(inversedBy: 'shares')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['share:read'])]
    private ?User $createdBy = null;

    public function __construct()
    {
        $this->isPublic = false;
        $this->token = $this->generateToken();
    }

    #[ORM\PrePersist]
    public function setCreatedAtValue(): void
    {
        $this->createdAt = new \DateTimeImmutable();
        
        if ($this->token === null) {
            $this->token = $this->generateToken();
        }
    }

    private function generateToken(): string
    {
        return bin2hex(random_bytes(32));
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getToken(): ?string
    {
        return $this->token;
    }

    public function setToken(string $token): static
    {
        $this->token = $token;
        return $this;
    }

    public function isPublic(): bool
    {
        return $this->isPublic;
    }

    public function setIsPublic(bool $isPublic): static
    {
        $this->isPublic = $isPublic;
        return $this;
    }

    public function getPassword(): ?string
    {
        return $this->password;
    }

    public function setPassword(?string $password): static
    {
        $this->password = $password;
        return $this;
    }

    public function getExpiresAt(): ?\DateTimeImmutable
    {
        return $this->expiresAt;
    }

    public function setExpiresAt(?\DateTimeImmutable $expiresAt): static
    {
        $this->expiresAt = $expiresAt;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;
        return $this;
    }

    public function getFile(): ?File
    {
        return $this->file;
    }

    public function setFile(?File $file): static
    {
        $this->file = $file;
        return $this;
    }

    public function getFolder(): ?Folder
    {
        return $this->folder;
    }

    public function setFolder(?Folder $folder): static
    {
        $this->folder = $folder;
        return $this;
    }

    public function getSharedWith(): ?User
    {
        return $this->sharedWith;
    }

    public function setSharedWith(?User $sharedWith): static
    {
        $this->sharedWith = $sharedWith;
        return $this;
    }

    public function getCreatedBy(): ?User
    {
        return $this->createdBy;
    }

    public function setCreatedBy(?User $createdBy): static
    {
        $this->createdBy = $createdBy;
        return $this;
    }

    #[Groups(['share:read'])]
    public function isExpired(): bool
    {
        if ($this->expiresAt === null) {
            return false;
        }
        return $this->expiresAt < new \DateTimeImmutable();
    }

    #[Groups(['share:read'])]
    public function hasPassword(): bool
    {
        return $this->password !== null;
    }

    #[Groups(['share:read'])]
    public function isValid(): bool
    {
        return $this->token !== null && !$this->isExpired();
    }

    public function getSharedResource(): File|Folder|null
    {
        return $this->file ?? $this->folder;
    }

    #[Groups(['share:read'])]
    public function getResourceType(): ?string
    {
        if ($this->file !== null) {
            return 'file';
        }
        
        if ($this->folder !== null) {
            return 'folder';
        }
        
        return null;
    }
}
