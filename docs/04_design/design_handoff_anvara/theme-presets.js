// theme-presets.js
// Anvara — selectable color themes.
//
// HOW THIS WORKS
// The user picks ONE background option + ONE accent option. Everything else
// (the semantic "finding" colors, ink, hairlines) is FIXED and must not be
// themed — those colors carry legal/safety meaning (see CONSTRAINTS below).
//
// Each value is a tuple so it maps cleanly onto CSS variables:
//   background → [--bg, --bg-deep, --surface-warm]
//   accent     → [--accent, --accent-deep, --accent-soft, --accent-tint]

export const BACKGROUND_PRESETS = {
  sky:      { label: 'Sky',      value: ['#E9F3FB', '#D6E8F6', '#F4FAFE'] }, // default
  mint:     { label: 'Mint',     value: ['#E6F5EE', '#D2EBDF', '#F2FBF7'] },
  lemon:    { label: 'Lemon',    value: ['#FBF6DD', '#F3EAC2', '#FEFBEC'] },
  lavender: { label: 'Lavender', value: ['#F1ECFB', '#E2D8F4', '#F8F4FD'] },
  blossom:  { label: 'Blossom',  value: ['#FCEDF3', '#F6DCE7', '#FEF5F8'] },
};

export const ACCENT_PRESETS = {
  cobalt:    { label: 'Cobalt',    value: ['#3360CE', '#284BA0', '#DFE7F7', '#F0F4FC'] }, // default
  turquoise: { label: 'Turquoise', value: ['#0EA5A2', '#0B8280', '#D5F0EF', '#EBF8F7'] },
  fuchsia:   { label: 'Fuchsia',   value: ['#D6398A', '#AC2C6E', '#FAE0EE', '#FDF0F7'] },
  grape:     { label: 'Grape',     value: ['#8139C2', '#66299E', '#EFE0F8', '#F7F0FB'] },
};

export const DEFAULT_THEME = { background: 'sky', accent: 'cobalt' };

// ─────────────────────────────────────────────────────────────────────────
// FIXED TOKENS — DO NOT expose these to the theme picker.
// The amber dot + the three semantic tints encode meaning, not taste.
// CONSTRAINTS: never red, never green, no scores, no safe/unsafe verdict.
// ─────────────────────────────────────────────────────────────────────────
export const FIXED_TOKENS = {
  surface: '#FFFFFF',
  ink:     '#222932',  // primary text (cool near-black)
  ink2:    '#5C6471',  // secondary text
  ink3:    '#97A1AE',  // tertiary / placeholder
  line:    '#E2E8EF',  // hairline
  lineSoft:'#EDF1F6',

  // Universal "finding present" indicator — appears on EVERY match bar.
  amber: '#E89318',

  // Semantic match-bar palettes (tint bg / border / strong / label text).
  // Bar TINT differentiates the category; it never implies good/bad.
  allergen:    { tint: '#FDEBC9', edge: '#F4CE83', strong: '#D2870F', ink: '#7E5410', label: '#96640F' },
  intolerance: { tint: '#FBE2CC', edge: '#F1C198', strong: '#CA6A2C', ink: '#7E3E1A', label: '#A1531F' },
  goal:        { tint: '#E7E9F1', edge: '#CCD1E0', strong: '#6A7396', ink: '#414B66', label: '#4D5772' },
  unknownInk:  '#8E857A', // "Could not verify" ingredients — neutral gray text, no bar
};

// ─────────────────────────────────────────────────────────────────────────
// Apply a chosen theme by writing CSS variables on a root element.
// Usage: applyTheme(document.documentElement, 'blossom', 'fuchsia')
// ─────────────────────────────────────────────────────────────────────────
export function applyTheme(el, backgroundKey = DEFAULT_THEME.background, accentKey = DEFAULT_THEME.accent) {
  const bg = (BACKGROUND_PRESETS[backgroundKey] || BACKGROUND_PRESETS.sky).value;
  const ac = (ACCENT_PRESETS[accentKey] || ACCENT_PRESETS.cobalt).value;
  el.style.setProperty('--bg', bg[0]);
  el.style.setProperty('--bg-deep', bg[1]);
  el.style.setProperty('--surface-warm', bg[2]);
  el.style.setProperty('--accent', ac[0]);
  el.style.setProperty('--accent-deep', ac[1]);
  el.style.setProperty('--accent-soft', ac[2]);
  el.style.setProperty('--accent-tint', ac[3]);
}
