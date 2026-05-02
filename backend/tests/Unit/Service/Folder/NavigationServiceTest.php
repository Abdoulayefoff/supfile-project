<?php

namespace App\Tests\Unit\Service\Folder;

use App\Entity\Folder;
use App\Service\Folder\NavigationService;
use PHPUnit\Framework\TestCase;

class NavigationServiceTest extends TestCase
{
    private NavigationService $navigationService;

    protected function setUp(): void
    {
        $this->navigationService = new NavigationService();
    }

    private function buildFolderWithId(int $id, string $name, ?Folder $parent = null): Folder
    {
        $folder = new Folder();
        $folder->setName($name);
        $folder->setParent($parent);

        $refl = new \ReflectionProperty(Folder::class, 'id');
        $refl->setValue($folder, $id);

        return $folder;
    }

    // ─── Happy Path

    public function testGetBreadcrumbsForRootFolder(): void
    {
        $root = $this->buildFolderWithId(1, 'Documents');

        $breadcrumbs = $this->navigationService->getBreadcrumbs($root);

        $this->assertCount(1, $breadcrumbs);
        $this->assertSame(['id' => 1, 'name' => 'Documents'], $breadcrumbs[0]);
    }

    public function testGetBreadcrumbsForNestedFolder(): void
    {
        $root = $this->buildFolderWithId(1, 'Documents');
        $sub  = $this->buildFolderWithId(2, 'Projet', $root);

        $breadcrumbs = $this->navigationService->getBreadcrumbs($sub);

        $this->assertCount(2, $breadcrumbs);
        $this->assertSame(['id' => 1, 'name' => 'Documents'], $breadcrumbs[0]);
        $this->assertSame(['id' => 2, 'name' => 'Projet'], $breadcrumbs[1]);
    }

    public function testGetBreadcrumbsForDeeplyNestedFolder(): void
    {
        $root    = $this->buildFolderWithId(1, 'Root');
        $level1  = $this->buildFolderWithId(2, 'Level1', $root);
        $level2  = $this->buildFolderWithId(3, 'Level2', $level1);
        $level3  = $this->buildFolderWithId(4, 'Level3', $level2);

        $breadcrumbs = $this->navigationService->getBreadcrumbs($level3);

        $this->assertCount(4, $breadcrumbs);
        $this->assertSame('Root', $breadcrumbs[0]['name']);
        $this->assertSame('Level1', $breadcrumbs[1]['name']);
        $this->assertSame('Level2', $breadcrumbs[2]['name']);
        $this->assertSame('Level3', $breadcrumbs[3]['name']);
    }

    public function testGetBreadcrumbsReturnsCorrectOrder(): void
    {
        $root = $this->buildFolderWithId(10, 'Root');
        $mid  = $this->buildFolderWithId(20, 'Middle', $root);
        $leaf = $this->buildFolderWithId(30, 'Leaf', $mid);

        $breadcrumbs = $this->navigationService->getBreadcrumbs($leaf);

        // L'ordre doit être du plus haut niveau vers le plus bas
        $this->assertSame(10, $breadcrumbs[0]['id']);
        $this->assertSame(20, $breadcrumbs[1]['id']);
        $this->assertSame(30, $breadcrumbs[2]['id']);
    }

    // ─── Cas limites 

    public function testGetBreadcrumbsForFolderWithNullId(): void
    {
        $folder = new Folder();
        $folder->setName('NoId');
        // id est null par défaut (pas encore persisté)

        $breadcrumbs = $this->navigationService->getBreadcrumbs($folder);

        $this->assertCount(1, $breadcrumbs);
        $this->assertNull($breadcrumbs[0]['id']);
        $this->assertSame('NoId', $breadcrumbs[0]['name']);
    }

    public function testGetBreadcrumbsReturnsFolderNameCorrectly(): void
    {
        $folder = $this->buildFolderWithId(5, 'Mon Dossier avec des espaces');

        $breadcrumbs = $this->navigationService->getBreadcrumbs($folder);

        $this->assertSame('Mon Dossier avec des espaces', $breadcrumbs[0]['name']);
    }

    public function testGetBreadcrumbsWithUnicodeName(): void
    {
        $folder = $this->buildFolderWithId(1, 'Ré-organisation 日本語');

        $breadcrumbs = $this->navigationService->getBreadcrumbs($folder);

        $this->assertSame('Ré-organisation 日本語', $breadcrumbs[0]['name']);
    }
}
