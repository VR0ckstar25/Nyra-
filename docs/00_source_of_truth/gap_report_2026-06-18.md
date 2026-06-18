# Gap report — ideal product vs. current build (2026-06-18)

Fast pre-launch pass of the core app motions against the envisioned Mirror-Principle
product. Each row: state, and (if a gap) how it was handled this session.

## Fixed this session
| Motion | Gap found | Fix |
|---|---|---|
| Result detail — diet/goal findings | Showed "Detailed explanation pending review" (no info card) because diet/goal live in matcher keyword lists, not the allergen DB | Added descriptive `info` to every GOAL_KW/DIET_KW entry; threaded through the match record; buildItem falls back to it. +regression test. |
| Ingredient coverage | 9 common product/dish names didn't resolve (halva, gomashio, worcestershire, bouillabaisse, frangipane, amaretto, frittata, aioli, quiche) | seed_07 gap-fill (DERIVED/POSSIBLE), 397→408 terms, regenerated export. |
| Brand | Name was Anvara | Renamed user-facing → Nyara (internal ids kept to not break the live build/Firebase). |
| Robustness | 6 crash-on-malformed-input paths | Array-guarded (matcher, export, ledger, outbox, billing). |

## Verified ALREADY matching the ideal (no gap)
- Mirror Principle on the result surface: Contains / May contain / Could-not-verify + amber dot; **no** verdicts/scores/red-green. No confidence meter (removed; provenance line instead).
- Onboarding flow: welcome → unified setup (cap 8) → sample → **skippable** account → getting-ready → tabs.
- Family: search, add, **remove**, per-member attribution ("You"+members), token transfers that actually gate scans, staleness "as of" note.
- Tiers: Free 10 / Plus 40 / Family 50-per-member / Family Pro 60 with real calendar-month quota gating + upsell.
- Honesty surfaces: DRAFT banner, per-match provenance, non-English notice, "data current as of", child-mode simplifies-not-hides.
- Empty states (Diary/Patterns/Profile): present and honest ("No scans saved yet", etc.) — not broken placeholders.

## Backups & error messaging (DevSecOps coverage — present)
- **Cloud sync** (optional, owner-scoped Firestore) with offline **outbox** retry queue (dedupe/expiry/backoff, 15 tests) → `syncStatus` surfaces failures.
- **Local checkpoint** (encrypted SecureStore) create/restore → status messages.
- **Data export** (shareable JSON, photos redacted) → `storageNotice` on failure.
- **Restore purchases** (entitlement backup after reinstall).
- **Right to erasure**: cloud delete now resilient + complete, errors if any collection can't be purged.
- Truth-based local saves: "could not be saved securely on this device: {reason}".

## Remaining gaps (NOT closable in-code this session)
1. **Ingredient DB breadth** — 408 terms covers Big-9 + intolerances well, but real shelves have thousands. Needs the expert-validation pipeline (hard launch gate). EXPANDED, not COMPLETE.
2. **Family Pro "enriched Patterns"** — currently copy + quota only; the deeper pattern analytics aren't differentiated yet. Needs a spec.
3. **First sample result → Diary** — sample is intentionally not persisted to the real diary; revisit if the "first aha" should be saveable.
4. **jest-expo render tests** — UI flow logic is covered via extracted pure modules; full render-integration tests pending.
5. **Owner/asset gates**: DB validation, attorney legal copy, store accounts, fonts/icon binaries, repo rename, real-device OCR confirmation.
