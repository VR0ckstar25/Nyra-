# Intended-Use Guardrails — Staying a Non-Device

**Purpose.** Keep Anvara on the **non-device** side of FDA jurisdiction. Under
**21 CFR 801.4**, device status turns on *objective intent* — your claims, the
design, and the circumstances of use, **not** your self-label. The likely basis
that Anvara is not a device is the **21st Century Cures Act software carve-out
(FD&C §520(o))**: software that displays/stores/reflects a user's own data and
does **not** diagnose, cure, mitigate, treat, or prevent disease.

> ⚠️ Not legal advice. The classification call is the **regulatory attorney's**
> (Legal Policies note, Attorney deliverable #9 — FDA SaMD review). This checklist
> is the engineering/product discipline that supports the non-device position.
> Ties to [match_semantics.md](../../database/match_semantics.md), Transfer Note §1
> (Mirror Principle) and §10/§16, and Legal note §3/§8.

---

## 🚫 NEVER (red lines — any one of these can trigger device status)

**Language / claims**
- ❌ "Safe", "Unsafe", "Safe for you", "Allergen-free", "Free from", "Approved",
  "OK to eat", "Avoid this", "You should not eat this".
- ❌ Any verdict, score, grade, rating, or binary safe/unsafe indicator
  (red/green). *(Already barred in the spec + match_semantics.)*
- ❌ Disease/treatment framing: "treats", "mitigates", "prevents a reaction",
  "protects you from", "manage your allergy" (as a medical claim).
- ❌ **Predicting** a physical reaction or outcome ("you will react",
  "likely to cause *you* symptoms").
- ❌ Unsubstantiated efficacy claims (e.g. "saves 3–4 minutes" unless defensible —
  Legal §8). Frame as time *reading labels*, never a health outcome.
- ❌ Diagnosing or naming a medical condition from logged data.

**Features**
- ❌ Shipping the **Phase 3 predictive/neural model** before the Phase 3 gates,
  incl. attorney FDA SaMD review (Transfer Note §16, Gate 2). Prediction of
  reactions is the single highest SaMD risk.
- ❌ Reaction-pattern logging that **concludes** a diagnosis or recommends
  clinical action (logging observations = OK; drawing a medical conclusion = not).
- ❌ Dosing, medication, or "what to do medically" guidance.

---

## ✅ ALWAYS (the safe-harbor posture)

**Language — mirror only**
- ✅ State **presence against the user's own declared profile**:
  *"Contains peanuts — peanuts are on your list."*
- ✅ Use the four result states only: **Detected / Possible / Unknown / Not
  detected** ([match_semantics.md](../../database/match_semantics.md)).
- ✅ "Not detected" is reading-limited and per-scan — never "does not contain it."
- ✅ Echo **manufacturer-certified** claims only, attributed:
  *"The label states: 'Certified gluten-free.'"*
- ✅ Keep the mandatory result-screen disclaimer + "check the original packaging"
  (Transfer Note §7 footer).

**Framing**
- ✅ Position as **Health & Fitness consumer information** that reflects the
  user's own data — not a clinical or diagnostic tool.
- ✅ Keep **intolerance as BETA** and visually distinct from allergy findings.
- ✅ Present `match_class` (Detected/Possible) for risk — **never** the
  `confidence_level` meter (that's search ordering only).

---

## Feature-level triggers — verdicts

| Feature | Non-device if… | Becomes device-risk if… |
|---|---|---|
| Allergen matching | states presence vs declared profile (mirror) | tells the user a product is "safe to eat" / "avoid" |
| Logging & calendar | records the user's own observations | concludes a diagnosis or recommends clinical action |
| Pattern recognition (V2) | shows the user's own frequency/patterns | claims to identify/predict a medical condition |
| **Predictive model (V3)** | **gated — not shipped** | predicts reactions/outcomes → SaMD |
| Notifications | warm reminders, no medical advice | instruct medical action |

---

## Copy & release gates (where this gets enforced)

- **App Store / Play listing** — attorney copy review before submission
  (Legal §8). No efficacy/clinical claims; "Health & Fitness" category must match
  content.
- **In-app first-run + result footer** — "not medical advice / not a device"
  disclaimer present and prominent (Legal §3 ToS: *Not medical advice*).
- **Every new string** touching results/notifications — check against the NEVER
  list before merge.

---

## Contingency only — IF an attorney ever classifies Anvara as a device

These do **not** apply at launch under the non-device posture; hold them ready:
- **21 CFR 801.50** — stand-alone software must display its **UDI** on startup or
  via an "About" command; **version number = production identifier**.
- **21 CFR 801.18** — device-facing dates must be **ISO `YYYY-MM-DD`** (our
  consumer date formats would need to change).
- **801.4 / 801.5 / 801.6 / 801.20** — intended-use, adequate directions,
  no misleading statements, UDI on label.

**Owner:** product + legal. **Sign-off:** regulatory attorney confirms the
non-device classification holds at each major release.
