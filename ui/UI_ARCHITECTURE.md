# UI Architecture & Theming Baseline

> **NON-AUTHORITATIVE (archived).** The production app is `sfis-app/` (React Native + Expo).
> This document described an early HTML prototype tree and is kept for reference only.

~~The replication baseline for the whole app.~~ (superseded) Build every screen against this so the
look stays consistent and the user's color choice flows everywhere automatically.

## The CSS decision (plain English)

The design handoff prototypes are **web** and switch colors using *CSS variables* —
a browser-only feature. Our app is **React Native + Expo** (the locked stack), which
has no CSS variables. Rather than hack one in, we use the idiomatic and better
approach: **one central color dictionary the whole app reads from** (a "theme
provider").

How it works: the user picks a Background + Accent → we rebuild the dictionary →
every screen recolors **instantly, no reload, fully offline**, and the choice is
remembered next launch. Why this is the right call for the product:

- **Feels premium & instant** — taps recolor the live preview immediately.
- **One source of truth** — no screen can drift to an off-brand color; the fixed
  safety colors (amber dot, allergen tints) are physically separated so they can
  never be themed by accident.
- **Marketing/appeal** — 20 personal looks is a cheap, delightful differentiator
  that builds ownership and retention; the defaults stay on-brand (Sky + Cobalt).
- **Cheap & robust** — no extra library, testable, works with no network.

## Files (the baseline)

| File | Role |
|---|---|
| `ui/theme/tokens.js` | All colors. `BACKGROUND_PRESETS` / `ACCENT_PRESETS` (themeable) + `FIXED` (never themed) + `buildTheme()` |
| `ui/theme/ThemeProvider.jsx` | Holds the chosen theme, persists it (AsyncStorage), re-applies on launch. Exposes `useTheme()` |
| `ui/screens/AppearanceScreen.jsx` | Settings → Appearance: the two pickers + a live preview |
| `ui/components/MatchBar.jsx` | Result atom: amber dot, category tint, Contains / May contain, family tags |
| `ui/screens/ResultScreen.jsx` | Composed result surface: bars → Could-not-verify → footer disclaimer |

## The rule every screen follows

```jsx
import { useTheme } from '../theme/ThemeProvider';

function AnyScreen() {
  const { theme: t } = useTheme();
  return (
    <View style={{ backgroundColor: t.bg }}>
      <Pressable style={{ backgroundColor: t.accent }}>
        <Text style={{ color: t.onAccent }}>Primary action</Text>
      </Pressable>
    </View>
  );
}
```

- **Themeable** (route through `useTheme`): `bg`, `bgDeep`, `surfaceWarm`,
  `accent`, `accentDeep`, `accentSoft`, `accentTint`.
- **Fixed** (use as-is, never themed): `surface`, `ink/ink2/ink3`, `line`,
  `amber`, `allergen/intolerance/goal` tints, `unknownInk`.
- **Never** hardcode a themeable hex in a screen. Findings are always amber +
  category tint + a text label (colorblind-safe). No red, no green, anywhere.

## Wrap the app once

```jsx
<ThemeProvider fallback={<Splash />}>
  <AppNavigator />
</ThemeProvider>
```

## Porting the prototype screens → RN

The handoff `.jsx`/`.html` are **visual reference, not code to copy**. To rebuild
each prototype screen:
1. Swap web tags for RN primitives: `div→View`, `span/p→Text`, `button→Pressable`,
   scrolling containers → `ScrollView`/`FlatList`. RN has no `className`; styles are
   objects.
2. Replace every hardcoded color with the matching `t.*` token.
3. Replace CSS `@keyframes` with `Animated`/Reanimated; box-shadow → RN `shadow*`/
   `elevation`.
4. Fonts: load Source Serif 4 / Hanken Grotesk / Spline Sans Mono via `expo-font`
   (names already in `FIXED`).

## Result screen — the agreed model (see database/match_semantics.md)

- Findings = **match bars**, one per category that has something. Clean
  category = **no bar** (absence = nothing found; no "not detected" label, no score).
- **Style: minimal** — crisp white card + a bold category rail + the universal amber
  dot (not a soft pastel fill). Defined, but never alarming/gamified (Design Note).
  **This is a founder decision (2026-06-05) that supersedes Design Note §4/§6.1's
  "warm amber bar" tint treatment** — recorded so the build and the spec agree.
  Category is still differentiated (rail + label color); intolerance keeps a
  visually distinct + BETA treatment from allergens.
- Inside a bar, wording carries the only distinction: **"Contains [X]"** (definite,
  in the ingredient list) vs **"May contain [X]"** (conditional — refined oils,
  lecithin; **and precautionary/cross-contact labelling**: "may contain…", "made in
  a facility that also processes…"). Same amber, same category color, **no confidence
  meter, no good/bad color**.
- Unidentified ingredients stay in the gray **"Could not verify"** section.

## Gap map (what this baseline covers vs what's left)

| Area | Status |
|---|---|
| Theme system + Appearance picker | ✅ built here |
| Result-screen color/wording model | ✅ baseline built (`MatchBar.jsx` + `ResultScreen.jsx`) to match_semantics.md |
| Onboarding (Welcome, Email, Severity, profile Qs) | 🟡 prototype exists — port to RN |
| **Username, Recovery-phrase** onboarding screens | ❌ not designed — build |
| **Tutorial scan** (Sunshine Oat Cookies) | ❌ not designed — build |
| **Subscription / paywall / loyalty / billing** | ❌ not designed — build |
| Full **Settings** hierarchy (§11.3) incl. Appearance row | 🟡 partial — Appearance now exists; wire the rest |
| Diary/Calendar, Patterns, Profiles/Family | 🟡 prototype exists — port to RN |
