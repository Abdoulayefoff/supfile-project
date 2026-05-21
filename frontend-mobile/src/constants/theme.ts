// Interface regroupant toutes les propriétés nécessaires pour un thème (clair ou sombre)
export interface AppTheme {
  primary: string;
  primaryLight: string;
  danger: string;
  dangerLight: string;
  success: string;
  successLight: string;
  purple: string;
  purpleLight: string;
  background: string;
  surface: string;
  surfaceSecondary: string;
  header: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  borderFocus: string;
  
  // File types
  fileImage: string;
  fileVideo: string;
  fileDocument: string;
  filePdf: string;
  fileAudio: string;
  fileArchive: string;
  fileText: string;
  fileOther: string;
  
  // OAuth
  oauthGoogle: string;
  oauthGithub: string;
  oauthMicrosoft: string;
}

// Définition de la palette de couleurs pour le Mode Clair
export const lightTheme: AppTheme = {
  primary: '#1A56DB',
  primaryLight: '#eff6ff',
  danger: '#ef4444',
  dangerLight: '#fef2f2',
  success: '#16a34a',
  successLight: '#f0fdf4',
  purple: '#8b5cf6',
  purpleLight: '#fdf4ff',
  
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceSecondary: '#f1f5f9',
  header: '#ffffff',
  
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
  textTertiary: '#94a3b8',
  
  border: '#e2e8f0',
  borderFocus: '#1A56DB',
  
  fileImage: '#10b981',
  fileVideo: '#8b5cf6',
  fileDocument: '#2563eb',
  filePdf: '#ef4444',
  fileAudio: '#f59e0b',
  fileArchive: '#ca8a04',
  fileText: '#64748b',
  fileOther: '#94a3b8',
  
  oauthGoogle: '#EA4335',
  oauthGithub: '#24292e',
  oauthMicrosoft: '#00A4EF',
};

// Définition de la palette de couleurs pour le Mode Sombre
export const darkTheme: AppTheme = {
  primary: '#3b82f6',
  primaryLight: '#1e3a5f',
  danger: '#f87171',
  dangerLight: '#450a0a',
  success: '#4ade80',
  successLight: '#052e16',
  purple: '#a78bfa',
  purpleLight: '#2e1065',
  
  background: '#0f172a',
  surface: '#1e293b',
  surfaceSecondary: '#334155',
  header: '#1e293b',
  
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  
  border: '#334155',
  borderFocus: '#3b82f6',
  
  fileImage: '#10b981',
  fileVideo: '#8b5cf6',
  fileDocument: '#2563eb',
  filePdf: '#ef4444',
  fileAudio: '#f59e0b',
  fileArchive: '#ca8a04',
  fileText: '#64748b',
  fileOther: '#94a3b8',
  
  oauthGoogle: '#EA4335',
  oauthGithub: '#ffffff', // White icon for dark mode
  oauthMicrosoft: '#00A4EF',
};
