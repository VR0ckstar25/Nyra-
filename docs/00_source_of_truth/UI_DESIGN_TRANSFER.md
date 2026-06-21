# Nyara — UI Design Transfer Note

Hand-off for a designer (or a design-focused Claude) to recreate or evolve Nyara's UI at
high fidelity. Everything here is pulled from the live app (`sfis-app/src/theme/tokens.js`,
`src/components/DesignPrimitives.jsx`, `src/screens/*`). Build from the principles first —
they constrain every visual choice.

---
## 0. What Nyara is (and the one rule that shapes the whole UI)
A calm, private, family-aware **food-label scanner**. You scan a packaged-food ingredients
list; Nyara reflects what's inside against a personal watchlist (allergies / intolerances /
diet / goals).

**THE MIRROR PRINCIPLE — non-negotiable design law:** Nyara is a *mirror, not a judge*.
- **No verdicts.** Never "safe / unsafe", never a score, never a grade.
- **No red, no green.** Those colors imply a verdict. The palette is deliberately warm/neutral
  with a single **amber** "finding present" dot.
- **Three honest outcomes only:** **Contains** · **May contain** · **Could not verify**.
- **Admit uncertainty loudly** (draft data, English-only, OCR can miss). Honesty is phrased as
  confidence, not apology.
- **No mascot. No fear imagery. No dark patterns.** The user always makes the call.

Tagline voice: *"Shop with a little less worry."* Calm, plain, reassuring, benefit-led.

---
## 1. Color system
Two layers: **themeable** (user picks Background × Accent, 5×4 = 20 combos) and **fixed**
(safety/legibility — never themed). NO red, NO green anywhere.

### Themeable — Backgrounds (pick one)
| key | bg | bgDeep | surfaceWarm |
|---|---|---|---|
| Sky | #E9F3FB | #D6E8F6 | #F4FAFE |
| Mint | #E6F5EE | #D2EBDF | #F2FBF7 |
| Lemon | #FBF6DD | #F3EAC2 | #FEFBEC |
| Lavender | #F1ECFB | #E2D8F4 | #F8F4FD |
| **Blossom (default)** | **#FCEDF3** | #F6DCE7 | #FEF5F8 |

### Themeable — Accents (pick one)
| key | accent | accentDeep | accentSoft | accentTint |
|---|---|---|---|---|
| Cobalt | #3360CE | #284BA0 | #DFE7F7 | #F0F4FC |
| Turquoise | #0EA5A2 | #0B8280 | #D5F0EF | #EBF8F7 |
| **Fuchsia (default)** | **#D6398A** | #AC2C6E | #FAE0EE | #FDF0F7 |
| Grape | #8139C2 | #66299E | #EFE0F8 | #F7F0FB |

**Default brand = Blossom + Fuchsia.** Splash/adaptive-icon bg = `#FCEDF3`.

### Fixed tokens (never themed — meaning, not taste)
- surface `#FFFFFF` · onAccent `#FBF7EF` (text/icon on accent fills)
- ink `#222932` · ink2 `#5C6471` · ink3 `#97A1AE` (primary / secondary / tertiary text)
- line `#E2E8EF` · lineSoft `#EDF1F6` (borders / dividers)
- **amber `#E89318`** — the universal "finding present" dot on every match bar. The only
  "attention" color in the app.
- **Category tints** (used for chips/pills/finding bars, by domain — warm, never red/green):
  - allergen: tint `#FDEBC9` · edge `#F4CE83` · strong `#D2870F` · ink `#7E5410` · label `#96640F`
  - intolerance: tint `#FBE2CC` · edge `#F1C198` · strong `#CA6A2C` · ink `#7E3E1A` · label `#A1531F`
  - diet: tint `#E9E4F3` · edge `#D2C8E6` · strong `#765C9C` · ink `#4F3F68` · label `#5F4C7A`
  - goal: tint `#E7E9F1` · edge `#CCD1E0` · strong `#6A7396` · ink `#414B66` · label `#4D5772`
- unknownInk `#8E857A` (for "could not verify").

---
## 2. Typography
Three roles. **Intended brand fonts** (currently system fallback; load via expo-font):
- **serif** → Source Serif 4 — screen titles, wordmark, big reassuring statements.
- **sans** → Hanken Grotesk — body, buttons, chips, most UI text.
- **mono** → Spline Sans Mono — overlines, metadata, "data current as of" stamps.

