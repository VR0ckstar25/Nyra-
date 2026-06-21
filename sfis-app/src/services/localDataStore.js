import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { DEFAULT_COMMERCIAL, normalizeCommercial } from './commercialModel';
import { normalizeSeverityFor, PROFILE_ITEM_CAP, PROFILE_LABELS } from '../profile/profileModel';

export const LOCAL_SCHEMA_VERSION = 3;
export const LOCAL_KEYS = {
  profile: 'nyara.profile.v1',
  scans: 'nyara.savedScans.v1',
  feedback: 'nyara.feedback.v1',
  settings: 'nyara.settings.v1',
  outbox: 'nyara.syncOutbox.v1',
  offlinePack: 'nyara.offlinePack.v1',
  security: 'nyara.security.v1',
  localBackup: 'nyara.localBackup.v1',
  session: 'nyara.session.v1',
  // uid that owns the on-device health data. Survives sign-out ON PURPOSE: a
  // different account signing in must NOT auto-merge this device's data
  // (cross-account health-data bleed - adversarial review, critical).
  dataOwner: 'nyara.dataOwner.v1',
};

export const DEFAULT_SETTINGS = {
  saveLabelImages: false,
  cloudBackupEnabled: true,
  autoOfflinePack: true,
  appLockTimeoutMinutes: 5,
  policyAcceptedAt: null,
  safetyAcknowledgedAt: null,
  onboardingIntent: null,
  commercial: DEFAULT_COMMERCIAL,
};

const CHUNK_SIZE = 1800;

export class LocalDataError extends Error {
  constructor(message, key, cause) {
    super(message);
    this.name = 'LocalDataError';
    this.key = key;
    this.cause = cause;
  }
}

function metaKey(key) {
  return `${key}.secure.meta`;
}

function chunkKey(key, generation, index) {
  return `${key}.secure.${generation}.${index}`;
}

function splitText(text) {
  const chunks = [];
  for (let i = 0; i < text.length; i += CHUNK_SIZE) chunks.push(text.slice(i, i + CHUNK_SIZE));
  return chunks.length ? chunks : [''];
}

function normalizeWatchedItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    const id = typeof item === 'string' ? item : item?.id;
    if (!id) return null;
    const source = PROFILE_LABELS[id] || {};
    const label = typeof item === 'string' ? (source.label || id) : (item.label || source.label || id);
    const palette = typeof item === 'string' ? source.palette : (item.palette || item.category || source.palette);
    return {
      id,
      label,
      category: palette || 'goal',
      palette: palette || 'goal',
      severity: normalizeSeverityFor(id, typeof item === 'string' ? undefined : item.severity, palette),
    };
  }).filter(Boolean).slice(0, PROFILE_ITEM_CAP);
}

function normalizeFamilyMembers(members) {
  if (!Array.isArray(members)) return [];
  return members.map((member, index) => ({
    id: member.id || `member-${index}`,
    name: member.name || 'Family member',
    email: member.email || '',
    child: !!member.child,
    watched: normalizeWatchedItems(member.watched || member.items),
  })).slice(0, 4);
}

function normalizeProfile(profile) {
  if (!profile || typeof profile !== 'object') return null;
  return {
    id: profile.id || 'self',
    name: profile.name || 'You',
    type: profile.type || 'adult',
    createdAt: profile.createdAt || new Date().toISOString(),
    updatedAt: profile.updatedAt || new Date().toISOString(),
    familyMembers: normalizeFamilyMembers(profile.familyMembers),
    items: normalizeWatchedItems(profile.items),
  };
}

function normalizeScans(scans) {
  if (!Array.isArray(scans)) return [];
  return scans.map((scan, index) => ({
    id: scan.id || `scan-migrated-${index}`,
    savedAt: scan.savedAt || scan.product?.date || new Date().toISOString(),
    source: scan.source || 'manual',
    product: scan.product || {},
    findings: Array.isArray(scan.findings) ? scan.findings : [],
    unverified: Array.isArray(scan.unverified) ? scan.unverified : [],
    feedback: scan.feedback || null,
    ocr: scan.ocr || null,
    image: scan.image || null,
  })).slice(0, 200);
}

function normalizeFeedback(feedback) {
  if (!Array.isArray(feedback)) return [];
  return feedback.map((entry, index) => ({
    id: entry.id || `feedback-migrated-${index}`,
    label: entry.label || 'unsure',
    category: entry.category || 'result_feedback',
    source: entry.source || 'result',
    note: entry.note || '',
    createdAt: entry.createdAt || new Date().toISOString(),
    savedScanId: entry.savedScanId || null,
    product: entry.product || {},
  })).slice(0, 200);
}

