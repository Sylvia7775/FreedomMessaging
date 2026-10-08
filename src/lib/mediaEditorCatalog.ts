export type FilterCategory =
  | 'popular'
  | 'vintage'
  | 'cinematic'
  | 'moody'
  | 'bw'
  | 'cyber'
  | 'nature'
  | 'artistic';

export interface CategorizedFilterItem {
  id: string;
  name: string;
  category: FilterCategory;
  cssFilter: string;
  tintColor?: string;
  swatchGradient: string;
}

export const FILTER_CATEGORIES: { id: FilterCategory; label: string }[] = [
  { id: 'popular', label: 'Popular & Glam' },
  { id: 'vintage', label: 'Vintage & Retro' },
  { id: 'cinematic', label: 'Cinematic' },
  { id: 'moody', label: 'Moody & Portrait' },
  { id: 'bw', label: 'B&W Mono' },
  { id: 'cyber', label: 'Cyber & Neon' },
  { id: 'nature', label: 'Nature & Travel' },
  { id: 'artistic', label: 'Artistic & Duotone' },
];

// 64 Categorized Filters (8 Categories x 8 Filters)
export const SIXTY_PLUS_FILTERS: CategorizedFilterItem[] = [
  // 1. Popular & Glam (8)
  {
    id: 'original',
    name: 'Original',
    category: 'popular',
    cssFilter: 'none',
    swatchGradient: 'from-slate-500 to-slate-700',
  },
  {
    id: 'soft_glam',
    name: 'Soft Glam',
    category: 'popular',
    cssFilter: 'brightness(1.06) contrast(0.98) saturate(1.18) sepia(0.08)',
    tintColor: 'rgba(255, 165, 205, 0.12)',
    swatchGradient: 'from-pink-400 to-rose-500',
  },
  {
    id: 'golden_hour',
    name: 'Golden Hour',
    category: 'popular',
    cssFilter: 'brightness(1.06) contrast(1.06) saturate(1.32) sepia(0.22)',
    tintColor: 'rgba(255, 175, 65, 0.16)',
    swatchGradient: 'from-amber-400 to-orange-500',
  },
  {
    id: 'rose_quartz',
    name: 'Rose Quartz',
    category: 'popular',
    cssFilter: 'brightness(1.08) contrast(0.95) saturate(1.18) hue-rotate(-8deg)',
    tintColor: 'rgba(255, 120, 180, 0.16)',
    swatchGradient: 'from-rose-300 to-pink-500',
  },
  {
    id: 'peach_glow',
    name: 'Peach Glow',
    category: 'popular',
    cssFilter: 'brightness(1.07) contrast(1.02) saturate(1.24) sepia(0.12)',
    tintColor: 'rgba(255, 150, 110, 0.14)',
    swatchGradient: 'from-orange-300 to-rose-400',
  },
  {
    id: 'velvet_skin',
    name: 'Velvet Skin',
    category: 'popular',
    cssFilter: 'brightness(1.09) contrast(0.94) saturate(1.1)',
    tintColor: 'rgba(255, 210, 195, 0.1)',
    swatchGradient: 'from-rose-200 to-amber-300',
  },
  {
    id: 'sun_kissed',
    name: 'Sun Kissed',
    category: 'popular',
    cssFilter: 'brightness(1.05) contrast(1.08) saturate(1.35) sepia(0.15)',
    tintColor: 'rgba(255, 190, 80, 0.14)',
    swatchGradient: 'from-yellow-400 to-orange-500',
  },
  {
    id: 'pure_clarity',
    name: 'Pure Clarity',
    category: 'popular',
    cssFilter: 'brightness(1.04) contrast(1.14) saturate(1.16)',
    swatchGradient: 'from-sky-400 to-blue-600',
  },

  // 2. Vintage & Retro (8)
  {
    id: 'film_1977',
    name: '1977 Film',
    category: 'vintage',
    cssFilter: 'contrast(1.1) brightness(1.08) saturate(1.25) sepia(0.3)',
    tintColor: 'rgba(243, 106, 188, 0.14)',
    swatchGradient: 'from-amber-600 to-rose-600',
  },
  {
    id: 'kodak_gold',
    name: 'Kodak Gold',
    category: 'vintage',
    cssFilter: 'brightness(1.04) contrast(1.12) saturate(1.28) sepia(0.26)',
    tintColor: 'rgba(255, 200, 60, 0.15)',
    swatchGradient: 'from-yellow-500 to-amber-700',
  },
  {
    id: 'polaroid_600',
    name: 'Polaroid 600',
    category: 'vintage',
    cssFilter: 'brightness(1.09) contrast(0.92) saturate(0.88) sepia(0.22)',
    tintColor: 'rgba(220, 235, 255, 0.14)',
    swatchGradient: 'from-stone-400 to-amber-600',
  },
  {
    id: 'sepia_classic',
    name: 'Sepia Classic',
    category: 'vintage',
    cssFilter: 'sepia(0.78) contrast(1.05) brightness(0.98)',
    swatchGradient: 'from-amber-700 to-stone-800',
  },
  {
    id: 'nostalgia_85',
    name: 'Nostalgia 85',
    category: 'vintage',
    cssFilter: 'brightness(1.02) contrast(0.95) saturate(0.82) sepia(0.35)',
    tintColor: 'rgba(245, 190, 120, 0.16)',
    swatchGradient: 'from-orange-400 to-stone-600',
  },
  {
    id: 'faded_memory',
    name: 'Faded Memory',
    category: 'vintage',
    cssFilter: 'brightness(1.1) contrast(0.84) saturate(0.75) sepia(0.2)',
    swatchGradient: 'from-slate-400 to-stone-500',
  },
  {
    id: 'warm_70s',
    name: '70s Warmth',
    category: 'vintage',
    cssFilter: 'brightness(1.03) contrast(1.06) saturate(1.2) sepia(0.42)',
    tintColor: 'rgba(235, 140, 50, 0.16)',
    swatchGradient: 'from-orange-500 to-amber-800',
  },
  {
    id: 'dust_grain',
    name: 'Dust & Grain',
    category: 'vintage',
    cssFilter: 'brightness(1.01) contrast(0.9) saturate(0.7) sepia(0.28)',
    tintColor: 'rgba(180, 160, 140, 0.15)',
    swatchGradient: 'from-zinc-500 to-stone-700',
  },

  // 3. Cinematic & Drama (8)
  {
    id: 'teal_orange',
    name: 'Teal & Orange',
    category: 'cinematic',
    cssFilter: 'contrast(1.22) brightness(1.01) saturate(1.38) hue-rotate(-6deg)',
    tintColor: 'rgba(0, 140, 165, 0.14)',
    swatchGradient: 'from-teal-500 to-orange-500',
  },
  {
    id: 'blockbuster',
    name: 'Blockbuster',
    category: 'cinematic',
    cssFilter: 'contrast(1.26) brightness(0.98) saturate(1.25)',
    tintColor: 'rgba(15, 85, 130, 0.16)',
    swatchGradient: 'from-cyan-700 to-amber-500',
  },
  {
    id: 'neo_noir',
    name: 'Neo Noir',
    category: 'cinematic',
    cssFilter: 'contrast(1.35) brightness(0.92) saturate(0.65)',
    tintColor: 'rgba(20, 35, 65, 0.2)',
    swatchGradient: 'from-slate-700 to-slate-950',
  },
  {
    id: 'gotham_dark',
    name: 'Gotham Dark',
    category: 'cinematic',
    cssFilter: 'contrast(1.28) brightness(0.9) saturate(0.72)',
    tintColor: 'rgba(30, 50, 70, 0.22)',
    swatchGradient: 'from-slate-800 to-zinc-950',
  },
  {
    id: 'blade_runner',
    name: 'Blade Runner',
    category: 'cinematic',
    cssFilter: 'contrast(1.24) brightness(0.96) saturate(1.45) hue-rotate(10deg)',
    tintColor: 'rgba(255, 95, 30, 0.16)',
    swatchGradient: 'from-orange-600 to-purple-900',
  },
  {
    id: 'indie_drama',
    name: 'Indie Drama',
    category: 'cinematic',
    cssFilter: 'contrast(1.12) brightness(0.97) saturate(0.86) sepia(0.14)',
    swatchGradient: 'from-emerald-800 to-stone-700',
  },
  {
    id: 'anamorphic',
    name: 'Anamorphic',
    category: 'cinematic',
    cssFilter: 'contrast(1.18) brightness(1.02) saturate(1.15)',
    tintColor: 'rgba(50, 130, 240, 0.12)',
    swatchGradient: 'from-blue-600 to-indigo-900',
  },
  {
    id: 'silver_screen',
    name: 'Silver Screen',
    category: 'cinematic',
    cssFilter: 'contrast(1.2) brightness(1.03) saturate(0.55) sepia(0.1)',
    swatchGradient: 'from-zinc-400 to-slate-800',
  },

  // 4. Moody & Portrait (8)
  {
    id: 'espresso',
    name: 'Espresso',
    category: 'moody',
    cssFilter: 'contrast(1.16) brightness(0.93) saturate(0.85) sepia(0.28)',
    tintColor: 'rgba(70, 40, 20, 0.18)',
    swatchGradient: 'from-amber-900 to-stone-950',
  },
  {
    id: 'nordic_cold',
    name: 'Nordic Cold',
    category: 'moody',
    cssFilter: 'contrast(1.1) brightness(1.02) saturate(0.75) hue-rotate(8deg)',
    tintColor: 'rgba(130, 190, 235, 0.16)',
    swatchGradient: 'from-sky-600 to-slate-800',
  },
  {
    id: 'autumn_crisp',
    name: 'Autumn Crisp',
    category: 'moody',
    cssFilter: 'contrast(1.14) brightness(0.98) saturate(1.15) sepia(0.24)',
    tintColor: 'rgba(210, 95, 35, 0.15)',
    swatchGradient: 'from-orange-700 to-amber-900',
  },
  {
    id: 'deep_forest',
    name: 'Deep Forest',
    category: 'moody',
    cssFilter: 'contrast(1.18) brightness(0.92) saturate(0.88) hue-rotate(-10deg)',
    tintColor: 'rgba(15, 75, 50, 0.18)',
    swatchGradient: 'from-emerald-800 to-teal-950',
  },
  {
    id: 'amber_mood',
    name: 'Amber Mood',
    category: 'moody',
    cssFilter: 'contrast(1.12) brightness(0.96) saturate(1.18) sepia(0.32)',
    swatchGradient: 'from-amber-600 to-yellow-900',
  },
  {
    id: 'velvet_shadow',
    name: 'Velvet Shadow',
    category: 'moody',
    cssFilter: 'contrast(1.22) brightness(0.91) saturate(0.92)',
    tintColor: 'rgba(65, 25, 85, 0.16)',
    swatchGradient: 'from-purple-900 to-slate-950',
  },
  {
    id: 'mystic_fog',
    name: 'Mystic Fog',
    category: 'moody',
    cssFilter: 'contrast(0.88) brightness(1.06) saturate(0.72)',
    tintColor: 'rgba(195, 205, 220, 0.16)',
    swatchGradient: 'from-slate-400 to-slate-600',
  },
  {
    id: 'twilight_dusk',
    name: 'Twilight',
    category: 'moody',
    cssFilter: 'contrast(1.14) brightness(0.94) saturate(1.2) hue-rotate(15deg)',
    tintColor: 'rgba(90, 50, 150, 0.18)',
    swatchGradient: 'from-indigo-700 to-purple-900',
  },

  // 5. B&W & Monochrome (8)
  {
    id: 'bw_classic',
    name: 'Classic B&W',
    category: 'bw',
    cssFilter: 'grayscale(1) contrast(1.18) brightness(1.02)',
    swatchGradient: 'from-neutral-400 to-neutral-900',
  },
  {
    id: 'noir_contrast',
    name: 'High Contrast Noir',
    category: 'bw',
    cssFilter: 'grayscale(1) contrast(1.48) brightness(0.95)',
    swatchGradient: 'from-neutral-600 to-black',
  },
  {
    id: 'leica_mono',
    name: 'Leica Mono',
    category: 'bw',
    cssFilter: 'grayscale(1) contrast(1.28) brightness(1.01)',
    swatchGradient: 'from-zinc-300 to-zinc-900',
  },
  {
    id: 'platinum_bw',
    name: 'Platinum',
    category: 'bw',
    cssFilter: 'grayscale(1) contrast(1.1) brightness(1.08) sepia(0.08)',
    swatchGradient: 'from-stone-300 to-stone-700',
  },
  {
    id: 'charcoal_bw',
    name: 'Charcoal',
    category: 'bw',
    cssFilter: 'grayscale(1) contrast(1.32) brightness(0.88)',
    swatchGradient: 'from-neutral-700 to-neutral-950',
  },
  {
    id: 'silvertone',
    name: 'Silvertone',
    category: 'bw',
    cssFilter: 'grayscale(0.95) contrast(1.15) brightness(1.06)',
    tintColor: 'rgba(180, 200, 220, 0.1)',
    swatchGradient: 'from-slate-300 to-slate-700',
  },
  {
    id: 'newspaper',
    name: 'Newspaper',
    category: 'bw',
    cssFilter: 'grayscale(1) contrast(0.94) brightness(1.04) sepia(0.14)',
    swatchGradient: 'from-stone-400 to-zinc-700',
  },
  {
    id: 'infrared_bw',
    name: 'Infrared B&W',
    category: 'bw',
    cssFilter: 'grayscale(1) contrast(1.4) brightness(1.12)',
    swatchGradient: 'from-white to-neutral-900',
  },

  // 6. Cyber & Neon (8)
  {
    id: 'tokyo_night',
    name: 'Tokyo Night',
    category: 'cyber',
    cssFilter: 'brightness(1.03) contrast(1.2) saturate(1.45) hue-rotate(12deg)',
    tintColor: 'rgba(130, 60, 255, 0.18)',
    swatchGradient: 'from-fuchsia-600 to-indigo-800',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    category: 'cyber',
    cssFilter: 'brightness(1.05) contrast(1.24) saturate(1.55) hue-rotate(-14deg)',
    tintColor: 'rgba(0, 210, 255, 0.15)',
    swatchGradient: 'from-cyan-400 to-pink-600',
  },
  {
    id: 'synthwave',
    name: 'Synthwave',
    category: 'cyber',
    cssFilter: 'brightness(1.04) contrast(1.18) saturate(1.5) hue-rotate(-20deg)',
    tintColor: 'rgba(255, 40, 150, 0.18)',
    swatchGradient: 'from-pink-500 to-purple-800',
  },
  {
    id: 'vaporwave',
    name: 'Vaporwave',
    category: 'cyber',
    cssFilter: 'brightness(1.08) contrast(1.06) saturate(1.42) hue-rotate(25deg)',
    tintColor: 'rgba(160, 100, 255, 0.18)',
    swatchGradient: 'from-teal-300 to-fuchsia-500',
  },
  {
    id: 'electric_blue',
    name: 'Electric Blue',
    category: 'cyber',
    cssFilter: 'brightness(1.02) contrast(1.22) saturate(1.38) hue-rotate(18deg)',
    tintColor: 'rgba(0, 120, 255, 0.2)',
    swatchGradient: 'from-blue-400 to-indigo-700',
  },
  {
    id: 'laser_pink',
    name: 'Laser Pink',
    category: 'cyber',
    cssFilter: 'brightness(1.05) contrast(1.16) saturate(1.48) hue-rotate(-18deg)',
    tintColor: 'rgba(255, 20, 130, 0.18)',
    swatchGradient: 'from-rose-500 to-fuchsia-700',
  },
  {
    id: 'ultraviolet',
    name: 'Ultraviolet',
    category: 'cyber',
    cssFilter: 'brightness(1.01) contrast(1.2) saturate(1.42) hue-rotate(32deg)',
    tintColor: 'rgba(120, 20, 240, 0.22)',
    swatchGradient: 'from-violet-500 to-purple-900',
  },
  {
    id: 'matrix_glow',
    name: 'Matrix Glow',
    category: 'cyber',
    cssFilter: 'brightness(0.98) contrast(1.26) saturate(1.25) hue-rotate(-45deg)',
    tintColor: 'rgba(16, 185, 129, 0.2)',
    swatchGradient: 'from-emerald-400 to-green-900',
  },

  // 7. Nature & Travel (8)
  {
    id: 'tropical_lush',
    name: 'Tropical Lush',
    category: 'nature',
    cssFilter: 'brightness(1.04) contrast(1.12) saturate(1.42)',
    tintColor: 'rgba(16, 185, 129, 0.1)',
    swatchGradient: 'from-emerald-400 to-teal-600',
  },
  {
    id: 'amalfi_coast',
    name: 'Amalfi Coast',
    category: 'nature',
    cssFilter: 'brightness(1.07) contrast(1.08) saturate(1.34)',
    tintColor: 'rgba(56, 189, 248, 0.12)',
    swatchGradient: 'from-sky-400 to-amber-400',
  },
  {
    id: 'sahara_sun',
    name: 'Sahara Sun',
    category: 'nature',
    cssFilter: 'brightness(1.06) contrast(1.14) saturate(1.28) sepia(0.25)',
    tintColor: 'rgba(245, 158, 11, 0.16)',
    swatchGradient: 'from-amber-500 to-red-600',
  },
  {
    id: 'alpine_blue',
    name: 'Alpine Blue',
    category: 'nature',
    cssFilter: 'brightness(1.05) contrast(1.15) saturate(1.18) hue-rotate(6deg)',
    tintColor: 'rgba(14, 165, 233, 0.14)',
    swatchGradient: 'from-cyan-400 to-blue-700',
  },
  {
    id: 'rainforest',
    name: 'Rainforest',
    category: 'nature',
    cssFilter: 'brightness(0.98) contrast(1.16) saturate(1.32) hue-rotate(-8deg)',
    swatchGradient: 'from-green-600 to-emerald-900',
  },
  {
    id: 'santorini',
    name: 'Santorini',
    category: 'nature',
    cssFilter: 'brightness(1.1) contrast(1.12) saturate(1.26)',
    tintColor: 'rgba(37, 99, 235, 0.1)',
    swatchGradient: 'from-blue-400 to-sky-600',
  },
  {
    id: 'sunset_reef',
    name: 'Sunset Reef',
    category: 'nature',
    cssFilter: 'brightness(1.04) contrast(1.14) saturate(1.4) hue-rotate(-10deg)',
    tintColor: 'rgba(244, 63, 94, 0.14)',
    swatchGradient: 'from-rose-500 to-amber-500',
  },
  {
    id: 'canyon_red',
    name: 'Canyon Red',
    category: 'nature',
    cssFilter: 'brightness(1.02) contrast(1.2) saturate(1.35) sepia(0.2)',
    tintColor: 'rgba(220, 38, 38, 0.14)',
    swatchGradient: 'from-red-600 to-orange-700',
  },

  // 8. Artistic & Duotone (8)
  {
    id: 'pastel_dream',
    name: 'Pastel Dream',
    category: 'artistic',
    cssFilter: 'brightness(1.12) contrast(0.9) saturate(1.15)',
    tintColor: 'rgba(244, 114, 182, 0.16)',
    swatchGradient: 'from-pink-300 to-indigo-300',
  },
  {
    id: 'pop_art',
    name: 'Pop Art',
    category: 'artistic',
    cssFilter: 'brightness(1.05) contrast(1.42) saturate(1.75)',
    swatchGradient: 'from-yellow-400 to-pink-600',
  },
  {
    id: 'crimson_tide',
    name: 'Crimson Tide',
    category: 'artistic',
    cssFilter: 'contrast(1.22) brightness(0.96) saturate(1.3)',
    tintColor: 'rgba(225, 29, 72, 0.22)',
    swatchGradient: 'from-rose-600 to-red-900',
  },
  {
    id: 'emerald_haze',
    name: 'Emerald Haze',
    category: 'artistic',
    cssFilter: 'contrast(1.12) brightness(1.02) saturate(1.2)',
    tintColor: 'rgba(16, 185, 129, 0.2)',
    swatchGradient: 'from-emerald-400 to-teal-800',
  },
  {
    id: 'lavender_mist',
    name: 'Lavender Mist',
    category: 'artistic',
    cssFilter: 'brightness(1.07) contrast(0.96) saturate(1.18)',
    tintColor: 'rgba(168, 85, 247, 0.2)',
    swatchGradient: 'from-purple-400 to-fuchsia-600',
  },
  {
    id: 'gold_leaf',
    name: 'Gold Leaf',
    category: 'artistic',
    cssFilter: 'contrast(1.18) brightness(1.04) saturate(1.25) sepia(0.38)',
    tintColor: 'rgba(234, 179, 8, 0.2)',
    swatchGradient: 'from-yellow-400 to-amber-600',
  },
  {
    id: 'cyanotype',
    name: 'Cyanotype',
    category: 'artistic',
    cssFilter: 'grayscale(0.75) contrast(1.24) brightness(0.98)',
    tintColor: 'rgba(2, 132, 199, 0.28)',
    swatchGradient: 'from-sky-500 to-blue-900',
  },
  {
    id: 'lomography',
    name: 'Lomography',
    category: 'artistic',
    cssFilter: 'contrast(1.34) brightness(0.98) saturate(1.52)',
    tintColor: 'rgba(124, 58, 237, 0.12)',
    swatchGradient: 'from-violet-600 to-rose-500',
  },
];

