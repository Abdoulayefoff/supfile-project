export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function getMimeIcon(mimeType: string): {
  icon: string;
  color: string;
} {
  if (mimeType.startsWith('image/')) return { icon: 'file-image-o', color: '#10b981' };
  if (mimeType.startsWith('video/')) return { icon: 'file-video-o', color: '#8b5cf6' };
  if (mimeType.startsWith('audio/')) return { icon: 'file-audio-o', color: '#f59e0b' };
  if (mimeType === 'application/pdf') return { icon: 'file-pdf-o', color: '#ef4444' };
  if (mimeType.includes('word') || mimeType.includes('document')) return { icon: 'file-word-o', color: '#2563eb' };
  if (mimeType.includes('excel') || mimeType.includes('sheet')) return { icon: 'file-excel-o', color: '#16a34a' };
  if (mimeType.includes('zip') || mimeType.includes('archive') || mimeType.includes('rar')) return { icon: 'file-archive-o', color: '#ca8a04' };
  if (mimeType.startsWith('text/')) return { icon: 'file-text-o', color: '#64748b' };
  return { icon: 'file-o', color: '#94a3b8' };
}

export function getMimeCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'Image';
  if (mimeType.startsWith('video/')) return 'Vidéo';
  if (mimeType.startsWith('audio/')) return 'Audio';
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType.startsWith('text/')) return 'Texte';
  return 'Fichier';
}