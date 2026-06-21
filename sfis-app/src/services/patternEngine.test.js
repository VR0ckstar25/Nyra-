// Stress suite for the local Nyara pattern engine.
// 100 normal-condition runs + 50 adversarial pressure runs. Every run clears
// model state first, then verifies bounded, finite, privacy-safe output.

const {
  analyzeScanPatterns,
  createPatternEngine,
  PATTERN_MIN_SCANS,
  PATTERN_MODEL_VERSION,
} = require('./patternEngine.js');

let pass = 0, fail = 0;
const failures = [];
const check = (name, cond, detail = '') => {
  if (cond) pass++;
  else { fail++; failures.push(`FAIL  ${name}${detail ? ` - ${detail}` : ''}`); }
};

console.log('=== Local pattern engine stress suite ===');

function makeRng(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

const FINDING_POOL = [
  { cat: 'allergen', common: 'Milk', kind: 'contains' },
  { cat: 'allergen', common: 'Peanuts', kind: 'may' },
  { cat: 'allergen', common: 'Almonds', kind: 'contains' },
  { cat: 'intolerance', common: 'Lactose', kind: 'contains' },
  { cat: 'diet', common: 'Animal-derived', kind: 'contains' },
  { cat: 'goal', common: 'Added sugar', kind: 'contains' },
  { cat: 'goal', common: 'Sodium', kind: 'may' },
];

function scanAt(index, rng, overrides = {}) {
  const findingCount = overrides.findingCount ?? Math.floor(rng() * 4);
  const items = [];
  for (let i = 0; i < findingCount; i += 1) {
    items.push(FINDING_POOL[Math.floor(rng() * FINDING_POOL.length)]);
  }
  const byCat = {};
  items.forEach((item) => {
    byCat[item.cat] = byCat[item.cat] || [];
    byCat[item.cat].push({ common: item.common, kind: item.kind });
  });
  const daysAgo = overrides.daysAgo ?? Math.floor(rng() * 45);
  const savedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 - index * 60000).toISOString();
  return {
    id: overrides.id || `scan-${index}-${Math.floor(rng() * 100000)}`,
    source: overrides.source || (rng() < 0.08 ? 'sample' : 'manual'),
    savedAt: overrides.savedAt || savedAt,
    product: overrides.product || { name: `Product ${index}` },
    findings: overrides.findings || Object.entries(byCat).map(([cat, catItems]) => ({
      cat,
      label: cat,
      items: catItems,
    })),
    unverified: overrides.unverified || (rng() < 0.25 ? ['natural flavors'] : []),
    feedback: overrides.feedback || (rng() < 0.12 ? (rng() < 0.5 ? 'Wrong' : 'Clear') : null),
  };
}

function normalScenario(seed) {
  const rng = makeRng(seed);
  const count = Math.floor(rng() * 80);
  return Array.from({ length: count }, (_, index) => scanAt(index, rng));
}

function adversarialScenario(seed) {
  const rng = makeRng(9000 + seed);
  const mode = seed % 10;
  if (mode === 0) return null;
  if (mode === 1) return [];
  if (mode === 2) return Array.from({ length: 40 }, (_, i) => scanAt(i, rng, { source: 'sample', findingCount: 3 }));
  if (mode === 3) return Array.from({ length: 220 }, (_, i) => scanAt(i, rng, { findingCount: 4 }));
  if (mode === 4) return Array.from({ length: 12 }, (_, i) => ({
    id: `broken-${i}`,
    source: i % 2 ? 'manual' : 'camera',
    savedAt: i % 3 ? 'not-a-date' : undefined,
    findings: i % 2 ? null : [{ cat: 'allergen', items: [{ common: '', kind: 'maybe' }, null, {}] }],
    unverified: i % 2 ? 'bad' : ['x', null, 'opaque spice'],
    feedback: i % 2 ? 'Wrong' : null,
  }));
  if (mode === 5) return Array.from({ length: 30 }, (_, i) => scanAt(i, rng, {
    savedAt: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
    feedback: 'Wrong',
    unverified: ['natural flavors', 'spices', 'colors'],
  }));
  if (mode === 6) return Array.from({ length: 30 }, (_, i) => scanAt(i, rng, {
    findings: [{ cat: 'allergen', label: 'Allergies', items: [{ common: 'Milk', kind: i % 2 ? 'may' : 'contains' }] }],
  }));
  if (mode === 7) return Array.from({ length: 10 }, (_, i) => scanAt(i, rng, {
    findings: [{ cat: 'weird', label: 'Weird', items: [{ common: `Odd ${i}`, kind: 'contains' }] }],
  }));
  if (mode === 8) return Array.from({ length: 20 }, (_, i) => scanAt(i, rng, {
    id: 'duplicate-id',
    product: { name: '' },
  }));
  return Array.from({ length: 18 }, (_, i) => scanAt(i, rng, {
    findings: [],
    unverified: ['unknown one', 'unknown two', 'unknown three'],
  }));
}

