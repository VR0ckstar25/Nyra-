# Anvara — App Replica (design + flow)

A faithful, **fully clickable** Anvara replica:
the exact screens from `Design.pdf`, wired into the real navigation flow. Built as
an HTML/React prototype (the same approach as the
`docs/04_design/design_handoff_anvara` reference), reusing those reference
screens verbatim for pixel fidelity.

This is a prototype/reference path. Production implementation decisions live in
the React Native + Expo app and the reconciled source-of-truth documents.

## Run it

Babel loads the `.jsx` files over the network, so serve the folder (don't open the
file directly):

```sh
cd replica
python3 -m http.server 8080
# then open http://localhost:8080
```

## The flow

```
Welcome → Profile setup (pick allergens + severity) → Email → Diary (home)
Diary ⇄ Patterns ⇄ Profile        (bottom tabs)
Scan tab → Camera → Processing → Result   (Standard / Child toggle on Result)
```

## What's real vs. placeholder

- **Real (structure & flow):** every screen, every tab, the onboarding steps, the
  scan→result loop, the Standard/Child result toggle, family profile switching,
  and all the settings groups — you can open each one and see what lives inside.
- **Selectable ingredients** in onboarding mirror the database (Big-9 allergens +
  severity). Intolerances, dietary prefs and goals exist in the data and are noted
  as the "next" steps.
- **"Info to be added":** anything whose final wording or behaviour is still the
  founder's call (legal disclosures, account/plan interiors, an ingredient's
  written explanation, sign-in, export, etc.) opens a bottom sheet that says so,
  rather than going nowhere. Nothing here invents content that needs approval.

## Theme

Defaults to **Blossom + Fuchsia** to match the Design.pdf walkthrough. The token
system supports the full 4×5 background/accent set; a user-facing appearance
picker can be added as a later step.
