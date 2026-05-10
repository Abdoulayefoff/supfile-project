<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260507120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajout de la table password_reset_tokens pour la réinitialisation de mot de passe';
    }

    public function up(Schema $schema): void
    {
        // Création de la table qui stocke les tokens de réinitialisation de mot de passe.
        // Chaque token est lié à un utilisateur (user_id) et possède :
        //   - token      : 64 caractères hex, unique, impossible à prédire
        //   - expires_at : date d'expiration (30 minutes après création)
        //   - used_at    : NULL tant que non utilisé, rempli après usage (usage unique)
        //   - created_at : date de création pour audit
        $this->addSql('
            CREATE TABLE password_reset_tokens (
                id          INT AUTO_INCREMENT NOT NULL,
                user_id     INT NOT NULL,
                token       VARCHAR(64) NOT NULL,
                expires_at  DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
                used_at     DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\',
                created_at  DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
                UNIQUE INDEX UNIQ_TOKEN (token),
                INDEX IDX_USER (user_id),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        ');

        // Clé étrangère vers la table users avec ON DELETE CASCADE :
        // si un utilisateur est supprimé, tous ses tokens sont automatiquement supprimés
        $this->addSql('
            ALTER TABLE password_reset_tokens
            ADD CONSTRAINT FK_PRT_USER
            FOREIGN KEY (user_id) REFERENCES users (id)
            ON DELETE CASCADE
        ');
    }

    public function down(Schema $schema): void
    {
        // Rollback : suppression de la contrainte puis de la table
        $this->addSql('ALTER TABLE password_reset_tokens DROP FOREIGN KEY FK_PRT_USER');
        $this->addSql('DROP TABLE password_reset_tokens');
    }
}