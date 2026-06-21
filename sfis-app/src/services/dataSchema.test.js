// Node verification for runtime validation + migration. Run: node src/services/dataSchema.test.js
const S = require('./dataSchema.js');

let pass = 0, fail = 0;
const failures = [];
const check = (name, cond, detail = '') => {
  if (cond) pass++;
  else { fail++; failures.push(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`); }
};

// profile validation
let r = S.validateProfile({ name: 'A', items: [{ id: 'milk', severity: 'Strict' }, { id: 'milk' }, { id: '' }, 'junk'], familyMembers: 'nope' });
check('profile dedupes watch ids', r.value.items.filter((i) => i.id === 'milk').length === 1);
check('profile drops id-less + non-object items', r.value.items.length === 1, JSON.stringify(r.value.items));
check('profile reports the drops as errors', r.errors.length >= 2);
check('profile coerces bad familyMembers to []', Array.isArray(r.value.familyMembers) && r.value.familyMembers.length === 0);
check('profile caps watchlist at 8', S.validateProfile({ items: Array.from({ length: 20 }, (_, i) => ({ id: `x${i}` })) }).value.items.length === 8);
check('profile caps family at 4 members', S.validateProfile({ familyMembers: Array.from({ length: 9 }, (_, i) => ({ id: `m${i}`, name: 'N' })) }).value.familyMembers.length === 4);
check('non-object profile is safe', S.validateProfile(null).value === null && !S.validateProfile(null).ok);

// scan / feedback validation
check('scan without id is not ok but safe', (() => { const x = S.validateScan({ findings: 'bad' }); return !x.ok && Array.isArray(x.value.findings); })());
check('scan coerces bad findings/unverified to arrays', (() => { const x = S.validateScan({ id: 's', findings: 5, unverified: {} }); return Array.isArray(x.value.findings) && Array.isArray(x.value.unverified); })());
check('feedback keeps null savedScanId', S.validateFeedback({ id: 'f', label: 'Clear' }).value.savedScanId === null);

// cloud snapshot (hostile)
r = S.validateCloudSnapshot({ profile: { items: [{ id: 'egg' }] }, scans: [null, { id: 's1' }, 'x'], feedback: [{ id: 'f1' }, {}] });
check('cloudSnapshot keeps only valid scans', r.value.scans.length === 1 && r.value.scans[0].id === 's1');
check('cloudSnapshot keeps only valid feedback', r.value.feedback.length === 1);
check('cloudSnapshot tolerates null profile', S.validateCloudSnapshot({ profile: null, scans: [] }).value.profile === null);
check('validate(unknown kind) is safe', !S.validate('bogus', {}).ok);

// commercial — unknown/old plan id hard-falls-back to free
check('commercial old plan id → free', S.validateCommercial({ planId: 'plus' }).value.planId === 'free');

// migration runner
check('migrate from v1 stamps source on legacy scans', (() => {
  const m = S.migrateStored({ schemaVersion: 1, data: { scans: [{ id: 's' }, { id: 't', source: 'camera' }] } });
  return m.schemaVersion === S.SCHEMA_VERSION && m.migrated && m.data.scans[0].source === 'manual' && m.data.scans[1].source === 'camera';
})());
check('migrate current version is a no-op', S.migrateStored({ schemaVersion: S.SCHEMA_VERSION, data: { x: 1 } }).migrated === false);
check('migrate missing version assumes v1', S.migrateStored({ data: { scans: [{ id: 's' }] } }).from === 1);
check('migrate non-object is safe', S.migrateStored(null).schemaVersion === S.SCHEMA_VERSION);
check('migrate bare blob (no data wrapper) still upgrades', S.migrateStored({ scans: [{ id: 's' }] }).data.scans[0].source === 'manual');

console.log(`\n${pass} passed, ${fail} failed  (data schema + migration)`);
failures.forEach((f) => console.log(f));
process.exit(fail ? 1 : 0);
