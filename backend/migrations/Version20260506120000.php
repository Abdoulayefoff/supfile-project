<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260506120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Avatar stocké en base64 en DB : VARCHAR(255) → LONGTEXT + reset des anciens chemins fichiers';
    }

    public function up(Schema $schema): void
    {
        // Passer la colonne avatar en LONGTEXT pour stocker les data URI base64 (~30-50 Ko)
        $this->addSql('ALTER TABLE users CHANGE avatar avatar LONGTEXT DEFAULT NULL');

        // Les anciennes valeurs sont des noms de fichiers (ex: "abc123_1.jpg") qui ne sont
        // plus valides. On les remet à NULL proprement.
        $this->addSql("UPDATE users SET avatar = NULL WHERE avatar IS NOT NULL AND avatar NOT LIKE 'data:%'");
    }

    public function down(Schema $schema): void
    {
        // Repasser en VARCHAR(255) — les data URI base64 sont trop longues, on les vide
        $this->addSql("UPDATE users SET avatar = NULL WHERE avatar LIKE 'data:%'");
        $this->addSql('ALTER TABLE users CHANGE avatar avatar VARCHAR(255) DEFAULT NULL');
    }
}
