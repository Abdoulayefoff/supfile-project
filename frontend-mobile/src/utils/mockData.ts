//Pour tester sans backend

import { FileItem, FolderItem } from '../types';

export const mockFolders: FolderItem[] = [
  { id: 1, name: 'Documents', createdAt: '2026-01-10T10:00:00+00:00', parent: null, isShared: false },
  { id: 2, name: 'Photos', createdAt: '2026-01-15T10:00:00+00:00', parent: null, isShared: false },
  { id: 3, name: 'Vidéos', createdAt: '2026-02-01T10:00:00+00:00', parent: null, isShared: false },
  { id: 4, name: 'Dossier Alice', createdAt: '2026-02-10T10:00:00+00:00', parent: null, isShared: true,
    sharedBy: { id: 5, email: 'alice@example.com', fullName: 'Alice Dupont' } },
];

export const mockFiles: FileItem[] = [
  { id: 1, name: 'Rapport_2026.pdf', size: 2048000, mimeType: 'application/pdf',
    createdAt: '2026-02-20T10:00:00+00:00', updatedAt: '2026-02-21T10:00:00+00:00', folder: null },
  { id: 2, name: 'Photo_vacances.jpg', size: 4096000, mimeType: 'image/jpeg',
    createdAt: '2026-02-18T10:00:00+00:00', updatedAt: '2026-02-18T10:00:00+00:00', folder: null },
  { id: 3, name: 'Présentation.pptx', size: 8192000, mimeType: 'application/vnd.ms-powerpoint',
    createdAt: '2026-02-15T10:00:00+00:00', updatedAt: '2026-02-16T10:00:00+00:00', folder: null },
  { id: 4, name: 'Budget.xlsx', size: 512000, mimeType: 'application/vnd.ms-excel',
    createdAt: '2026-02-10T10:00:00+00:00', updatedAt: '2026-02-10T10:00:00+00:00', folder: null },
  { id: 5, name: 'Notes.txt', size: 10240, mimeType: 'text/plain',
    createdAt: '2026-02-05T10:00:00+00:00', updatedAt: '2026-02-05T10:00:00+00:00', folder: null },
  { id: 6, name: 'Video_cours.mp4', size: 524288000, mimeType: 'video/mp4',
    createdAt: '2026-01-28T10:00:00+00:00', updatedAt: '2026-01-28T10:00:00+00:00', folder: null },
];