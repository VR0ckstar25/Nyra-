import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, SafeAreaView, Share, View, Text, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { IntroScreen } from './src/screens/IntroScreen';
import { UpgradeScreen } from './src/screens/UpgradeScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { OnboardingIntentScreen } from './src/screens/OnboardingIntentScreen';
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
import { VisualConceptScreen } from './src/screens/VisualConceptScreen';
import { SecurityBackupScreen } from './src/screens/SecurityBackupScreen';
import { UnlockScreen } from './src/screens/UnlockScreen';
import { PolicyAgreementScreen } from './src/screens/PolicyAgreementScreen';
import { HowItWorksScreen } from './src/screens/HowItWorksScreen';
import { PlansScreen } from './src/screens/PlansScreen';
import { CredibilityScreen } from './src/screens/CredibilityScreen';
import { BottomTabs } from './src/components/BottomTabs';
import { matchScan } from './src/match/scanMatch';
import data from './src/data/allergens.json';
import { TUTORIAL } from './src/data/tutorial';
import { profileIds } from './src/profile/profileModel';
import { firebaseReady, firebaseUnavailableMessage } from './src/services/firebaseClient';
import {
  preproductionAuthReady,
  resetPassword,
  signInWithApple,
  signInWithDemoGoogle,
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
import { cleanupExpiredLabelImages, deleteScanImages, enrichCapturedImage } from './src/services/localRetention';
import { familyScanGate, houseAdForContext, isFamilyPlan, isUnlimited, normalizeCommercial, normalizeFamilyLedger, planFor, recordFamilyScan, recordScanUsage, scanQuota, transferScans, updateCommercialPlan } from './src/services/commercialModel';
import { purchasePlan, restorePurchases } from './src/services/billingService';
import {
  DEFAULT_SETTINGS,
  LOCAL_KEYS,
  loadLocalSnapshot,
  readLocalValue,
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
import { buildOutboxItem, mergeOutboxItems, outboxDedupeKey, retryTime, RETRY_DELAYS_MS } from './src/services/outboxQueue';
import { makeId, mergeById, messageFrom, restoreScreenFromSession, RESTORABLE_SCREENS, sameJson, serializeUser } from './src/services/appCore';
import { validateCloudSnapshot } from './src/services/dataSchema';
import { backFromSaveProfile, onboardingNextScreen, ownershipConflict, postAuthScreen, shouldStampOwner } from './src/services/flowRouting';
import { buildExportPayload, writeExportFile } from './src/services/dataExport';

const HEADER_ROW_HEIGHT = 48;

// Not pure (reads module-level Firebase readiness) — stays here.
function authStatusMessage() {
  if (firebaseReady) return 'Firebase ready';
  if (preproductionAuthReady) return 'Preproduction demo auth active';
  return firebaseUnavailableMessage();
}

// Queue semantics (dedupe/merge/expiry/backoff) live in src/services/outboxQueue.js
// (pure + unit-tested). This wrapper just supplies App's id + error-message helpers.
function makeOutboxItem(kind, payload, error) {
  return buildOutboxItem({ kind, payload, id: makeId('outbox'), message: messageFrom(error, 'Cloud sync failed') });
}

async function saveOutboxCloudItem(uid, item) {
  if (item.kind === 'profile') return saveCloudProfile(uid, item.payload);
  if (item.kind === 'scan') return saveCloudScan(uid, item.payload);
  if (item.kind === 'feedback') return saveCloudFeedback(uid, item.payload);
  if (item.kind === 'event') return saveCloudEvent(uid, item.payload);
  return null;
}

function HeaderButton({ label, onPress, align, t }) {
  return (
    <View style={{ width: 104, alignItems: align }}>
      {label ? (
        <Pressable onPress={onPress} accessibilityRole="button" hitSlop={12}
          style={{ minHeight: 42, minWidth: 82, paddingHorizontal: 6, justifyContent: 'center',
            alignItems: align }}>
          <Text style={{ fontFamily: t.sans, fontSize: 14, fontWeight: '800', color: t.accentDeep }}>
            {label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function HeaderTitle({ title, t }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
      <Text style={{ fontFamily: t.sans, fontSize: 9.5, fontWeight: '900', color: t.accentDeep,
        textTransform: 'uppercase', letterSpacing: 0 }}>
        Nyara
      </Text>
      <Text numberOfLines={1} style={{ fontFamily: t.sans, fontSize: 14.5, lineHeight: 18, fontWeight: '800', color: t.ink }}>
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

function ProcessingBanner({ task, t }) {
  if (!task) return null;
  const label = task.label || 'This step';
  const detail = task.type === 'camera-ocr'
    ? 'Keep Nyara open while it reads the label. Closing now can stop the scan, and you may need to take it again.'
    : task.type === 'offline-pack'
      ? 'Keep Nyara open while it prepares offline scanning. This helps make future scans faster and more reliable.'
      : task.type === 'cloud-backup'
        ? 'Keep Nyara open while it finishes the backup. Your local data stays saved even if the network is slow.'
        : 'Keep Nyara open for a moment so this can finish cleanly.';

  return (
    <View style={{ paddingHorizontal: 14, paddingTop: 10, backgroundColor: t.bg }}>
      <View accessibilityRole="alert" style={{ flexDirection: 'row', alignItems: 'center', gap: 12,
        borderRadius: 15, backgroundColor: t.accentTint, borderWidth: 1, borderColor: t.accentSoft,
        padding: 13 }}>
        <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: t.surface,
          alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={t.accentDeep} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: t.sans, fontSize: 14.2, fontWeight: '900', color: t.ink }}>
            {label} is in progress
          </Text>
          <Text style={{ fontFamily: t.sans, fontSize: 12.7, color: t.ink2, lineHeight: 18, marginTop: 2 }}>
            {detail}
          </Text>
        </View>
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
  const [syncStatus, setSyncStatus] = useState(authStatusMessage());
  const [syncOutbox, setSyncOutbox] = useState([]);
  const syncOutboxRef = useRef([]);
  const [storageNotice, setStorageNotice] = useState('');
  const [offlinePack, setOfflinePack] = useState(null);
  const [security, setSecurity] = useState(null);
  const [localBackup, setLocalBackup] = useState(null);
  const [locked, setLocked] = useState(false);
  const [lockRecoveryMode, setLockRecoveryMode] = useState(false);
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
  const commercial = normalizeCommercial(settings.commercial);
  const homeAd = houseAdForContext(commercial, 'home');
  // Scan quota: family plans scale the monthly pool by member count. Gate counts
  // real scans only (samples are free). At the cap, scanning blocks until the 1st.
  // Family token ledger: per-member credits the family can transfer. Derived from
  // the live plan + member list each render so departures/joins reconcile; the
  // raw ledger persists in settings.
  const onFamilyPlan = isFamilyPlan(commercial.planId);
  // Tiers (2026-06-20): paid (Individual/Family) is UNLIMITED, only Free is capped,
  // so scanQuota gates everyone (it returns unlimited for paid). The per-member
  // family ledger is dormant under unlimited but kept for a possible finite future.
  const familyMembersForLedger = [{ id: 'self', name: profile?.name || 'You', child: false },
    ...((profile?.familyMembers || []).map((m) => ({ id: m.id, name: m.name, child: !!m.child })))];
  const familyLedger = (onFamilyPlan && !isUnlimited(commercial.planId))
    ? normalizeFamilyLedger(settings.familyLedger, commercial, familyMembersForLedger)
    : null;
  const scanGate = familyLedger
    ? familyScanGate(familyLedger, commercial, 'self')
    : scanQuota(commercial, settings.scanUsage, 1);
  const productReviewQueue = feedbackLog.filter((entry) => {
    const label = String(entry?.label || '').toLowerCase();
    return entry?.category === 'product_issue' || label === 'wrong' || label === 'unsure';
  });
  const productIssueCount = productReviewQueue.length;

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

  const flushOutbox = async (uid, queue = syncOutboxRef.current, { force = false } = {}) => {
    if (!uid || !queue.length) return { queue, pushed: 0, expired: 0, lastError: '' };
    const now = Date.now();
    const remaining = [];
    let pushed = 0;
    let expired = 0;
    let lastError = '';

    for (const item of queue) {
      const isExpired = item.expiresAt && new Date(item.expiresAt).getTime() <= now;
      const due = force || !item.nextRetryAt || new Date(item.nextRetryAt).getTime() <= now;
      if (isExpired) {
        expired += 1;
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
    } else if (expired) {
      setSyncStatus(`Backup queue cleared: ${lastError}`);
    }
    return { queue: savedQueue, pushed, expired, lastError };
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

  // Cross-account guard (adversarial review, CRITICAL): this device's health data
  // may belong to a different account. Never pull-merge or push across accounts.
  // The owner stamp survives sign-out on purpose.
  const verifyDataOwnership = async (uid) => {
    const ownerResult = await readLocalValue(LOCAL_KEYS.dataOwner, null).catch(() => null);
    const owner = ownerResult?.value || null;
    const hasLocalData = !!profile || savedScans.length > 0 || feedbackLog.length > 0;
    if (ownershipConflict({ owner, uid, hasLocalData })) {
      setSyncStatus("This device holds another account's data - cloud sync is blocked. Clear local data in Profile to use this account here.");
      return false;
    }
    if (shouldStampOwner({ owner, uid, hasLocalData })) {
      await writeLocalValue(LOCAL_KEYS.dataOwner, uid).catch((e) => console.warn('data-owner stamp failed:', e?.message));
    }
    return true;
  };

  const pushSnapshotWithQueue = async (uid, snapshot = currentBackupSnapshot()) => {
    try {
      if (!(await verifyDataOwnership(uid))) return false;
      await pushLocalSnapshot(uid, snapshot);
      const outboxResult = await flushOutbox(uid);
      if (outboxResult.expired && !outboxResult.queue.length && !outboxResult.pushed) {
        setSyncStatus(`Backed up current data. Old queued item expired: ${outboxResult.lastError}`);
      } else {
        setSyncStatus(`Backed up ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`);
      }
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
      `${interruptedTask.label || 'The last task'} did not keep running after Nyara closed, so nothing was half-saved. Start it again when you're ready.`,
      [{ text: 'OK', onPress: () => setInterruptedTask(null) }],
    );
  }, [hydrated, interruptedTask]);

  useEffect(() => subscribeAuthState((user) => {
    const nextUser = serializeUser(user);
    setAuthUser(nextUser);
    setSyncStatus(nextUser ? 'Signed in. Sync pending…' : authStatusMessage());
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
        if (!(await verifyDataOwnership(authUser.uid))) return;
        // Sanitize untrusted cloud data before it touches state/storage (dataSchema).
        const cloud = validateCloudSnapshot(await pullCloudSnapshot(authUser.uid)).value;
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
    // Snapshot date: members match offline from this snapshot; UI can show staleness.
    saveProfile({ ...profile, familyMembers: [...existing, { ...member, addedAt: new Date().toISOString() }] });
  };

  const removeFamilyMember = (member) => {
    if (!profile || !member?.id) return;
    Alert.alert(
      'Remove family profile?',
      `Remove ${member.name || 'this family member'} from this device's Nyara profile? Saved scans stay in Diary.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const nextMembers = (profile.familyMembers || []).filter((m) => m.id !== member.id);
            saveProfile({ ...profile, familyMembers: nextMembers });
          },
        },
      ],
    );
  };

  // Move scans between family members (engine: transferScans). Returns {ok,reason}
  // so the sheet can report honestly; persists the new ledger on success.
  const transferFamilyScans = (fromId, toId, n) => {
    if (!familyLedger) return { ok: false, reason: 'Transfers are available on family plans.' };
    const res = transferScans(familyLedger, fromId, toId, n);
    if (res.ok) updateSettings({ familyLedger: res.ledger });
    return res;
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
      'This removes the saved profile, scan diary, and feedback from THIS device only. '
      + (authUser
        ? 'You stay signed in, and any cloud backup is kept — to remove that too, use "Delete cloud backup" and sign out.'
        : 'Nothing is synced, so this device is the only copy.'),
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
            setLockRecoveryMode(false);
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
        const combined = [entry, ...prev];
        const saved = combined.slice(0, 200);
        deleteScanImages(combined.slice(200)); // reap photos for scans aged past the cap
        persistLocalValue(LOCAL_KEYS.scans, saved, 'Scan diary');
        return saved;
      });
      // Count toward the monthly quota — real scans only, never samples. On a family
      // plan the scanning member (self on this device) spends their own credit.
      if (source !== 'sample') {
        if (onFamilyPlan && familyLedger) {
          updateSettings({ familyLedger: recordFamilyScan(familyLedger, 'self') });
        } else {
          updateSettings({ scanUsage: recordScanUsage(settings.scanUsage) });
        }
      }
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

  const recordFeedback = (label, extra = {}) => {
    const entry = {
      id: makeId('feedback'),
      label,
      category: extra.category || 'result_feedback',
      source: extra.source || 'result',
      note: extra.note || '',
      createdAt: new Date().toISOString(),
      savedScanId: extra.savedScanId || result?.savedScanId || null,
      product: extra.product || result?.product || {},
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
      category: entry.category,
    });
    if (entry.savedScanId) {
      setSavedScans((prev) => {
        const next = prev.map((scan) => (scan.id === entry.savedScanId ? { ...scan, feedback: label } : scan));
        persistLocalValue(LOCAL_KEYS.scans, next, 'Scan diary');
        const updated = next.find((scan) => scan.id === entry.savedScanId);
        if (canCloudBackup && updated) saveCloudScan(authUser.uid, updated).catch((error) => enqueueOutbox('scan', updated, error));
        return next;
      });
    }
  };

  const openSavedScan = (scan) => {
    if (!scan) return;
    setResult({
      findings: scan.findings || [],
      unverified: scan.unverified || [],
      product: scan.product || {},
      image: scan.image || null,
      ocr: scan.ocr || null,
      savedScanId: scan.id,
      savedAt: scan.savedAt,
      source: scan.source || 'saved',
    });
    setResultNext(null);
    setScreen('result');
  };

  const reportProductIssue = () => {
    Alert.alert(
      'Report product data?',
      'Open a saved scan to mark the exact result as Wrong or Unsure, or log a general review request now.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open diary', onPress: () => setScreen('history') },
        {
          text: 'Log request',
          onPress: () => {
            recordFeedback('Product issue', {
              category: 'product_issue',
              source: 'profile',
              note: 'General product or ingredient data review request.',
            });
            setStorageNotice('Product data review request saved.');
          },
        },
      ],
    );
  };

  const openProductReviewItem = (entry) => {
    if (!entry) return;
    const scan = entry.savedScanId ? savedScans.find((item) => item.id === entry.savedScanId) : null;
    if (scan) {
      openSavedScan(scan);
      return;
    }
    setStorageNotice('General product review request is saved. Open a saved scan to attach exact label evidence.');
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
        if (!(await verifyDataOwnership(signedInUser.uid))) {
          setScreen(profile ? (returnTo && returnTo !== 'scan' ? returnTo : 'profile') : 'onboarding-intent');
          return credential;
        }
        const cloud = validateCloudSnapshot(await pullCloudSnapshot(signedInUser.uid)).value;
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
    setScreen(postAuthScreen({ hasProfile: !!nextProfile, returnTo }));
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

  const handleDemoGoogleAuth = async () => {
    const credential = await signInWithDemoGoogle();
    return finishAuth(credential);
  };

  const handleAppleAuth = async () => {
    const credential = await signInWithApple();
    return finishAuth(credential);
  };

  const finishLockRecovery = async (credential) => {
    const signedInUser = serializeUser(credential?.user);
    if (!signedInUser?.uid) {
      throw new Error('Sign-in did not complete. No account was returned.');
    }
    const ownerResult = await readLocalValue(LOCAL_KEYS.dataOwner, null).catch(() => null);
    const owner = ownerResult?.value || null;
    const hasLocalData = !!profile || savedScans.length > 0 || feedbackLog.length > 0;
    if (ownershipConflict({ owner, uid: signedInUser.uid, hasLocalData })) {
      throw new Error("This account does not match the Nyara data protected on this phone.");
    }

    setAuthUser(signedInUser);
    if (shouldStampOwner({ owner, uid: signedInUser.uid, hasLocalData })) {
      await persistLocalValue(LOCAL_KEYS.dataOwner, signedInUser.uid, 'Data owner');
    }
    const nextSecurity = disablePinSecurity(security || {});
    await persistSecurity(nextSecurity);
    setLocked(false);
    setLockRecoveryMode(false);
    setSyncStatus('Signed in. App PIN reset on this device.');
    setScreen('security-backup');
    return credential;
  };

  const handleEmailLockRecovery = async ({ email, password }) => {
    const credential = await signInWithEmail({ email, password, mode: 'sign-in' });
    return finishLockRecovery(credential);
  };

  const handleGoogleLockRecovery = async (idToken) => {
    const credential = await signInWithGoogleIdToken(idToken);
    return finishLockRecovery(credential);
  };

  const handleDemoGoogleLockRecovery = async () => {
    const credential = await signInWithDemoGoogle();
    return finishLockRecovery(credential);
  };

  const handleAppleLockRecovery = async () => {
    const credential = await signInWithApple();
    return finishLockRecovery(credential);
  };

  const handleSignOut = async () => {
    try {
      await signOutCurrentUser();
      setAuthUser(null);
      setSyncStatus(authStatusMessage());
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
      setReturnTo('security-backup');
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

  const retryAllBackupsNow = async () => {
    if (!authUser?.uid) {
      setSyncStatus('Sign in to retry cloud backup.');
      setReturnTo('security-backup');
      setScreen('save-profile');
      return false;
    }
    if (!cloudBackupEnabled) {
      setSyncStatus('Turn on cloud backup before retrying.');
      return false;
    }
    const taskId = beginProcessingTask('cloud-retry', 'Retrying backup queue');
    setSyncStatus('Retrying queued backups...');
    try {
      const result = await flushOutbox(authUser.uid, syncOutboxRef.current, { force: true });
      if (!result.queue.length && result.expired) {
        setSyncStatus(`Queued backups expired: ${result.lastError}`);
        return false;
      }
      if (!result.queue.length) setSyncStatus('Queued backups are synced.');
      return result.queue.length === 0;
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

  // Export the user's own data (profile + diary + feedback) to a shareable JSON.
  // Photos stay on device (dataExport strips uris). Uses the OS share sheet.
  const exportMyData = async () => {
    try {
      const payload = buildExportPayload({ profile, scans: savedScans, feedback: feedbackLog, settings });
      const uri = await writeExportFile(payload);
      if (uri) {
        await Share.share({ url: uri, title: 'Nyara data export', message: 'My Nyara data export.' });
      } else {
        // No file system (shouldn't happen on device) — share the JSON inline.
        await Share.share({ title: 'Nyara data export', message: JSON.stringify(payload) });
      }
    } catch (error) {
      setStorageNotice(messageFrom(error, 'Could not export your data.'));
    }
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
    if (!nextProfile) {
      setScreen('onboarding-intent');
      return;
    }
    const { findings, unverified } = matchScan(TUTORIAL.text, nextProfile, matcherData);
    showResult({
      findings,
      unverified,
      product: { name: TUTORIAL.name, brand: TUTORIAL.brand, date: TUTORIAL.date },
    }, { source: 'sample', persist: false, next: { label: 'Show me how Nyara works', screen: 'how-it-works' } });
  };

  const previewFirstResult = () => {
    runFirstSample(profile);
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
      setScreen('onboarding-intent');
      return;
    }
    saveProfile(profile);
    setScreen('getting-ready');
  };

  const continueFromOnboardingIntent = (intent) => {
    updateSettings({ onboardingIntent: intent ? { id: intent.id, title: intent.title } : null });
    setScreen('onboarding');
  };

  const acceptPolicies = () => {
    const now = new Date().toISOString();
    updateSettings({
      policyAcceptedAt: now,
      safetyAcknowledgedAt: now,
    });
    setReturnTo('getting-ready');
    setScreen('save-profile');
  };

  // Plan change routes through the billing seam: store mode runs the real purchase
  // (entitlement decides the plan); preview mode applies locally with an honest note.
  // Card data never touches us — store billing keeps Nyara out of PCI scope.
  const selectPlanPreview = async (planId) => {
    const res = await purchasePlan(planId);
    if (!res.ok) {
      setStorageNotice(res.reason || 'That plan could not be selected.');
      return;
    }
    const grantedPlan = res.planId || planId;
    const nextCommercial = updateCommercialPlan(settings.commercial, grantedPlan);
    updateSettings({ commercial: nextCommercial });
    setStorageNotice(res.mode === 'store'
      ? `${planFor(grantedPlan).label} active.`
      : res.note || `${planFor(grantedPlan).label} preview selected. No charge — store billing isn't connected yet.`);
    recordProcessEvent('commercial.plan_selected', { planId: grantedPlan, billingMode: res.mode, charged: !!res.charged });
  };

  // Restore purchases — the entitlement backup after reinstall / new phone.
  const restorePlan = async () => {
    const res = await restorePurchases();
    if (!res.ok) { setStorageNotice(res.reason || 'Restore failed.'); return; }
    if (res.planId) {
      const nextCommercial = updateCommercialPlan(settings.commercial, res.planId);
      updateSettings({ commercial: nextCommercial });
      setStorageNotice(`Restored: ${planFor(res.planId).label}.`);
    } else {
      setStorageNotice(res.note || 'No purchases to restore.');
    }
    recordProcessEvent('commercial.restore', { planId: res.planId || null, billingMode: res.mode });
  };

  const continueFromResult = () => {
    const next = resultNext?.screen;
    setResultNext(null);
    setScreen(next || 'diary');
  };

  if (!hydrated) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: t.sans, fontSize: 15, fontWeight: '800', color: t.ink }}>Nyara</Text>
      </SafeAreaView>
    );
  }

  if (locked && isSecurityEnabled(security)) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
        {lockRecoveryMode ? (
          <SaveProfileScreen
            hasProfile={!!profile}
            onBack={() => setLockRecoveryMode(false)}
            onEraseDevice={clearLocalData}
            onEmailAuth={handleEmailLockRecovery}
            onGoogleToken={handleGoogleLockRecovery}
            onDemoGoogleAuth={handleDemoGoogleLockRecovery}
            onAppleAuth={handleAppleLockRecovery}
            onResetPassword={resetPassword}
            authReady={firebaseReady}
            preproductionAuthReady={preproductionAuthReady}
            authUser={authUser}
            syncStatus={syncStatus}
            recoveryMode
          />
        ) : (
          <UnlockScreen
            onUnlock={unlockApp}
            onForgotPin={() => setLockRecoveryMode(true)}
            lockoutText={lockoutMessage(security)}
          />
        )}
        <StatusBar style="dark" />
      </SafeAreaView>
    );
  }

  let body, title, left = {}, right = {};
  const tabs = new Set(['diary', 'scan', 'patterns', 'profile']);
  if (screen === 'welcome') {
    title = 'Welcome';
    body = <WelcomeScreen
      // New users see the Mirror-Principle intro first; returning sign-ins skip it.
      onStart={() => { setReturnTo('getting-ready'); setScreen(settings.introSeenAt ? (settings.policyAcceptedAt ? 'save-profile' : 'policy') : 'intro'); }}
      onSignIn={() => { setReturnTo('getting-ready'); setScreen(settings.policyAcceptedAt ? 'save-profile' : 'policy'); }}
    />;
  } else if (screen === 'intro') {
    title = 'Welcome';
    left = { label: '‹ Welcome', onPress: () => setScreen('welcome') };
    const leaveIntro = () => { updateSettings({ introSeenAt: new Date().toISOString() }); setScreen(settings.policyAcceptedAt ? 'save-profile' : 'policy'); };
    body = <IntroScreen onDone={leaveIntro} onSkip={leaveIntro} />;
  } else if (screen === 'policy') {
    title = 'Agreement';
    left = { label: '‹ Welcome', onPress: () => setScreen('welcome') };
    body = <PolicyAgreementScreen onAccept={acceptPolicies} onBack={() => setScreen('welcome')} />;
  } else if (screen === 'onboarding-intent') {
    title = 'Setup';
    left = { label: '‹ Sign in', onPress: () => setScreen('save-profile') };
    body = <OnboardingIntentScreen
      onContinue={continueFromOnboardingIntent}
      onSkip={() => continueFromOnboardingIntent(null)}
    />;
  } else if (screen === 'onboarding') {
    title = profileSaved ? 'Edit Profile' : 'Watchlist';
    body = <OnboardingScreen initialProfile={profile} onDone={(p) => {
      saveProfile(p);
      setScreen(onboardingNextScreen({ profileSaved, hasProfile: !!profile }));
    }} guidedFocus={settings.onboardingIntent} />;
  } else if (screen === 'save-profile') {
    title = profile ? 'Save Profile' : 'Sign In';
    body = <SaveProfileScreen hasProfile={!!profile} onUseLocal={useLocally}
      onBack={() => setScreen(backFromSaveProfile({ hasProfile: !!profile, returnTo }))}
      onEmailAuth={handleEmailAuth}
      onGoogleToken={handleGoogleAuth}
      onDemoGoogleAuth={handleDemoGoogleAuth}
      onAppleAuth={handleAppleAuth}
      onResetPassword={resetPassword}
      authReady={firebaseReady}
      preproductionAuthReady={preproductionAuthReady}
      authUser={authUser}
      syncStatus={syncStatus} />;
  } else if (screen === 'getting-ready') {
    title = 'Getting Ready';
    body = <GettingReadyScreen profile={profile} offlinePack={offlinePack}
      onDownload={downloadOfflinePack} onDone={() => setScreen('diary')} />;
  } else if (screen === 'credibility') {
    title = 'Why Nyara';
    body = <CredibilityScreen onContinue={previewFirstResult} onSkip={previewFirstResult} />;
  } else if (screen === 'how-it-works') {
    title = 'How It Works';
    body = <HowItWorksScreen onDone={() => setScreen('getting-ready')} />;
  } else if (screen === 'diary') {
    title = 'Home';
    right = { label: 'Theme', onPress: openAppearance };
    body = <DesignPreviewScreen scans={savedScans} offlinePack={offlinePack} ad={homeAd}
      onScan={() => setScreen('scan')} onDownload={() => setScreen('getting-ready')}
      onDiary={() => setScreen('history')} onPlans={() => setScreen('plans')} />;
  } else if (screen === 'history') {
    title = 'Diary';
    left = { label: '‹ Home', onPress: () => setScreen('diary') };
    body = <DiaryScreen scans={savedScans} houseAd={houseAdForContext(commercial, 'diary')} onAd={() => setScreen('plans')}
              onSample={runTutorial} onScan={() => setScreen('scan')} onOpenScan={openSavedScan} />;
  } else if (screen === 'scan') {
    title = 'Scan';
    right = { label: 'Theme', onPress: openAppearance };
    body = <ScanScreen profile={profile} matcherData={matcherData}
              scanGate={scanGate} onUpgrade={() => setScreen('upgrade')}
              onResult={(r, options = {}) => showResult(r, { source: 'manual', persist: true, ...options })}
              onCamera={() => setScreen('camera')} />;
  } else if (screen === 'patterns') {
    title = 'Patterns';
    right = { label: 'Theme', onPress: openAppearance };
    body = <PatternsScreen scans={savedScans} houseAd={houseAdForContext(commercial, 'patterns')} onAd={() => setScreen('plans')}
              onScan={() => setScreen('scan')} />;
  } else if (screen === 'profile') {
    title = 'Profile';
    body = <ProfileScreen profile={profile} scans={savedScans} feedbackCount={feedbackLog.length}
      productIssueCount={productIssueCount}
      productReviewQueue={productReviewQueue}
      settings={settings} authUser={authUser} authReady={firebaseReady} preproductionAuthReady={preproductionAuthReady}
      syncStatus={syncStatus} commercial={commercial}
      familyLedger={familyLedger} onTransferScans={transferFamilyScans}
      onAppearance={openAppearance} onEditProfile={() => setScreen('onboarding')} onClearLocalData={clearLocalData}
      onToggleSaveLabelImages={() => updateSettings({ saveLabelImages: !settings.saveLabelImages })}
      onSignIn={() => { setReturnTo('profile'); setScreen('save-profile'); }} onSignOut={handleSignOut} onAddMember={addFamilyMember}
      onRemoveMember={removeFamilyMember}
      onDesignPreview={() => setScreen('design-preview')} onVisualConcept={() => setScreen('visual-concept')}
      onPlans={() => setScreen('plans')}
      onReportIssue={reportProductIssue}
      onOpenReviewItem={openProductReviewItem}
      onSecurityBackup={() => setScreen('security-backup')} />;
  } else if (screen === 'camera') {
    title = 'Camera';
    left = { label: '‹ Scan', onPress: () => setScreen('scan') };
    body = <CameraScreen profile={profile} matcherData={matcherData} onBack={() => setScreen('scan')}
              scanGate={scanGate} onUpgrade={() => setScreen('upgrade')}
              onManual={() => setScreen('scan')}
              onResult={(r) => showResult(r, { source: 'camera', persist: true })}
              onProcessingStart={beginProcessingTask}
              onProcessingEnd={endProcessingTask} />;
  } else if (screen === 'result') {
    title = 'Result';
    left = { label: resultNext ? '‹ Watchlist' : '‹ Scan', onPress: () => setScreen(resultNext ? 'onboarding' : 'scan') };
    body = <ResultScreen {...(result || {})} onFeedback={recordFeedback}
      nextLabel={resultNext?.label} onNext={resultNext ? continueFromResult : undefined} />;
  } else if (screen === 'appearance') {
    title = 'Appearance';
    left = { label: '‹ Back', onPress: () => setScreen(returnTo) };
    body = <AppearanceScreen />;
  } else if (screen === 'upgrade') {
    title = 'Go unlimited';
    left = { label: '‹ Scan', onPress: () => setScreen('scan') };
    body = <UpgradeScreen
      scanGate={scanGate}
      onChoosePlan={(planId) => { selectPlanPreview(planId); setScreen('scan'); }}
      onMaybeLater={() => setScreen('scan')} />;
  } else if (screen === 'plans') {
    title = 'Plans';
    left = { label: '‹ Profile', onPress: () => setScreen('profile') };
    body = <PlansScreen commercial={commercial} onSelectPlan={selectPlanPreview} onRestore={restorePlan} onBack={() => setScreen('profile')} />;
  } else if (screen === 'design-preview') {
    title = 'Preview';
    left = { label: '‹ Profile', onPress: () => setScreen('profile') };
    body = <DesignPreviewScreen scans={savedScans} offlinePack={offlinePack}
      onScan={() => setScreen('scan')} onDownload={() => setScreen('getting-ready')} />;
  } else if (screen === 'visual-concept') {
    title = 'Visuals';
    left = { label: '‹ Profile', onPress: () => setScreen('profile') };
    body = <VisualConceptScreen />;
  } else if (screen === 'security-backup') {
    title = 'Security';
    left = { label: '‹ Profile', onPress: () => setScreen('profile') };
    body = <SecurityBackupScreen
      settings={settings}
      security={security}
      authUser={authUser}
      authReady={firebaseReady}
      preproductionAuthReady={preproductionAuthReady}
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
      onRetryBackupsNow={retryAllBackupsNow}
      onDeleteCloudBackup={deleteCloudBackupNow}
      onCreateLocalBackup={createLocalBackup}
      onRestoreLocalBackup={restoreLocalBackup}
      onExportData={exportMyData}
      onToggleAutoOfflinePack={toggleAutoOfflinePack}
      onManageOfflinePack={() => setScreen('getting-ready')}
      onToggleSaveLabelImages={() => updateSettings({ saveLabelImages: !settings.saveLabelImages })}
      onClearLocalData={clearLocalData}
      onSignIn={() => { setReturnTo('security-backup'); setScreen('save-profile'); }}
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
        onAction={canCloudBackup && syncOutbox.length ? () => flushOutbox(authUser.uid, syncOutboxRef.current, { force: true }) : undefined}
        t={t} />
      <ProcessingBanner task={activeTask} t={t} />
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
