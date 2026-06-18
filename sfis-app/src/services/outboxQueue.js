// outboxQueue.js — pure semantics for the offline cloud-sync outbox, extracted
// from App.js so the queue rules (dedupe, expiry, ordering, cap, retry backoff)
// are unit-testable in plain node instead of trapped in a React component.
//
// An outbox item: { id, kind, payload, createdAt, expiresAt, attempts,
//                    lastError, nextRetryAt }. kind ∈ 'profile'|'scan'|'feedback'|'event'.

export const OUTBOX_RETENTION_MS = 7 * 24 * 60 * 60 * 1000; // drop items older than a week
export const RETRY_DELAYS_MS = [5 * 60 * 1000, 15 * 60 * 1000, 60 * 60 * 1000, 6 * 60 * 60 * 1000];
export const OUTBOX_MAX = 200;

// One queued record per logical target: the profile is a singleton; everything
// else dedupes on its payload id so re-enqueuing a failed write replaces, not stacks.
export function outboxDedupeKey(item) {
  if (item.kind === 'profile') return 'profile:self';
  return `${item.kind}:${item.payload?.id || item.id}`;
}

// Build a fresh queue item. Pure: caller injects id/message/now so tests are
// deterministic (App.js passes its makeId + messageFrom + real clock).
export function buildOutboxItem({ kind, payload, id, message = 'Cloud sync failed', now = Date.now() }) {
  const createdAt = new Date(now).toISOString();
  return {
    id,
    kind,
    payload,
    createdAt,
    expiresAt: new Date(now + OUTBOX_RETENTION_MS).toISOString(),
    attempts: 0,
    lastError: message,
    nextRetryAt: createdAt,
  };
}

// Merge additions into the existing queue: dedupe by key (last write wins), drop
// expired items, order oldest-first, cap length. Malformed items are ignored.
export function mergeOutboxItems(existing = [], additions = [], now = Date.now()) {
  const byKey = new Map();
  const safe = (a) => (Array.isArray(a) ? a : []);
  [...safe(existing), ...safe(additions)].forEach((item) => {
    if (!item?.kind || !item?.payload) return;
    byKey.set(outboxDedupeKey(item), item);
  });
  return Array.from(byKey.values())
    .filter((item) => !item.expiresAt || new Date(item.expiresAt).getTime() > now)
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
    .slice(0, OUTBOX_MAX);
}

// Exponential-ish backoff: each attempt waits longer, clamped to the last bucket.
export function retryTime(attempts = 0, now = Date.now()) {
  const delay = RETRY_DELAYS_MS[Math.min(attempts, RETRY_DELAYS_MS.length - 1)];
  return new Date(now + delay).toISOString();
}

// Is this item due for another attempt at `now`?
export function isDue(item, now = Date.now()) {
  if (!item?.nextRetryAt) return true;
  return new Date(item.nextRetryAt).getTime() <= now;
}
