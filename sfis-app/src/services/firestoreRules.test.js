// Firestore security-rules tests (OWASP M3 / API-BOLA-IDOR + GDPR erasure).
// Runs against the Firestore emulator:  npm run test:rules
//   (wraps: firebase emulators:exec --only firestore "node src/services/firestoreRules.test.js")
// Proves the rules actually enforce owner isolation — the layer that holds health data.

const fs = require('fs');
const path = require('path');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { setDoc, getDoc, deleteDoc, updateDoc, doc } = require('firebase/firestore');

let pass = 0, fail = 0;
const failures = [];
async function expectOk(name, p) { try { await assertSucceeds(p); pass++; } catch (e) { fail++; failures.push(`ALLOW-expected ${name}: ${e.message}`); } }
async function expectDenied(name, p) { try { await assertFails(p); pass++; } catch (e) { fail++; failures.push(`DENY-expected ${name}: ${e.message}`); } }

(async () => {
  const testEnv = await initializeTestEnvironment({
    projectId: 'nyara-rules-test',
    firestore: {
      rules: fs.readFileSync(path.join(__dirname, '../../firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });

  const alice = testEnv.authenticatedContext('alice').firestore();
  const bob = testEnv.authenticatedContext('bob').firestore();
  const anon = testEnv.unauthenticatedContext().firestore();

  // Seed alice's data with rules disabled
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users/alice/profile/self'), { name: 'Alice' });
    await setDoc(doc(db, 'users/alice/scans/s1'), { id: 's1' });
    await setDoc(doc(db, 'users/alice/events/e1'), { id: 'e1', type: 'auth.completed' });
    await setDoc(doc(db, 'users/bob/profile/self'), { name: 'Bob' });
  });

  // 1. Owner can read/write their own tree
  await expectOk('owner reads own profile', getDoc(doc(alice, 'users/alice/profile/self')));
  await expectOk('owner writes own scan', setDoc(doc(alice, 'users/alice/scans/s2'), { id: 's2' }));
  await expectOk('owner writes own feedback', setDoc(doc(alice, 'users/alice/feedback/f1'), { id: 'f1' }));

  // 2. BOLA / IDOR — a different signed-in user cannot touch alice's data
  await expectDenied('bob reads alice profile', getDoc(doc(bob, 'users/alice/profile/self')));
  await expectDenied('bob writes alice scan', setDoc(doc(bob, 'users/alice/scans/evil'), { id: 'evil' }));
  await expectDenied('bob deletes alice scan', deleteDoc(doc(bob, 'users/alice/scans/s1')));
  await expectDenied('bob reads alice events', getDoc(doc(bob, 'users/alice/events/e1')));

  // 3. Unauthenticated is denied everywhere
  await expectDenied('anon reads alice profile', getDoc(doc(anon, 'users/alice/profile/self')));
  await expectDenied('anon writes alice scan', setDoc(doc(anon, 'users/alice/scans/x'), { id: 'x' }));

  // 4. payloadOwnerOk — cannot stamp a foreign ownerUid into your own tree
  await expectDenied('owner cannot write mismatched ownerUid', setDoc(doc(alice, 'users/alice/scans/s3'), { id: 's3', ownerUid: 'bob' }));
  await expectOk('owner write with matching ownerUid', setDoc(doc(alice, 'users/alice/scans/s4'), { id: 's4', ownerUid: 'alice' }));

  // 5. Events audit trail — append + owner-delete (erasure), but NO edits
  await expectOk('owner appends event', setDoc(doc(alice, 'users/alice/events/e2'), { id: 'e2', type: 'scan.saved' }));
  await expectDenied('owner cannot edit an event (no history rewrite)', updateDoc(doc(alice, 'users/alice/events/e1'), { type: 'tampered' }));
  await expectOk('owner can delete own event (right to erasure)', deleteDoc(doc(alice, 'users/alice/events/e1')));

  // 6. Catch-all — arbitrary top-level collections denied
  await expectDenied('owner cannot write outside /users', setDoc(doc(alice, 'secrets/x'), { a: 1 }));
  await expectDenied('owner cannot read another top-level collection', getDoc(doc(alice, 'admin/config')));

  await testEnv.cleanup();
  console.log(`\n${pass} passed, ${fail} failed  (Firestore rules)`);
  failures.forEach((f) => console.log('  FAIL ' + f));
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('rules test harness error:', e.message); process.exit(1); });
