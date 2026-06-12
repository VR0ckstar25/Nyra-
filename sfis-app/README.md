# Anvara — Working Prototype (vertical slice)

The **Step 1.5 vertical slice**: one real path end-to-end —
**onboarding → scan → real matching → result** — on the real (DRAFT) allergen data.
Built React Native + Expo (the locked stack).

## Run it

```sh
cd sfis-app
npm install
npx expo start
```

Verify the engine without the app:
```sh
npm run test:match
```

Camera OCR and Apple sign-in require an iOS/Android development build because they use native modules. Expo Go can still use manual entry and sample scans; web is not configured in this package.

## What's Real (Honest Boundary)

| Piece | Status |
|---|---|
| Theme system + Appearance picker (20 combos, persisted) | **real** |
| Matching engine (synonym graph, PAL/free-from context, OCR tolerance, false-positive guards, parens, multi-parent, dedupe) | **real**, Node-verified |
| Result screen (Contains / May contain / Could-not-verify, minimal bars) | **real**, renders matcher output |
| Onboarding (allergies, intolerances, goals/diet + severity UI) | **real UI**, matcher-backed for supported ids |
| Diary + Patterns | **real local persistence**, reflects saved scans |
| Profile/family shell | **real self profile + deferred Add members state** |
| **Camera → OCR** | **native bridge added** — Android uses on-device ML Kit text recognition, iOS uses on-device Apple Vision. Expo Go/web show an honest unavailable state. |
| Auth + cloud sync | **Firebase scaffold wired** for email, Google token sign-in, Apple sign-in, Firestore profile/scans/feedback sync. Requires `.env` Firebase/OAuth values. |
| Cloud photo storage | deliberately **off**. Storage rules deny all uploads until a reviewed 7-day deletion job exists. |

## Flow to try
1. **Onboarding** → choose watched items or tap **Use demo profile** → Continue.
2. **Diary** → tap **Try a sample scan**, or open **Scan** and run the tutorial sample.
3. **Result**: Milk + Almond show **Contains**; Peanut shows **May contain** (from the
   "may contain peanuts" PAL line); "natural flavours" sits under **Could not verify**.
   Wheat/soy are present on the label but **not shown** — they're not on the profile.
4. Tap **Theme** to recolor the whole app live; the amber finding dot never changes.

## Backend setup

Use Firebase Spark for the first production slice: it has a no-cost tier without a required payment method, Firebase Auth, and Firestore sync. Copy `.env.example` to `.env` and fill the Firebase web app values. Enable Email/Password in Firebase Auth. Enable Google and Apple providers when the OAuth/app identifiers are ready.

Firestore paths:
- `users/{uid}/profile/self`
- `users/{uid}/scans/{scanId}`
- `users/{uid}/feedback/{feedbackId}`

Rules are user-owned only. Storage is deny-by-default because label photos should stay local.

## Privacy posture

Default behavior is minimal retention: OCR runs on-device; label photos are not uploaded; captured label images are removed from this phone after 7 days unless the user turns on **Save label photos** in Profile. Cloud sync stores profile choices, product names, matcher results, OCR text, and feedback so Diary/Patterns can work across devices.

## Notes
- Data is **DRAFT** (`src/data/allergens.json`, exported from `../database`). Nothing is
  clinically validated — prototype only.
- Matching is deterministic and offline. OCR is only for reading label text before the matcher runs.
- Custom fonts (Source Serif 4 / Hanken Grotesk / Spline Sans Mono) use system
  fallback here; load via `expo-font` as a polish step.