// ============================================================================
// TEXT DESIGN TYPOGRAPHY TEMPLATES (With Randomizer / Shuffle Support)
// ============================================================================
export interface TextDesignTemplate {
  id: string;
  name: string;
  fontFamily: string;
  fontWeight: string;
  textTransform: 'none' | 'uppercase' | 'lowercase';
  letterSpacing: string;
  boxStyle: 'none' | 'solid_pill' | 'neon_outline' | 'flip_clock' | 'editorial_frame' | 'stamp_badge' | 'glass_banner' | 'shadow_pop';
  defaultColor: string;
  defaultBgColor: string;
  defaultTiltDeg: number;
  decorativePrefix?: string;
  decorativeSuffix?: string;
}

export const TEXT_DESIGN_TEMPLATES: TextDesignTemplate[] = [
  {
    id: 'bold_modern',
    name: 'Bold Modern',
    fontFamily: 'sans-serif',
    fontWeight: '900',
    textTransform: 'none',
    letterSpacing: '0.01em',
    boxStyle: 'none',
    defaultColor: '#60A5FA',
    defaultBgColor: 'transparent',
    defaultTiltDeg: 4,
  },
  {
    id: 'neon_club',
    name: 'Neon Glow',
    fontFamily: 'sans-serif',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    boxStyle: 'neon_outline',
    defaultColor: '#F472B6',
    defaultBgColor: 'rgba(236, 72, 153, 0.18)',
    defaultTiltDeg: -4,
    decorativePrefix: '✦ ',
    decorativeSuffix: ' ✦',
  },
  {
    id: 'flip_clock',
    name: 'Flip Clock',
    fontFamily: 'monospace',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    boxStyle: 'flip_clock',
    defaultColor: '#FFFFFF',
    defaultBgColor: 'rgba(90, 95, 105, 0.85)',
    defaultTiltDeg: -18,
  },
  {
    id: 'editorial_serif',
    name: 'Vogue Serif',
    fontFamily: 'Georgia, serif',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    boxStyle: 'editorial_frame',
    defaultColor: '#FEF08A',
    defaultBgColor: 'rgba(15, 23, 42, 0.72)',
    defaultTiltDeg: 0,
  },
  {
    id: 'street_pill',
    name: 'Streetwear',
    fontFamily: 'Impact, sans-serif',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    boxStyle: 'solid_pill',
    defaultColor: '#FFFFFF',
    defaultBgColor: '#E11D48',
    defaultTiltDeg: -3,
  },
  {
    id: 'shadow_pop',
    name: '3D Pop',
    fontFamily: 'sans-serif',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    boxStyle: 'shadow_pop',
    defaultColor: '#38BDF8',
    defaultBgColor: '#1E293B',
    defaultTiltDeg: 3,
  },
  {
    id: 'stamp_seal',
    name: 'Stamp Seal',
    fontFamily: 'monospace',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    boxStyle: 'stamp_badge',
    defaultColor: '#FBBF24',
    defaultBgColor: 'rgba(251, 191, 36, 0.14)',
    defaultTiltDeg: -8,
    decorativePrefix: '★ ',
    decorativeSuffix: ' ★',
  },
  {
    id: 'cinema_quote',
    name: 'Cinema Sub',
    fontFamily: 'sans-serif',
    fontWeight: '700',
    textTransform: 'none',
    letterSpacing: '0.03em',
    boxStyle: 'glass_banner',
    defaultColor: '#FDE047',
    defaultBgColor: 'rgba(0, 0, 0, 0.65)',
    defaultTiltDeg: 0,
    decorativePrefix: '“',
    decorativeSuffix: '”',
  },
  {
    id: 'script_dream',
    name: 'Dream Script',
    fontFamily: 'cursive, serif',
    fontWeight: '700',
    textTransform: 'none',
    letterSpacing: '0.02em',
    boxStyle: 'none',
    defaultColor: '#F9A8D4',
    defaultBgColor: 'transparent',
    defaultTiltDeg: -5,
    decorativePrefix: '✨ ',
    decorativeSuffix: ' ✨',
  },
  {
    id: 'cyber_tag',
    name: 'Cyber Tag',
    fontFamily: 'monospace',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: '0.09em',
    boxStyle: 'solid_pill',
    defaultColor: '#090D16',
    defaultBgColor: '#22D3EE',
    defaultTiltDeg: -2,
    decorativePrefix: '// ',
  },
  {
    id: 'emerald_luxe',
    name: 'Emerald Luxe',
    fontFamily: 'Georgia, serif',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    boxStyle: 'solid_pill',
    defaultColor: '#FFFFFF',
    defaultBgColor: '#10B981',
    defaultTiltDeg: 0,
  },
  {
    id: 'sunset_badge',
    name: 'Sunset Wave',
    fontFamily: 'sans-serif',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    boxStyle: 'solid_pill',
    defaultColor: '#FFFFFF',
    defaultBgColor: '#F97316',
    defaultTiltDeg: 5,
  },
];

