// localAccountService.js — backend-free email/password accounts (founder decision
// 2026-06-21: drop Firebase for now). An "account" is a local credential that gates
// THIS device's data — no server, so it works offline but does NOT sync or recover
// across devices. Password is salted + SHA-256 hashed in SecureStore; the raw
// password is never stored.
//
// Guarded requires keep it node-testable (in-memory store + node crypto fallback).

let SecureStore;
try { SecureStore = require('expo-secure-store'); } catch (e) {
  const mem = new Map();
  SecureStore = {
    getItemAsync: async (k) => (mem.has(k) ? mem.get(k) : null),
    setItemAsync: async (k, v) => { mem.set(k, v); },
    deleteItemAsync: async (k) => { mem.delete(k); },
  };
}
let ExpoCrypto;
try { ExpoCrypto = require('expo-crypto'); } catch (e) { ExpoCrypto = null; }
// Web Crypto: present as a global in node 18+ (used by tests) and absent in RN
// Hermes (where expo-crypto is used instead).
const webCrypto = (typeof globalThis !== 'undefined' && globalThis.crypto) || null;

const ACCOUNT_KEY = 'nyara.localAccount.v1';   // the credential record (persists)
const SESSION_KEY = 'nyara.localSession.v1';   // present only while signed in

function normalizeEmail(email) { return String(email || '').trim().toLowerCase(); }

// Deterministic uid from email so local data keys stay stable for an account.
function deriveUid(email) {
  const clean = normalizeEmail(email).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
  return `local-${clean || 'user'}`;
}

const toHex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

// Web Crypto path runs in node tests; expo-crypto path runs in React Native.
async function sha256Hex(input) {
  if (webCrypto?.subtle) {
    const data = new TextEncoder().encode(input);
    const buf = await webCrypto.subtle.digest('SHA-256', data);
    return toHex(new Uint8Array(buf));
  }
  if (ExpoCrypto?.digestStringAsync) {
    return ExpoCrypto.digestStringAsync(ExpoCrypto.CryptoDigestAlgorithm.SHA256, input);
  }
  throw new Error('No crypto available to hash the password.');
}

function randomSaltHex(bytes = 16) {
  if (webCrypto?.getRandomValues) {
    const a = new Uint8Array(bytes);
    webCrypto.getRandomValues(a);
    return toHex(a);
  }
  if (ExpoCrypto?.getRandomBytes) {
    return toHex(ExpoCrypto.getRandomBytes(bytes));
  }
  throw new Error('No CSPRNG available to salt the password.');
}

// Pure validation — returns an error string or null.
function validateCredentials({ email, password, username, mode }) {
  const clean = normalizeEmail(email);
  if (!clean || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) return 'Enter a valid email address.';
  if (!password || password.length < 6) return 'Password must be at least 6 characters.';
  if (mode === 'create' && username !== undefined && String(username).trim().length > 24) return 'Username must be 24 characters or fewer.';
  return null;
}

function toUser(account) {
  return {
    uid: account.uid,
    email: account.email,
    displayName: account.username || 'You',
    local: true,
    providerId: 'local.password',
  };
}

async function readAccount() {
  const text = await SecureStore.getItemAsync(ACCOUNT_KEY);
  if (!text) return null;
  try { return JSON.parse(text); } catch (e) { await SecureStore.deleteItemAsync(ACCOUNT_KEY).catch(() => {}); return null; }
}

// Create OR sign in to a local account, depending on `mode`. Returns { user }.
export async function localEmailAuth({ email, password, username, mode = 'sign-in' }) {
  const err = validateCredentials({ email, password, username, mode });
  if (err) throw new Error(err);
  const clean = normalizeEmail(email);
  const existing = await readAccount();

  if (mode === 'create') {
    if (existing && existing.email === clean) {
      throw new Error('An account with this email already exists on this device. Sign in instead.');
    }
    const salt = randomSaltHex();
    const hash = await sha256Hex(salt + password);
    const account = {
      uid: deriveUid(clean), email: clean,
      username: String(username || '').trim() || 'You',
      salt, hash, createdAt: new Date().toISOString(),
    };
    await SecureStore.setItemAsync(ACCOUNT_KEY, JSON.stringify(account));
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify({ uid: account.uid }));
    return { user: toUser(account) };
  }

  // sign-in
  if (!existing) throw new Error('No account on this device yet — create one first.');
  if (existing.email !== clean) throw new Error('That email does not match the account on this device.');
  const hash = await sha256Hex(existing.salt + password);
  // Local on-device hash compare — no remote timing surface (an attacker would
  // already need the unlocked device + SecureStore), so a plain compare is fine.
  // eslint-disable-next-line security/detect-possible-timing-attacks
  if (hash !== existing.hash) throw new Error('Incorrect password.');
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify({ uid: existing.uid }));
  return { user: toUser(existing) };
}

// The signed-in local user, or null. Used to restore the session on launch.
export async function getActiveLocalUser() {
  const session = await SecureStore.getItemAsync(SESSION_KEY);
  if (!session) return null;
  const account = await readAccount();
  return account ? toUser(account) : null;
}

// Sign out keeps the credential (so you can sign back in); only the session clears.
export async function signOutLocalAccount() {
  await SecureStore.deleteItemAsync(SESSION_KEY).catch(() => {});
}

// Full removal of the local account (used by "clear local data").
export async function deleteLocalAccount() {
  await SecureStore.deleteItemAsync(SESSION_KEY).catch(() => {});
  await SecureStore.deleteItemAsync(ACCOUNT_KEY).catch(() => {});
}

export { validateCredentials, deriveUid, normalizeEmail };
