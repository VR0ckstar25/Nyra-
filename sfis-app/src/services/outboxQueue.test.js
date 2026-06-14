// Node verification for the offline sync outbox queue semantics.
// Run: node src/services/outboxQueue.test.js  (wired into `npm test`)
// Covers the rules that protect a user's un-synced health data: dedupe (no
// stacking), profile singleton, expiry, oldest-first ordering, the 200 cap,
// retry backoff, and due-time checks.

const {
  buildOutboxItem, mergeOutboxItems, outboxDedupeKey, retryTime, isDue,
  OUTBOX_RETENTION_MS, RETRY_DELAYS_MS, OUTBOX_MAX,
} = require('./outboxQueue.js');

let pass = 0, fail = 0;
const failures = [];
const check = (name, cond, detail = '') => {
  if (cond) pass++;
  else { fail++; failures.push(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`); }
};

const T0 = Date.UTC(2026, 5, 12, 12, 0, 0);
const mk = (kind, id, atMs = T0) => buildOutboxItem({ kind, payload: { id }, id: `o-${kind}-${id}`, now: atMs });

// 1. Dedupe key: profile is a singleton; others key on payload id
check('profile dedupe is singleton', outboxDedupeKey({ kind: 'profile', payload: { id: 'x' } }) === 'profile:self');
check('scan dedupe keys on payload id', outboxDedupeKey({ kind: 'scan', payload: { id: 's1' } }) === 'scan:s1');

// 2. Re-enqueuing the same scan replaces, never stacks
let q = mergeOutboxItems([mk('scan', 's1')], [mk('scan', 's1')], T0);
check('duplicate scan does not stack', q.length === 1, JSON.stringify(q.map((i) => i.id)));

// 3. Two different scans + a profile coexist; second profile replaces the first
q = mergeOutboxItems([mk('scan', 's1'), mk('profile', 'p1')], [mk('scan', 's2'), mk('profile', 'p2')], T0);
check('distinct scans + single profile', q.length === 3 && q.filter((i) => i.kind === 'profile').length === 1, JSON.stringify(q.map(outboxDedupeKey)));

// 4. Expiry: an item older than retention is dropped
const stale = { ...mk('scan', 'old'), expiresAt: new Date(T0 - 1000).toISOString() };
q = mergeOutboxItems([stale, mk('scan', 's2')], [], T0);
check('expired item dropped', q.length === 1 && q[0].payload.id === 's2');

// 5. Ordering: oldest createdAt first
q = mergeOutboxItems([mk('scan', 'b', T0 + 5000), mk('scan', 'a', T0)], [], T0);
check('oldest-first ordering', q[0].payload.id === 'a' && q[1].payload.id === 'b');

// 6. Cap at OUTBOX_MAX
const many = Array.from({ length: OUTBOX_MAX + 50 }, (_, i) => mk('scan', `s${i}`, T0 + i));
check('queue capped at max', mergeOutboxItems(many, [], T0).length === OUTBOX_MAX);

// 7. Malformed items ignored
q = mergeOutboxItems([{ kind: 'scan' }, { payload: { id: 'x' } }, null], [mk('scan', 'ok')], T0);
check('malformed items ignored', q.length === 1 && q[0].payload.id === 'ok');

// 8. buildOutboxItem shape + retention
const item = buildOutboxItem({ kind: 'feedback', payload: { id: 'f1' }, id: 'o1', message: 'net down', now: T0 });
check('built item carries fields', item.attempts === 0 && item.lastError === 'net down' && item.nextRetryAt === item.createdAt);
check('expiry = now + retention', new Date(item.expiresAt).getTime() === T0 + OUTBOX_RETENTION_MS);

// 9. Retry backoff grows then clamps
check('attempt 0 → first delay', retryTime(0, T0) === new Date(T0 + RETRY_DELAYS_MS[0]).toISOString());
check('attempt 2 → third delay', retryTime(2, T0) === new Date(T0 + RETRY_DELAYS_MS[2]).toISOString());
check('attempt 99 clamps to last delay', retryTime(99, T0) === new Date(T0 + RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1]).toISOString());

// 10. isDue
check('item due when nextRetryAt passed', isDue({ nextRetryAt: new Date(T0 - 1).toISOString() }, T0));
check('item not due when nextRetryAt future', !isDue({ nextRetryAt: new Date(T0 + 1000).toISOString() }, T0));

console.log(`\n${pass} passed, ${fail} failed`);
failures.forEach((f) => console.log(f));
process.exit(fail ? 1 : 0);
