// Node verification for the SecureStore-backed Firebase auth persistence adapter.
// Run: node src/services/secureAuthStorage.test.js  (wired into `npm test`)

const { createSecureAuthStorage } = require('./secureAuthStorage.js');

let pass = 0, fail = 0;
const failures = [];
const check = (name, cond, detail = '') => {
  if (cond) pass++;
  else { fail++; failures.push(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`); }
};

// in-memory SecureStore stub that REJECTS illegal keys, like the real one
const store = new Map();
const stub = {
  async getItemAsync(k) { assertKey(k); return store.has(k) ? store.get(k) : null; },
  async setItemAsync(k, v) { assertKey(k); store.set(k, String(v)); },
  async deleteItemAsync(k) { assertKey(k); store.delete(k); },
};
function assertKey(k) { if (!/^[A-Za-z0-9._-]+$/.test(k)) throw new Error(`illegal SecureStore key: ${k}`); }

(async () => {
  const s = createSecureAuthStorage(stub);

  // 1. Firebase-shaped key (':' and '[DEFAULT]') round-trips without key errors
  const fbKey = 'firebase:authUser:AIzaFAKE:[DEFAULT]';
  await s.setItem(fbKey, '{"uid":"u1"}');
  check('firebase-shaped key round-trips', (await s.getItem(fbKey)) === '{"uid":"u1"}');

  // 2. Oversized value (> 2KB) chunks and reassembles byte-exact
  const big = 'x'.repeat(5000) + JSON.stringify({ refreshToken: 'r'.repeat(1234) });
  await s.setItem(fbKey, big);
  check('5KB+ blob chunks and reassembles', (await s.getItem(fbKey)) === big);
  check('chunks actually under SecureStore limit', [...store.values()].every((v) => v.length <= 1800));

  // 3. Shrinking value cleans up stale chunks
  await s.setItem(fbKey, 'tiny');
  check('shrink leaves no stale chunks readable', (await s.getItem(fbKey)) === 'tiny');

  // 4. removeItem clears everything
  await s.removeItem(fbKey);
  check('removeItem clears value', (await s.getItem(fbKey)) === null);
  check('removeItem leaves no orphan keys', [...store.keys()].filter((k) => k.includes('authUser')).length === 0);

  // 5. Missing native module → null adapter (caller falls back loudly)
  check('null impl yields null adapter', createSecureAuthStorage(null) === null);

  console.log(`\n${pass} passed, ${fail} failed`);
  failures.forEach((f) => console.log(f));
  process.exit(fail ? 1 : 0);
})();
