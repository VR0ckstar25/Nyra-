# Security audit triage (rev. 2026-06-21)

## ESLint security scan (`npm run lint`)
- Config: `.eslintrc.json` runs `eslint-plugin-security` high-signal rules (child_process,
  eval, unsafe-regex, non-literal fs/require, pseudoRandomBytes, timing-attacks, bidi, buffer)
  plus no-eval/no-new-func. `detect-object-injection` is OFF (pure noise on `obj[key]`).
- **Findings: 1, fixed.** `scanMatch.js:328` — `\bcream\s+(?:of\s+)?tartar\b` tripped
  `detect-unsafe-regex` (nested-quantifier ReDoS) and runs on untrusted OCR/label text.
  Fixed: the input is `norm()`-ed to single spaces, so a literal space replaces `\s+`
  (behavior-identical, ReDoS-free). Scan now clean. Wired into CI (`test` job).

## `npm audit` triage
- Snapshot: 41 vulns (18 high, 22 moderate, 1 low).
- **All 18 highs are in the Expo / Metro BUILD toolchain** — `@expo/cli`, `@expo/config-*`,
  `@expo/metro-config`, `@expo/prebuild-config`, `@xmldom/xmldom`, `cacache`, `tar`,
  `form-data`, `expo-*` dev packages. These run at build/prebuild time, **not in the shipped
  app bundle**, so they are not a runtime attack surface for end users.
- `npm audit fix --force` would bump the Expo SDK (major, breaking) — **not done deliberately.**
- **Decision:** accept now for beta; clear them as part of a planned **Expo SDK upgrade**
  (separate, tested effort). CI runs `npm audit --audit-level=high` as a *visible, non-blocking*
  report so new runtime-dependency vulns surface immediately.
- **Re-check trigger:** any NEW high/critical in a *runtime* dependency (firebase,
  react-native, react-native-purchases, expo-secure-store, anvara-ocr) must be treated as
  blocking, not toolchain noise.

## Still open (tracked in TEST_PLAN.md)
- Secret scanning (gitleaks) — wired in CI.
- Firestore rules tests — done (16/16, emulator).
- MITM/network confirmation, real-device QA, server-side quota enforcement — pending.
