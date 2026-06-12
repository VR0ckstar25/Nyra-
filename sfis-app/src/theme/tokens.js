// tokens.js — single source of truth for all colors. NO CSS variables in RN;
// the whole app reads from one theme object handed down by ThemeProvider.
// THEMEABLE = user picks Background + Accent (20 combos). FIXED = safety/legal,
// never themed (amber finding dot, category tints, ink/lines). No red, no green.

export const BACKGROUND_PRESETS = {
  sky:      { label: 'Sky',      bg: '#E9F3FB', bgDeep: '#D6E8F6', surfaceWarm: '#F4FAFE' },
  mint:     { label: 'Mint',     bg: '#E6F5EE', bgDeep: '#D2EBDF', surfaceWarm: '#F2FBF7' },
  lemon:    { label: 'Lemon',    bg: '#FBF6DD', bgDeep: '#F3EAC2', surfaceWarm: '#FEFBEC' },
  lavender: { label: 'Lavender', bg: '#F1ECFB', bgDeep: '#E2D8F4', surfaceWarm: '#F8F4FD' },
  blossom:  { label: 'Blossom',  bg: '#FCEDF3', bgDeep: '#F6DCE7', surfaceWarm: '#FEF5F8' },
};

export const ACCENT_PRESETS = {
  cobalt:    { label: 'Cobalt',    accent: '#3360CE', accentDeep: '#284BA0', accentSoft: '#DFE7F7', accentTint: '#F0F4FC' },
  turquoise: { label: 'Turquoise', accent: '#0EA5A2', accentDeep: '#0B8280', accentSoft: '#D5F0EF', accentTint: '#EBF8F7' },
  fuchsia:   { label: 'Fuchsia',   accent: '#D6398A', accentDeep: '#AC2C6E', accentSoft: '#FAE0EE', accentTint: '#FDF0F7' },
  grape:     { label: 'Grape',     accent: '#8139C2', accentDeep: '#66299E', accentSoft: '#EFE0F8', accentTint: '#F7F0FB' },
};

export const DEFAULT_THEME = { background: 'blossom', accent: 'fuchsia' };

// FIXED tokens — DO NOT expose to the picker. Meaning, not taste.
export const FIXED = {
  surface:  '#FFFFFF',
  onAccent: '#FBF7EF',
  ink:      '#222932',
  ink2:     '#5C6471',
  ink3:     '#97A1AE',
  line:     '#E2E8EF',
  lineSoft: '#EDF1F6',
  amber:    '#E89318',   // universal "finding present" dot — every match bar
  allergen:    { tint: '#FDEBC9', edge: '#F4CE83', strong: '#D2870F', ink: '#7E5410', label: '#96640F' },
  intolerance: { tint: '#FBE2CC', edge: '#F1C198', strong: '#CA6A2C', ink: '#7E3E1A', label: '#A1531F' },
  diet:        { tint: '#E9E4F3', edge: '#D2C8E6', strong: '#765C9C', ink: '#4F3F68', label: '#5F4C7A' },
  goal:        { tint: '#E7E9F1', edge: '#CCD1E0', strong: '#6A7396', ink: '#414B66', label: '#4D5772' },
  unknownInk:  '#8E857A',
  // Fonts intentionally use system defaults in the prototype (custom fonts =
  // polish step via expo-font). Leaving undefined → clean system font, no crash.
  serif: undefined,
  sans:  undefined,
  mono:  undefined,
  radius: 18,
};

export function buildTheme(backgroundKey = DEFAULT_THEME.background, accentKey = DEFAULT_THEME.accent) {
  const bg = BACKGROUND_PRESETS[backgroundKey] || BACKGROUND_PRESETS.sky;
  const ac = ACCENT_PRESETS[accentKey] || ACCENT_PRESETS.cobalt;
  return {
    ...FIXED,
    bg: bg.bg, bgDeep: bg.bgDeep, surfaceWarm: bg.surfaceWarm,
    accent: ac.accent, accentDeep: ac.accentDeep, accentSoft: ac.accentSoft, accentTint: ac.accentTint,
  };
}
