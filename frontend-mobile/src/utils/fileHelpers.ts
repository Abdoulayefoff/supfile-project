// Convertit une taille en octets en une chaîne lisible (KB, MB, GB...)
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Formate une date ISO en format français "JJ MMM AAAA"
export const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
};

// Associe une icône Ionicons et une couleur en fonction du type MIME du fichier
export const getMimeIcon = (mimeType: string): { icon: string; color: string } => {
  if (mimeType.startsWith('image/')) return { icon: 'image-outline', color: '#10b981' };
  if (mimeType.startsWith('video/')) return { icon: 'film-outline', color: '#8b5cf6' };
  if (mimeType.startsWith('audio/')) return { icon: 'musical-notes-outline', color: '#f59e0b' };
  if (mimeType.includes('pdf')) return { icon: 'document-text-outline', color: '#ef4444' };
  if (mimeType.includes('word') || mimeType.includes('document')) return { icon: 'document-text-outline', color: '#2563eb' };
  if (mimeType.includes('excel') || mimeType.includes('sheet')) return { icon: 'stats-chart-outline', color: '#16a34a' };
  if (mimeType.includes('zip') || mimeType.includes('archive') || mimeType.includes('rar')) return { icon: 'archive-outline', color: '#ca8a04' };
  if (mimeType.startsWith('text/')) return { icon: 'document-text-outline', color: '#64748b' };
  return { icon: 'document-outline', color: '#94a3b8' }; // Valeur par défaut
};

// Retourne un label humain (ex: "Image", "Vidéo") à partir d'un type MIME
export const getMimeCategory = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'Image';
  if (mimeType.startsWith('video/')) return 'Vidéo';
  if (mimeType.startsWith('audio/')) return 'Audio';
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'Document';
  if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'Tableur';
  if (mimeType.includes('zip') || mimeType.includes('archive') || mimeType.includes('rar')) return 'Archive';
  if (mimeType.startsWith('text/')) return 'Texte';
  return 'Fichier'; // Valeur par défaut
};
