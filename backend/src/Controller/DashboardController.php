<?php

namespace App\Controller;

use App\Service\DashboardService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Controller pour récupérer les données du dashboard utilisateur.
 */
class DashboardController extends AbstractController
{
    /**
     * GET /api/dashboard
     * Retourne : quota utilisé, répartition par type et activités récentes.
     */
    #[Route('/api/dashboard', methods: ['GET'])]
    public function dashboard(DashboardService $service): JsonResponse
    {
        return new JsonResponse(
            $service->getDashboard($this->getUser())
        );
    }
}
