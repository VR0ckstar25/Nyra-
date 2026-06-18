export const PATTERN_MIN_SCANS = 6;
export const PATTERN_MODEL_VERSION = 'local-neural-pattern-v1';

const CAT_WEIGHT = {
  allergen: 1,
  intolerance: 0.78,
  diet: 0.58,
  goal: 0.48,
};

const KIND_WEIGHT = {
  contains: 1,
  may: 0.68,
};

function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function sigmoid(value) {
  return 1 / (1 + Math.exp(-value));
}

function safeDate(value, fallback = Date.now()) {
  const time = new Date(value || fallback).getTime();
  return Number.isFinite(time) ? time : fallback;
}

function dayKey(value) {
  const date = new Date(safeDate(value));
  return date.toISOString().slice(0, 10);
}

function itemName(item) {
  return String(item?.common || item?.technical || item?.label || item?.name || 'Unknown').trim() || 'Unknown';
}

function itemKind(item) {
  return item?.kind === 'may' ? 'may' : 'contains';
}

function findingCategory(finding) {
  return finding?.cat || 'goal';
}

function normalizeScan(scan, index) {
  const savedAt = safeDate(scan?.savedAt || scan?.product?.date || Date.now() - index * 1000);
  return {
    id: scan?.id || `scan-${index}`,
    source: scan?.source || 'manual',
    savedAt: new Date(savedAt).toISOString(),
    product: scan?.product || {},
    findings: Array.isArray(scan?.findings) ? scan.findings : [],
    unverified: Array.isArray(scan?.unverified) ? scan.unverified.filter(Boolean) : [],
    feedback: scan?.feedback || null,
  };
}

function neuralAttentionScore(features) {
  // Tiny fixed-weight local scorer. It is not a medical model and it does not
  // learn across users; it just ranks saved-scan patterns consistently.
  const hiddenA = sigmoid(
    -1.05
    + 2.1 * features.frequency
    + 1.2 * features.recency
    + 1.35 * features.containsRatio
    + 0.75 * features.categoryWeight
    - 0.25 * features.wrongFeedback,
  );
  const hiddenB = sigmoid(
    -0.6
    + 1.65 * features.mayRatio
    + 0.9 * features.unverifiedRate
    + 0.65 * features.repeatDays
    + 0.45 * features.categoryWeight,
  );
  return clamp01(sigmoid(-1.2 + 1.8 * hiddenA + 1.25 * hiddenB));
}

function emptyResult(sampleIgnoredCount = 0) {
  return {
    schemaVersion: 1,
    model: {
      version: PATTERN_MODEL_VERSION,
      state: 'cleared',
      trainedOnDevice: true,
      medicalPrediction: false,
    },
    ready: false,
    scanCount: 0,
    sampleIgnoredCount,
    summary: 'Pattern view starts at 6 real scans. Sample scans do not count.',
    topFindings: [],
    insights: [],
    quality: {
      unverifiedRate: 0,
      wrongRate: 0,
      usefulRate: 0,
      issueCount: 0,
    },
    clearance: {
      ok: true,
      warnings: [],
    },
  };
}

export function createPatternEngine() {
  let state = {
    runs: 0,
    lastClearedAt: new Date(0).toISOString(),
  };

  return {
    reset() {
      state = {
        runs: 0,
        lastClearedAt: new Date().toISOString(),
      };
      return { ...state };
    },
    state() {
      return { ...state };
    },
    analyze(scans = []) {
      state.runs += 1;
      return analyzeScanPatterns(scans, { state });
    },
  };
}

