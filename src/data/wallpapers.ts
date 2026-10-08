import { ChatWallpaperConfig } from '../types';

export const DEFAULT_WALLPAPER_CONFIG: ChatWallpaperConfig = {
  id: 'default',
  name: 'Freedom Standard',
  type: 'color',
  value: 'transparent',
  previewBg: '#0f172a',
  backgroundStyle: 'transparent',
  dimness: 0,
  blur: 0,
};

export const WALLPAPER_PRESETS: ChatWallpaperConfig[] = [
  DEFAULT_WALLPAPER_CONFIG,
  {
    id: 'emerald-flow',
    name: 'Emerald Aurora',
    type: 'gradient',
    value: 'from-emerald-950 via-slate-900 to-teal-950',
    previewBg: 'linear-gradient(135deg, #064e3b 0%, #0f172a 50%, #134e4a 100%)',
    backgroundStyle: 'linear-gradient(135deg, #064e3b 0%, #0f172a 50%, #134e4a 100%)',
    dimness: 10,
    blur: 0,
  },
  {
    id: 'midnight-violet',
    name: 'Midnight Violet',
    type: 'gradient',
    value: 'from-purple-950 via-slate-900 to-indigo-950',
    previewBg: 'linear-gradient(135deg, #3b0764 0%, #0f172a 50%, #1e1b4b 100%)',
    backgroundStyle: 'linear-gradient(135deg, #3b0764 0%, #0f172a 50%, #1e1b4b 100%)',
    dimness: 15,
    blur: 0,
  },
  {
    id: 'cyber-dark',
    name: 'Cyber Noir',
    type: 'gradient',
    value: 'from-slate-950 via-gray-900 to-slate-950',
    previewBg: 'linear-gradient(135deg, #020617 0%, #111827 50%, #020617 100%)',
    backgroundStyle: 'linear-gradient(135deg, #020617 0%, #111827 50%, #020617 100%)',
    dimness: 5,
    blur: 0,
  },
  {
    id: 'sunset-amber',
    name: 'Amber Glow',
    type: 'gradient',
    value: 'from-amber-950 via-slate-900 to-orange-950',
    previewBg: 'linear-gradient(135deg, #451a03 0%, #0f172a 50%, #431407 100%)',
    backgroundStyle: 'linear-gradient(135deg, #451a03 0%, #0f172a 50%, #431407 100%)',
    dimness: 15,
    blur: 0,
  },
  {
    id: 'ocean-depth',
    name: 'Deep Oceanic',
    type: 'gradient',
    value: 'from-cyan-950 via-slate-900 to-blue-950',
    previewBg: 'linear-gradient(135deg, #083344 0%, #0f172a 50%, #172554 100%)',
    backgroundStyle: 'linear-gradient(135deg, #083344 0%, #0f172a 50%, #172554 100%)',
    dimness: 10,
    blur: 0,
  },
  {
    id: 'geometric-doodle',
    name: 'Freedom Minimal Doodle',
    type: 'doodle',
    value: 'radial-gradient(circle at 25px 25px, rgba(16, 185, 129, 0.12) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(16, 185, 129, 0.08) 2%, transparent 0%)',
    previewBg: '#0f172a',
    backgroundStyle: 'radial-gradient(circle at 25px 25px, rgba(16, 185, 129, 0.12) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(16, 185, 129, 0.08) 2%, transparent 0%)',
    dimness: 0,
    blur: 0,
  },
];

export function isLikelyImageUrl(url: string): boolean {
  if (!url) return false;
  const clean = url.trim().toLowerCase();
  return (
    clean.startsWith('data:image/') ||
    clean.endsWith('.png') ||
    clean.endsWith('.jpg') ||
    clean.endsWith('.jpeg') ||
    clean.endsWith('.webp') ||
    clean.endsWith('.gif') ||
    clean.endsWith('.svg') ||
    clean.includes('unsplash.com') ||
    clean.includes('images.') ||
    clean.includes('cloudinary.com') ||
    clean.includes('firebasestorage.googleapis.com')
  );
}

export function extractWallpaperLinkFromText(text?: string): string | null {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  if (!matches || matches.length === 0) return null;
  for (const url of matches) {
    if (isLikelyImageUrl(url)) return url;
  }
  return null;
}

export function createCustomUrlWallpaper(
  url: string,
  dimness = 20,
  blur = 0,
  name = 'Custom Wallpaper'
): ChatWallpaperConfig {
  return {
    id: `custom-wp-${Date.now()}`,
    name,
    type: 'image',
    value: url,
    previewBg: url,
    backgroundStyle: `url("${url}")`,
    dimness,
    blur,
    isCustomUrl: true,
  };
}
