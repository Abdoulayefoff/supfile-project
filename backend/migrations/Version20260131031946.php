<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260131031946 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE files (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, path VARCHAR(500) NOT NULL, size BIGINT NOT NULL, mime_type VARCHAR(100) NOT NULL, is_deleted TINYINT DEFAULT 0 NOT NULL, deleted_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, owner_id INT NOT NULL, folder_id INT DEFAULT NULL, INDEX IDX_63540597E3C61F9 (owner_id), INDEX IDX_6354059162CB942 (folder_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('CREATE TABLE folders (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, is_deleted TINYINT DEFAULT 0 NOT NULL, deleted_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, owner_id INT NOT NULL, parent_id INT DEFAULT NULL, INDEX IDX_FE37D30F7E3C61F9 (owner_id), INDEX IDX_FE37D30F727ACA70 (parent_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('CREATE TABLE shares (id INT AUTO_INCREMENT NOT NULL, token VARCHAR(64) NOT NULL, is_public TINYINT DEFAULT 0 NOT NULL, password VARCHAR(255) DEFAULT NULL, expires_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, file_id INT DEFAULT NULL, folder_id INT DEFAULT NULL, shared_with_id INT DEFAULT NULL, created_by_id INT NOT NULL, INDEX IDX_905F717C93CB796C (file_id), INDEX IDX_905F717C162CB942 (folder_id), INDEX IDX_905F717CD14FE63F (shared_with_id), INDEX IDX_905F717CB03A8386 (created_by_id), UNIQUE INDEX UNIQ_IDENTIFIER_TOKEN (token), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('CREATE TABLE users (id INT AUTO_INCREMENT NOT NULL, email VARCHAR(180) NOT NULL, password VARCHAR(255) NOT NULL, first_name VARCHAR(100) DEFAULT NULL, last_name VARCHAR(100) DEFAULT NULL, avatar VARCHAR(255) DEFAULT NULL, quota_used BIGINT DEFAULT 0 NOT NULL, quota_limit BIGINT DEFAULT 32212254720 NOT NULL, theme VARCHAR(20) DEFAULT NULL, oauth_provider VARCHAR(100) DEFAULT NULL, oauth_id VARCHAR(255) DEFAULT NULL, roles JSON NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, UNIQUE INDEX UNIQ_IDENTIFIER_EMAIL (email), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('CREATE TABLE messenger_messages (id BIGINT AUTO_INCREMENT NOT NULL, body LONGTEXT NOT NULL, headers LONGTEXT NOT NULL, queue_name VARCHAR(190) NOT NULL, created_at DATETIME NOT NULL, available_at DATETIME NOT NULL, delivered_at DATETIME DEFAULT NULL, INDEX IDX_75EA56E0FB7336F0 (queue_name), INDEX IDX_75EA56E0E3BD61CE (available_at), INDEX IDX_75EA56E016BA31DB (delivered_at), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('ALTER TABLE files ADD CONSTRAINT FK_63540597E3C61F9 FOREIGN KEY (owner_id) REFERENCES users (id)');
        $this->addSql('ALTER TABLE files ADD CONSTRAINT FK_6354059162CB942 FOREIGN KEY (folder_id) REFERENCES folders (id)');
        $this->addSql('ALTER TABLE folders ADD CONSTRAINT FK_FE37D30F7E3C61F9 FOREIGN KEY (owner_id) REFERENCES users (id)');
        $this->addSql('ALTER TABLE folders ADD CONSTRAINT FK_FE37D30F727ACA70 FOREIGN KEY (parent_id) REFERENCES folders (id)');
        $this->addSql('ALTER TABLE shares ADD CONSTRAINT FK_905F717C93CB796C FOREIGN KEY (file_id) REFERENCES files (id)');
        $this->addSql('ALTER TABLE shares ADD CONSTRAINT FK_905F717C162CB942 FOREIGN KEY (folder_id) REFERENCES folders (id)');
        $this->addSql('ALTER TABLE shares ADD CONSTRAINT FK_905F717CD14FE63F FOREIGN KEY (shared_with_id) REFERENCES users (id)');
        $this->addSql('ALTER TABLE shares ADD CONSTRAINT FK_905F717CB03A8386 FOREIGN KEY (created_by_id) REFERENCES users (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE files DROP FOREIGN KEY FK_63540597E3C61F9');
        $this->addSql('ALTER TABLE files DROP FOREIGN KEY FK_6354059162CB942');
        $this->addSql('ALTER TABLE folders DROP FOREIGN KEY FK_FE37D30F7E3C61F9');
        $this->addSql('ALTER TABLE folders DROP FOREIGN KEY FK_FE37D30F727ACA70');
        $this->addSql('ALTER TABLE shares DROP FOREIGN KEY FK_905F717C93CB796C');
        $this->addSql('ALTER TABLE shares DROP FOREIGN KEY FK_905F717C162CB942');
        $this->addSql('ALTER TABLE shares DROP FOREIGN KEY FK_905F717CD14FE63F');
        $this->addSql('ALTER TABLE shares DROP FOREIGN KEY FK_905F717CB03A8386');
        $this->addSql('DROP TABLE files');
        $this->addSql('DROP TABLE folders');
        $this->addSql('DROP TABLE shares');
        $this->addSql('DROP TABLE users');
        $this->addSql('DROP TABLE messenger_messages');
    }
}
