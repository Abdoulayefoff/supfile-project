<?php

namespace App\Service\Auth;

use App\Entity\PasswordResetToken;
use App\Repository\PasswordResetTokenRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class PasswordResetService
{
    /**
     * Durée de validité du token en minutes.
     * 30 minutes est un bon compromis : assez long pour que l'utilisateur
     * ait le temps d'agir, assez court pour limiter la fenêtre d'attaque.
     */
    private const TOKEN_TTL_MINUTES = 30;

    public function __construct(
        private EntityManagerInterface       $em,
        private PasswordResetTokenRepository $tokenRepository,
        private UserRepository               $userRepository,
        private MailerInterface              $mailer,
        private UserPasswordHasherInterface  $passwordHasher,
        /**
         * URL de base du frontend, injectée depuis la variable d'environnement
         * FRONTEND_URL (ex: https://www.supfile-cloud.fr).
         * Utilisée pour construire le lien de réinitialisation dans l'email.
         */
        private string $frontendUrl,
        /**
         * Adresse email expéditrice, injectée depuis MAILER_FROM
         * (ex: noreply@supfile-cloud.fr).
         */
        private string $mailerFrom,
    ) {}

    /**
     * Étape 1 du flux — Demande de réinitialisation.
     *
     * Reçoit l'email saisi par l'utilisateur, génère un token sécurisé,
     * le stocke en base et envoie l'email contenant le lien de reset.
     *
     * SÉCURITÉ : cette méthode ne révèle jamais si l'email existe en base.
     * Elle retourne void dans tous les cas — le contrôleur renvoie toujours
     * un HTTP 200 au client, ce qui empêche l'énumération des comptes
     * (un attaquant ne peut pas savoir si une adresse est inscrite ou non).
     */
    public function requestReset(string $email): void
    {
        // Recherche de l'utilisateur par email
        $user = $this->userRepository->findOneBy(['email' => $email]);

        // Si l'email n'existe pas en base, on sort silencieusement.
        // Le frontend recevra quand même un 200 — pas de fuite d'information.
        if (!$user) {
            return;
        }

        // Supprimer tous les tokens de reset non encore utilisés pour cet utilisateur.
        // Cela évite l'accumulation de tokens actifs et force l'utilisation
        // du dernier lien envoyé uniquement.
        $existingTokens = $this->tokenRepository->findBy([
            'user'   => $user,
            'usedAt' => null,
        ]);
        foreach ($existingTokens as $old) {
            $this->em->remove($old);
        }

        // Générer un token cryptographiquement sécurisé.
        // random_bytes(32) produit 32 octets aléatoires via le CSPRNG du système.
        // bin2hex() les convertit en 64 caractères hexadécimaux.
        // Ce token est impossible à prédire ou brute-forcer.
        $rawToken  = bin2hex(random_bytes(32));
        $expiresAt = new \DateTimeImmutable('+' . self::TOKEN_TTL_MINUTES . ' minutes');

        // Persister le token en base de données
        $resetToken = new PasswordResetToken($user, $rawToken, $expiresAt);
        $this->em->persist($resetToken);
        $this->em->flush();

        // Construire le lien complet qui sera inclus dans l'email.
        // Ex: https://www.supfile-cloud.fr/reset-password?token=abc123...
        $resetLink = $this->frontendUrl . '/reset-password?token=' . $rawToken;

        // Construire et envoyer l'email via le template Twig
        $email = (new TemplatedEmail())
            ->from($this->mailerFrom)
            ->to($user->getEmail())
            ->subject('Réinitialisation de votre mot de passe SUPFile')
            ->htmlTemplate('emails/reset_password.html.twig')
            ->context([
                // Variables disponibles dans le template Twig
                'firstName'        => $user->getFirstName() ?? 'Utilisateur',
                'resetLink'        => $resetLink,
                'expiresInMinutes' => self::TOKEN_TTL_MINUTES,
            ]);

        $this->mailer->send($email);
    }

    /**
     * Étape 2 du flux — Réinitialisation effective du mot de passe.
     *
     * Reçoit le token (extrait de l'URL par le frontend) et le nouveau
     * mot de passe saisi par l'utilisateur. Vérifie la validité du token,
     * met à jour le mot de passe hashé, puis invalide le token pour qu'il
     * ne puisse pas être réutilisé.
     *
     * @throws \InvalidArgumentException si le token est invalide, expiré ou déjà utilisé.
     */
    public function resetPassword(string $rawToken, string $newPassword): void
    {
        // Recherche du token : doit exister, ne pas être expiré, ne pas être utilisé.
        // findValidToken() applique les trois conditions en une seule requête.
        $resetToken = $this->tokenRepository->findValidToken($rawToken);

        // Si le token n'est pas trouvé (invalide, expiré ou déjà utilisé),
        // on lève une exception que le contrôleur transformera en HTTP 400.
        if (!$resetToken) {
            throw new \InvalidArgumentException('Token invalide ou expiré.');
        }

        $user = $resetToken->getUser();

        // Hasher le nouveau mot de passe avec l'algorithme configuré dans Symfony
        // (bcrypt ou argon2id selon security.yaml) — jamais stocker en clair.
        $hashed = $this->passwordHasher->hashPassword($user, $newPassword);
        $user->setPassword($hashed);

        // Invalider le token : marquer usedAt = now.
        // Le token devient inutilisable même si le lien est réutilisé.
        $resetToken->markAsUsed();

        // Un seul flush pour sauvegarder les deux changements (mot de passe + token)
        // de manière atomique — soit les deux sont sauvegardés, soit aucun.
        $this->em->flush();
    }
}