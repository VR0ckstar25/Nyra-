# Nyara — Adversarial Test Plan (static · dynamic · OWASP · safety)

Reviewer stance: this is a **health-adjacent, allergy-safety** app on React Native/Expo
with Firebase Auth + Firestore, SecureStore, on-device ML Kit OCR, a `nyara://` deep-link
scheme, and a RevenueCat billing seam. A false-negative on an allergen can hurt someone, so
**safety testing outranks everything**. Status: ✅ automated today · 🟡 partial · ⬜ gap.

---
## 1. STATIC ANALYSIS (SAST / SCA / secrets / config)
- ⬜ **Linting + security lint** — ESLint + `eslint-plugin-security`, `eslint-plugin-react-native`; fail CI on errors.
- ⬜ **Dependency audit (SCA)** — `npm audit` + Snyk/OSV-Scanner on every PR; pin + review transitive deps (firebase, expo, react-native-purchases). We currently carry known-vuln warnings from `npm audit` — triage them.
- ⬜ **Secret scanning** — gitleaks / trufflehog in CI + pre-commit; assert no API keys, `.env`, keystores, or Firebase secrets ever committed (`.env` is gitignored — verify continuously).
- ⬜ **Typed schemas / static contracts** — add TypeScript or zod runtime validators for stored data (profile, scan, feedback, offlinePack) and cloud payloads; today they're untyped JS.
- 🟡 **Custom safety lint** — grep/AST rule banning verdict words ("safe to eat", "unsafe") in result/UI copy and banning `confidence`-meter resurrection (partly covered by intro/test asserts).
- ⬜ **Firestore rules static review** — lint `firestore.rules` for any `allow read/write: if true`, unscoped wildcards, or missing `request.auth` checks.
- ⬜ **Bundle/IaC config review** — `app.json` permissions (only CAMERA), `eas.json` profiles, no debug flags / demo-auth in release variant.
- ✅ **Parse/balance checks** — JS/JSX parse gate (in dev loop).

## 2. DYNAMIC ANALYSIS (DAST / runtime / fuzz)
- ✅ **Matcher fuzz** — 2000-assertion seeded battery (hostile/garbage input never throws; allergen invariants).
- ✅ **Crash/robustness** — malformed profile/ledger/outbox/export inputs (found+fixed 6 crashes).
- ⬜ **Network MITM** — run the app through Burp/mitmproxy/Charles: confirm TLS everywhere, **no label photos or OCR text leave the device**, cloud payloads are stripped as claimed, no PII in query strings/logs.
- ⬜ **Live Firestore rules tests** — `@firebase/rules-unit-testing` emulator suite: user A cannot read/write user B's docs; events are owner-delete-only; `payloadOwnerOk` actually fires; unauth requests denied.
- ⬜ **Auth/session dynamic** — token refresh, session survives restart (the firebase@12 RN-persistence risk), sign-out wipes session, account-switch on shared device (cross-account merge guard) under real timing/races.
- ⬜ **Deep-link / scheme abuse** — fuzz `nyara://` / `exp+nyara://` intents: malformed URLs, injection, unexpected screens, no auth bypass via deep link.
- ⬜ **OCR adversarial inputs** — blurry/rotated/low-light/multi-language/handwritten/partial labels on real devices; confirm honest "couldn't read" + non-English notice, never a falsely-clean result.
- ⬜ **Storage-at-rest inspection** — pull the app sandbox (rooted/emulator): assert health data is in SecureStore (encrypted), not plaintext AsyncStorage; photos honor 7-day expiry.
- 🟡 **State-clearance / resume** — appClearance stress suite (3250 runs) covers state reset; real app-lock/background-resume needs device QA.

