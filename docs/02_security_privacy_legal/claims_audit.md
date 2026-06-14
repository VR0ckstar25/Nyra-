# Security & privacy claims audit (2026-06-12)

Every user-facing security/privacy claim was checked against actual code behavior.
Result: **all claims backed.** Re-run this audit whenever copy or storage changes.

| Claim (where) | Verified behavior | Status |
|---|---|---|
| "App data is encrypted at rest on this device" (SecurityBackup, Credibility, Policy, GettingReady) | profile, scans, feedback, settings, offline pack, outbox, data-owner all persist via `writeLocalValue` → chunked `expo-secure-store` (iOS Keychain / Android Keystore). AsyncStorage is used only to read+delete LEGACY plaintext keys during migration. App.js makes no direct AsyncStorage writes. | ✅ True |
| "Label photos stay on this phone" (SaveProfile, Camera, Export) | `cloudSafeScan` strips the image before any cloud write; data export strips the uri (test-pinned); no `firebase/storage` usage; `storage.rules` deny-all. | ✅ True |
| "removed after 7 days unless you keep them" (GettingReady, settings) | `applyRetentionPolicy` stamps `now+7d` on toggle-off; launch cleanup reaps expired + repairs legacy null deadlines. 10 tests. | ✅ True |
| "The PIN is salted and hashed locally… not uploaded" (SecurityBackup) | `securityService.hashPin` salted SHA-256; stored in SecureStore; never sent. | ✅ True |
| Apple sign-in nonce | SHA-256 hashed before use (`authService`). | ✅ True |
| Cross-account isolation | data-owner stamp gates pull/push at client (`flowRouting.ownershipConflict`, 18 tests) + `payloadOwnerOk` Firestore rule. | ✅ True |
| (Absence) "we never sell data" | Not claimed anywhere — matches the privacy stance (only identity is hashed/encrypted; no over-promise). | ✅ Correct |
| Auth token storage | Firebase persistence moved to chunked SecureStore adapter (no plaintext refresh token). | ✅ True |

## Still pending (non-code, launch gate)
- Attorney review of the full privacy policy / terms (all copy is preproduction placeholder).
- Independent validation of the ingredient database (DRAFT) before any non-"second-pass" claim.
