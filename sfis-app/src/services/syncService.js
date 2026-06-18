import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import * as SecureStore from 'expo-secure-store';
import { firestoreDb, firebaseReady } from './firebaseClient';

const PREPROD_CLOUD_PREFIX = 'anvara.preproductionCloud.v1';
const PREPROD_CHUNK_SIZE = 1800;

function requireDb() {
  if (!firebaseReady || !firestoreDb) {
    throw new Error('Cloud sync is not configured.');
  }
  return firestoreDb;
}

function cleanForFirestore(value) {
  if (value == null) return null;
  return JSON.parse(JSON.stringify(value));
}

function isPreproductionUid(uid) {
  return String(uid || '').startsWith('preprod-');
}

function safeUid(uid) {
  return String(uid || 'unknown').replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 80);
}

function preprodMetaKey(uid) {
  return `${PREPROD_CLOUD_PREFIX}.${safeUid(uid)}.meta`;
}

function preprodChunkKey(uid, generation, index) {
  return `${PREPROD_CLOUD_PREFIX}.${safeUid(uid)}.${generation}.${index}`;
}

function splitText(text) {
  const chunks = [];
  for (let i = 0; i < text.length; i += PREPROD_CHUNK_SIZE) chunks.push(text.slice(i, i + PREPROD_CHUNK_SIZE));
  return chunks.length ? chunks : [''];
}

function emptyPreproductionCloud() {
  return {
    schemaVersion: 1,
    profile: null,
    scans: {},
    feedback: {},
    events: {},
    updatedAt: null,
  };
}

async function readPreproductionCloud(uid) {
  const metaText = await SecureStore.getItemAsync(preprodMetaKey(uid));
  if (!metaText) return emptyPreproductionCloud();
  try {
    const meta = JSON.parse(metaText);
    const chunks = [];
    for (let i = 0; i < meta.chunks; i += 1) {
      const chunk = await SecureStore.getItemAsync(preprodChunkKey(uid, meta.generation, i));
      if (chunk == null) throw new Error('Preproduction cloud data is incomplete.');
      chunks.push(chunk);
    }
    return { ...emptyPreproductionCloud(), ...JSON.parse(chunks.join('')) };
  } catch (error) {
    return emptyPreproductionCloud();
  }
}

async function writePreproductionCloud(uid, value) {
  const generation = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const text = JSON.stringify({
    ...emptyPreproductionCloud(),
    ...value,
    updatedAt: new Date().toISOString(),
  });
  const chunks = splitText(text);
  const previousMetaText = await SecureStore.getItemAsync(preprodMetaKey(uid)).catch(() => null);
  const previousMeta = previousMetaText ? JSON.parse(previousMetaText) : null;

  await Promise.all(chunks.map((chunk, index) => SecureStore.setItemAsync(preprodChunkKey(uid, generation, index), chunk)));
  await SecureStore.setItemAsync(preprodMetaKey(uid), JSON.stringify({
    generation,
    chunks: chunks.length,
    savedAt: new Date().toISOString(),
  }));
  if (previousMeta?.generation && previousMeta.generation !== generation) {
    await Promise.all(Array.from({ length: previousMeta.chunks || 0 }, (_, index) => (
      SecureStore.deleteItemAsync(preprodChunkKey(uid, previousMeta.generation, index)).catch(() => {})
    )));
  }
}

async function updatePreproductionCloud(uid, updater) {
  const cloud = await readPreproductionCloud(uid);
  const next = await updater(cloud);
  await writePreproductionCloud(uid, next || cloud);
  return next || cloud;
}

async function deletePreproductionCloud(uid) {
  const metaText = await SecureStore.getItemAsync(preprodMetaKey(uid)).catch(() => null);
  const meta = metaText ? JSON.parse(metaText) : null;
  if (meta?.generation) {
    await Promise.all(Array.from({ length: meta.chunks || 0 }, (_, index) => (
      SecureStore.deleteItemAsync(preprodChunkKey(uid, meta.generation, index)).catch(() => {})
    )));
  }
  await SecureStore.deleteItemAsync(preprodMetaKey(uid)).catch(() => {});
}

function sortedValues(map, dateKey) {
  return Object.values(map || {}).sort((a, b) => (
    String(b?.[dateKey] || b?.createdAt || '').localeCompare(String(a?.[dateKey] || a?.createdAt || ''))
  ));
}

function cloudSafeScan(scan) {
  const clean = cleanForFirestore(scan);
  if (!clean) return null;
  const { image, ocr, ...rest } = clean;
  return {
    ...rest,
    ocr: ocr
      ? {
          confidence: ocr.confidence ?? null,
          capturedAt: ocr.capturedAt || null,
          textStored: false,
        }
      : null,
    labelImage: image
      ? {
          capturedAt: image.capturedAt || null,
          deleteAfter: image.deleteAfter || null,
          retainedOnDevice: !!image.retainedOnDevice,
        }
      : null,
  };
}

function docData(snapshot) {
  const data = snapshot.data();
  if (!data) return null;
  const { cloudUpdatedAt, ...rest } = data;
  return rest;
}

function userRoot(uid) {
  const db = requireDb();
  return doc(db, 'users', uid);
}

export async function saveCloudProfile(uid, profile) {
  if (!uid || !profile) return null;
  if (isPreproductionUid(uid)) {
    await updatePreproductionCloud(uid, (cloud) => ({
      ...cloud,
      profile: cleanForFirestore(profile),
    }));
    return 'self';
  }
  const ref = doc(userRoot(uid), 'profile', 'self');
  await setDoc(ref, {
    ...cleanForFirestore(profile),
    cloudUpdatedAt: serverTimestamp(),
  }, { merge: true });
  return ref.id;
}