Observed scale (px / weight):
- Screen title (serif) 23–34, weight 600, lineHeight ~1.2.
- Welcome/hero statement (serif) 34, weight 600.
- Body (sans) 13.5–15.5, weight 400–600, lineHeight ~1.4.
- Overline (mono) 11, weight 700, uppercase, used as section/eyebrow labels.
- Primary button label (sans) 15.5 weight 800; Secondary 15 weight 700.
- Chip (sans) 14 (compact 12.5), weight 600 (selected 800).
- Metadata/notes (sans/mono) 11–12.5, ink3.

---
## 3. Spacing, shape, elevation
- Base radius `18` (cards). Buttons radius `14`. Chips/pills/switch `999` (full).
- Screen padding 18–22. Card padding 16–18. Inter-card gap 14–18. Chip gap 9.
- Elevation: cards = 1px `line` border + white surface (mostly flat). The **camera CTA** and
  the active **primary button** get a soft accent shadow (shadowOpacity ~0.16–0.18, radius 12–16,
  offset y 6–8) — the only real elevation, to pull the eye to the main action.

---
## 4. Components (specs from DesignPrimitives.jsx)
- **Wordmark** — "Nyara" in serif + a small **fuchsia dot (tittle)** to the lower-right; the dot
  nods to the amber finding-dot without implying a verdict. No icon/logo mark beyond this.
- **ScreenIntro** — serif title (23) + sans sub (13.2, ink2) + optional right-side slot (e.g. a
  count pill). Top of nearly every screen.
- **Overline** — mono 11, uppercase, section/eyebrow label.
- **Card** — white surface, radius 18, 1px line border. The default container.
- **PrimaryButton** — minHeight 52, radius 14, accent fill, onAccent label (800). Disabled →
  lineSoft fill + ink3 label.
- **SecondaryButton** — minHeight 48, radius 14, surface fill, 1px line, accentDeep label (700).
- **Chip** — pill (radius 999), surface default / category-tint when selected; label 14, weight
  600→800 selected. Used for watchlist selection.
- **Pill** — small status tag, radius 999, height 26, category-tinted.
- **ProgressBar** — height 8, radius 999, lineSoft track + accent fill.
- **SwitchPill** — 48×30 toggle, accent when on, line when off, white knob.
- **MatchBar** — one finding row: verb (Contains/May/Could-not-verify) + item name + **amber dot**
  + chevron → opens detail sheet. Category-tinted.
- **HouseAdCard** — free-tier house message (megaphone icon, eyebrow "Nyara Free", title, body,
  "View plans"). Only on Home/Diary/Patterns — NEVER on Result/Camera.
- **BottomTabs** — 4 icon tabs: Home, Scan, Patterns, Profile. Active = accent.

---
## 5. Screens (layout + states)
Build each from a ScreenIntro + Cards. States that must be designed are called out.

**First-run flow:** Welcome → Intro (3 slides) → Policy → Sign-in/Local → Intent → Watchlist →
Credibility → Sample result → How-it-works → Getting-ready → Home.

1. **Welcome** — centered: Wordmark, serif hero ("Shop with a little less worry."), sub
   ("We reflect what's inside against what you care about — no verdicts."), PrimaryButton
   "Get started", SecondaryButton "I already have an account".
2. **Intro (3 paged slides + dots)** — slide title (serif 32) + body + 3 bullet points (accent
   dots). Slides: ① "A mirror, not a judge" ② "Three honest answers" (Contains/May/Could-not-verify)
   ③ "We tell you what we don't know" (draft data, photos local, check packaging). Next/Back/Skip.
3. **Policy** — terms/privacy/medical-disclaimer acknowledgement (copy pending attorney).
4. **Sign in / Save profile** — providers (Apple, Google) + Email card with **Username (nickname),
   Email, Password** and Create / Sign in. **Privacy disclaimer under username:** "Use a nickname,
   not your real name… Nyara is about what you avoid, not who you are." Status line shows backend
   state. "Skip for now — use on this phone" local path. States: idle / busy / error message /
   "account ready".
5. **Onboarding (watchlist)** — ScreenIntro with "N of 8" count pill (turns accent at cap). Search
   box on top (searches all 107 items). Default tiles = **9 major allergens + 4 top intolerances**
   + full Diet/Goals; each long section shows "+N more — use search". Selected items list below
   with a 3-level **severity** selector each. Cap = 8 (over-cap chips dim to 0.4 + a notice).
