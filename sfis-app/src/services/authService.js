import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  OAuthProvider,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { firebaseAuth, firebaseReady, firebaseUnavailableMessage } from './firebaseClient';
import { localEmailAuth, getActiveLocalUser, signOutLocalAccount } from './localAccountService';

// With no Firebase keys we fall back to backend-free LOCAL accounts (email/password
// gating this device's data — no sync/recovery). This is the live mode today.
export const localAccountsActive = !firebaseReady;

const LAST_AUTH_USER_KEY = 'anvara.auth.lastUser.v1';
const DEMO_AUTH_USER_KEY = 'anvara.auth.preproductionUser.v1';
const NONCE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._';
const PREPRODUCTION_AUTH_ENABLED = process.env.EXPO_PUBLIC_PREPROD_AUTH === 'true' && process.env.NODE_ENV !== 'production';

export const preproductionAuthReady = PREPRODUCTION_AUTH_ENABLED && !firebaseReady;

function requireFirebaseAuth() {
  if (!firebaseReady || !firebaseAuth) {
    throw new Error(firebaseUnavailableMessage() || 'Firebase Auth is not configured.');
  }
  return firebaseAuth;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function makeNonce(size = 32) {
  const bytes = Crypto.getRandomBytes(size);
  return Array.from(bytes, (byte) => NONCE_CHARS[byte % NONCE_CHARS.length]).join('');
}

function demoUidFor(email, provider = 'email') {
  const clean = normalizeEmail(email || `${provider}@anvara.preprod`);
  return `preprod-${provider}-${clean.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 54)}`;
}

function makeDemoCredential({ email, provider = 'email', displayName = 'Preproduction user' }) {
  return {
    user: {
      uid: demoUidFor(email, provider),
      email: normalizeEmail(email),
      displayName,
      isAnonymous: false,
      providerId: `preproduction.${provider}`,
      preproduction: true,
    },
  };
}

async function saveDemoUser(user) {
  await SecureStore.setItemAsync(DEMO_AUTH_USER_KEY, JSON.stringify({
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || 'Preproduction user',
    preproduction: true,
    updatedAt: new Date().toISOString(),
  }));
}

async function readDemoUser() {
  const text = await SecureStore.getItemAsync(DEMO_AUTH_USER_KEY);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    await SecureStore.deleteItemAsync(DEMO_AUTH_USER_KEY).catch(() => {});
    return null;
  }
}

export function subscribeAuthState(callback) {
  if (!firebaseReady || !firebaseAuth) {
    // Local-account mode: restore the signed-in local user (if any). Fall back to
    // the legacy demo user only if preproduction demo auth is explicitly enabled.
    getActiveLocalUser()
      .then((user) => (user ? callback(user) : (preproductionAuthReady ? readDemoUser().then(callback) : callback(null))))
      .catch(() => callback(null));
    return () => {};
  }

  return onAuthStateChanged(firebaseAuth, (user) => {
    if (user) {
      SecureStore.setItemAsync(LAST_AUTH_USER_KEY, JSON.stringify({
        uid: user.uid,
        email: user.email || '',
        updatedAt: new Date().toISOString(),
      })).catch(() => {});
    } else {
      SecureStore.deleteItemAsync(LAST_AUTH_USER_KEY).catch(() => {});
    }
    callback(user);
  });
}

export async function signInWithDemoGoogle() {
  if (!preproductionAuthReady) {
    throw new Error('Preproduction demo auth is not enabled.');
  }
  const credential = makeDemoCredential({
    email: 'google.demo@anvara.preprod',
    provider: 'google',
    displayName: 'Google demo',
  });
  await saveDemoUser(credential.user);
  return credential;
}

export async function signInWithEmail({ email, password, username, mode = 'sign-in' }) {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail || !password) {
    throw new Error('Enter an email and password.');
  }
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  // No Firebase keys → backend-free local account (validates + hashes on device).
  if (!firebaseReady) {
    return localEmailAuth({ email: cleanEmail, password, username, mode });
  }

  const auth = requireFirebaseAuth();
  if (mode === 'create') {
    return createUserWithEmailAndPassword(auth, cleanEmail, password);
  }
  return signInWithEmailAndPassword(auth, cleanEmail, password);
}

export async function resetPassword(email) {
  if (!firebaseReady) {
    // Local accounts have no server to email a reset link. Be honest about it.
    const cleanEmail = normalizeEmail(email);
    if (!cleanEmail) throw new Error('Enter your email first.');
    throw new Error('This is a local account, so there is no reset email. If you forgot the password, you can clear local data in Profile and set up again (your saved scans on this device stay).');
  }
  const auth = requireFirebaseAuth();
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) throw new Error('Enter your email first.');
  return sendPasswordResetEmail(auth, cleanEmail);
}

export async function signInWithGoogleIdToken(idToken) {
  const auth = requireFirebaseAuth();
  if (!idToken) throw new Error('Google did not return an ID token.');
  const credential = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(auth, credential);
}

export async function signInWithApple() {
  const auth = requireFirebaseAuth();
  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) {
    throw new Error('Apple sign-in is available only on supported Apple devices.');
  }

  const rawNonce = makeNonce();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  const appleCredential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });

  if (!appleCredential.identityToken) {
    throw new Error('Apple did not return an identity token.');
  }

  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({
    idToken: appleCredential.identityToken,
    rawNonce,
  });

  return signInWithCredential(auth, credential);
}

export async function signOutCurrentUser() {
  if (!firebaseReady) {
    await signOutLocalAccount().catch(() => {});
    await SecureStore.deleteItemAsync(DEMO_AUTH_USER_KEY).catch(() => {});
    return;
  }
  const auth = requireFirebaseAuth();
  await signOut(auth);
  await SecureStore.deleteItemAsync(LAST_AUTH_USER_KEY).catch(() => {});
}
