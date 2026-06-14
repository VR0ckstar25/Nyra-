// Node verification for the app-flow routing decisions (the funnel/auth paths the
// adversarial review found bugs in). Run: node src/services/flowRouting.test.js

const {
  onboardingNextScreen, postAuthScreen, backFromSaveProfile,
  ownershipConflict, shouldStampOwner,
} = require('./flowRouting.js');

let pass = 0, fail = 0;
const failures = [];
const check = (name, cond, detail = '') => {
  if (cond) pass++;
  else { fail++; failures.push(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`); }
};

// Onboarding next
check('first run → credibility funnel', onboardingNextScreen({ profileSaved: false, hasProfile: false }) === 'credibility');
check('editing saved profile → profile', onboardingNextScreen({ profileSaved: true, hasProfile: true }) === 'profile');
check('saved flag without profile is still first-run', onboardingNextScreen({ profileSaved: true, hasProfile: false }) === 'credibility');

// Post-auth routing (review: no-profile must NOT dead-end in empty tabs)
check('auth w/ no profile → onboarding-intent', postAuthScreen({ hasProfile: false, returnTo: 'profile' }) === 'onboarding-intent');
check('auth w/ profile, no returnTo → getting-ready', postAuthScreen({ hasProfile: true, returnTo: null }) === 'getting-ready');
check('auth w/ profile honors returnTo', postAuthScreen({ hasProfile: true, returnTo: 'patterns' }) === 'patterns');
check('auth never returns to scan tab', postAuthScreen({ hasProfile: true, returnTo: 'scan' }) === 'getting-ready');

// Back from save-profile (review: never strand an unsaved profile in tabs)
check('back w/ no profile → policy', backFromSaveProfile({ hasProfile: false, returnTo: 'scan' }) === 'policy');
check('back w/ profile → profile by default', backFromSaveProfile({ hasProfile: true, returnTo: null }) === 'profile');
check('back honors returnTo (not scan)', backFromSaveProfile({ hasProfile: true, returnTo: 'patterns' }) === 'patterns');

// Cross-account ownership guard (the CRITICAL the review found)
check('different owner + local data = conflict', ownershipConflict({ owner: 'A', uid: 'B', hasLocalData: true }));
check('different owner but empty device = no conflict', !ownershipConflict({ owner: 'A', uid: 'B', hasLocalData: false }));
check('first sign-in (no owner) = no conflict', !ownershipConflict({ owner: null, uid: 'B', hasLocalData: true }));
check('same owner = no conflict', !ownershipConflict({ owner: 'A', uid: 'A', hasLocalData: true }));

// Owner stamping
check('stamp on first sign-in', shouldStampOwner({ owner: null, uid: 'B', hasLocalData: true }));
check('do NOT stamp on conflict', !shouldStampOwner({ owner: 'A', uid: 'B', hasLocalData: true }));
check('no re-stamp when owner unchanged', !shouldStampOwner({ owner: 'A', uid: 'A', hasLocalData: true }));
check('adopt empty device for new uid', shouldStampOwner({ owner: 'A', uid: 'B', hasLocalData: false }));

console.log(`\n${pass} passed, ${fail} failed`);
failures.forEach((f) => console.log(f));
process.exit(fail ? 1 : 0);
