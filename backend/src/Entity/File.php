<?php

namespace App\Entity;

use App\Repository\FileRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: FileRepository::class)]
#[ORM\Table(name: 'files')]
#[ORM\HasLifecycleCallbacks]
class File
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['file:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['file:read', 'file:write'])]
    private ?string $name = null;

    #[ORM\Column(length: 500)]
    #[Groups(['file:read'])]
    private ?string $path = null;

    #[ORM\Column(type: Types::BIGINT)]
    #[Groups(['file:read'])]
    private ?string $size = null;

    #[ORM\Column(length: 100)]
    #[Groups(['file:read'])]
    private ?string $mimeType = null;

    #[ORM\Column(options: ['default' => false])]
    #[Groups(['file:read'])]
    private bool $isDeleted = false;

    #[ORM\Column(nullable: true)]
    #[Groups(['file:read'])]
    private ?\DateTimeImmutable $deletedAt = null;

    #[ORM\Column]
    #[Groups(['file:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column]
    #[Groups(['file:read'])]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\ManyToOne(inversedBy: 'files')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['file:read'])]
    private ?User $owner = null;

    #[ORM\ManyToOne(inversedBy: 'files')]
    #[Groups(['file:read', 'file:write'])]
    private ?Folder $folder = null;

    public function __construct()
    {
        $this->isDeleted = false;
    }

    #[ORM\PrePersist]
    public function setCreatedAtValue(): void
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function setUpdatedAtValue(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;
        return $this;
    }

    public function getPath(): ?string
    {
        return $this->path;
    }

    public function setPath(string $path): static
    {
        $this->path = $path;
        return $this;
    }

    public function getSize(): ?string
    {
        return $this->size;
    }

    public function setSize(string $size): static
    {
        $this->size = $size;
        return $this;
    }

    public function getMimeType(): ?string
    {
        return $this->mimeType;
    }

    public function setMimeType(string $mimeType): static
    {
        $this->mimeType = $mimeType;
        return $this;
    }

    public function isDeleted(): bool
    {
        return $this->isDeleted;
    }

    public function setIsDeleted(bool $isDeleted): static
    {
        $this->isDeleted = $isDeleted;
        return $this;
    }

    public function getDeletedAt(): ?\DateTimeImmutable
    {
        return $this->deletedAt;
    }

    public function setDeletedAt(?\DateTimeImmutable $deletedAt): static
    {
        $this->deletedAt = $deletedAt;
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

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(\DateTimeImmutable $updatedAt): static
    {
        $this->updatedAt = $updatedAt;
        return $this;
    }

    public function getOwner(): ?User
    {
        return $this->owner;
    }

    public function setOwner(?User $owner): static
    {
        $this->owner = $owner;
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

    public function softDelete(): void
    {
        $this->isDeleted = true;
        $this->deletedAt = new \DateTimeImmutable();
    }

    public function restore(): void
    {
        $this->isDeleted = false;
        $this->deletedAt = null;
    }

    #[Groups(['file:read'])]
    public function getExtension(): string
    {
        return pathinfo($this->name, PATHINFO_EXTENSION);
    }

    #[Groups(['file:read'])]
    public function isImage(): bool
    {
        return str_starts_with($this->mimeType ?? '', 'image/');
    }

    #[Groups(['file:read'])]
    public function isVideo(): bool
    {
        return str_starts_with($this->mimeType ?? '', 'video/');
    }

    #[Groups(['file:read'])]
    public function isAudio(): bool
    {
        return str_starts_with($this->mimeType ?? '', 'audio/');
    }

    #[Groups(['file:read'])]
    public function isPdf(): bool
    {
        return $this->mimeType === 'application/pdf';
    }

    #[Groups(['file:read'])]
    public function getHumanReadableSize(): string
    {
        $bytes = (int) $this->size;
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }
}
