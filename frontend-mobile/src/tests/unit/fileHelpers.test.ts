// Suite de tests unitaires pour le module fileHelpers
import { formatFileSize, formatDate, getMimeIcon, getMimeCategory } from '../../utils/fileHelpers';

// Groupe de tests unitaires couvrant les fonctions utilitaires de gestion des fichiers
describe('fileHelpers', () => {
  // Tests du formateur de taille de fichier (octets → KB, MB, GB)
  describe('formatFileSize', () => {
    it('returns 0 B for 0 bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });

    it('formats bytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1.5)).toBe('1.5 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });
  });

  // Tests du formateur de date en format localisé
  describe('formatDate', () => {
    it('formats valid date string correctly', () => {
      const date = new Date('2023-01-15T10:00:00Z');
      expect(formatDate(date.toISOString())).toMatch(/15 janv\. 2023|15 janv. 2023/);
    });

    it('retourne la même chaîne si la date est invalide', () => {
      expect(formatDate('invalid-date')).toBe('Invalid Date');
    });
  });

  // Tests de la résolution d'icône et de couleur à partir du type MIME
  describe('getMimeIcon', () => {
    it('retourne la bonne icône et couleur pour les images', () => {
      expect(getMimeIcon('image/jpeg')).toEqual({ icon: 'image-outline', color: '#10b981' });
    });

    it('retourne la bonne icône et couleur pour le pdf', () => {
      expect(getMimeIcon('application/pdf')).toEqual({ icon: 'document-text-outline', color: '#ef4444' });
    });

    it('retourne l\'icône par défaut pour les types inconnus', () => {
      expect(getMimeIcon('application/unknown')).toEqual({ icon: 'document-outline', color: '#94a3b8' });
    });
  });

  // Tests de la catégorisation humaine à partir du type MIME
  describe('getMimeCategory', () => {
    it('retourne la bonne catégorie pour les images', () => {
      expect(getMimeCategory('image/png')).toBe('Image');
    });

    it('retourne la bonne catégorie pour les zip', () => {
      expect(getMimeCategory('application/zip')).toBe('Archive');
    });

    it('retourne la catégorie par défaut pour les types inconnus', () => {
      expect(getMimeCategory('application/unknown')).toBe('Fichier');
    });
  });
});
