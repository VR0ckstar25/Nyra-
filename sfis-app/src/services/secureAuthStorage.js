// secureAuthStorage.js — SecureStore-backed AsyncStorage-shaped adapter for
// Firebase Auth persistence (review finding: refresh tokens lived in plaintext
// AsyncStorage while SecureStore protected only a trivial uid cache).
//
// Constraints handled:
//  • SecureStore keys allow only [A-Za-z0-9._-]; Firebase keys contain ':' and
//    '[DEFAULT]' → keys are sanitized deterministically.
//  • SecureStore values should stay ≤ ~2KB; Firebase's persisted user blob can
//    exceed that → values are chunked (same approach as localDataStore).
//
// createSecureAuthStorage(impl) takes an injectable SecureStore implementation
// so the chunk/sanitize logic is unit-testable in plain node.

const CHUNK_SIZE = 1800;

function defaultSecureStore() {
  try {
    // eslint-disable-next-line global-require
    return require('expo-secure-store');
  } catch (e) {
    return null; // non-native env (tests inject their own impl)
  }
}

const sanitizeKey = (key) => `anvara.auth.${String(key).replace(/[^A-Za-z0-9._-]/g, '_')}`;
const metaKey = (key) => `${sanitizeKey(key)}.n`;
const chunkKey = (key, i) => `${sanitizeKey(key)}.${i}`;

export function createSecureAuthStorage(impl = defaultSecureStore()) {
  if (!impl) return null;

  return {
    async getItem(key) {
      const count = Number(await impl.getItemAsync(metaKey(key)));
      if (!count || Number.isNaN(count)) return null;
      const parts = [];
      for (let i = 0; i < count; i++) {
        const part = await impl.getItemAsync(chunkKey(key, i));
        if (part == null) return null; // torn write → treat as signed out, never corrupt
        parts.push(part);
      }
      return parts.join('');
    },

    async setItem(key, value) {
      const str = String(value);
      const chunks = [];
      for (let i = 0; i < str.length; i += CHUNK_SIZE) chunks.push(str.slice(i, i + CHUNK_SIZE));
      // write chunks first, meta last — readers never see a half-written value
      for (let i = 0; i < chunks.length; i++) await impl.setItemAsync(chunkKey(key, i), chunks[i]);
      const prev = Number(await impl.getItemAsync(metaKey(key))) || 0;
      await impl.setItemAsync(metaKey(key), String(chunks.length));
      for (let i = chunks.length; i < prev; i++) await impl.deleteItemAsync(chunkKey(key, i)).catch(() => {});
    },

    async removeItem(key) {
      const count = Number(await impl.getItemAsync(metaKey(key))) || 0;
      await impl.deleteItemAsync(metaKey(key)).catch(() => {});
      for (let i = 0; i < count; i++) await impl.deleteItemAsync(chunkKey(key, i)).catch(() => {});
    },
  };
}

export default createSecureAuthStorage;