export function analyzeScanPatterns(scans = [], options = {}) {
  const source = Array.isArray(scans) ? scans : [];
  const normalized = source.map(normalizeScan);
  const realScans = normalized.filter((scan) => scan.source !== 'sample');
  const sampleIgnoredCount = normalized.length - realScans.length;
  if (!realScans.length) return emptyResult(sampleIgnoredCount);

  const sorted = [...realScans].sort((a, b) => safeDate(b.savedAt) - safeDate(a.savedAt));
  const newest = safeDate(sorted[0]?.savedAt);
  const oldest = safeDate(sorted[sorted.length - 1]?.savedAt);
  const spanDays = Math.max(1, Math.ceil((newest - oldest) / (24 * 60 * 60 * 1000)) + 1);
  const counts = new Map();
  let unverifiedTotal = 0;
  let feedbackTotal = 0;
  let wrongTotal = 0;
  let usefulTotal = 0;

  sorted.forEach((scan) => {
    unverifiedTotal += scan.unverified.length;
    const feedback = String(scan.feedback || '').toLowerCase();
    if (feedback) feedbackTotal += 1;
    if (feedback === 'wrong' || feedback === 'product issue') wrongTotal += 1;
    if (feedback === 'clear') usefulTotal += 1;

    scan.findings.forEach((finding) => {
      const cat = findingCategory(finding);
      (finding.items || []).forEach((item) => {
        const name = itemName(item);
        const kind = itemKind(item);
        const key = `${cat}:${name}`;
        const existing = counts.get(key) || {
          key,
          name,
          cat,
          count: 0,
          contains: 0,
          may: 0,
          days: new Set(),
          productNames: new Set(),
          firstSeenAt: scan.savedAt,
          lastSeenAt: scan.savedAt,
        };
        existing.count += 1;
        existing[kind] += 1;
        existing.days.add(dayKey(scan.savedAt));
        if (scan.product?.name) existing.productNames.add(scan.product.name);
        if (safeDate(scan.savedAt) > safeDate(existing.lastSeenAt)) existing.lastSeenAt = scan.savedAt;
        if (safeDate(scan.savedAt) < safeDate(existing.firstSeenAt)) existing.firstSeenAt = scan.savedAt;
        counts.set(key, existing);
      });
    });
  });

  const scanCount = sorted.length;
  const maxCount = Math.max(1, ...Array.from(counts.values()).map((item) => item.count));
  const unverifiedRate = clamp01(unverifiedTotal / Math.max(1, scanCount * 3));
  const wrongRate = clamp01(wrongTotal / Math.max(1, feedbackTotal));
  const usefulRate = clamp01(usefulTotal / Math.max(1, feedbackTotal));

  const topFindings = Array.from(counts.values()).map((row) => {
    const daysSinceSeen = Math.max(0, Math.floor((Date.now() - safeDate(row.lastSeenAt)) / (24 * 60 * 60 * 1000)));
    const features = {
      frequency: clamp01(row.count / maxCount),
      recency: clamp01(1 / (1 + daysSinceSeen / 14)),
      containsRatio: clamp01(row.contains / Math.max(1, row.count)),
      mayRatio: clamp01(row.may / Math.max(1, row.count)),
      categoryWeight: CAT_WEIGHT[row.cat] ?? CAT_WEIGHT.goal,
      unverifiedRate,
      wrongFeedback: wrongRate,
      repeatDays: clamp01(row.days.size / Math.min(spanDays, scanCount)),
    };
    return {
      name: row.name,
      cat: row.cat,
      count: row.count,
      contains: row.contains,
      may: row.may,
      days: row.days.size,
      productCount: row.productNames.size,
      firstSeenAt: row.firstSeenAt,
      lastSeenAt: row.lastSeenAt,
      score: Number(neuralAttentionScore(features).toFixed(4)),
      features,
    };
  }).sort((a, b) => b.score - a.score || b.count - a.count || a.name.localeCompare(b.name)).slice(0, 8);

  const ready = scanCount >= PATTERN_MIN_SCANS;
  const insights = [];
  if (!ready) {
    insights.push({
      id: 'collecting',
      title: 'Still collecting scans',
      body: `${scanCount} of ${PATTERN_MIN_SCANS} real scans saved. Nyara will avoid trend language until there is more history.`,
      level: 'info',
    });
  } else if (topFindings.length) {
    const top = topFindings[0];
    insights.push({
      id: 'top-repeat',
      title: `${top.name} shows up most often`,
      body: `${top.count} saved scan${top.count === 1 ? '' : 's'} included this match. This is a local diary summary, not a safety prediction.`,
      level: top.cat === 'allergen' ? 'attention' : 'info',
    });
  }
  if (unverifiedRate >= 0.35) {
    insights.push({
      id: 'unknown-heavy',
      title: 'Many labels include unknowns',
      body: 'A high share of saved scans had ingredients Nyara could not verify. Check original labels carefully.',
      level: 'attention',
    });
  }
  if (wrongRate >= 0.3) {
    insights.push({
      id: 'feedback-pressure',
      title: 'Review pressure is high',
      body: 'Several saved results were marked wrong or product-issue. Treat pattern summaries cautiously until those are reviewed.',
      level: 'attention',
    });
  }
  if (ready && !topFindings.length) {
    insights.push({
      id: 'no-matches',
      title: 'No repeated profile matches yet',
      body: 'You have enough scans for summaries, but no saved matches to rank.',
      level: 'info',
    });
  }

  const warnings = [];
  if (wrongRate >= 0.3) warnings.push('High wrong/product-issue feedback rate.');
  if (unverifiedRate >= 0.5) warnings.push('High unknown ingredient rate.');
  if (scanCount > 200) warnings.push('Input trimmed by caller should keep local analysis bounded.');

  return {
    schemaVersion: 1,
    model: {
      version: PATTERN_MODEL_VERSION,
      state: options.state ? 'resettable-local' : 'stateless-local',
      trainedOnDevice: true,
      medicalPrediction: false,
      runs: options.state?.runs || 0,
      lastClearedAt: options.state?.lastClearedAt || null,
    },
    ready,
    scanCount,
    sampleIgnoredCount,
    summary: ready
      ? 'Pattern summaries use only real saved scans on this device.'
      : `Pattern view starts at ${PATTERN_MIN_SCANS} real scans. Sample scans do not count.`,
    topFindings,
    insights,
    quality: {
      unverifiedRate: Number(unverifiedRate.toFixed(4)),
      wrongRate: Number(wrongRate.toFixed(4)),
      usefulRate: Number(usefulRate.toFixed(4)),
      issueCount: wrongTotal,
    },
    clearance: {
      ok: warnings.length === 0,
      warnings,
    },
  };
}
