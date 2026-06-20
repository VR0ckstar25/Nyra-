# Nyara — Production Completion Checklist (rev. 2026-06-20)

Single source of truth for "what's done / what's left / who owns it." Status keys:
✅ done & tested · 🟡 partial · ⬜ not started · 🔒 owner/external gate (no code can close it).

## 1. Core product (Mirror Principle)
- ✅ Deterministic offline matcher — Contains / May contain / Could-not-verify, amber dot, **no verdicts/scores/colors**
- ✅ Matcher safety hardened: free-from (incl. derived-swallow fix), PAL never reads as Contains, OCR tolerance, plant guards, negation, lecithin source guard
- ✅ Per-match provenance line (replaces the banned confidence meter)
- ✅ Non-English label → honest capability notice (no false empty result)
- ✅ Ingredient DB: 408 terms, Big-9 + intolerances, reproducible export, fatal dupe gate
- 🔒 **DB breadth + independent expert validation** — DRAFT today; hard launch gate
- 🟡 Family-Pro "enriched Patterns" — copy/quota only; deeper analytics need a spec

## 2. Flow & screens
- ✅ First-run **intro** (3-slide Mirror-Principle walkthrough) → policy → setup → sample → getting-ready → tabs
- ✅ Onboarding: unified one-screen setup, cap 8, severity, search
- ✅ Result surface: child mode (simplifies, never hides), DRAFT banner, family attribution
- ✅ Diary / Patterns / Profile with honest empty states (no placeholder content anywhere)
- ✅ Every finding shows a real "What it is" card (allergen/intolerance from DB; diet/goal from keyword info)
- ✅ Session restore safe (no camera/result dead-ends; no-profile → welcome)

## 3. Family
- ✅ Search / add / **remove** members; per-member attribution ("You" + members)
- ✅ Token ledger: per-member monthly credits, transfers that actually gate scans, departed→pool
- ✅ Staleness "as of {date}" on member avatars
- 🟡 Live account directory — test directory today (`__DEV__`-guarded); needs real accounts

## 4. Tiers, quota, billing
- ✅ Free 10 / Plus 40 / Family 50-per-member / Family Pro 60 — calendar-month gating + upsell
- ✅ RevenueCat-shaped billing seam; **no card data ever touches us** (PCI-out-of-scope, test-asserted)
- ✅ House ads: free tier, Diary/Patterns only, **never** Result/Camera
- 🔒 Real purchases — needs App Store / Play / RevenueCat accounts (preview honest until then)

## 5. Backups, security, DevSecOps
- ✅ Cloud sync (owner-scoped Firestore) + offline outbox retry (dedupe/expiry/backoff)
- ✅ Local encrypted checkpoint (SecureStore) create/restore
- ✅ Data export (photos + full OCR text redacted)
- ✅ Restore purchases (entitlement backup)
- ✅ Right to erasure — resilient + complete cloud delete, errors if any collection can't purge
- ✅ App-lock PIN (salted hash), cross-account bleed closed (client + rules), auth tokens in SecureStore
- ✅ Truth-based local saves with surfaced error messages
- ✅ Test posture: **19 node suites, ~7,960 assertions, 0 failures** — incl. 146-assertion security battery + 2000-assertion seeded fuzz battery; 6 crash-on-malformed-input bugs found & fixed

## 6. Real-device / OCR
- ✅ Native `anvara-ocr` module compiles into the dev build; installed on the S24 once
- 🟡 **Real-photo OCR not yet confirmed** — needs the phone connected (founder action)
- 🔒 Standalone build (JS embedded, no Metro) for cable-free everyday use — needs EAS login or a release keystore

## 7. Brand & launch gates (owner)
- ✅ Renamed user-facing → Nyara
- 🔒 Internal id migration `anvara`→`nyara` (package/scheme/repo) — one coordinated step, post-Firebase
- 🔒 Fonts (Source Serif 4 / Hanken Grotesk / Spline Sans Mono) + app icon binaries
- 🔒 Attorney sign-off on legal/privacy copy
- 🔒 GitHub repo rename + privacy decision before promotion
- 🔒 Firebase keys (turns demo-auth/preview-billing real)

## Honest one-line status
Code/backend is **production-shaped and test-covered**; what stands between here and a public launch is **not code** — it's DB validation, legal, store/Firebase accounts, fonts/icon, and a real-device OCR confirmation.