## 3. OWASP — Mobile Top 10 (MASVS) + API Security
- ⬜ **M1 Improper Credential Usage** — no hardcoded creds; tokens in SecureStore; RevenueCat key not abusable.
- ⬜ **M2 Inadequate Supply Chain** — SCA + pinned deps + verified native modules (anvara-ocr).
- 🟡 **M3 Insecure Auth/Authz** — Firestore owner-scoping (have rules; need emulator tests); no client-trusted entitlements (billing entitlement comes from store receipt ✅ design).
- 🟡 **M4 Insufficient Input/Output Validation** — matcher fuzz ✅; add schema validation on stored/cloud reads (untrusted synced data).
- ⬜ **M5 Insecure Communication** — TLS pinning consideration; verify no cleartext; MITM test (see §2).
- 🟡 **M6 Inadequate Privacy Controls** — photos/OCR local-only ✅ (unit-tested); needs live MITM confirmation + data-export redaction audit ✅.
- ⬜ **M7 Insufficient Binary Protection** — release build: no source maps shipped, no debug/demo-auth, obfuscation/Hermes bytecode, root/jailbreak awareness for health data.
- ⬜ **M8 Security Misconfiguration** — Firestore rules, Storage rules (deny-all ✅), app.json, no verbose logging of health data in prod.
- 🟡 **M9 Insecure Data Storage** — SecureStore chunks ✅; verify nothing health-adjacent in AsyncStorage/logs/clipboard; quota is client-tamperable (needs server enforcement) ⬜.
- ⬜ **M10 Insufficient Cryptography** — SecureStore relies on OS keystore; PIN salted-hashed ✅ — review hash params; no home-rolled crypto.
- **API (Firestore is the API):** BOLA/IDOR (user B's uid), broken function-level auth (events delete), mass-assignment on profile docs, rate-limiting/abuse, unrestricted resource consumption (sync spam).

## 4. SAFETY-CRITICAL (domain — highest stakes)
- ✅ **Allergen false-negative battery** — free-from/PAL/derived-swallow/OCR/grouping regressions (162 + 77 corpus + fuzz).
- 🟡 **Expanded hostile-label corpus** — keep growing real-world label formats; multi-allergen, contradictory claims, foreign terms (non-English notice ✅).
- ⬜ **Independent DB validation** — clinical/expert review of `allergens.json` before any safety claim (LAUNCH GATE).
- ⬜ **Real-device OCR→match end-to-end** — photo → OCR → match accuracy/recall measured on real packaging (the one unproven link).
- ✅ **Mirror-Principle invariants** — no verdict words, PAL never reads Contains, child mode simplifies-not-hides, attribution shows on every result.

## 5. PRIVACY / COMPLIANCE / DATA
- ✅ Export redaction (no photo uri / OCR text); right-to-erasure delete path.
- ⬜ GDPR/CCPA flows: data access + deletion verified end-to-end (incl. cloud); retention timers honored on device.
- ⬜ Consent + legal copy present and gating (LAUNCH GATE — attorney).
- ⬜ Analytics audit — if added, must exclude ingredient text + health-adjacent fields.

## 6. ACCESSIBILITY / PERFORMANCE / RESILIENCE
- 🟡 **Accessibility** — roles/labels added on key controls; need a full real-device pass: screen reader (TalkBack/VoiceOver), 44px touch targets, contrast ratios, dynamic type scaling (AX5), no color-only meaning (amber dot has text).
- ⬜ **Performance** — matcher latency on large labels, cold-start, memory on low-end Android, offline-pack size vs storage.
- ⬜ **Resilience** — airplane-mode scanning (offline matcher), Firebase down, storage full, interrupted sync, corrupted local store recovery (schema migration ⬜).

## 7. PROCESS / CI
- ⬜ **CI pipeline** — run unit suites + parse + lint + SCA + secret scan + Firestore-rules emulator tests on every PR (today tests run only via `npm test` locally).
- ✅ Unit/regression suites — 19 files, ~7,940 assertions, 0 failures.
- ⬜ Coverage reporting + threshold gate.
- ⬜ Pre-release smoke: fresh clone → `npm ci` → test → build → install → first-run flow.

---
### Honest bottom line
**Strong today:** safety/allergen logic, crash-robustness, privacy unit-tests, state-clearance — all automated.
**Biggest gaps (in priority order):** (1) live Firestore-rules emulator tests, (2) MITM/network confirmation, (3) real-device OCR + accessibility QA, (4) SAST/SCA/secret-scan in CI, (5) server-side quota/entitlement enforcement, (6) independent DB validation (launch gate). None of these are "nice to have" for a health app shipping real money + health data.
