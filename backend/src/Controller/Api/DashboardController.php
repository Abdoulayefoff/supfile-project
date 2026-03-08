<?php

namespace App\Controller\Api;

use App\Repository\FileRepository;
use App\Repository\FolderRepository;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/dashboard', name: 'api_dashboard_')]
#[IsGranted('ROLE_USER')]
class DashboardController extends AbstractController
{
    public function __construct(
        private FileRepository $fileRepository,
        private FolderRepository $folderRepository,
        private EntityManagerInterface $em,
    ) {}

    /**
     * GET /api/dashboard/stats
     * Quota et nombre de fichiers/dossiers
     */
    #[Route('/stats', name: 'stats', methods: ['GET'])]
    public function stats(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        $fileCount = $this->fileRepository->count(['owner' => $user, 'isDeleted' => false]);
        $folderCount = $this->folderRepository->count(['owner' => $user, 'isDeleted' => false]);

        return $this->json([
            'quota' => [
                'used' => $user->getQuotaUsed(),
                'limit' => $user->getQuotaLimit(),
                'percentage' => $user->getQuotaPercentage(),
            ],
            'files' => $fileCount,
            'folders' => $folderCount,
        ]);
    }

    /**
     * GET /api/dashboard/stats/type
     * Répartition des fichiers par type MIME
     */
    #[Route('/stats/type', name: 'stats_type', methods: ['GET'])]
    public function statsByType(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        $result = $this->em->createQueryBuilder()
            ->select('f.mimeType, COUNT(f.id) as count, SUM(f.size) as totalSize')
            ->from('App\Entity\File', 'f')
            ->where('f.owner = :user')
            ->andWhere('f.isDeleted = false')
            ->groupBy('f.mimeType')
            ->orderBy('count', 'DESC')
            ->setParameter('user', $user)
            ->getQuery()
            ->getResult();

        // Regrouper par catégorie
        $categories = [];
        foreach ($result as $row) {
            $category = $this->getMimeCategory($row['mimeType']);
            if (!isset($categories[$category])) {
                $categories[$category] = ['count' => 0, 'totalSize' => 0];
            }
            $categories[$category]['count'] += $row['count'];
            $categories[$category]['totalSize'] += $row['totalSize'];
        }

        $formatted = [];
        foreach ($categories as $category => $data) {
            $formatted[] = [
                'category' => $category,
                'count' => $data['count'],
                'totalSize' => $data['totalSize'],
            ];
        }

        return $this->json($formatted);
    }

    /**
     * GET /api/dashboard/recent
     * 5 derniers fichiers modifiés
     */
    #[Route('/recent', name: 'recent', methods: ['GET'])]
    public function recent(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        $files = $this->fileRepository->findBy(
            ['owner' => $user, 'isDeleted' => false],
            ['updatedAt' => 'DESC'],
            5
        );

        $data = array_map(fn($file) => [
            'id' => $file->getId(),
            'name' => $file->getName(),
            'mimeType' => $file->getMimeType(),
            'size' => $file->getSize(),
            'folderId' => $file->getFolder()?->getId(),
            'updatedAt' => $file->getUpdatedAt()->format('c'),
        ], $files);

        return $this->json($data);
    }

    /**
     * GET /api/dashboard/search
     * Recherche par nom, type, date
     */
    #[Route('/search', name: 'search', methods: ['GET'])]
    public function search(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        $query = $request->query->get('q', '');
        $type = $request->query->get('type', '');
        $dateFrom = $request->query->get('dateFrom', '');
        $dateTo = $request->query->get('dateTo', '');

        $qb = $this->em->createQueryBuilder()
            ->select('f')
            ->from('App\Entity\File', 'f')
            ->where('f.owner = :user')
            ->andWhere('f.isDeleted = false')
            ->setParameter('user', $user)
            ->orderBy('f.updatedAt', 'DESC');

        if (!empty($query)) {
            $qb->andWhere('f.name LIKE :query')
               ->setParameter('query', '%' . $query . '%');
        }

        if (!empty($type)) {
            $qb->andWhere('f.mimeType LIKE :type')
               ->setParameter('type', '%' . $type . '%');
        }

        if (!empty($dateFrom)) {
            $qb->andWhere('f.createdAt >= :dateFrom')
               ->setParameter('dateFrom', new \DateTimeImmutable($dateFrom));
        }

        if (!empty($dateTo)) {
            $qb->andWhere('f.createdAt <= :dateTo')
               ->setParameter('dateTo', new \DateTimeImmutable($dateTo));
        }

        $files = $qb->getQuery()->getResult();

        $data = array_map(fn($file) => [
            'id' => $file->getId(),
            'name' => $file->getName(),
            'mimeType' => $file->getMimeType(),
            'size' => $file->getSize(),
            'folderId' => $file->getFolder()?->getId(),
            'createdAt' => $file->getCreatedAt()->format('c'),
            'updatedAt' => $file->getUpdatedAt()->format('c'),
        ], $files);

        return $this->json($data);
    }

    /**
     * Détermine la catégorie d'un type MIME
     */
    private function getMimeCategory(string $mimeType): string
    {
        return match(true) {
            str_starts_with($mimeType, 'image/') => 'images',
            str_starts_with($mimeType, 'video/') => 'videos',
            str_starts_with($mimeType, 'audio/') => 'audio',
            str_contains($mimeType, 'pdf') => 'pdf',
            str_contains($mimeType, 'word') || str_contains($mimeType, 'document') => 'documents',
            str_contains($mimeType, 'sheet') || str_contains($mimeType, 'excel') => 'tableurs',
            str_contains($mimeType, 'zip') || str_contains($mimeType, 'rar') || str_contains($mimeType, 'tar') => 'archives',
            str_starts_with($mimeType, 'text/') => 'texte',
            default => 'autres',
        };
    }
}