// appCore.js — pure helpers extracted from App.js so identity/merge/session-restore
// logic is unit-testable in plain node instead of living inside the root component.
// No React, no side effects.

export const RESTORABLE_SCREENS = new Set([
  'diary', 'scan', 'patterns', 'profile', 'history',
  'policy', 'save-profile', 'getting-ready', 'onboarding-intent', 'onboarding', 'credibility', 'how-it-works', 'appearance', 'plans',
  'design-preview', 'visual-concept', 'security-backup',
]);
export const SCREEN_RESTORE_FALLBACKS = {
  camera: 'scan',
  result: 'diary',
};

export function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function serializeUser(user) {
  return user ? { uid: user.uid, email: user.email || '', displayName: user.displayName || '' } : null;
}

// Merge local + cloud records by id, newest wins (recency-aware across several date
// fields), returned newest-first. A stale local record must never beat a newer cloud
// one for the same id (and vice-versa).
export function mergeById(local = [], cloud = [], dateKey = 'savedAt') {
  const merged = new Map();
  [...cloud, ...local].forEach((item) => {
    if (!item?.id) return;
    const existing = merged.get(item.id);
    if (!existing) {
      merged.set(item.id, item);
      return;
    }
    const existingDate = new Date(existing?.[dateKey] || existing?.updatedAt || existing?.cloudUpdatedAt || existing?.createdAt || 0).getTime();
    const itemDate = new Date(item?.[dateKey] || item?.updatedAt || item?.cloudUpdatedAt || item?.createdAt || 0).getTime();
    if (itemDate >= existingDate) merged.set(item.id, item);
  });
  return Array.from(merged.values()).sort((a, b) => {
    const left = b?.[dateKey] || b?.createdAt || '';
    const right = a?.[dateKey] || a?.createdAt || '';
    return String(left).localeCompare(String(right));
  });
}

export function messageFrom(error, fallback = 'Unknown error') {
  return error?.message || String(error || fallback);
}

export function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

// Where to land on relaunch: no profile → welcome; otherwise the last screen if it's
// safe to restore (camera/result fall back), else the diary home.
export function restoreScreenFromSession(session, hasProfile) {
  if (!hasProfile) return 'welcome';
  const last = session?.lastScreen;
  const mapped = SCREEN_RESTORE_FALLBACKS[last] || last;
  return RESTORABLE_SCREENS.has(mapped) ? mapped : 'diary';
}