export const EDITOR_COLOR_PALETTE: string[] = [
  '#FFFFFF',
  '#60A5FA',
  '#F472B6',
  '#FBBF24',
  '#34D399',
  '#A78BFA',
  '#F87171',
  '#22D3EE',
  '#FB923C',
  '#E11D48',
  '#10B981',
  '#0F172A',
];

// ============================================================================
// STICKER LIBRARY (Hats/Props including Pink Cowboy Hat from 36.jpg & 00 44 Clock, Emoticons, Shapes, Custom)
// ============================================================================
export type StickerCategory = 'props' | 'emoticons' | 'shapes' | 'custom';

export interface EditorStickerDefinition {
  id: string;
  name: string;
  category: StickerCategory;
  renderType: 'special_cowboy_hat' | 'special_flip_clock' | 'emoji' | 'shape_badge' | 'image_url';
  content: string;
  bgColor?: string;
  textColor?: string;
}

export const BUILTIN_EDITOR_STICKERS: EditorStickerDefinition[] = [
  // Props & Hats (matching 36.jpg Pink Cowboy Hat with Flower & Screenshot_20210725_004432.jpg 00 44 clock)
  {
    id: 'pink_cowboy_hat',
    name: 'Pink Cowboy Hat',
    category: 'props',
    renderType: 'special_cowboy_hat',
    content: '🤠🌸',
  },
  {
    id: 'flip_clock_0044',
    name: '00 44 Clock',
    category: 'props',
    renderType: 'special_flip_clock',
    content: '00 44',
  },
  { id: 'prop_crown', name: 'Royal Crown', category: 'props', renderType: 'emoji', content: '👑' },
  { id: 'prop_shades', name: 'Cool Shades', category: 'props', renderType: 'emoji', content: '🕶️' },
  { id: 'prop_hat_bow', name: 'Sun Hat', category: 'props', renderType: 'emoji', content: '👒' },
  { id: 'prop_tophat', name: 'Magic Hat', category: 'props', renderType: 'emoji', content: '🎩' },
  { id: 'prop_cap', name: 'Street Cap', category: 'props', renderType: 'emoji', content: '🧢' },
  { id: 'prop_butterfly', name: 'Butterfly', category: 'props', renderType: 'emoji', content: '🦋' },
  { id: 'prop_ribbon', name: 'Pink Bow', category: 'props', renderType: 'emoji', content: '🎀' },
  { id: 'prop_lips', name: 'Glam Kiss', category: 'props', renderType: 'emoji', content: '💋' },
  { id: 'prop_headphones', name: 'Headphones', category: 'props', renderType: 'emoji', content: '🎧' },
  { id: 'prop_camera', name: 'Flash Cam', category: 'props', renderType: 'emoji', content: '📸' },

  // Emoticons (24)
  { id: 'emo_1', name: 'Heart Eyes', category: 'emoticons', renderType: 'emoji', content: '😍' },
  { id: 'emo_2', name: 'Star Struck', category: 'emoticons', renderType: 'emoji', content: '🤩' },
  { id: 'emo_3', name: 'Fire', category: 'emoticons', renderType: 'emoji', content: '🔥' },
  { id: 'emo_4', name: 'Sparkles', category: 'emoticons', renderType: 'emoji', content: '✨' },
  { id: 'emo_5', name: 'Pink Heart', category: 'emoticons', renderType: 'emoji', content: '💖' },
  { id: 'emo_6', name: '100', category: 'emoticons', renderType: 'emoji', content: '💯' },
  { id: 'emo_7', name: 'Cool', category: 'emoticons', renderType: 'emoji', content: '😎' },
  { id: 'emo_8', name: 'Party', category: 'emoticons', renderType: 'emoji', content: '🥳' },
  { id: 'emo_9', name: 'Laugh', category: 'emoticons', renderType: 'emoji', content: '😂' },
  { id: 'emo_10', name: 'Wink Kiss', category: 'emoticons', renderType: 'emoji', content: '😘' },
  { id: 'emo_11', name: 'Mind Blown', category: 'emoticons', renderType: 'emoji', content: '🤯' },
  { id: 'emo_12', name: 'Angel', category: 'emoticons', renderType: 'emoji', content: '😇' },
  { id: 'emo_13', name: 'Devil', category: 'emoticons', renderType: 'emoji', content: '😈' },
  { id: 'emo_14', name: 'Cat Love', category: 'emoticons', renderType: 'emoji', content: '😻' },
  { id: 'emo_15', name: 'Unicorn', category: 'emoticons', renderType: 'emoji', content: '🦄' },
  { id: 'emo_16', name: 'Rainbow', category: 'emoticons', renderType: 'emoji', content: '🌈' },
  { id: 'emo_17', name: 'Lightning', category: 'emoticons', renderType: 'emoji', content: '⚡' },
  { id: 'emo_18', name: 'Diamond', category: 'emoticons', renderType: 'emoji', content: '💎' },
  { id: 'emo_19', name: 'Cherry', category: 'emoticons', renderType: 'emoji', content: '🍒' },
  { id: 'emo_20', name: 'Rose', category: 'emoticons', renderType: 'emoji', content: '🌹' },

  // Shapes & Badges (12)
  {
    id: 'shape_love',
    name: 'LOVE Badge',
    category: 'shapes',
    renderType: 'shape_badge',
    content: '♥ LOVE',
    bgColor: '#EC4899',
    textColor: '#FFFFFF',
  },
  {
    id: 'shape_live',
    name: 'LIVE Stamp',
    category: 'shapes',
    renderType: 'shape_badge',
    content: '● LIVE',
    bgColor: '#E11D48',
    textColor: '#FFFFFF',
  },
  {
    id: 'shape_vip',
    name: 'VIP Gold',
    category: 'shapes',
    renderType: 'shape_badge',
    content: '★ VIP ★',
    bgColor: '#F59E0B',
    textColor: '#0F172A',
  },
  {
    id: 'shape_new',
    name: 'NEW Drop',
    category: 'shapes',
    renderType: 'shape_badge',
    content: '⚡ NEW',
    bgColor: '#3B82F6',
    textColor: '#FFFFFF',
  },
  {
    id: 'shape_vibes',
    name: 'Good Vibes',
    category: 'shapes',
    renderType: 'shape_badge',
    content: '✨ GOOD VIBES',
    bgColor: '#8B5CF6',
    textColor: '#FFFFFF',
  },
  {
    id: 'shape_mood',
    name: 'MOOD Tag',
    category: 'shapes',
    renderType: 'shape_badge',
    content: '#MOOD',
    bgColor: '#10B981',
    textColor: '#FFFFFF',
  },
  {
    id: 'shape_star',
    name: 'Gold Star',
    category: 'shapes',
    renderType: 'emoji',
    content: '⭐',
  },
  {
    id: 'shape_burst',
    name: 'Boom Burst',
    category: 'shapes',
    renderType: 'emoji',
    content: '💥',
  },
  {
    id: 'shape_speech',
    name: 'Speech Bubble',
    category: 'shapes',
    renderType: 'emoji',
    content: '💬',
  },
  {
    id: 'shape_thought',
    name: 'Thought Cloud',
    category: 'shapes',
    renderType: 'emoji',
    content: '💭',
  },
];

const CUSTOM_EDITOR_STICKERS_KEY = 'freedom_custom_editor_stickers_v1';

export function getSavedCustomEditorStickers(): EditorStickerDefinition[] {
  try {
    const raw = localStorage.getItem(CUSTOM_EDITOR_STICKERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function addCustomEditorSticker(sticker: EditorStickerDefinition): EditorStickerDefinition[] {
  const current = getSavedCustomEditorStickers();
  const updated = [sticker, ...current.filter((s) => s.id !== sticker.id)];
  try {
    localStorage.setItem(CUSTOM_EDITOR_STICKERS_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

export function removeCustomEditorSticker(id: string): EditorStickerDefinition[] {
  const current = getSavedCustomEditorStickers();
  const updated = current.filter((s) => s.id !== id);
  try {
    localStorage.setItem(CUSTOM_EDITOR_STICKERS_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}