function normalizeSettings(settings) {
  const clean = settings && typeof settings === 'object' ? settings : {};
  return {
    ...DEFAULT_SETTINGS,
    ...clean,
    commercial: normalizeCommercial(clean.commercial || DEFAULT_SETTINGS.commercial),
  };
}

function normalizeOutbox(outbox) {
  if (!Array.isArray(outbox)) return [];
  const now = Date.now();
  return outbox.filter((item) => !item.expiresAt || new Date(item.expiresAt).getTime() > now).slice(0, 200);
}

function normalizeOfflinePack(pack) {
  if (!pack || typeof pack !== 'object') return null;
  return {
    id: pack.id || 'offline-pack',
    recommendationVersion: pack.recommendationVersion || null,
    selectedPackIds: Array.isArray(pack.selectedPackIds) ? pack.selectedPackIds : [],
    data: pack.data || null,
    features: pack.features || {},
    downloadedAt: pack.downloadedAt || new Date().toISOString(),
    bytes: pack.bytes || 0,
    termCount: pack.termCount || pack.data?.terms?.length || 0,
  };
}

function normalizeSecurity(security) {
  if (!security || typeof security !== 'object') {
    return {
      appLockEnabled: false,
      salt: null,
      pinHash: null,
      failedAttempts: 0,
      lockedUntil: null,
      createdAt: null,
      updatedAt: null,
    };
  }
  return {
    appLockEnabled: !!(security.appLockEnabled && security.salt && security.pinHash),
    salt: security.salt || null,
    pinHash: security.pinHash || null,
    failedAttempts: Number.isFinite(security.failedAttempts) ? security.failedAttempts : 0,
    lockedUntil: security.lockedUntil || null,
    createdAt: security.createdAt || null,
    updatedAt: security.updatedAt || new Date().toISOString(),
  };
}

function normalizeLocalBackup(backup) {
  if (!backup || typeof backup !== 'object') return null;
  const scans = normalizeScans(backup.scans);
  const feedback = normalizeFeedback(backup.feedback);
  return {
    id: backup.id || 'local-backup',
    createdAt: backup.createdAt || new Date().toISOString(),
    schemaVersion: backup.schemaVersion || LOCAL_SCHEMA_VERSION,
    profile: normalizeProfile(backup.profile),
    scans,
    feedback,
    settings: normalizeSettings(backup.settings),
    offlinePack: normalizeOfflinePack(backup.offlinePack),
    counts: {
      scans: scans.length,
      feedback: feedback.length,
      watchedItems: Array.isArray(backup.profile?.items) ? backup.profile.items.length : 0,
    },
  };
}

function normalizeSession(session) {
  if (!session || typeof session !== 'object') {
    return {
      lastScreen: null,
      returnTo: null,
      activeTask: null,
      updatedAt: null,
    };
  }
  const task = session.activeTask && typeof session.activeTask === 'object' ? session.activeTask : null;
  return {
    lastScreen: typeof session.lastScreen === 'string' ? session.lastScreen : null,
    returnTo: typeof session.returnTo === 'string' ? session.returnTo : null,
    activeTask: task ? {
      id: task.id || `task-${Date.now()}`,
      type: task.type || 'work',
      label: task.label || 'Work',
      startedAt: task.startedAt || new Date().toISOString(),
      updatedAt: task.updatedAt || new Date().toISOString(),
    } : null,
    updatedAt: session.updatedAt || new Date().toISOString(),
  };
}

function normalizeByKey(key, value) {
  switch (key) {
    case LOCAL_KEYS.profile: return normalizeProfile(value);
    case LOCAL_KEYS.scans: return normalizeScans(value);
    case LOCAL_KEYS.feedback: return normalizeFeedback(value);
    case LOCAL_KEYS.settings: return normalizeSettings(value);
    case LOCAL_KEYS.outbox: return normalizeOutbox(value);
    case LOCAL_KEYS.offlinePack: return normalizeOfflinePack(value);
    case LOCAL_KEYS.security: return normalizeSecurity(value);
    case LOCAL_KEYS.localBackup: return normalizeLocalBackup(value);
    case LOCAL_KEYS.session: return normalizeSession(value);
    default: return value;
  }
}

async function getMeta(key) {
  const text = await SecureStore.getItemAsync(metaKey(key));
  return text ? JSON.parse(text) : null;
}

async function readSecureJson(key) {
  const meta = await getMeta(key);
  if (!meta) return undefined;
  const chunks = [];
  for (let i = 0; i < meta.chunks; i += 1) {
    const text = await SecureStore.getItemAsync(chunkKey(key, meta.generation, i));
    if (text == null) throw new LocalDataError('Encrypted local data is incomplete.', key);
    chunks.push(text);
  }
  const envelope = JSON.parse(chunks.join(''));
  return normalizeByKey(key, envelope.value);
}

