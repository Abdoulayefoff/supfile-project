<?php

namespace App\Controller;

use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;

/**
 * Controller pour la gestion du profil utilisateur.
 * Permet de modifier email, mot de passe, avatar et préférences.
 */
class UserController extends AbstractController
{
    /**
     * PUT /api/user/profile
     * Met à jour le profil utilisateur : email, avatar, préférences.
     */
    #[Route('/api/user/profile', methods: ['PUT'])]
    public function updateProfile(
        Request $request,
        EntityManagerInterface $em
    ): JsonResponse {
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true);

        if (isset($data['email'])) {
            $user->setEmail($data['email']);
        }

        if (isset($data['preferences'])) {
            $user->setPreferences($data['preferences']);
        }

        if (isset($data['avatar'])) {
            $user->setAvatar($data['avatar']);
        }

        $em->flush();

        return new JsonResponse(['status' => 'updated']);
    }

    /**
     * PUT /api/user/password
     * Change le mot de passe de l'utilisateur.
     */
    #[Route('/api/user/password', methods: ['PUT'])]
    public function changePassword(
        Request $request,
        UserPasswordHasherInterface $hasher,
        EntityManagerInterface $em
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);
        $user = $this->getUser();

        if (empty($data['password'])) {
            return new JsonResponse(['error' => 'Missing password'], 400);
        }

        // Hashage sécurisé du mot de passe
        $user->setPassword(
            $hasher->hashPassword($user, $data['password'])
        );

        $em->flush();

        return new JsonResponse(['status' => 'password_changed']);
    }
}
