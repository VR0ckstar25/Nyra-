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

// Family plans carry a per-member allowance; only they expose the token ledger.
export function isFamilyPlan(planId) {
  return !!planFor(planId).perMemberMonthlyScans;
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

const HOUSE_ADS = {
  home: {
    id: 'house-home',
    eyebrow: 'Anvara Free',
    title: 'Keep the result screen quiet.',
    body: 'Free may show occasional house messages on Home, Diary, and Patterns. Allergy results stay ad-free by design.',
    action: 'View plans',
  },
  diary: {
    id: 'house-diary',
    eyebrow: 'Anvara Free',
    title: 'More room to look back.',
    body: 'Plus and Family keep a longer scan history and add family profiles. Result screens stay ad-free on every plan.',
    action: 'View plans',
  },
  patterns: {
    id: 'house-patterns',
    eyebrow: 'Anvara Free',
    title: 'Richer patterns on Family.',
    body: 'Family plans enrich what Patterns can show across everyone you watch for. These house messages never touch a result.',
    action: 'View plans',
  },
};

export function houseAdForContext(commercial, context = 'home') {
  if (!shouldShowHouseAds(commercial, context)) return null;
  return HOUSE_ADS[context] || HOUSE_ADS.home;
}

export function billingStatus(commercial) {
  const normalized = normalizeCommercial(commercial);
  return normalized.billingMode === 'store'
    ? 'Store billing connected'
    : 'Preview mode - no real purchase or charge is made.';
}

// ── Family token ledger (founder spec 2026-06-12) ───────────────────────────
// Family plans give EACH member their own monthly scan credits, and members can
// transfer unused credits to each other ("if there were a missing member their
// credits can be distributed"). When a member leaves mid-cycle, their remaining
// credits move to a shared 'pool' the owner can hand out. Calendar-month cycles.
//
// ledger shape: { cycle:'YYYY-MM', members:{ [id]:{ allowance, used, received, given } } }
export const FAMILY_POOL_ID = 'pool';

function emptyEntry(allowance = 0) {
  return { allowance, used: 0, received: 0, given: 0 };
}

export function memberRemaining(entry) {
  if (!entry) return 0;
  return Math.max(0, (entry.allowance + entry.received) - (entry.given + entry.used));
}

// members: [{ id, name?, child? }] — must include self (id 'self').
export function normalizeFamilyLedger(ledger, commercial, members = [], now = new Date()) {
  const plan = planFor(normalizeCommercial(commercial).planId);
  const per = plan.perMemberMonthlyScans || 0;
  const key = cycleKey(now);
  const fresh = !ledger || ledger.cycle !== key;
  const prev = (!fresh && ledger.members && typeof ledger.members === 'object') ? ledger.members : {};
  const next = { cycle: key, members: {} };
  const memberList = (Array.isArray(members) ? members : []).filter((m) => m && typeof m === 'object' && m.id);
  const liveIds = new Set(memberList.map((m) => m.id));

  memberList.forEach((m) => {
    const entry = prev[m.id];
    next.members[m.id] = entry && !fresh
      ? { allowance: per, used: entry.used, received: entry.received, given: entry.given }
      : emptyEntry(per);
  });

  // departed members: remaining credits flow into the transferable pool
  const pool = prev[FAMILY_POOL_ID] && !fresh ? { ...prev[FAMILY_POOL_ID] } : emptyEntry(0);
  if (!fresh) {
    Object.entries(prev).forEach(([id, entry]) => {
      if (id === FAMILY_POOL_ID || liveIds.has(id)) return;
      pool.received += memberRemaining(entry);
    });
  }
  next.members[FAMILY_POOL_ID] = pool;
  return next;
}

// Move n unused credits from one member (or the pool) to another.
export function transferScans(ledger, fromId, toId, n) {
  const amount = Math.floor(Number(n) || 0);
  if (amount <= 0) return { ok: false, reason: 'Transfer amount must be a positive number.', ledger };
  if (fromId === toId) return { ok: false, reason: 'Pick two different members.', ledger };
  const from = ledger?.members?.[fromId];
  const to = ledger?.members?.[toId];
  if (!from || !to) return { ok: false, reason: 'Both members must be on the family plan.', ledger };
  if (memberRemaining(from) < amount) {
    return { ok: false, reason: `Only ${memberRemaining(from)} scans left to transfer.`, ledger };
  }
  const next = { ...ledger, members: { ...ledger.members,
    [fromId]: { ...from, given: from.given + amount },
    [toId]: { ...to, received: to.received + amount } } };
  return { ok: true, ledger: next };
}

export function canScanForMember(ledger, memberId) {
  const remaining = memberRemaining(ledger?.members?.[memberId]);
  return { allowed: remaining > 0, remaining };
}

// Scan gate for a family plan, shaped like scanQuota() so the UI is uniform. Founder
// decision (2026-06-18): a family scan consumes the SCANNING member's own credit
// (self on this device); transfers rebalance. Includes credits received via transfer.
export function familyScanGate(ledger, commercial, memberId = 'self', now = new Date()) {
  const plan = planFor(normalizeCommercial(commercial).planId);
  const base = plan.perMemberMonthlyScans || 0;
  const entry = ledger?.members?.[memberId] || { allowance: base, used: 0, received: 0, given: 0 };
  const allowance = entry.allowance + entry.received - entry.given; // this member's effective pool
  const remaining = memberRemaining(entry);
  const nextResetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
  return { allowance, used: entry.used, remaining, allowed: remaining > 0, nextResetAt, family: true };
}

export function recordFamilyScan(ledger, memberId) {
  const entry = ledger?.members?.[memberId];
  if (!entry || memberRemaining(entry) <= 0) return ledger;
  return { ...ledger, members: { ...ledger.members, [memberId]: { ...entry, used: entry.used + 1 } } };
}

export function familyTotals(ledger) {
  const entries = Object.entries(ledger?.members || {});
  return entries.reduce((acc, [id, e]) => {
    acc.allowance += e.allowance + (id === FAMILY_POOL_ID ? e.received : 0);
    acc.used += e.used;
    acc.remaining += memberRemaining(e);
    return acc;
  }, { allowance: 0, used: 0, remaining: 0 });
}
