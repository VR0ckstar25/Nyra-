// testAccounts.js — four TEST member accounts (founder request 2026-06-11) so the
// family search/add flow can be exercised end-to-end through the real UI without
// OAuth. Fake people, realistic shapes. When accounts go live these become seeded
// directory users; the search swaps from this list to the real user directory.
// NEVER ship enabled in production builds.

export const TEST_ACCOUNTS = [
  {
    id: 'test-maya',
    name: 'Maya Lindqvist',
    email: 'maya.test@anvara.dev',
    child: false,
    watched: [
      { id: 'peanut', severity: 'Strict avoid' },
      { id: 'allergen.treenut', severity: 'Strict avoid' },
    ],
  },
  {
    id: 'test-theo',
    name: 'Theo Lindqvist',
    email: 'theo.test@anvara.dev',
    child: true,
    watched: [
      { id: 'milk', severity: 'Important' },
      { id: 'goal.less_sugar', severity: 'Prefer less' },
    ],
  },
  {
    id: 'test-ava',
    name: 'Ava Chen',
    email: 'ava.test@anvara.dev',
    child: true,
    watched: [
      { id: 'egg', severity: 'Flag it' },
    ],
  },
  {
    id: 'test-rohan',
    name: 'Rohan Patel',
    email: 'rohan.test@anvara.dev',
    child: false,
    watched: [
      { id: 'gluten', severity: 'Strict' },
      { id: 'sesame', severity: 'Important' },
    ],
  },
];

export function searchTestAccounts(query, excludeIds = []) {
  // Hard guard (review finding): the test directory must never resolve in a
  // production bundle — the comment alone wasn't a guard. __DEV__ is set by
  // Metro; the typeof check keeps plain-node tests working.
  if (typeof __DEV__ !== 'undefined' && !__DEV__) return [];
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [];
  return TEST_ACCOUNTS.filter((a) =>
    !excludeIds.includes(a.id) &&
    (a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)));
}
