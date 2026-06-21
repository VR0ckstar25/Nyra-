// App-wide clearance stress suite.
// Runs 100 normal app-state scenarios and 50 adversarial pressure scenarios.
// Each run starts from cleared state, then drives the real Anvara service layer:
// profile -> matcher -> scan diary -> retention -> offline packs -> commercial
// guardrails -> pattern engine.

const { matchScan } = require('../match/scanMatch.js');
const data = require('../data/allergens.json');
const {
  buildSelfProfile,
  FAMILY_MEMBER_CAP,
  PROFILE_ITEM_CAP,
  profileIds,
  profileItems,
} = require('../profile/profileModel.js');
const {
  buildOfflinePackFromData,
  estimateOfflinePackFromData,
  recommendedOfflinePackIds,
  usesLegacyBroadRecommendation,
} = require('./offlinePacksCore.js');
const { analyzeScanPatterns, PATTERN_MIN_SCANS } = require('./patternEngine.js');
const { cleanupExpiredLabelImages, enrichCapturedImage } = require('./localRetention.js');
const {
  houseAdForContext,
  normalizeCommercial,
  PLAN_IDS,
  shouldShowHouseAds,
  updateCommercialPlan,
} = require('./commercialModel.js');

let pass = 0, fail = 0;
const failures = [];
const check = (name, cond, detail = '') => {
  if (cond) pass++;
  else { fail++; failures.push(`FAIL  ${name}${detail ? ` - ${detail}` : ''}`); }
};

console.log('=== App-wide state clearance suite ===');

const PROFILE_POOL = [
  'milk', 'egg', 'wheat', 'soy', 'peanut', 'allergen.treenut', 'almond', 'fish',
  'allergen.shellfish', 'sesame', 'lactose', 'gluten', 'diet.vegan',
  'diet.pescatarian', 'goal.less_sugar', 'goal.less_sodium', 'goal.avoid_dates',
];

const INGREDIENTS = [
  'milk powder, oats, sugar',
  'peanut flour, salt',
  'almond butter, rice crisps',
  'soy lecithin, cocoa, sugar',
  'wheat flour, sesame, yeast',
  'egg whites, vanilla',
  'cod oil, natural flavors',
  'shrimp powder, rice',
  'honey, gelatin, date paste',
  'bacon bits, salt, potato starch',
  'turkey broth, rice',
  'oats, natural flavors, spices',
  'may contain milk, eggs, soy and tree nuts',
  'dairy-free cheese, vegan butter',
  'coconut milk, cocoa butter, cream of tartar',
];

