import { sb } from './supabase.js';

export const THEMES = [
  {
    id: 'light',
    nameKey: 'profile.themeLightName',
    descKey: 'profile.themeLightDesc',
    preview: { bg: '#eef0f7', surface: '#ffffff', accent: '#4f46e5', text: '#111827' },
  },
  {
    id: 'warzone',
    nameKey: 'profile.themeWarzName',
    descKey: 'profile.themeWarzDesc',
    preview: { bg: '#0d0f0c', surface: '#161a14', accent: '#d97706', text: '#e8e4d8' },
  },
  {
    id: 'midnight',
    nameKey: 'profile.themeMidName',
    descKey: 'profile.themeMidDesc',
    preview: { bg: '#080c18', surface: '#0e1426', accent: '#38bdf8', text: '#e2e8f0' },
  },
];

export function applyTheme(themeId) {
  const valid = THEMES.map(t => t.id);
  const id = valid.includes(themeId) ? themeId : 'light';
  document.documentElement.setAttribute('data-theme', id === 'light' ? '' : id);
  localStorage.setItem('nc_theme', id);
}

export function loadTheme() {
  const saved = localStorage.getItem('nc_theme') || 'light';
  applyTheme(saved);
  return saved;
}

export async function saveTheme(userId, themeId) {
  applyTheme(themeId);
  await sb.from('profiles').update({ theme: themeId }).eq('id', userId);
}
