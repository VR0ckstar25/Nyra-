export const PLAN_IDS = {
  free: 'free',
  plus: 'plus',
  family: 'family',
  familyPro: 'familyPro',
};

export const DEFAULT_COMMERCIAL = {
  planId: PLAN_IDS.free,
  billingMode: 'preview',
  houseAdsEnabled: true,
  adPersonalizationAllowed: false,
  updatedAt: null,
};

// Quotas (founder decisions 2026-06-12): Free 10 scans/month; V1 (Plus) 40/month;
// Family Basic 50 scans/month PER MEMBER; Family Pro 60/member + enriched
// patterns/feedback. Cycles are calendar months — at the cap, scanning blocks
// until the 1st unless the user upgrades. Quotas count REAL scans only (never
// samples), and a blocked scan is a calm notice, never a dark pattern.
export const PLAN_LEVELS = [
  {
    id: PLAN_IDS.free,
    label: 'Free',
    price: '$0',
    badge: 'House ads',
    monthlyScans: 10,
    perMemberMonthlyScans: null,
    summary: 'Try Anvara with local scanning, diary, and focused offline packs.',
    features: [
      '10 scans a month',
      'Manual and camera-assisted scanning',
      'Local diary and basic patterns',
      'House messages on Home only',
    ],
  },
  {
    id: PLAN_IDS.plus,
    label: 'Plus',
    price: 'Preview',
    badge: 'No ads',
    monthlyScans: 40,
    perMemberMonthlyScans: null,
    summary: 'A quieter single-person setup for frequent label checks.',
    features: [
      '40 scans a month',
      'No house messages',
      'Cloud backup when signed in',
      'Security, offline, and local checkpoint tools',
    ],
  },
  {
    id: PLAN_IDS.family,
    label: 'Family',
    price: 'Preview',
    badge: 'Up to 5 profiles',
    monthlyScans: 50,
    perMemberMonthlyScans: 50,
    summary: 'Built for households managing more than one watchlist.',
    features: [
      '50 scans a month for every family member',
      'One camera scan checks every member’s allergies at once',
      'No house messages',
      'Family profiles up to the 5-profile cap',
    ],
  },
  {
    id: PLAN_IDS.familyPro,
    label: 'Family Pro',
    price: 'Preview',
    badge: 'Richest tracking',
    monthlyScans: 60,
    perMemberMonthlyScans: 60,
    summary: 'Everything in Family, with deeper questions and richer pattern tracking.',
    features: [
      '60 scans a month for every family member',
      'One camera scan checks every member’s allergies at once',
      'Extra follow-up questions and feedback that enrich Patterns',
      'No house messages',
    ],
  },
];

// ── Scan quota mechanics (calendar-month cycles) ────────────────────────────
// usage shape: { cycle: 'YYYY-MM', used: number } — persisted with the profile.
export function cycleKey(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function normalizeUsage(usage, now = new Date()) {
  const key = cycleKey(now);
  if (!usage || usage.cycle !== key) return { cycle: key, used: 0 }; // calendar rollover resets
  return { cycle: key, used: Math.max(0, Number(usage.used) || 0) };
}

// Family plans: the pool scales per member (self counts as one member).
export function monthlyScanAllowance(commercial, memberCount = 1) {
  const plan = planFor(normalizeCommercial(commercial).planId);
  if (plan.perMemberMonthlyScans) return plan.perMemberMonthlyScans * Math.max(1, memberCount);
  return plan.monthlyScans;
}

export function scanQuota(commercial, usage, memberCount = 1, now = new Date()) {
  const allowance = monthlyScanAllowance(commercial, memberCount);
  const current = normalizeUsage(usage, now);
  const remaining = Math.max(0, allowance - current.used);
  // nextResetAt = first instant of the next calendar month (the "calendar block")
  const nextResetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
  return { allowance, used: current.used, remaining, allowed: remaining > 0, cycle: current.cycle, nextResetAt };
}

export function recordScanUsage(usage, now = new Date()) {
  const current = normalizeUsage(usage, now);
  return { ...current, used: current.used + 1 };
}

const PLAN_BY_ID = Object.fromEntries(PLAN_LEVELS.map((plan) => [plan.id, plan]));

export function normalizeCommercial(value = {}) {
  const raw = value && typeof value === 'object' ? value : {};
  const planId = PLAN_BY_ID[raw.planId] ? raw.planId : PLAN_IDS.free;
  return {
    ...DEFAULT_COMMERCIAL,
    ...raw,
    planId,
    billingMode: raw.billingMode === 'store' ? 'store' : 'preview',
    houseAdsEnabled: raw.houseAdsEnabled !== false,
    adPersonalizationAllowed: false,
    updatedAt: raw.updatedAt || null,
  };
}

export function planFor(planId) {
  return PLAN_BY_ID[planId] || PLAN_BY_ID[PLAN_IDS.free];
}

export function updateCommercialPlan(current, planId) {
  const normalized = normalizeCommercial(current);
  const nextPlan = planFor(planId);
  return normalizeCommercial({
    ...normalized,
    planId: nextPlan.id,
    houseAdsEnabled: nextPlan.id === PLAN_IDS.free,
    updatedAt: new Date().toISOString(),
  });
}

export function shouldShowHouseAds(commercial, context = 'home') {
  const normalized = normalizeCommercial(commercial);
  if (context === 'result' || context === 'camera') return false;
  return normalized.planId === PLAN_IDS.free && normalized.houseAdsEnabled;
}

export function houseAdForContext(commercial, context = 'home') {
  if (!shouldShowHouseAds(commercial, context)) return null;
  if (context === 'home') {
    return {
      id: 'free-plus-house-message',
      eyebrow: 'Anvara Free',
      title: 'Keep the result screen quiet.',
      body: 'Free may show occasional house messages here on Home. Allergy results stay ad-free by design.',
      action: 'View plans',
    };
  }
  return {
    id: 'free-house-message',
    eyebrow: 'Anvara Free',
    title: 'House message',
    body: 'Free messages never appear on result details.',
    action: 'View plans',
  };
}

export function billingStatus(commercial) {
  const normalized = normalizeCommercial(commercial);
  return normalized.billingMode === 'store'
    ? 'Store billing connected'
    : 'Preview mode - no real purchase or charge is made.';
}
