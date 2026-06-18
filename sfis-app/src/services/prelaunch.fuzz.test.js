// prelaunch.fuzz.test.js — large generative pre-launch battery (~1500 assertions).
// Property/fuzz testing: thousands of GENERATED inputs checked against invariants,
// which finds edge cases hand-written tests miss. Deterministic via a seeded PRNG,
// so any failure is reproducible (the failing input is printed).
// Run: node src/services/prelaunch.fuzz.test.js  (wired into `npm test`)

const { matchScan } = require('../match/scanMatch.js');
const data = require('../data/allergens.json');
const C = require('./commercialModel.js');
const outbox = require('./outboxQueue.js');
const { buildExportPayload } = require('./dataExport.js');
const { mergeById } = require('./appCore.js');
const { nonEnglishNotice } = require('./languageCheck.js');

// ---- seeded PRNG (mulberry32) — reproducible across runs ----
let seed = 0x9e3779b9;
function rnd() { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

const groups = {};
let curGroup = '';
const group = (g) => { curGroup = g; groups[g] = groups[g] || { pass: 0, fail: 0 }; };
const failures = [];
let pass = 0, fail = 0;
const check = (cond, detail) => {
  groups[curGroup].pass + groups[curGroup].fail;
  if (cond) { pass++; groups[curGroup].pass++; }
  else { fail++; groups[curGroup].fail++; if (failures.length < 40) failures.push(`[${curGroup}] ${detail}`); }
};
const kindOf = (r, common) => { for (const f of r.findings) for (const i of f.items) if (i.common === common) return i.kind; return '(none)'; };
// Naming-agnostic helpers: when exactly ONE id is watched, any finding is that
// allergen (a single tree-nut shows its specific name, not the "Tree nuts" group).
const allItems = (r) => r.findings.flatMap((f) => f.items);
const anyContains = (r) => allItems(r).some((i) => i.kind === 'contains');
const anyMay = (r) => allItems(r).some((i) => i.kind === 'may');
const anyFinding = (r) => allItems(r).length > 0;

// Vetted terms that MUST flag "contains" for their watch id (drawn from the DB +
// the green regression suite — DIRECT/DERIVED, not POSSIBLE/AMBIGUOUS/plant-guarded).
const CONTAINS_TERMS = [
  ['milk', 'Milk'], ['whey', 'Milk'], ['casein', 'Milk'], ['butter', 'Milk'], ['cheese', 'Milk'], ['yogurt', 'Milk'], ['cream', 'Milk'],
  ['peanut', 'Peanuts'], ['peanuts', 'Peanuts'], ['peanut butter', 'Peanuts'],
  ['almond', 'Tree nuts'], ['almonds', 'Tree nuts'], ['walnut', 'Tree nuts'], ['cashew', 'Tree nuts'], ['pecan', 'Tree nuts'],
  ['egg', 'Eggs'], ['eggs', 'Eggs'], ['albumin', 'Eggs'],
  ['wheat', 'Wheat'], ['semolina', 'Wheat'], ['durum', 'Wheat'],
  ['soy', 'Soy'], ['soya', 'Soy'], ['soybean', 'Soy'],
  ['sesame', 'Sesame'], ['tahini', 'Sesame'],
];
const WATCH_FOR = { Milk: 'milk', Peanuts: 'peanut', 'Tree nuts': 'almond', Eggs: 'egg', Wheat: 'wheat', Soy: 'soy', Sesame: 'sesame' };
// Free-from list names (identity terms a "Free from X" claim should suppress).
const FREE_NAMES = [['milk', 'Milk'], ['eggs', 'Eggs'], ['soy', 'Soy'], ['peanuts', 'Peanuts'], ['wheat', 'Wheat'], ['sesame', 'Sesame']];
const PANTRY_NOISE = ['sugar', 'salt', 'water', 'rice flour', 'citric acid', 'natural flavors', 'spices', 'oats'];

// ── 1. Matcher robustness fuzz: never throws on garbage (300) ──────────────────
group('1. matcher-never-throws');
const charsets = ['abcdefghijklmnopqrstuvwxyz ,.;:()/-', 'МИРПШ砂糖小麦ピーナッツ', '0123456789!@#$%^&*', '🥜🥛🍞🥚 ', '\n\t  ,,,;;;'];
for (let i = 0; i < 300; i++) {
  const len = int(0, 400);
  const cs = pick(charsets);
  let s = ''; for (let j = 0; j < len; j++) s += cs[Math.floor(rnd() * cs.length)];
  const watch = rnd() < 0.5 ? Object.keys(data.parents) : [pick(Object.keys(data.parents))];
  try { const r = matchScan(s, watch, data); check(Array.isArray(r.findings) && Array.isArray(r.unverified), `shape #${i}`); }
  catch (e) { check(false, `threw on len=${len} cs="${cs.slice(0, 6)}": ${e.message}`); }
}

// ── 2. Present watched allergen flags "contains" amid noise (300) ──────────────
group('2. allergen-contains');
for (let i = 0; i < 300; i++) {
  const [term, common] = pick(CONTAINS_TERMS);
  const noise = Array.from({ length: int(0, 4) }, () => pick(PANTRY_NOISE));
  const parts = [...noise]; parts.splice(int(0, parts.length), 0, term);
  const label = `Ingredients: ${parts.join(', ')}.`;
  check(anyContains(matchScan(label, [WATCH_FOR[common]], data)), `"${label}" (watch ${WATCH_FOR[common]}) → expected a contains finding`);
}

// ── 3. PAL distributes as "may", never "contains" (200) ────────────────────────
group('3. PAL-is-may');
const PAL_OPENERS = ['May contain', 'May also contain', 'Produced in a facility that also processes', 'Made on shared equipment with'];
for (let i = 0; i < 200; i++) {
  const [term, common] = pick(CONTAINS_TERMS.filter(([, c]) => WATCH_FOR[c]));
  const label = `Ingredients: oats, sugar. ${pick(PAL_OPENERS)} ${term}.`;
  const r = matchScan(label, [WATCH_FOR[common]], data);
  check(anyMay(r) && !anyContains(r), `"${label}" → expected may (not contains)`);
}

// ── 4. "Free from X" (alone) suppresses X (150) ────────────────────────────────
group('4. free-from-suppresses');
const FREE_OPENERS = ['Free from', 'Free of', 'Does not contain', 'Contains no'];
for (let i = 0; i < 150; i++) {
  const [name, common] = pick(FREE_NAMES);
  const label = `${pick(FREE_OPENERS)} ${name}.`;
  const r = matchScan(label, [WATCH_FOR[common]], data);
  check(!anyFinding(r), `"${label}" → expected ${common} suppressed, got ${JSON.stringify(allItems(r).map((i) => i.common + '/' + i.kind))}`);
}

// ── 5. Free-from claim never swallows a different allergen's DERIVED ingredient
// form (150). Bare allergen NAMES are legitimately a free-from list and suppress;
// the no-swallow guarantee is specifically for derived/compound forms (casein,
// semolina, tahini) of a DIFFERENT allergen than the one the claim names.
group('5. free-from-no-swallow');
const DERIVED_PRESENT = [['casein', 'Milk'], ['whey', 'Milk'], ['butter', 'Milk'], ['peanut butter', 'Peanuts'], ['semolina', 'Wheat'], ['tahini', 'Sesame'], ['albumin', 'Eggs']];
for (let i = 0; i < 150; i++) {
  const [term, common] = pick(DERIVED_PRESENT);
  const freeChoices = FREE_NAMES.filter(([, c]) => c !== common);
  const [freeName] = pick(freeChoices);
  const label = `${pick(FREE_OPENERS)} ${freeName}, ${term}.`;
  const r = matchScan(label, [WATCH_FOR[common]], data);
  check(anyFinding(r), `"${label}" → derived ${common} ingredient must still surface, got (none)`);
}

// ── 6. Family ledger conservation under random transfers (250) ─────────────────
group('6. ledger-conservation');
for (let i = 0; i < 250; i++) {
  const n = int(2, 5);
  const members = Array.from({ length: n }, (_, k) => ({ id: k === 0 ? 'self' : `m${k}`, name: `P${k}` }));
  let led = C.normalizeFamilyLedger(null, { planId: 'family' }, members, new Date(2026, 5, 1));
  const total0 = C.familyTotals(led).remaining;
  for (let s = 0; s < int(1, 8); s++) {
    const from = pick(members).id, to = pick(members).id;
    const res = C.transferScans(led, from, to, int(1, 70));
    if (res.ok) led = res.ledger; // only valid transfers apply
  }
  check(C.familyTotals(led).remaining === total0, `transfers changed total: ${total0} → ${C.familyTotals(led).remaining}`);
}

// ── 7. Quota never negative, blocks exactly at allowance (200) ─────────────────
group('7. quota-bounds');
for (let i = 0; i < 200; i++) {
  const plan = pick(['free', 'plus']);
  const allowance = plan === 'free' ? 10 : 40;
  let u = null; const scans = int(0, allowance + 15); let granted = 0;
  for (let s = 0; s < scans; s++) { const q = C.scanQuota({ planId: plan }, u, 1); if (q.allowed) { u = C.recordScanUsage(u); granted++; } }
  const q = C.scanQuota({ planId: plan }, u, 1);
  check(q.remaining >= 0 && granted <= allowance && q.allowed === (granted < allowance), `${plan}: granted=${granted}/${allowance} remaining=${q.remaining}`);
}

// ── 8. Outbox stays bounded + deduped + never resurrects expired (150) ─────────
group('8. outbox-bounds');
for (let i = 0; i < 150; i++) {
  const items = Array.from({ length: int(0, 350) }, (_, k) => outbox.buildOutboxItem({ kind: pick(['scan', 'feedback', 'event']), payload: { id: `x${int(0, 50)}` }, id: `o${k}`, now: Date.UTC(2026, 5, 1) }));
  const merged = outbox.mergeOutboxItems(items, [], Date.UTC(2026, 5, 1));
  const keys = merged.map(outbox.outboxDedupeKey);
  check(merged.length <= 200 && new Set(keys).size === keys.length, `len=${merged.length} dupes=${keys.length - new Set(keys).size}`);
}

// ── 9. mergeById always keeps the newest record per id (150) ───────────────────
group('9. merge-recency');
for (let i = 0; i < 150; i++) {
  const id = 'r';
  const d1 = int(2020, 2026), d2 = int(2020, 2026);
  const local = [{ id, savedAt: `${d1}-01-01`, w: 'L' }];
  const cloud = [{ id, savedAt: `${d2}-01-01`, w: 'C' }];
  const winner = mergeById(local, cloud, 'savedAt')[0].w;
  // ties go to local (cloud listed first, local later, >= keeps local) — both valid recency
  const expected = d1 > d2 ? 'L' : d2 > d1 ? 'C' : 'L';
  check(winner === expected, `d1=${d1} d2=${d2} → ${winner}, expected ${expected}`);
}

// ── 10. Export never leaks photo uri / OCR text (150) ──────────────────────────
group('10. export-no-leak');
for (let i = 0; i < 150; i++) {
  const scans = Array.from({ length: int(0, 6) }, (_, k) => ({
    id: `s${k}`,
    image: rnd() < 0.6 ? { uri: `file:///private/secret-${int(0, 999)}.jpg`, capturedAt: 'x', deleteAfter: 'y', retainedOnDevice: rnd() < 0.5 } : null,
    ocr: rnd() < 0.7 ? { text: `INGREDIENTS secret-token-${int(0, 999)} milk peanuts`, confidence: rnd(), capturedAt: 'x' } : null,
  }));
  const payload = buildExportPayload({ profile: { name: 'P' }, scans, feedback: [], exportedAt: '2026-06-18T00:00:00Z' });
  const str = JSON.stringify(payload);
  check(!str.includes('file://') && !str.includes('secret-') && !str.includes('secret-token'), `leak in export #${i}`);
}

// ── Report ─────────────────────────────────────────────────────────────────────
console.log('\n=== PRE-LAUNCH GENERATIVE FUZZ BATTERY (seeded, reproducible) ===');
let total = 0;
Object.entries(groups).forEach(([g, r]) => { total += r.pass + r.fail; console.log(`  ${r.fail ? 'FAIL' : ' ok '}  ${g}: ${r.pass}/${r.pass + r.fail}`); });
console.log(`\n${pass} passed, ${fail} failed  (${total} generated assertions)`);
failures.forEach((f) => console.log('  FAIL ' + f));
process.exit(fail ? 1 : 0);
