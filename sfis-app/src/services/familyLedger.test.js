// Node verification for the family token ledger (founder spec 2026-06-12):
// per-member monthly credits, transfers between members, departed-member credits
// flowing to a shared pool, calendar-month resets.
// Run: node src/services/familyLedger.test.js  (wired into `npm test`)

const {
  normalizeFamilyLedger, transferScans, canScanForMember, recordFamilyScan,
  memberRemaining, familyTotals, FAMILY_POOL_ID,
} = require('./commercialModel.js');

let pass = 0, fail = 0;
const failures = [];
const check = (name, cond, detail = '') => {
  if (cond) pass++;
  else { fail++; failures.push(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`); }
};

const JUNE = new Date(2026, 5, 15); // local-time constructors — no UTC parsing traps
const JULY = new Date(2026, 6, 2);
const fam = { planId: 'family' };           // 50/member
const MEMBERS = [{ id: 'self', name: 'You' }, { id: 'test-theo', name: 'Theo' }, { id: 'test-ava', name: 'Ava' }];

// 1. Init: every member gets the per-member allowance; pool starts empty
let led = normalizeFamilyLedger(null, fam, MEMBERS, JUNE);
check('each member starts with 50', memberRemaining(led.members.self) === 50 && memberRemaining(led.members['test-theo']) === 50);
check('pool starts empty', memberRemaining(led.members[FAMILY_POOL_ID]) === 0);
check('totals = 150 for 3 members', familyTotals(led).remaining === 150, JSON.stringify(familyTotals(led)));

// 2. Transfers: ok, insufficient, self-transfer, unknown member
let t = transferScans(led, 'test-theo', 'self', 20);
check('transfer 20 Theo→self ok', t.ok && memberRemaining(t.ledger.members.self) === 70 && memberRemaining(t.ledger.members['test-theo']) === 30);
check('over-transfer rejected', !transferScans(t.ledger, 'test-theo', 'self', 31).ok);
check('self-transfer rejected', !transferScans(led, 'self', 'self', 5).ok);
check('unknown member rejected', !transferScans(led, 'ghost', 'self', 5).ok);
check('zero/negative rejected', !transferScans(led, 'self', 'test-theo', 0).ok && !transferScans(led, 'self', 'test-theo', -3).ok);
check('totals conserved across transfer', familyTotals(t.ledger).remaining === 150);

// 3. Scanning draws down the right member and stops at zero
led = t.ledger;
for (let i = 0; i < 30; i++) led = recordFamilyScan(led, 'test-theo');
check('Theo exhausted after 30 scans (50-20 transferred)', memberRemaining(led.members['test-theo']) === 0);
check('exhausted member blocked', !canScanForMember(led, 'test-theo').allowed);
const before = led;
led = recordFamilyScan(led, 'test-theo');
check('scan at zero is a no-op', led === before);
check('other members unaffected', canScanForMember(led, 'test-ava').allowed && memberRemaining(led.members['test-ava']) === 50);

// 4. Departed member: remaining credits flow to the pool; pool can re-distribute
const fewer = MEMBERS.filter((m) => m.id !== 'test-ava'); // Ava (50 left) departs
led = normalizeFamilyLedger(led, fam, fewer, JUNE);
check('departed credits land in pool', memberRemaining(led.members[FAMILY_POOL_ID]) === 50, JSON.stringify(led.members[FAMILY_POOL_ID]));
t = transferScans(led, FAMILY_POOL_ID, 'test-theo', 25);
check('pool→member transfer works', t.ok && memberRemaining(t.ledger.members['test-theo']) === 25);
check('pool drained correctly', memberRemaining(t.ledger.members[FAMILY_POOL_ID]) === 25);

// 5. Calendar rollover: fresh allowances, transfers/pool cleared
led = normalizeFamilyLedger(t.ledger, fam, fewer, JULY);
check('July resets each member to 50', memberRemaining(led.members.self) === 50 && memberRemaining(led.members['test-theo']) === 50);
check('July clears the pool', memberRemaining(led.members[FAMILY_POOL_ID]) === 0);
check('cycle key advanced', led.cycle === '2026-07', led.cycle);

// 6. Family Pro gets 60/member
const pro = normalizeFamilyLedger(null, { planId: 'familyPro' }, MEMBERS, JUNE);
check('familyPro = 60/member', memberRemaining(pro.members.self) === 60);

console.log(`\n${pass} passed, ${fail} failed`);
failures.forEach((f) => console.log(f));
process.exit(fail ? 1 : 0);
