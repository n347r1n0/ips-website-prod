// frontend/src/ui/skins/wheels/pokerSkin.presets.js

// 🎨 Палитры кольца (только цвета/альфы).
export const PALETTES = {
  glassRedIvory: {
    red:  'color-mix(in oklab, var(--brand-crimson, #EE2346) 78%, black)',
    ivory:'color-mix(in oklab, white 92%, var(--bg-0, #0B0D12) 8%)',
    tintAlphaRed:   0.46,
    tintAlphaIvory: 0.20,
    baseDark:  'var(--bg-2, #141A22)',
    baseDark2: 'var(--bg-0, #0B0D12)',
  },

  titanium: {
    red:   'color-mix(in oklab, #9b1e2b 78%, black)',
    ivory: 'color-mix(in oklab, #d9dde3 88%, #0B0D12 12%)',
    tintAlphaRed:   0.35,
    tintAlphaIvory: 0.26,
    baseDark:  'color-mix(in oklab, #0E1218 80%, #1a1f27 20%)',
    baseDark2: 'color-mix(in oklab, #06090d 85%, #131821 15%)',
  },

  silver: {
    red:   'color-mix(in oklab, #b22335 70%, black)',
    ivory: 'color-mix(in oklab, #f3f5f7 96%, #0B0D12 4%)',
    tintAlphaRed:   0.32,
    tintAlphaIvory: 0.18,
    baseDark:  '#1b1f26',
    baseDark2: '#0b0f14',
  },
};

// ⚙️ Варианты центра (чаши).
//  bowl  — привычная «вогнутая» чашка.
//  bezel — яркая светлая кромка-обод, на которую падает тень от центрального диска.
export const CENTERS = {
  bowl:  { innerR: 0.30, rimThickness: 0.042, glowOpacity: 0.80, style: 'bowl'  },
  bezel: { innerR: 0.30, rimThickness: 0.050, glowOpacity: 0.80, style: 'bezel' },
};

// 🚚 Утилита с дефолтами
export function resolvePresets(p) {
  const palette = PALETTES[p?.palette] || PALETTES.titanium;
  const center  = CENTERS[p?.center]    || CENTERS.bowl;
  return { palette, center };
}
