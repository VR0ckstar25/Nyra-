// Node verification for the extracted App core helpers.
// Run: node src/services/appCore.test.js  (wired into `npm test`)
// Focus: mergeById recency (a stale local record must NOT clobber a newer cloud one)
// and session-restore safety (never strand on camera/result; no profile → welcome).

const { makeId, serializeUser, mergeById, messageFrom, sameJson, restoreScreenFromSession } = require('./appCore.js');

let pass = 0, fail = 0;
const failures = [];
const check = (name, cond, detail = '') => {
  if (cond) pass++;
  else { fail++; failures.push(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`); }
};

// makeId
check('makeId prefixed + unique-ish', makeId('scan').startsWith('scan-') && makeId('x') !== makeId('x'));

// serializeUser
check('serializeUser maps fields', sameJson(serializeUser({ uid: 'u', email: 'e@x', displayName: 'D', secret: 1 }), { uid: 'u', email: 'e@x', displayName: 'D' }));
check('serializeUser null-safe', serializeUser(null) === null);

// mergeById recency — the review-flagged risk
const local = [{ id: 'a', savedAt: '2026-01-01', who: 'local' }];
const cloud = [{ id: 'a', savedAt: '2026-06-01', who: 'cloud' }];
let m = mergeById(local, cloud, 'savedAt');
check('newer cloud beats stale local (same id)', m.length === 1 && m[0].who === 'cloud', JSON.stringify(m));
m = mergeById([{ id: 'a', savedAt: '2026-06-02', who: 'local-new' }], [{ id: 'a', savedAt: '2026-01-01', who: 'cloud-old' }], 'savedAt');
check('newer local beats stale cloud (same id)', m[0].who === 'local-new', JSON.stringify(m));
m = mergeById([{ id: 'a', savedAt: '2026-01-01' }], [{ id: 'b', savedAt: '2026-06-01' }], 'savedAt');
check('distinct ids both kept, newest first', m.length === 2 && m[0].id === 'b');
check('items without id dropped', mergeById([{ savedAt: 'x' }], [], 'savedAt').length === 0);

// messageFrom
check('messageFrom prefers .message', messageFrom(new Error('boom')) === 'boom');
check('messageFrom falls back', messageFrom(null, 'fb') === 'fb');

// restoreScreenFromSession
check('no profile → welcome', restoreScreenFromSession({ lastScreen: 'patterns' }, false) === 'welcome');
check('safe screen restored', restoreScreenFromSession({ lastScreen: 'patterns' }, true) === 'patterns');
check('camera falls back to scan', restoreScreenFromSession({ lastScreen: 'camera' }, true) === 'scan');
check('result falls back to diary', restoreScreenFromSession({ lastScreen: 'result' }, true) === 'diary');
check('unknown screen → diary', restoreScreenFromSession({ lastScreen: 'nope' }, true) === 'diary');
check('missing session → diary (with profile)', restoreScreenFromSession(null, true) === 'diary');

console.log(`\n${pass} passed, ${fail} failed`);
failures.forEach((f) => console.log(f));
process.exit(fail ? 1 : 0);