export async function writeLocalValue(key, value) {
  const normalized = normalizeByKey(key, value);
  const generation = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const envelope = JSON.stringify({
    schemaVersion: LOCAL_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    value: normalized,
  });
  const chunks = splitText(envelope);
  let previousMeta = null;

  try {
    previousMeta = await getMeta(key).catch(() => null);
    await Promise.all(chunks.map((chunk, index) => SecureStore.setItemAsync(chunkKey(key, generation, index), chunk)));
    await SecureStore.setItemAsync(metaKey(key), JSON.stringify({
      schemaVersion: LOCAL_SCHEMA_VERSION,
      generation,
      chunks: chunks.length,
      savedAt: new Date().toISOString(),
    }));
    if (previousMeta?.generation && previousMeta.generation !== generation) {
      await Promise.all(Array.from({ length: previousMeta.chunks || 0 }, (_, index) => (
        SecureStore.deleteItemAsync(chunkKey(key, previousMeta.generation, index)).catch(() => {})
      )));
    }
    return normalized;
  } catch (error) {
    await Promise.all(chunks.map((_, index) => SecureStore.deleteItemAsync(chunkKey(key, generation, index)).catch(() => {})));
    throw new LocalDataError(`Could not save ${labelForKey(key)} securely on this device.`, key, error);
  }
}

export async function readLocalValue(key, fallback) {
  try {
    const secure = await readSecureJson(key);
    if (secure !== undefined) return { value: secure, migrated: false };

    const legacy = await AsyncStorage.getItem(key);
    if (legacy == null) return { value: normalizeByKey(key, fallback), migrated: false };

    const parsed = JSON.parse(legacy);
    const normalized = await writeLocalValue(key, parsed);
    await AsyncStorage.removeItem(key).catch(() => {});
    return { value: normalized, migrated: true };
  } catch (error) {
    return {
      value: normalizeByKey(key, fallback),
      error: error instanceof LocalDataError ? error : new LocalDataError(`Could not read ${labelForKey(key)}.`, key, error),
    };
  }
}

export async function removeLocalValues(keys = Object.values(LOCAL_KEYS)) {
  await Promise.all(keys.map(async (key) => {
    const meta = await getMeta(key);
    if (meta?.generation) {
      await Promise.all(Array.from({ length: meta.chunks || 0 }, (_, index) => (
        SecureStore.deleteItemAsync(chunkKey(key, meta.generation, index))
      )));
    }
    await SecureStore.deleteItemAsync(metaKey(key));
    await AsyncStorage.removeItem(key);
  }));
}

export async function loadLocalSnapshot() {
  const [profile, scans, feedback, settings, outbox, offlinePack, security, localBackup, session] = await Promise.all([
    readLocalValue(LOCAL_KEYS.profile, null),
    readLocalValue(LOCAL_KEYS.scans, []),
    readLocalValue(LOCAL_KEYS.feedback, []),
    readLocalValue(LOCAL_KEYS.settings, DEFAULT_SETTINGS),
    readLocalValue(LOCAL_KEYS.outbox, []),
    readLocalValue(LOCAL_KEYS.offlinePack, null),
    readLocalValue(LOCAL_KEYS.security, null),
    readLocalValue(LOCAL_KEYS.localBackup, null),
    readLocalValue(LOCAL_KEYS.session, null),
  ]);
  return {
    profile: profile.value,
    scans: scans.value,
    feedback: feedback.value,
    settings: settings.value,
    outbox: outbox.value,
    offlinePack: offlinePack.value,
    security: security.value,
    localBackup: localBackup.value,
    session: session.value,
    notices: [profile, scans, feedback, settings, outbox, offlinePack, security, localBackup, session]
      .map((item) => item.error?.message)
      .filter(Boolean),
  };
}

function labelForKey(key) {
  const labels = {
    [LOCAL_KEYS.profile]: 'profile',
    [LOCAL_KEYS.scans]: 'scan diary',
    [LOCAL_KEYS.feedback]: 'feedback',
    [LOCAL_KEYS.settings]: 'settings',
    [LOCAL_KEYS.outbox]: 'backup queue',
    [LOCAL_KEYS.offlinePack]: 'offline pack',
    [LOCAL_KEYS.security]: 'security settings',
    [LOCAL_KEYS.localBackup]: 'local backup',
    [LOCAL_KEYS.session]: 'app session',
  };
  return labels[key] || 'local data';
}
