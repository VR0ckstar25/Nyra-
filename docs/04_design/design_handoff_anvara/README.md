# Handoff: Anvara — Selectable Color Themes

## Overview
This package delivers a **user-selectable theme system** for Anvara. The end user picks
**one Background** and **one Accent** from a curated set
of options; everything else in the palette is fixed because it carries product/legal meaning.

The headline deliverable is **`theme-presets.js`** — the exact, curated color options,
ready to wire into a settings/appearance picker. The HTML files are design references
showing how the themes look in context.

## About the design files
The `.html` / `.jsx` files in this bundle are **design references created in HTML** — working
prototypes of the intended look and behavior, **not** production code to copy verbatim.
Recreate them in the target codebase using its existing framework and patterns (React, Vue,
SwiftUI, etc.). If no environment exists yet, pick the most appropriate framework and build there.
In the prototype the themes are applied by mutating shared JS tokens; in production, prefer the
**CSS-variable approach** shown in `theme-presets.js` (`applyTheme()`).

## Fidelity
**High-fidelity.** Colors are final and exact (hex values below). Spacing/typography in the
prototype are representative; match them to the target design system where one exists.

---

## ⭐ The color options (the deliverable)

The picker has **two independent controls**. Default = **Sky + Cobalt**.

### Background options — tuple maps to `[--bg, --bg-deep, --surface-warm]`
| Key | Label | `--bg` (page) | `--bg-deep` (stripes/wells) | `--surface-warm` (soft cards) |
|-----|-------|---------------|------------------------------|-------------------------------|
| `sky` *(default)* | Sky | `#E9F3FB` | `#D6E8F6` | `#F4FAFE` |
| `mint` | Mint | `#E6F5EE` | `#D2EBDF` | `#F2FBF7` |
| `lemon` | Lemon | `#FBF6DD` | `#F3EAC2` | `#FEFBEC` |
| `lavender` | Lavender | `#F1ECFB` | `#E2D8F4` | `#F8F4FD` |
| `blossom` | Blossom | `#FCEDF3` | `#F6DCE7` | `#FEF5F8` |

### Accent options — tuple maps to `[--accent, --accent-deep, --accent-soft, --accent-tint]`
| Key | Label | `--accent` (CTAs/selection) | `--accent-deep` (pressed) | `--accent-soft` (fills) | `--accent-tint` (wash) |
|-----|-------|------------------------------|----------------------------|--------------------------|-------------------------|
| `cobalt` *(default)* | Cobalt | `#3360CE` | `#284BA0` | `#DFE7F7` | `#F0F4FC` |
| `turquoise` | Turquoise | `#0EA5A2` | `#0B8280` | `#D5F0EF` | `#EBF8F7` |
| `fuchsia` | Fuchsia | `#D6398A` | `#AC2C6E` | `#FAE0EE` | `#FDF0F7` |
| `grape` | Grape | `#8139C2` | `#66299E` | `#EFE0F8` | `#F7F0FB` |

Any background × any accent is a valid combination (4 × 5 = 20 looks). Persist the user's
two keys (e.g. `{ background: 'blossom', accent: 'fuchsia' }`) and re-apply on launch.

### Where the accent is used
Primary buttons, selected states, links, the calendar "today" cell, progress/processing,
profile-avatar rings, active tab, and toggles (ON = `--accent`, never green/red).

---

## 🔒 Fixed tokens — NOT user-selectable
These must never appear in the theme picker. They encode meaning, not taste.

- **Text / lines:** ink `#222932`, ink-2 `#5C6471`, ink-3 `#97A1AE`, surface `#FFFFFF`, line `#E2E8EF`, line-soft `#EDF1F6`
- **Universal "finding present" indicator:** filled **amber** dot `#E89318` — on *every* match bar
- **Semantic match-bar tints (category only — never good/bad):**
  - Allergen — tint `#FDEBC9`, border `#F4CE83`, strong `#D2870F`, label `#96640F`
  - Intolerance — tint `#FBE2CC`, border `#F1C198`, strong `#CA6A2C`, label `#A1531F`
  - Goal — tint `#E7E9F1`, border `#CCD1E0`, strong `#6A7396`, label `#4D5772`
  - Could-not-verify ingredients — neutral gray text `#8E857A`, no bar, no color indicator

### Hard constraints (non-negotiable, from the product spec)
- **No red and no green anywhere.** Green reads "safe to eat"; red reads "danger." Both are
  verdicts the app must never issue. (This is also why the curated accent options deliberately
  exclude red/green hues.)
- **No score, grade, rating, or binary safe/unsafe indicator.**
- Findings are communicated by **presence** (amber dot + category tint + text label), never by a
  verdict color. Color is always backed by a text label so the UI is colorblind-safe.
- Keep contrast accessible: body text on every background option stays well above WCAG AA.

---

## Typography (reference)
- **Display / emotional moments:** Source Serif 4 (600)
- **All functional UI:** Hanken Grotesk (400–800) — common ingredient name always larger than the technical name; technical name only in parentheses directly below, on results & logs
- **Monospace (dates, placeholders):** Spline Sans Mono

## Files in this bundle
- `theme-presets.js` — **the color options + `applyTheme()` helper** (the deliverable)
- `Anvara - Flow.html` — interactive flow reference (Diary, Scan, Processing, Result, Profiles)
- `app/theme.jsx` — prototype tokens + shared atoms
- `app/result.jsx`, `app/screens-result.jsx` — the Result screen (core surface)
- `app/onboarding.jsx`, `app/screens-app.jsx` — onboarding, Diary, Patterns, Profiles
- `tweaks-panel.jsx` — the in-prototype picker used to preview themes (reference only)

## Implementation notes
1. Build a settings/appearance screen with two pickers (Background, Accent) sourced from
   `BACKGROUND_PRESETS` / `ACCENT_PRESETS`.
2. Render each option as a swatch (the first 1–2 colors of its tuple read well as a chip).
3. On selection, call `applyTheme(root, bgKey, accentKey)` and persist the two keys.
4. Map all component colors to the CSS variables — never hardcode the themeable ones.
5. Leave the fixed tokens as constants; do not route them through the picker.