6. **Camera** — live camera view + "Scan ingredient label". After capture: a **review** card
   (editable product name/brand + recognized OCR text) before "Check ingredients". Draft-data note.
   States: permission request / reading / review / OCR-failed (fallback to manual). Manual entry is
   a quiet "enter by hand" fallback (camera is the hero).
7. **Result (most important surface)** — header + honesty notices (Draft data; non-English "we may
   not have read this label" when triggered). Findings as MatchBars grouped by domain
   (allergen→intolerance→diet→goal). Each: verb + amber dot. Empty state = one calm headline
   ("Nothing in what we could read matched your profile. Always check the packaging too."), NOT a
   scary all-clear. **Per-finding detail sheet:** "What it is", "Read as" (technical), how it matched
   (provenance + draft caveat), alternate label names, family **attribution chips** ("You"/member).
   **Child mode** simplifies wording (never hides). Feedback: Clear / Unsure / Wrong.
8. **Home/Diary** — "Scan calmly, save what matters." stat row (Profile/Offline/Review), big
   "Scan a label", Diary (real-scan count) + Patterns (n/6) cards, optional HouseAdCard. Diary list:
   calendar + searchable history, filters (All/Real/Samples/Matches), reopen a saved result. Empty:
   "No scans saved yet."
9. **Patterns** — on-device summaries from real scans (≥6). No medical/predictive language.
10. **Profile** — profile card (name + watched pills + "Edit watched items"), Account sync card,
    **Family** card (self avatar + light-gray "＋" circle to search-add members, up to 5; child
    avatars are rounded-square + sandy tint; remove flow), Plans, Security/backup, Appearance,
    product-review queue count.
11. **Plans** — Free / Individual / Family blocks (price, tagline, benefit checklist, "Most popular"
    on Individual). "Payment via App Store/Play — Nyara never sees card details."
12. **Upgrade (paywall)** — shown at the free cap. Affirmation headline ("You've used all 10 free
    scans — you're building a real habit"), value row (Unlimited / No ads / 5 profiles), selectable
    plan cards, "Go unlimited" + calm "Maybe later". **Ethical only — no countdown timers/guilt.**
13. **Security & backup** — App-lock PIN, cloud backup toggle + retry queue, local checkpoint,
    "Prepare my ingredient data" (offline) + freshness, data export, clear-local-data.
14. **Unlock** — PIN gate. **Appearance** — Background × Accent picker (the 20 combos).

---
## 6. Interaction & motion
- Calm, minimal motion. Sheet = bottom modal, fade/slide. No bouncy/playful animation.
- The amber dot is a static presence indicator, not animated.
- Primary action per screen is singular and obvious (one accent PrimaryButton).
- Taps ≥44px targets; chips/buttons meet this.

---
## 7. Accessibility (required)
- Color is never the sole signal — every MatchBar pairs the dot with the verb word.
- Contrast: ink on bg, onAccent on accent must pass AA. Category inks chosen for tinted bgs.
- accessibilityRole/label/state on all controls; child-mode toggle must announce state.
- Support dynamic type scaling and screen readers (TalkBack/VoiceOver). Full device pass pending.

---
## 8. Explicitly NOT in the design
No red/green, no scores/grades/ratings, no "safe/unsafe", no mascot, no fear imagery, no
credit-card UI (store handles payment), no ad SDKs (house messages only, never on result/camera),
no confidence meter (the verb carries certainty).

---
## 9. Asset gaps to resolve in design
- **Brand fonts** not yet loaded (Source Serif 4 / Hanken Grotesk / Spline Sans Mono) — currently
  system fallback. Loading them is the single biggest visual upgrade.
- **App icon + splash** are placeholders (splash bg is correct Blossom #FCEDF3; icon is default).
- A chosen **v2 visual direction** to apply consistently (bolder cards/illustration style) — open.

---
## 10. Source of truth in code
`src/theme/tokens.js` (all color), `src/components/DesignPrimitives.jsx` (components),
`src/components/Wordmark.jsx`, `src/screens/*`. Mirror-Principle copy rules are enforced by tests
(`src/services/introContent.test.js`, matcher verb constraints). Keep those guarantees intact.
