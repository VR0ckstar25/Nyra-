// flowRouting.js — pure navigation/flow DECISIONS extracted from App.js so the
// rules the adversarial review found bugs in (editing-vs-first-run, post-auth
// routing, the cross-account ownership gate) are unit-testable without a render
// harness. These return screen names / booleans; App.js owns the actual setScreen.

// Onboarding finished: an existing saved profile means "edit" (return to Profile);
// a brand-new one means first-run (continue into the credibility/sample funnel).
export function onboardingNextScreen({ profileSaved, hasProfile }) {
  return (profileSaved && hasProfile) ? 'profile' : 'credibility';
}

// After auth completes: a profile (local or restored) continues to getting-ready;
// no profile means the account never finished setup → send to onboarding, NOT a
// dead-end empty tab (review finding). returnTo wins unless it's the scan tab.
export function postAuthScreen({ hasProfile, returnTo }) {
  if (!hasProfile) return 'onboarding-intent';
  if (returnTo && returnTo !== 'scan') return returnTo;
  return 'getting-ready';
}

// Back from the Save/Sign-in screen: with a profile, honor returnTo (not scan)
// else Profile; without one, fall back to the policy screen — never strand the
// user in tabs with an unsaved profile (review finding).
export function backFromSaveProfile({ hasProfile, returnTo }) {
  if (!hasProfile) return 'policy';
  if (returnTo && returnTo !== 'scan') return returnTo;
  return 'profile';
}

// Cross-account guard core: block pull/push when this device already holds a
// DIFFERENT account's data. A first sign-in (no stored owner) or the same owner
// is always fine; an empty device adopts the new owner.
export function ownershipConflict({ owner, uid, hasLocalData }) {
  return !!(owner && owner !== uid && hasLocalData);
}

// Should we (re)stamp the device's data-owner? Only when it's unset or changing
// to a uid that's allowed to adopt it (no conflict).
export function shouldStampOwner({ owner, uid, hasLocalData }) {
  if (ownershipConflict({ owner, uid, hasLocalData })) return false;
  return owner !== uid;
}
