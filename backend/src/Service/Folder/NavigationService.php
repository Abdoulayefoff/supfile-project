<?php

namespace App\Service\Folder;

use App\Entity\Folder;

class NavigationService
{
    /**
     * Retourne le fil d'Ariane d'un dossier sous forme de tableau.
     *
     * Exemple pour un dossier "Projet" dans "Documents" :
     * [
     *   ['id' => 1, 'name' => 'Documents'],
     *   ['id' => 2, 'name' => 'Projet'],
     * ]
     */
    public function getBreadcrumbs(Folder $folder): array
    {
        $breadcrumbs = [];
        $current = $folder;

        // On remonte la hiérarchie jusqu'à la racine
        while ($current !== null) {
            array_unshift($breadcrumbs, [
                'id'   => $current->getId(),
                'name' => $current->getName(),
            ]);
            $current = $current->getParent();
        }

        return $breadcrumbs;
    }
}