export async function saveCloudScan(uid, scan) {
  if (!uid || !scan?.id) return null;
  if (isPreproductionUid(uid)) {
    await updatePreproductionCloud(uid, (cloud) => ({
      ...cloud,
      scans: {
        ...(cloud.scans || {}),
        [scan.id]: {
          ...cloudSafeScan(scan),
          cloudUpdatedAt: new Date().toISOString(),
        },
      },
    }));
    return scan.id;
  }
  const ref = doc(userRoot(uid), 'scans', scan.id);
  await setDoc(ref, {
    ...cloudSafeScan(scan),
    cloudUpdatedAt: serverTimestamp(),
  }, { merge: true });
  return ref.id;
}

export async function saveCloudFeedback(uid, feedback) {
  if (!uid || !feedback?.id) return null;
  if (isPreproductionUid(uid)) {
    await updatePreproductionCloud(uid, (cloud) => ({
      ...cloud,
      feedback: {
        ...(cloud.feedback || {}),
        [feedback.id]: {
          ...cleanForFirestore(feedback),
          cloudUpdatedAt: new Date().toISOString(),
        },
      },
    }));
    return feedback.id;
  }
  const ref = doc(userRoot(uid), 'feedback', feedback.id);
  await setDoc(ref, {
    ...cleanForFirestore(feedback),
    cloudUpdatedAt: serverTimestamp(),
  }, { merge: true });
  return ref.id;
}

export async function saveCloudEvent(uid, event) {
  if (!uid || !event?.id) return null;
  if (isPreproductionUid(uid)) {
    await updatePreproductionCloud(uid, (cloud) => ({
      ...cloud,
      events: {
        ...(cloud.events || {}),
        [event.id]: {
          ...cleanForFirestore(event),
          cloudUpdatedAt: new Date().toISOString(),
        },
      },
    }));
    return event.id;
  }
  const ref = doc(userRoot(uid), 'events', event.id);
  await setDoc(ref, {
    ...cleanForFirestore(event),
    cloudUpdatedAt: serverTimestamp(),
  }, { merge: true });
  return ref.id;
}

export async function pushLocalSnapshot(uid, { profile, scans = [], feedback = [] }) {
  if (!uid) return;
  if (isPreproductionUid(uid)) {
    await updatePreproductionCloud(uid, (cloud) => ({
      ...cloud,
      lastSyncAt: new Date().toISOString(),
      schemaVersion: 1,
      profile: profile ? cleanForFirestore(profile) : cloud.profile,
      scans: Object.fromEntries(scans.slice(0, 200).map((scan) => [scan.id, {
        ...cloudSafeScan(scan),
        cloudUpdatedAt: new Date().toISOString(),
      }])),
      feedback: Object.fromEntries(feedback.slice(0, 200).map((entry) => [entry.id, {
        ...cleanForFirestore(entry),
        cloudUpdatedAt: new Date().toISOString(),
      }])),
    }));
    return;
  }
  await setDoc(userRoot(uid), {
    lastSyncAt: serverTimestamp(),
    schemaVersion: 1,
  }, { merge: true });
  if (profile) await saveCloudProfile(uid, profile);
  await Promise.all(scans.slice(0, 200).map((scan) => saveCloudScan(uid, scan)));
  await Promise.all(feedback.slice(0, 200).map((entry) => saveCloudFeedback(uid, entry)));
}

export async function pullCloudSnapshot(uid) {
  if (!uid) return { profile: null, scans: [], feedback: [] };
  if (isPreproductionUid(uid)) {
    const cloud = await readPreproductionCloud(uid);
    return {
      profile: cloud.profile || null,
      scans: sortedValues(cloud.scans, 'savedAt').slice(0, 200),
      feedback: sortedValues(cloud.feedback, 'createdAt').slice(0, 200),
    };
  }
  const profileSnap = await getDoc(doc(userRoot(uid), 'profile', 'self'));
  const scanSnap = await getDocs(query(collection(userRoot(uid), 'scans'), orderBy('savedAt', 'desc'), limit(200)));
  const feedbackSnap = await getDocs(query(collection(userRoot(uid), 'feedback'), orderBy('createdAt', 'desc'), limit(200)));

  return {
    profile: profileSnap.exists() ? docData(profileSnap) : null,
    scans: scanSnap.docs.map(docData).filter(Boolean),
    feedback: feedbackSnap.docs.map(docData).filter(Boolean),
  };
}

export async function deleteCloudSnapshot(uid) {
  if (!uid) return;
  if (isPreproductionUid(uid)) {
    await deletePreproductionCloud(uid);
    return;
  }
  // Erasure must be COMPLETE and resilient: delete every collection independently so
  // one rejection doesn't leave the rest half-deleted, then report what (if anything)
  // could not be removed so the caller can surface it rather than claim a clean wipe.
  const failed = [];
  const purge = async (name) => {
    try {
      const snap = await getDocs(collection(userRoot(uid), name));
      const results = await Promise.allSettled(snap.docs.map((item) => deleteDoc(item.ref)));
      if (results.some((r) => r.status === 'rejected')) failed.push(name);
    } catch (e) { failed.push(name); }
  };
  await purge('scans');
  await purge('feedback');
  await purge('events');
  await deleteDoc(doc(userRoot(uid), 'profile', 'self')).catch(() => failed.push('profile'));
  if (failed.length) {
    throw new Error(`Some cloud data could not be deleted: ${failed.join(', ')}. Please try again.`);
  }
}
