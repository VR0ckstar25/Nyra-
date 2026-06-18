import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingKeys = requiredKeys.filter((key) => !firebaseConfig[key]);

let app = null;
let auth = null;
let db = null;
let initError = null;

if (missingKeys.length === 0) {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    try {
      if (Platform.OS === 'web') {
        auth = getAuth(app);
      } else {
        const { getReactNativePersistence } = require('firebase/auth');
        // Hardening (review finding): persist auth/refresh tokens in SecureStore
        // (chunked, sanitized keys) instead of plaintext AsyncStorage. Falls back
        // to AsyncStorage only where SecureStore is unavailable — LOUDLY.
        const { createSecureAuthStorage } = require('./secureAuthStorage');
        const secureStorage = createSecureAuthStorage();
        if (!secureStorage) console.warn('Nyara: SecureStore unavailable — auth tokens falling back to AsyncStorage.');
        auth = initializeAuth(app, {
          persistence: getReactNativePersistence(secureStorage || AsyncStorage),
        });
      }
    } catch (error) {
      // No more silent downgrade (review finding): in-memory persistence signs
      // users out on every restart — say so where developers will see it.
      console.warn('Nyara: native auth persistence failed — sessions will NOT survive restarts:', error?.message);
      auth = getAuth(app);
    }
    db = getFirestore(app);
  } catch (error) {
    initError = error;
  }
}

export const firebaseReady = !!app && !!auth && !!db && !initError;
export const firebaseMissingKeys = missingKeys;
export const firebaseInitError = initError;
export const firebaseApp = app;
export const firebaseAuth = auth;
export const firestoreDb = db;

export function firebaseUnavailableMessage() {
  if (firebaseReady) return '';
  if (initError) return initError.message || 'Firebase failed to initialize.';
  return `Add Firebase values for: ${missingKeys.join(', ')}`;
}
