// Node verification for the data-export payload builder.
// Run: node src/services/dataExport.test.js  (wired into `npm test`)
// The load-bearing promise: health data is the user's to take, but label PHOTOS
// never leave the device — the export must carry photo metadata only, no uri.

const { buildExportPayload, exportFileName, EXPORT_SCHEMA_VERSION } = require('./dataExport.js');

let pass = 0, fail = 0;
const failures = [];
const check = (name, cond, detail = '') => {
  if (cond) pass++;
  else { fail++; failures.push(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`); }
};

const AT = '2026-06-12T10:00:00.000Z';
const profile = { name: 'You', items: [{ id: 'milk', severity: 'Strict avoid' }], familyMembers: [{ id: 'm1', name: 'Theo' }] };
const scans = [
  { id: 's1', product: { name: 'Cookies' }, findings: [], image: { uri: 'file:///private/x.jpg', capturedAt: AT, retainedOnDevice: false, deleteAfter: AT } },
  { id: 's2', product: { name: 'Bar' }, findings: [], image: null },
];
const feedback = [{ id: 'f1', label: 'Clear' }];

const payload = buildExportPayload({ profile, scans, feedback, settings: { commercial: { planId: 'family' } }, exportedAt: AT });

// 1. Shape + provenance
check('app + schema stamped', payload.app === 'Anvara' && payload.schema === EXPORT_SCHEMA_VERSION);
check('exportedAt preserved (injected, deterministic)', payload.exportedAt === AT);
check('plan captured', payload.plan === 'family');
check('counts correct', payload.counts.scans === 2 && payload.counts.feedback === 1 && payload.counts.familyMembers === 1);

// 2. THE PRIVACY INVARIANT: no image uri anywhere in the serialized export
const serialized = JSON.stringify(payload);
check('no file:// uri leaks into export', !serialized.includes('file://'), serialized.slice(0, 200));
check('photo metadata retained (dates, not bytes)', payload.scans[0].image.capturedAt === AT && payload.scans[0].image.deleteAfter === AT);
check('null image stays null', payload.scans[1].image === null);

// 3. Health data IS included (it's the user's own copy)
check('profile + severity included', payload.profile.items[0].severity === 'Strict avoid');
check('feedback included', payload.feedback.length === 1);

// 4. Filename is date-stamped
check('filename date-stamped', exportFileName(AT) === 'anvara-data-2026-06-12.json', exportFileName(AT));

// 5. Empty/edge inputs don't throw
const empty = buildExportPayload({ exportedAt: AT });
check('empty export is valid', empty.counts.scans === 0 && empty.profile === null && empty.plan === 'free');

console.log(`\n${pass} passed, ${fail} failed`);
failures.forEach((f) => console.log(f));
process.exit(fail ? 1 : 0);