function assertClearance(label, result, expectedRealCount = null) {
  check(`${label}: returns object`, !!result && typeof result === 'object');
  check(`${label}: schema version`, result.schemaVersion === 1);
  check(`${label}: model version`, result.model?.version === PATTERN_MODEL_VERSION);
  check(`${label}: no medical prediction`, result.model?.medicalPrediction === false);
  check(`${label}: top findings bounded`, Array.isArray(result.topFindings) && result.topFindings.length <= 8);
  check(`${label}: insights array`, Array.isArray(result.insights));
  check(`${label}: clearance shape`, typeof result.clearance?.ok === 'boolean' && Array.isArray(result.clearance.warnings));
  check(`${label}: quality finite`, ['unverifiedRate', 'wrongRate', 'usefulRate'].every((key) => Number.isFinite(result.quality?.[key])));
  check(`${label}: quality bounded`, ['unverifiedRate', 'wrongRate', 'usefulRate'].every((key) => result.quality[key] >= 0 && result.quality[key] <= 1));
  check(`${label}: scores finite`, result.topFindings.every((row) => Number.isFinite(row.score) && row.score >= 0 && row.score <= 1));
  check(`${label}: sorted scores`, result.topFindings.every((row, index, rows) => index === 0 || rows[index - 1].score >= row.score));
  check(`${label}: sample scans ignored`, result.sampleIgnoredCount >= 0);
  if (expectedRealCount != null) {
    check(`${label}: real scan count`, result.scanCount === expectedRealCount, `expected ${expectedRealCount}, got ${result.scanCount}`);
  }
  if (result.scanCount < PATTERN_MIN_SCANS) {
    check(`${label}: not ready below threshold`, result.ready === false);
  }
}

for (let i = 0; i < 100; i += 1) {
  const engine = createPatternEngine();
  const reset = engine.reset();
  check(`normal ${i}: state cleared`, reset.runs === 0 && !!reset.lastClearedAt);
  const scans = normalScenario(i + 1);
  const expectedReal = scans.filter((scan) => scan.source !== 'sample').length;
  const result = engine.analyze(scans);
  check(`normal ${i}: state increments once`, engine.state().runs === 1);
  assertClearance(`normal ${i}`, result, expectedReal);
}

for (let i = 0; i < 50; i += 1) {
  const engine = createPatternEngine();
  engine.reset();
  const scans = adversarialScenario(i);
  let result;
  try {
    result = engine.analyze(scans);
    check(`adversarial ${i}: no throw`, true);
  } catch (error) {
    check(`adversarial ${i}: no throw`, false, error.message);
    result = null;
  }
  const expectedReal = Array.isArray(scans) ? scans.filter((scan) => scan?.source !== 'sample').length : 0;
  assertClearance(`adversarial ${i}`, result, expectedReal);
}

const stateless = analyzeScanPatterns(normalScenario(1234));
assertClearance('stateless direct analyze', stateless);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) {
  console.error(failures.join('\n'));
  process.exit(1);
}
