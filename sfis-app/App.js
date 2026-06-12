import React, { useEffect, useRef, useState } from 'react';
import { Alert, AppState, SafeAreaView, View, Text, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { DiaryScreen } from './src/screens/DiaryScreen';
import { ScanScreen } from './src/screens/ScanScreen';
import { CameraScreen } from './src/screens/CameraScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { SaveProfileScreen } from './src/screens/SaveProfileScreen';
import { GettingReadyScreen } from './src/screens/GettingReadyScreen';
import { AppearanceScreen } from './src/screens/AppearanceScreen';
import { PatternsScreen } from './src/screens/PatternsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { DesignPreviewScreen } from './src/screens/DesignPreviewScreen';
import { SecurityBackupScreen } from './src/screens/SecurityBackupScreen';
import { UnlockScreen } from './src/screens/UnlockScreen';
import { BottomTabs } from './src/components/BottomTabs';
import { matchScan } from './src/match/scanMatch';
import data from './src/data/allergens.json';
import { TUTORIAL } from './src/data/tutorial';
import { profileIds } from './src/profile/profileModel';
import { firebaseReady, firebaseUnavailableMessage } from './src/services/firebaseClient';
import {
  resetPassword,
  signInWithApple,
  signInWithEmail,
  signInWithGoogleIdToken,
  signOutCurrentUser,
  subscribeAuthState,
} from './src/services/authService';
import {
  pullCloudSnapshot,
  pushLocalSnapshot,
  deleteCloudSnapshot,
  saveCloudFeedback,
  saveCloudEvent,
  saveCloudProfile,
  saveCloudScan,
} from './src/services/syncService';
import { cleanupExpiredLabelImages, enrichCapturedImage } from './src/services/localRetention';
import {
  DEFAULT_SETTINGS,
  LOCAL_KEYS,
  loadLocalSnapshot,
  removeLocalValues,
  writeLocalValue,
} from './src/services/localDataStore';
import { buildOfflinePack, recommendedOfflinePackIds, usesLegacyBroadRecommendation } from './src/services/offlinePacks';
import {
  createPinSecurity,
  disablePinSecurity,
  isSecurityEnabled,
  lockoutMessage,
  recordFailedUnlock,
  recordSuccessfulUnlock,
  verifyPin,
} from './src/services/securityService';

const OUTBOX_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const RETRY_DELAYS_MS = [5 * 60 * 1000, 15 * 60 * 1000, 60 * 60 * 1000, 6 * 60 * 60 * 1000];
const HEADER_ROW_HEIGHT = 62;
const RESTORABLE_SCREENS = new Set([
  'diary', 'scan', 'patterns', 'profile', 'history',
  'save-profile', 'getting-ready', 'onboarding', 'appearance',
  'design-preview', 'security-backup',
]);
const SCREEN_RESTORE_FALLBACKS = {
  camera: 'scan',
  result: 'diary',
};

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function serializeUser(user) {
  return user ? { uid: user.uid, email: user.email || '', displayName: user.displayName || '' } : null;
}

function mergeById(local = [], cloud = [], dateKey = 'savedAt') {
  const merged = new Map();
  [...cloud, ...local].forEach((item) => {
    if (item?.id) merged.set(item.id, item);
  });
  return Array.from(merged.values()).sort((a, b) => {
    const left = b?.[dateKey] || b?.createdAt || '';
    const right = a?.[dateKey] || a?.createdAt || '';
    return String(left).localeCompare(String(right));
  });
}

function messageFrom(error, fallback = 'Unknown error') {
  return error?.message || String(error || fallback);
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function outboxDedupeKey(item) {
  if (item.kind === 'profile') return 'profile:self';
  return `${item.kind}:${item.payload?.id || item.id}`;
}

function makeOutboxItem(kind, payload, error) {
  const createdAt = new Date().toISOString();
  const imageExpiry = payload?.image?.deleteAfter;
  return {
    id: makeId('outbox'),
    kind,
    payload,
    createdAt,
    expiresAt: imageExpiry || new Date(Date.now() + OUTBOX_RETENTION_MS).toISOString(),
    attempts: 0,
    lastError: messageFrom(error, 'Cloud sync failed'),
    nextRetryAt: createdAt,
  };
}

function mergeOutboxItems(existing = [], additions = []) {
  const byKey = new Map();
  [...existing, ...additions].forEach((item) => {
    if (!item?.kind || !item?.payload) return;
    byKey.set(outboxDedupeKey(item), item);
  });
  const now = Date.now();
  return Array.from(byKey.values())
    .filter((item) => !item.expiresAt || new Date(item.expiresAt).getTime() > now)
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
    .slice(0, 200);
}

function retryTime(attempts = 0) {
  const delay = RETRY_DELAYS_MS[Math.min(attempts, RETRY_DELAYS_MS.length - 1)];
  return new Date(Date.now() + delay).toISOString();
}

async function saveOutboxCloudItem(uid, item) {
  if (item.kind === 'profile') return saveCloudProfile(uid, item.payload);
  if (item.kind === 'scan') return saveCloudScan(uid, item.payload);
  if (item.kind === 'feedback') return saveCloudFeedback(uid, item.payload);
  if (item.kind === 'event') return saveCloudEvent(uid, item.payload);
  return null;
}

function restoreScreenFromSession(session, hasProfile) {
  if (!hasProfile) return 'welcome';
  const last = session?.lastScreen;
  const mapped = SCREEN_RESTORE_FALLBACKS[last] || last;
  return RESTORABLE_SCREENS.has(mapped) ? mapped : 'diary';
}

function HeaderButton({ label, onPress, align, t }) {
  return (
    <View style={{ width: 116, alignItems: align }}>
      {label ? (
        <Pressable onPress={onPress} accessibilityRole="button" hitSlop={12}
          style={{ minHeight: 48, minWidth: 88, paddingHorizontal: 8, justifyContent: 'center',
            alignItems: align }}>
          <Text style={{ fontFamily: t.sans, fontSize: 15, fontWeight: '800', color: t.accentDeep }}>
            {label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function HeaderTitle({ title, t }) {
  return (
    <View style={{ alignItems: 'center', minWidth: 0 }}>
      <Text style={{ fontFamily: t.sans, fontSize: 10.5, fontWeight: '900', color: t.accentDeep,
        textTransform: 'uppercase', letterSpacing: 0 }}>
        Anvara
      </Text>
      <Text numberOfLines={1} style={{ fontFamily: t.sans, fontSize: 16, fontWeight: '800', color: t.ink }}>
        {title}
      </Text>
    </View>
  );
}

function NoticeBanner({ message, actionLabel, onAction, t }) {
  if (!message) return null;
  return (
    <View style={{ paddingHorizontal: 14, paddingTop: 10, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14,
        backgroundColor: t.surface, borderWidth: 1, borderColor: t.accentSoft, padding: 12 }}>
        <Text style={{ flex: 1, fontFamily: t.sans, fontSize: 12.8, color: t.ink2, lineHeight: 18 }}>
          {message}
        </Text>
        {actionLabel ? (
          <Pressable onPress={onAction} accessibilityRole="button" style={{ minHeight: 34, paddingHorizontal: 11,
            borderRadius: 11, backgroundColor: t.accentTint, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: t.sans, fontSize: 12.5, fontWeight: '800', color: t.accentDeep }}>
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function Shell() {
  const { theme: t } = useTheme();
  const [profile, setProfile] = useState(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [savedScans, setSavedScans] = useState([]);
  const [feedbackLog, setFeedbackLog] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [authUser, setAuthUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState(firebaseReady ? 'Local mode' : firebaseUnavailableMessage());
  const [syncOutbox, setSyncOutbox] = useState([]);
  const syncOutboxRef = useRef([]);
  const [storageNotice, setStorageNotice] = useState('');
  const [offlinePack, setOfflinePack] = useState(null);
  const [security, setSecurity] = useState(null);
  const [localBackup, setLocalBackup] = useState(null);
  const [locked, setLocked] = useState(false);
  const [screen, setScreen] = useState('welcome');
  const [returnTo, setReturnTo] = useState('scan');
  const [activeTask, setActiveTask] = useState(null);
  const [interruptedTask, setInterruptedTask] = useState(null);
  const [result, setResult] = useState(null);
  const [resultNext, setResultNext] = useState(null);
  const backgroundedAt = useRef(null);
  const matcherData = offlinePack?.data || data;
  const cloudBackupEnabled = !!settings.cloudBackupEnabled;
  const canCloudBackup = !!authUser?.uid && cloudBackupEnabled;

  useEffect(() => {
    syncOutboxRef.current = syncOutbox;
  }, [syncOutbox]);

  const persistLocalValue = async (key, value, label) => {
    try {
      const saved = await writeLocalValue(key, value);
      return saved;
    } catch (error) {
      setStorageNotice(`${label} could not be saved securely on this device: ${messageFrom(error)}`);
      return null;
    }
  };

  const persistOutboxQueue = async (queue) => {
    const saved = await persistLocalValue(LOCAL_KEYS.outbox, queue, 'Backup queue');
    const nextQueue = saved || queue;
    syncOutboxRef.current = nextQueue;
    setSyncOutbox(nextQueue);
    return nextQueue;
  };

  const persistSecurity = async (nextSecurity) => {
    setSecurity(nextSecurity);
    const saved = await persistLocalValue(LOCAL_KEYS.security, nextSecurity, 'Security settings');
    return saved || nextSecurity;
  };

  const persistSession = (nextScreen = screen, nextReturnTo = returnTo, nextTask = activeTask) => {
    if (!hydrated) return Promise.resolve(null);
    return persistLocalValue(LOCAL_KEYS.session, {
      lastScreen: nextScreen,
      returnTo: nextReturnTo,
      activeTask: nextTask,
      updatedAt: new Date().toISOString(),
    }, 'App session');
  };

  const beginProcessingTask = (type, label) => {
    const now = new Date().toISOString();
    const task = {
      id: makeId('task'),
      type,
      label,
      startedAt: now,
      updatedAt: now,
    };
    setActiveTask(task);
    if (hydrated) {
      persistLocalValue(LOCAL_KEYS.session, {
        lastScreen: screen,
        returnTo,
        activeTask: task,
        updatedAt: now,
      }, 'App session');
    }
    return task.id;
  };

  const endProcessingTask = (taskId) => {
    setActiveTask((current) => {
      const next = current?.id === taskId ? null : current;
      if (hydrated) {
        persistLocalValue(LOCAL_KEYS.session, {
          lastScreen: screen,
          returnTo,
          activeTask: next,
          updatedAt: new Date().toISOString(),
        }, 'App session');
      }
      return next;
    });
  };

  const enqueueOutboxItems = async (items) => {
    if (!items.length) return syncOutboxRef.current;
    const nextQueue = mergeOutboxItems(syncOutboxRef.current, items);
    setSyncStatus(`Backup pending: ${items[0].lastError}`);
    return persistOutboxQueue(nextQueue);
  };

  const enqueueOutbox = (kind, payload, error) => {
    if (!payload) return Promise.resolve(syncOutboxRef.current);
    return enqueueOutboxItems([makeOutboxItem(kind, payload, error)]);
  };

  const enqueueSnapshotOutbox = (snapshot, error) => {
    const items = [];
    if (snapshot.profile) items.push(makeOutboxItem('profile', snapshot.profile, error));
    (snapshot.scans || []).forEach((scan) => items.push(makeOutboxItem('scan', scan, error)));
    (snapshot.feedback || []).forEach((entry) => items.push(makeOutboxItem('feedback', entry, error)));
    return enqueueOutboxItems(items);
  };

  const flushOutbox = async (uid, queue = syncOutboxRef.current) => {
    if (!uid || !queue.length) return queue;
    const now = Date.now();
    const remaining = [];
    let pushed = 0;
    let lastError = '';

    for (const item of queue) {
      const expired = item.expiresAt && new Date(item.expiresAt).getTime() <= now;
      const due = !item.nextRetryAt || new Date(item.nextRetryAt).getTime() <= now;
      if (expired) {
        lastError = `${item.kind} backup expired after the 7-day retention window.`;
        continue;
      }
      if (!due) {
        remaining.push(item);
        continue;
      }
      try {
        await saveOutboxCloudItem(uid, item);
        pushed += 1;
      } catch (error) {
        const attempts = (item.attempts || 0) + 1;
        lastError = messageFrom(error, 'Cloud sync failed');
        remaining.push({
          ...item,
          attempts,
          lastError,
          nextRetryAt: retryTime(attempts),
        });
      }
    }

    const savedQueue = await persistOutboxQueue(remaining);
    if (savedQueue.length) {
      const reason = lastError || savedQueue[0]?.lastError || 'Waiting for the next retry window.';
      setSyncStatus(`Backup pending: ${savedQueue.length} item${savedQueue.length === 1 ? '' : 's'}. ${reason}`);
    } else if (pushed) {
      setSyncStatus(`Synced ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`);
    }
    return savedQueue;
  };

  const refreshOfflinePackForProfile = async (nextProfile) => {
    if (!offlinePack) return null;
    const refreshed = buildOfflinePack(nextProfile, offlinePack.selectedPackIds);
    const saved = await persistLocalValue(LOCAL_KEYS.offlinePack, refreshed, 'Offline matcher pack');
    if (saved) setOfflinePack(saved);
    return saved;
  };

  const saveOfflinePackForProfile = async (nextProfile = profile, selectedPackIds = null) => {
    if (!nextProfile) return null;
    const pack = buildOfflinePack(nextProfile, selectedPackIds || offlinePack?.selectedPackIds);
    const saved = await persistLocalValue(LOCAL_KEYS.offlinePack, pack, 'Offline matcher pack');
    if (saved) setOfflinePack(saved);
    return saved;
  };

  const currentBackupSnapshot = () => ({
    profile,
    scans: savedScans,
    feedback: feedbackLog,
  });

  const recordProcessEvent = (type, payload = {}) => {
    const event = {
      id: makeId('event'),
      type,
      createdAt: new Date().toISOString(),
      payload,
    };
    if (canCloudBackup) {
      saveCloudEvent(authUser.uid, event)
        .catch((error) => enqueueOutbox('event', event, error));
    }
    return event;
  };

  const pushSnapshotWithQueue = async (uid, snapshot = currentBackupSnapshot()) => {
    try {
      await pushLocalSnapshot(uid, snapshot);
      await flushOutbox(uid);
      setSyncStatus(`Backed up ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`);
      return true;
    } catch (error) {
      await enqueueSnapshotOutbox(snapshot, error);
      setSyncStatus(messageFrom(error, 'Cloud backup failed'));
      return false;
    }
  };

  useEffect(() => {
    let live = true;
    loadLocalSnapshot().then(async (snapshot) => {
      if (!live) return;
      const parsedProfile = snapshot.profile || null;
      const parsedScans = Array.isArray(snapshot.scans) ? snapshot.scans : [];
      const parsedFeedback = Array.isArray(snapshot.feedback) ? snapshot.feedback : [];
      const parsedSettings = { ...DEFAULT_SETTINGS, ...(snapshot.settings || {}) };
      const cleanedScans = await cleanupExpiredLabelImages(
        Array.isArray(parsedScans) ? parsedScans : [],
        parsedSettings.saveLabelImages,
      );
      setProfile(parsedProfile);
      setProfileSaved(!!parsedProfile);
      setSavedScans(cleanedScans);
      setFeedbackLog(Array.isArray(parsedFeedback) ? parsedFeedback : []);
      setSettings(parsedSettings);
      const parsedOutbox = Array.isArray(snapshot.outbox) ? snapshot.outbox : [];
      syncOutboxRef.current = parsedOutbox;
      setSyncOutbox(parsedOutbox);
      setOfflinePack(snapshot.offlinePack || null);
      setSecurity(snapshot.security || null);
      setLocalBackup(snapshot.localBackup || null);
      setLocked(isSecurityEnabled(snapshot.security));
      if (snapshot.notices?.length) setStorageNotice(snapshot.notices[0]);
      if (!sameJson(parsedScans, cleanedScans)) {
        persistLocalValue(LOCAL_KEYS.scans, cleanedScans, 'Scan diary');
      }
      const restoredScreen = restoreScreenFromSession(snapshot.session, !!parsedProfile);
      const restoredReturnTo = RESTORABLE_SCREENS.has(snapshot.session?.returnTo) ? snapshot.session.returnTo : 'diary';
      setReturnTo(restoredReturnTo);
      setScreen(restoredScreen);
      if (snapshot.session?.activeTask) {
        setInterruptedTask(snapshot.session.activeTask);
        persistLocalValue(LOCAL_KEYS.session, {
          lastScreen: restoredScreen,
          returnTo: restoredReturnTo,
          activeTask: null,
          updatedAt: new Date().toISOString(),
        }, 'App session');
      }
    }).catch((error) => {
      if (live) {
        setStorageNotice(`Local data could not be loaded: ${messageFrom(error)}`);
        setScreen('welcome');
      }
    }).finally(() => {
      if (live) setHydrated(true);
    });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    persistSession(screen, returnTo, activeTask);
  }, [hydrated, screen, returnTo, activeTask?.id]);

  useEffect(() => {
    if (!hydrated || !interruptedTask) return;
    Alert.alert(
      'Processing stopped',
      `${interruptedTask.label || 'The last task'} stopped because Anvara was closed before it finished. Please start it again.`,
      [{ text: 'OK', onPress: () => setInterruptedTask(null) }],
    );
  }, [hydrated, interruptedTask]);

  useEffect(() => subscribeAuthState((user) => {
    const nextUser = serializeUser(user);
    setAuthUser(nextUser);
    setSyncStatus(nextUser ? 'Signed in. Sync pending…' : (firebaseReady ? 'Local mode' : firebaseUnavailableMessage()));
  }), []);

  useEffect(() => {
    if (!hydrated || !authUser?.uid) return undefined;
    if (!cloudBackupEnabled) {
      setSyncStatus('Cloud backup off. Local encrypted mode.');
      return undefined;
    }
    let live = true;

    async function syncCloud() {
      try {
        setSyncStatus('Syncing…');
        const cloud = await pullCloudSnapshot(authUser.uid);
        if (!live) return;

        const nextProfile = cloud.profile || profile;
        const nextScans = mergeById(savedScans, cloud.scans, 'savedAt');
        const nextFeedback = mergeById(feedbackLog, cloud.feedback, 'createdAt');

        if (cloud.profile) {
          setProfile(cloud.profile);
          setProfileSaved(true);
          persistLocalValue(LOCAL_KEYS.profile, cloud.profile, 'Profile');
        }
        setSavedScans(nextScans);
        setFeedbackLog(nextFeedback);
        persistLocalValue(LOCAL_KEYS.scans, nextScans, 'Scan diary');
        persistLocalValue(LOCAL_KEYS.feedback, nextFeedback, 'Feedback');

        const snapshot = {
          profile: nextProfile,
          scans: nextScans,
          feedback: nextFeedback,
        };
        const backedUp = await pushSnapshotWithQueue(authUser.uid, snapshot);
        if (live && backedUp) setSyncStatus(`Synced ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`);
      } catch (error) {
        if (live) setSyncStatus(error.message || 'Sync failed. Local data is still saved.');
      }
    }

    syncCloud();
    return () => { live = false; };
  }, [hydrated, authUser?.uid, cloudBackupEnabled]);

  useEffect(() => {
    if (!hydrated || !authUser?.uid || !cloudBackupEnabled || !syncOutbox.length) return undefined;
    const timer = setInterval(() => {
      flushOutbox(authUser.uid);
    }, 60 * 1000);
    return () => clearInterval(timer);
  }, [hydrated, authUser?.uid, cloudBackupEnabled, syncOutbox.length]);

  useEffect(() => {
    if (!hydrated || !profile || !settings.autoOfflinePack) return undefined;
    const selectedPackIds = usesLegacyBroadRecommendation(offlinePack) ? recommendedOfflinePackIds(profile) : null;
    if (offlinePack && !selectedPackIds) return undefined;
    saveOfflinePackForProfile(profile, selectedPackIds).catch((error) => {
      setStorageNotice(`Offline matcher pack could not be prepared: ${messageFrom(error)}`);
    });
    return undefined;
  }, [hydrated, profile, offlinePack, settings.autoOfflinePack]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        if (hydrated) persistSession(screen, returnTo, activeTask);
        backgroundedAt.current = Date.now();
      }
      if (!isSecurityEnabled(security)) return;
      if (nextState === 'active' && backgroundedAt.current) {
        const timeout = Math.max(1, settings.appLockTimeoutMinutes || 5) * 60 * 1000;
        if (Date.now() - backgroundedAt.current >= timeout) setLocked(true);
      }
    });
    return () => subscription.remove();
  }, [security, settings.appLockTimeoutMinutes, hydrated, screen, returnTo, activeTask?.id]);

  const openAppearance = () => {
    setReturnTo(screen);
    setScreen('appearance');
  };

  const saveProfile = (nextProfile) => {
    setProfile(nextProfile);
    setProfileSaved(true);
    persistLocalValue(LOCAL_KEYS.profile, nextProfile, 'Profile');
    if (offlinePack) {
      refreshOfflinePackForProfile(nextProfile);
    } else if (settings.autoOfflinePack) {
      saveOfflinePackForProfile(nextProfile);
    }
    if (canCloudBackup) {
      saveCloudProfile(authUser.uid, nextProfile)
        .then(() => setSyncStatus('Profile synced'))
        .catch((error) => enqueueOutbox('profile', nextProfile, error));
    }
    recordProcessEvent('profile.saved', {
      watchedCount: profileIds(nextProfile).length,
      familyCount: (nextProfile.familyMembers || []).length,
    });
  };

  // Family: add a found member (test directory today, live accounts later).
  // Family cap is 5 profiles incl. self; persists through the same path as saveProfile.
  const addFamilyMember = (member) => {
    if (!profile) return;
    const existing = profile.familyMembers || [];
    if (existing.some((m) => m.id === member.id) || existing.length >= 4) return;
    saveProfile({ ...profile, familyMembers: [...existing, member] });
  };

  const updateSettings = (patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      persistLocalValue(LOCAL_KEYS.settings, next, 'Settings');
      if (prev.saveLabelImages && !next.saveLabelImages) {
        cleanupExpiredLabelImages(savedScans, false).then((cleaned) => {
          setSavedScans(cleaned);
          persistLocalValue(LOCAL_KEYS.scans, cleaned, 'Scan diary');
        }).catch((error) => setStorageNotice(`Expired label images could not be cleaned: ${messageFrom(error)}`));
      }
      return next;
    });
  };

  const clearLocalData = () => {
    Alert.alert(
      'Clear local data?',
      'This removes the saved profile, scan diary, and result feedback from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            let clearFailed = false;
            await removeLocalValues(Object.values(LOCAL_KEYS)).catch((error) => {
              clearFailed = true;
              setStorageNotice(`Local data could not be fully cleared: ${messageFrom(error)}`);
            });
            setProfile(null);
            setProfileSaved(false);
            setSavedScans([]);
            setFeedbackLog([]);
            setSettings(DEFAULT_SETTINGS);
            syncOutboxRef.current = [];
            setSyncOutbox([]);
            setOfflinePack(null);
            setSecurity(null);
            setLocalBackup(null);
            setLocked(false);
            if (!clearFailed) setStorageNotice('');
            setResult(null);
            setResultNext(null);
            setScreen('welcome');
          },
        },
      ],
    );
  };

  const showResult = (nextResult, { source = 'manual', persist = true, next = null } = {}) => {
    const savedAt = new Date().toISOString();
    setResultNext(next);
    const image = enrichCapturedImage(nextResult.image, settings.saveLabelImages);
    if (persist) {
      const entry = {
        id: makeId('scan'),
        savedAt,
        source,
        product: nextResult.product || {},
        findings: nextResult.findings || [],
        unverified: nextResult.unverified || [],
        ocr: nextResult.ocr ? {
          text: nextResult.ocr.text || '',
          confidence: nextResult.ocr.confidence ?? null,
          capturedAt: image?.capturedAt || savedAt,
        } : null,
        image,
      };
      setResult({ ...nextResult, image, savedScanId: entry.id, savedAt, source });
      if (canCloudBackup) {
        saveCloudScan(authUser.uid, entry)
          .then(() => setSyncStatus('Scan synced'))
          .catch((error) => enqueueOutbox('scan', entry, error));
      }
      setSavedScans((prev) => {
        const saved = [entry, ...prev].slice(0, 200);
        persistLocalValue(LOCAL_KEYS.scans, saved, 'Scan diary');
        return saved;
      });
      recordProcessEvent('scan.result_saved', {
        scanId: entry.id,
        source,
        productName: entry.product.name || '',
        findingCount: entry.findings.length,
        unverifiedCount: entry.unverified.length,
      });
    } else {
      setResult({ ...nextResult, image, savedAt, source });
    }
    setScreen('result');
  };

  const recordFeedback = (label) => {
    const entry = {
      id: makeId('feedback'),
      label,
      createdAt: new Date().toISOString(),
      savedScanId: result?.savedScanId || null,
      product: result?.product || {},
    };
    setFeedbackLog((prev) => {
      const next = [entry, ...prev].slice(0, 200);
      persistLocalValue(LOCAL_KEYS.feedback, next, 'Feedback');
      return next;
    });
    if (canCloudBackup) {
      saveCloudFeedback(authUser.uid, entry)
        .then(() => setSyncStatus('Feedback synced'))
        .catch((error) => enqueueOutbox('feedback', entry, error));
    }
    recordProcessEvent('feedback.recorded', {
      feedbackId: entry.id,
      savedScanId: entry.savedScanId,
      label,
    });
    setSavedScans((prev) => {
      const next = prev.map((scan) => (scan.id === entry.savedScanId ? { ...scan, feedback: label } : scan));
      persistLocalValue(LOCAL_KEYS.scans, next, 'Scan diary');
      const updated = next.find((scan) => scan.id === entry.savedScanId);
      if (canCloudBackup && updated) saveCloudScan(authUser.uid, updated).catch((error) => enqueueOutbox('scan', updated, error));
      return next;
    });
  };

  const finishAuth = async (credential) => {
    const signedInUser = serializeUser(credential?.user);
    if (!signedInUser?.uid) {
      throw new Error('Sign-in did not complete. No account was returned.');
    }
    if (signedInUser) setAuthUser(signedInUser);
    let nextProfile = profile;
    let nextScans = savedScans;
    let nextFeedback = feedbackLog;
    if (signedInUser?.uid && cloudBackupEnabled) {
      setSyncStatus('Signed in. Syncing…');
      try {
        const cloud = await pullCloudSnapshot(signedInUser.uid);
        nextProfile = cloud.profile || profile;
        nextScans = mergeById(savedScans, cloud.scans, 'savedAt');
        nextFeedback = mergeById(feedbackLog, cloud.feedback, 'createdAt');

        if (nextProfile) {
          setProfile(nextProfile);
          setProfileSaved(true);
          persistLocalValue(LOCAL_KEYS.profile, nextProfile, 'Profile');
        }
        setSavedScans(nextScans);
        setFeedbackLog(nextFeedback);
        persistLocalValue(LOCAL_KEYS.scans, nextScans, 'Scan diary');
        persistLocalValue(LOCAL_KEYS.feedback, nextFeedback, 'Feedback');

        await pushSnapshotWithQueue(signedInUser.uid, {
          profile: nextProfile,
          scans: nextScans,
          feedback: nextFeedback,
        });
        saveCloudEvent(signedInUser.uid, {
          id: makeId('event'),
          type: 'auth.completed',
          createdAt: new Date().toISOString(),
          payload: {
            restoredProfile: !!cloud.profile,
            localProfile: !!profile,
            scanCount: nextScans.length,
            feedbackCount: nextFeedback.length,
          },
        }).catch((error) => enqueueOutbox('event', {
          id: makeId('event'),
          type: 'auth.completed',
          createdAt: new Date().toISOString(),
          payload: { restoredProfile: !!cloud.profile, localProfile: !!profile },
        }, error));
      } catch (error) {
        await enqueueSnapshotOutbox({ profile, scans: savedScans, feedback: feedbackLog }, error);
        setSyncStatus(messageFrom(error, 'Signed in, but cloud sync failed. Local data is still saved.'));
      }
    } else if (signedInUser?.uid) {
      if (profile) {
        setProfileSaved(true);
        persistLocalValue(LOCAL_KEYS.profile, profile, 'Profile');
      }
      setSyncStatus('Signed in. Cloud backup off.');
    }
    setScreen(nextProfile ? 'getting-ready' : 'onboarding');
    return credential;
  };

  const handleEmailAuth = async ({ email, password, mode }) => {
    const credential = await signInWithEmail({ email, password, mode });
    return finishAuth(credential);
  };

  const handleGoogleAuth = async (idToken) => {
    const credential = await signInWithGoogleIdToken(idToken);
    return finishAuth(credential);
  };

  const handleAppleAuth = async () => {
    const credential = await signInWithApple();
    return finishAuth(credential);
  };

  const handleSignOut = async () => {
    try {
      await signOutCurrentUser();
      setAuthUser(null);
      setSyncStatus(firebaseReady ? 'Local mode' : firebaseUnavailableMessage());
    } catch (error) {
      setSyncStatus(error.message || 'Sign out failed');
    }
  };

  const setAppPin = async (pin) => {
    const nextSecurity = await createPinSecurity(pin);
    await persistSecurity(nextSecurity);
    setLocked(false);
    return nextSecurity;
  };

  const disableAppPin = async () => {
    const nextSecurity = disablePinSecurity(security || {});
    await persistSecurity(nextSecurity);
    setLocked(false);
  };

  const unlockApp = async (pin) => {
    const result = await verifyPin(security, pin);
    if (result.ok) {
      const nextSecurity = recordSuccessfulUnlock(security || {});
      await persistSecurity(nextSecurity);
      setLocked(false);
      return { ok: true };
    }
    const nextSecurity = recordFailedUnlock(security || {});
    await persistSecurity(nextSecurity);
    return { ok: false, error: lockoutMessage(nextSecurity) || result.error };
  };

  const backupNow = async () => {
    if (!authUser?.uid) {
      setSyncStatus('Sign in to use cloud backup.');
      setScreen('save-profile');
      return false;
    }
    if (!cloudBackupEnabled) {
      setSyncStatus('Turn on cloud backup first.');
      return false;
    }
    const taskId = beginProcessingTask('cloud-backup', 'Cloud backup');
    setSyncStatus('Backing up now...');
    try {
      const ok = await pushSnapshotWithQueue(authUser.uid, currentBackupSnapshot());
      recordProcessEvent('backup.manual_completed', {
        ok,
        queuedItems: syncOutboxRef.current.length,
      });
      return ok;
    } finally {
      endProcessingTask(taskId);
    }
  };

  const deleteCloudBackupNow = () => {
    if (!authUser?.uid) {
      setSyncStatus('Sign in before deleting a cloud backup.');
      return;
    }
    Alert.alert(
      'Delete cloud backup?',
      'This removes the cloud copy for this account. Local encrypted data on this device stays here.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCloudSnapshot(authUser.uid);
              await persistOutboxQueue([]);
              setSyncStatus('Cloud backup deleted');
            } catch (error) {
              setSyncStatus(messageFrom(error, 'Could not delete cloud backup'));
            }
          },
        },
      ],
    );
  };

  const createLocalBackup = async () => {
    const taskId = beginProcessingTask('local-backup', 'Local checkpoint');
    try {
      const backup = {
        id: makeId('backup'),
        createdAt: new Date().toISOString(),
        schemaVersion: 1,
        profile,
        scans: savedScans,
        feedback: feedbackLog,
        settings,
        offlinePack,
      };
      const saved = await persistLocalValue(LOCAL_KEYS.localBackup, backup, 'Local backup');
      if (saved) {
        setLocalBackup(saved);
        setStorageNotice('Secure local checkpoint created on this device.');
      }
      return saved;
    } finally {
      endProcessingTask(taskId);
    }
  };

  const restoreLocalBackup = () => {
    if (!localBackup) return;
    Alert.alert(
      'Restore local checkpoint?',
      'This replaces the current profile, scan diary, feedback, settings, and offline pack with the encrypted checkpoint saved on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            setProfile(localBackup.profile);
            setProfileSaved(!!localBackup.profile);
            setSavedScans(localBackup.scans || []);
            setFeedbackLog(localBackup.feedback || []);
            setSettings({ ...DEFAULT_SETTINGS, ...(localBackup.settings || {}) });
            setOfflinePack(localBackup.offlinePack || null);
            await Promise.all([
              persistLocalValue(LOCAL_KEYS.profile, localBackup.profile, 'Profile'),
              persistLocalValue(LOCAL_KEYS.scans, localBackup.scans || [], 'Scan diary'),
              persistLocalValue(LOCAL_KEYS.feedback, localBackup.feedback || [], 'Feedback'),
              persistLocalValue(LOCAL_KEYS.settings, { ...DEFAULT_SETTINGS, ...(localBackup.settings || {}) }, 'Settings'),
              persistLocalValue(LOCAL_KEYS.offlinePack, localBackup.offlinePack || null, 'Offline matcher pack'),
            ]);
            setStorageNotice('Secure local checkpoint restored.');
            setScreen('diary');
          },
        },
      ],
    );
  };

  const toggleCloudBackup = () => {
    const next = !settings.cloudBackupEnabled;
    updateSettings({ cloudBackupEnabled: next });
    setSyncStatus(next ? 'Cloud backup on. Sync pending...' : 'Cloud backup off. Local encrypted mode.');
  };

  const toggleAutoOfflinePack = () => {
    const next = !settings.autoOfflinePack;
    updateSettings({ autoOfflinePack: next });
    if (next && profile) saveOfflinePackForProfile(profile);
  };

  const runTutorial = () => {
    const { findings, unverified } = matchScan(TUTORIAL.text, profile, matcherData);
    showResult({
      findings,
      unverified,
      product: { name: TUTORIAL.name, brand: TUTORIAL.brand, date: TUTORIAL.date },
    }, { source: 'sample', persist: true });
  };

  const runFirstSample = (nextProfile) => {
    const { findings, unverified } = matchScan(TUTORIAL.text, nextProfile, matcherData);
    showResult({
      findings,
      unverified,
      product: { name: TUTORIAL.name, brand: TUTORIAL.brand, date: TUTORIAL.date },
    }, { source: 'sample', persist: false, next: { label: 'Continue', screen: 'save-profile' } });
  };

  const downloadOfflinePack = async (selectedPackIds) => {
    const taskId = beginProcessingTask('offline-pack', 'Offline matcher pack');
    try {
      const pack = buildOfflinePack(profile, selectedPackIds);
      const saved = await persistLocalValue(LOCAL_KEYS.offlinePack, pack, 'Offline matcher pack');
      if (!saved) throw new Error('Offline pack could not be saved on this device.');
      setOfflinePack(saved);
      recordProcessEvent('offline_pack.saved', {
        termCount: saved.termCount,
        bytes: saved.bytes,
        selectedPackIds: saved.selectedPackIds,
      });
      return saved;
    } finally {
      endProcessingTask(taskId);
    }
  };

  const useLocally = () => {
    if (!profile) {
      setScreen('onboarding');
      return;
    }
    saveProfile(profile);
    setScreen('getting-ready');
  };

  const continueFromResult = () => {
    const next = resultNext?.screen;
    setResultNext(null);
    setScreen(next || 'diary');
  };

  if (!hydrated) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: t.sans, fontSize: 15, fontWeight: '800', color: t.ink }}>Anvara</Text>
      </SafeAreaView>
    );
  }

  if (locked && isSecurityEnabled(security)) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
        <UnlockScreen
          onUnlock={unlockApp}
          onResetDevice={clearLocalData}
          lockoutText={lockoutMessage(security)}
        />
        <StatusBar style="dark" />
      </SafeAreaView>
    );
  }

  let body, title, left = {}, right = {};
  const tabs = new Set(['diary', 'scan', 'patterns', 'profile']);
  if (screen === 'welcome') {
    title = 'Welcome';
    body = <WelcomeScreen onStart={() => setScreen('onboarding')} onSignIn={() => setScreen('save-profile')} />;
  } else if (screen === 'onboarding') {
    title = profileSaved ? 'Edit Profile' : 'Watch For';
    body = <OnboardingScreen initialProfile={profile} onDone={(p) => {
      const editing = profileSaved && !!profile;
      if (editing) {
        saveProfile(p);
        setScreen('profile');
      } else {
        setProfile(p);
        setProfileSaved(false);
        runFirstSample(p);
      }
    }} />;
  } else if (screen === 'save-profile') {
    title = profile ? 'Save Profile' : 'Sign In';
    body = <SaveProfileScreen hasProfile={!!profile} onUseLocal={useLocally}
      onBack={() => setScreen(profile ? 'result' : 'welcome')}
      onEmailAuth={handleEmailAuth}
      onGoogleToken={handleGoogleAuth}
      onAppleAuth={handleAppleAuth}
      onResetPassword={resetPassword}
      authReady={firebaseReady}
      authUser={authUser}
      syncStatus={syncStatus} />;
  } else if (screen === 'getting-ready') {
    title = 'Getting Ready';
    body = <GettingReadyScreen profile={profile} offlinePack={offlinePack}
      onDownload={downloadOfflinePack} onDone={() => setScreen('diary')} />;
  } else if (screen === 'diary') {
    title = 'Home';
    right = { label: 'Theme', onPress: openAppearance };
    body = <DesignPreviewScreen scans={savedScans} offlinePack={offlinePack}
      onScan={() => setScreen('scan')} onDownload={() => setScreen('getting-ready')} onDiary={() => setScreen('history')} />;
  } else if (screen === 'history') {
    title = 'Diary';
    left = { label: '‹ Home', onPress: () => setScreen('diary') };
    body = <DiaryScreen scans={savedScans} onSample={runTutorial} onScan={() => setScreen('scan')} />;
  } else if (screen === 'scan') {
    title = 'Scan';
    right = { label: 'Theme', onPress: openAppearance };
    body = <ScanScreen profile={profile} matcherData={matcherData}
              onResult={(r) => showResult(r, { source: 'manual', persist: true })}
              onCamera={() => setScreen('camera')} />;
  } else if (screen === 'patterns') {
    title = 'Patterns';
    right = { label: 'Theme', onPress: openAppearance };
    body = <PatternsScreen scans={savedScans} onScan={() => setScreen('scan')} />;
  } else if (screen === 'profile') {
    title = 'Profile';
    body = <ProfileScreen profile={profile} scans={savedScans} feedbackCount={feedbackLog.length}
      settings={settings} authUser={authUser} authReady={firebaseReady} syncStatus={syncStatus}
      onAppearance={openAppearance} onEditProfile={() => setScreen('onboarding')} onClearLocalData={clearLocalData}
      onToggleSaveLabelImages={() => updateSettings({ saveLabelImages: !settings.saveLabelImages })}
      onSignIn={() => setScreen('save-profile')} onSignOut={handleSignOut} onAddMember={addFamilyMember}
      onDesignPreview={() => setScreen('design-preview')} onSecurityBackup={() => setScreen('security-backup')} />;
  } else if (screen === 'camera') {
    title = 'Camera';
    left = { label: '‹ Scan', onPress: () => setScreen('scan') };
    body = <CameraScreen profile={profile} matcherData={matcherData} onBack={() => setScreen('scan')}
              onManual={() => setScreen('scan')}
              onResult={(r) => showResult(r, { source: 'camera', persist: true })}
              onProcessingStart={beginProcessingTask}
              onProcessingEnd={endProcessingTask} />;
  } else if (screen === 'result') {
    title = 'Result';
    left = { label: resultNext ? '‹ Watch' : '‹ Scan', onPress: () => setScreen(resultNext ? 'onboarding' : 'scan') };
    body = <ResultScreen {...(result || {})} onFeedback={recordFeedback}
      nextLabel={resultNext?.label} onNext={resultNext ? continueFromResult : undefined} />;
  } else if (screen === 'appearance') {
    title = 'Appearance';
    left = { label: '‹ Back', onPress: () => setScreen(returnTo) };
    body = <AppearanceScreen />;
  } else if (screen === 'design-preview') {
    title = 'Preview';
    left = { label: '‹ Profile', onPress: () => setScreen('profile') };
    body = <DesignPreviewScreen scans={savedScans} offlinePack={offlinePack}
      onScan={() => setScreen('scan')} onDownload={() => setScreen('getting-ready')} />;
  } else if (screen === 'security-backup') {
    title = 'Security';
    left = { label: '‹ Profile', onPress: () => setScreen('profile') };
    body = <SecurityBackupScreen
      settings={settings}
      security={security}
      authUser={authUser}
      authReady={firebaseReady}
      syncStatus={syncStatus}
      syncOutbox={syncOutbox}
      offlinePack={offlinePack}
      scans={savedScans}
      feedbackCount={feedbackLog.length}
      localBackup={localBackup}
      onSetAppPin={setAppPin}
      onDisableAppPin={disableAppPin}
      onLockNow={() => setLocked(true)}
      onToggleCloudBackup={toggleCloudBackup}
      onBackupNow={backupNow}
      onDeleteCloudBackup={deleteCloudBackupNow}
      onCreateLocalBackup={createLocalBackup}
      onRestoreLocalBackup={restoreLocalBackup}
      onToggleAutoOfflinePack={toggleAutoOfflinePack}
      onManageOfflinePack={() => setScreen('getting-ready')}
      onToggleSaveLabelImages={() => updateSettings({ saveLabelImages: !settings.saveLabelImages })}
      onClearLocalData={clearLocalData}
      onSignIn={() => setScreen('save-profile')}
    />;
  }

  const backupNotice = syncOutbox.length
    ? `Cloud backup pending for ${syncOutbox.length} item${syncOutbox.length === 1 ? '' : 's'}. ${syncOutbox[0]?.lastError || 'Waiting for a retry.'}`
    : '';
  const bannerMessage = storageNotice || backupNotice;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ backgroundColor: t.surfaceWarm, borderBottomWidth: 1, borderBottomColor: t.lineSoft }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 14, height: HEADER_ROW_HEIGHT }}>
          <HeaderButton label={left.label} onPress={left.onPress} align="flex-start" t={t} />
          <HeaderTitle title={title} t={t} />
          <HeaderButton label={right.label} onPress={right.onPress} align="flex-end" t={t} />
        </View>
      </View>
      <NoticeBanner message={bannerMessage}
        actionLabel={canCloudBackup && syncOutbox.length ? 'Retry' : ''}
        onAction={canCloudBackup && syncOutbox.length ? () => flushOutbox(authUser.uid) : undefined}
        t={t} />
      <View style={{ flex: 1 }}>{body}</View>
      {tabs.has(screen) ? <BottomTabs active={screen} onChange={setScreen} /> : null}
      <StatusBar style="dark" translucent={false} backgroundColor={t.surfaceWarm} />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ThemeProvider fallback={null}>
      <Shell />
    </ThemeProvider>
  );
}