function rng(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function pick(random, array) {
  return array[Math.floor(random() * array.length)];
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function blankState() {
  return {
    profile: null,
    scans: [],
    feedback: [],
    settings: {
      saveLabelImages: false,
      cloudBackupEnabled: true,
      autoOfflinePack: true,
    },
    offlinePack: null,
    commercial: normalizeCommercial(null),
  };
}

function makeProfile(seed, adversarial = false) {
  const random = rng(seed);
  const wanted = [];
  const target = adversarial ? 24 : 1 + Math.floor(random() * PROFILE_ITEM_CAP);
  for (let i = 0; i < target; i += 1) {
    wanted.push(adversarial && i % 5 === 0 ? 'milk' : pick(random, PROFILE_POOL));
  }
  if (adversarial) wanted.push('unknown.preference', null, 'milk');
  const severity = Object.fromEntries(PROFILE_POOL.map((id) => [id, random() > 0.5 ? 'Strict avoid' : 'Important']));
  const previousProfile = adversarial
    ? {
        familyMembers: Array.from({ length: 8 }, (_, index) => ({
          id: `member-${index}`,
          name: `Member ${index}`,
          child: index % 2 === 0,
          watched: PROFILE_POOL.concat(PROFILE_POOL.slice(0, 4)).map((id) => ({ id, severity: 'Important' })),
        })),
      }
    : {
        familyMembers: random() > 0.65 ? [{
          id: 'member-normal',
          name: 'Family member',
          child: random() > 0.5,
          watched: [{ id: pick(random, PROFILE_POOL), severity: 'Important' }],
        }] : [],
      };
  return buildSelfProfile(wanted, severity, previousProfile);
}

function saveScan(state, result, options = {}) {
  const savedAt = options.savedAt || new Date(Date.now() - state.scans.length * 60000).toISOString();
  const image = options.image || null;
  const entry = {
    id: options.id || `scan-${state.scans.length}-${Math.random().toString(36).slice(2, 7)}`,
    savedAt,
    source: options.source || 'manual',
    product: result.product || { name: 'Stress product' },
    findings: Array.isArray(result.findings) ? result.findings : [],
    unverified: Array.isArray(result.unverified) ? result.unverified : [],
    feedback: options.feedback || null,
    ocr: options.ocr || null,
    image,
  };
  state.scans = [entry, ...state.scans].slice(0, 200);
  if (entry.feedback) {
    state.feedback = [{
      id: `feedback-${state.feedback.length}`,
      label: entry.feedback,
      category: entry.feedback === 'Product issue' ? 'product_issue' : 'result_feedback',
      source: 'clearance',
      createdAt: savedAt,
      savedScanId: entry.id,
      product: entry.product,
    }, ...state.feedback].slice(0, 200);
  }
  return entry;
}

function finitePattern(pattern) {
  return pattern
    && Number.isFinite(pattern.quality.unverifiedRate)
    && Number.isFinite(pattern.quality.wrongRate)
    && Number.isFinite(pattern.quality.usefulRate)
    && pattern.topFindings.every((row) => Number.isFinite(row.score) && row.score >= 0 && row.score <= 1);
}

function assertState(label, state) {
  const selfItems = profileItems(state.profile);
  const selfIds = selfItems.map((item) => item.id);
  check(`${label}: profile exists`, !!state.profile);
  check(`${label}: self preferences capped`, selfItems.length <= PROFILE_ITEM_CAP, JSON.stringify(selfIds));
  check(`${label}: self preferences deduped`, new Set(selfIds).size === selfIds.length, JSON.stringify(selfIds));
  check(`${label}: family capped`, (state.profile.familyMembers || []).length <= FAMILY_MEMBER_CAP);
  check(`${label}: family watched capped`, (state.profile.familyMembers || []).every((m) => (m.watched || m.items || []).length <= PROFILE_ITEM_CAP));
  check(`${label}: scans capped`, state.scans.length <= 200);
  check(`${label}: feedback capped`, state.feedback.length <= 200);
  check(`${label}: feedback references scan or product snapshot`, state.feedback.every((f) => (
    !f.savedScanId
    || state.scans.some((scan) => scan.id === f.savedScanId)
    || !!f.product
  )));
  check(`${label}: commercial result ads blocked`, !shouldShowHouseAds(state.commercial, 'result') && houseAdForContext(state.commercial, 'result') === null);
  check(`${label}: commercial camera ads blocked`, !shouldShowHouseAds(state.commercial, 'camera'));
  check(`${label}: ad personalization disabled`, normalizeCommercial(state.commercial).adPersonalizationAllowed === false);
  check(`${label}: offline pack exists`, !!state.offlinePack);
  check(`${label}: offline pack ids valid`, state.offlinePack.selectedPackIds.every((id) => ['watchlist', 'big9', 'intolerances', 'dietGoals', 'opaque'].includes(id)), JSON.stringify(state.offlinePack.selectedPackIds));
  check(`${label}: offline pack not legacy broad`, !usesLegacyBroadRecommendation(state.offlinePack), JSON.stringify(state.offlinePack.selectedPackIds));
  check(`${label}: offline pack finite`, Number.isFinite(state.offlinePack.bytes) && Number.isFinite(state.offlinePack.termCount));
  check(`${label}: images expire or are retained by setting`, state.scans.every((scan) => {
    if (!scan.image) return true;
    if (state.settings.saveLabelImages) return scan.image.retainedOnDevice === true;
    return scan.image.retainedOnDevice === false && !!scan.image.deleteAfter;
  }));
  const pattern = analyzeScanPatterns(state.scans);
  const realCount = state.scans.filter((scan) => scan.source !== 'sample').length;
  check(`${label}: pattern scan count`, pattern.scanCount === realCount, `expected ${realCount}, got ${pattern.scanCount}`);
  check(`${label}: pattern finite`, finitePattern(pattern));
  check(`${label}: pattern threshold`, realCount >= PATTERN_MIN_SCANS ? pattern.ready === true : pattern.ready === false);
  check(`${label}: profile id union non-empty`, profileIds(state.profile).length > 0);
}

async function runNormal(index) {
  const random = rng(index + 1000);
  const state = blankState();
  check(`normal ${index}: state cleared`, !state.profile && state.scans.length === 0 && state.feedback.length === 0);
  state.profile = makeProfile(index + 1, false);
  const recommended = recommendedOfflinePackIds(state.profile);
  state.offlinePack = buildOfflinePackFromData(data, state.profile, recommended);
  const estimate = estimateOfflinePackFromData(data, state.profile, recommended);
  check(`normal ${index}: estimate matches pack ids`, estimate.selectedPackIds.join('|') === state.offlinePack.selectedPackIds.join('|'));
  state.commercial = updateCommercialPlan(state.commercial, random() > 0.75 ? PLAN_IDS.individual : PLAN_IDS.free);

  const scansToRun = Math.floor(random() * 48);
  for (let i = 0; i < scansToRun; i += 1) {
    const source = random() < 0.08 ? 'sample' : random() < 0.25 ? 'camera' : 'manual';
    const text = pick(random, INGREDIENTS);
    const result = matchScan(text, state.profile, state.offlinePack.data || data);
    const capturedAt = new Date(Date.now() - Math.floor(random() * 3) * 24 * 60 * 60 * 1000).toISOString();
    const image = source === 'camera'
      ? enrichCapturedImage({ uri: `file:///tmp/anvara-${index}-${i}.jpg`, capturedAt }, state.settings.saveLabelImages)
      : null;
    saveScan(state, {
      ...result,
      product: { name: `Normal ${index}-${i}`, date: capturedAt },
    }, {
      source,
      image,
      feedback: random() < 0.12 ? (random() < 0.7 ? 'Clear' : 'Wrong') : null,
    });
  }
  state.scans = await cleanupExpiredLabelImages(state.scans, state.settings.saveLabelImages);
  assertState(`normal ${index}`, state);
}

async function runAdversarial(index) {
  const random = rng(index + 9000);
  const state = blankState();
  check(`adversarial ${index}: state cleared`, !state.profile && state.scans.length === 0 && state.feedback.length === 0);
  state.profile = makeProfile(index + 1, true);
  state.commercial = normalizeCommercial({
    planId: index % 2 ? 'unknown-plan' : PLAN_IDS.family,
    billingMode: index % 3 ? 'pirate' : 'store',
    houseAdsEnabled: true,
    adPersonalizationAllowed: true,
  });
  const packIds = index % 4 === 0
    ? ['unknown-pack']
    : ['watchlist', 'big9', 'intolerances', 'dietGoals', 'opaque', 'unknown-pack'];
  state.offlinePack = buildOfflinePackFromData(data, state.profile, packIds);

  const scansToRun = 220 + (index % 9);
  for (let i = 0; i < scansToRun; i += 1) {
    const malformed = i % 17 === 0;
    const source = i % 11 === 0 ? 'sample' : i % 3 === 0 ? 'camera' : 'manual';
    const text = malformed ? '' : pick(random, INGREDIENTS);
    const result = malformed
      ? { findings: i % 2 ? null : [], unverified: i % 3 ? ['unknown', null, 'spice blend'] : 'bad', product: {} }
      : matchScan(text, state.profile, state.offlinePack.data || data);
    const capturedAt = new Date(Date.now() - (i % 10) * 24 * 60 * 60 * 1000).toISOString();
    const image = source === 'camera'
      ? enrichCapturedImage({ uri: `file:///tmp/anvara-pressure-${index}-${i}.jpg`, capturedAt }, i % 13 === 0)
      : null;
    saveScan(state, {
      ...result,
      product: { name: i % 5 === 0 ? '' : `Pressure ${index}-${i}`, date: i % 7 === 0 ? 'bad-date' : capturedAt },
      findings: Array.isArray(result.findings) ? result.findings : [],
      unverified: Array.isArray(result.unverified) ? result.unverified : [],
    }, {
      id: i % 19 === 0 ? `duplicate-${index}` : undefined,
      source,
      image,
      savedAt: i % 23 === 0 ? 'bad-date' : capturedAt,
      feedback: i % 5 === 0 ? 'Wrong' : i % 13 === 0 ? 'Product issue' : null,
    });
  }
  state.scans = await cleanupExpiredLabelImages(state.scans, false);
  state.settings.saveLabelImages = false;
  assertState(`adversarial ${index}`, state);
}

(async function main() {
  for (let i = 0; i < 100; i += 1) await runNormal(i);
  for (let i = 0; i < 50; i += 1) await runAdversarial(i);

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail) {
    console.error(failures.slice(0, 120).join('\n'));
    process.exit(1);
  }
})();
