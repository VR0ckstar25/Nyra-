import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import { CloudUpload, HardDriveDownload, LockKeyhole, ShieldCheck, WifiOff } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Card, Overline, PrimaryButton, ProgressBar, ScreenIntro, SecondaryButton, SwitchPill } from '../components/DesignPrimitives';
import { formatBytes } from '../services/offlinePacks';
import { isSecurityEnabled } from '../services/securityService';

function formatDate(value) {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Saved';
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function offlineFreshness(pack) {
  if (!pack?.downloadedAt) return { label: 'Not ready', detail: 'Download a recommended pack before relying on offline scanning.' };
  const downloaded = new Date(pack.downloadedAt).getTime();
  if (Number.isNaN(downloaded)) return { label: 'Saved', detail: 'Offline pack is saved, but the build date is unknown.' };
  const ageDays = Math.floor((Date.now() - downloaded) / (24 * 60 * 60 * 1000));
  if (ageDays < 1) return { label: 'Fresh', detail: 'Built today from the selected offline pack options.' };
  if (ageDays <= 14) return { label: `${ageDays}d old`, detail: 'Still recent. Rebuild after profile or database changes.' };
  return { label: `${ageDays}d old`, detail: 'Rebuild recommended so offline scans use the latest bundled data.' };
}

function Stat({ label, value, t }) {
  return (
    <View style={{ flex: 1, minHeight: 64, borderRadius: 14, backgroundColor: t.surfaceWarm,
      borderWidth: 1, borderColor: t.lineSoft, padding: 10, justifyContent: 'center' }}>
      <Text numberOfLines={1} style={{ fontFamily: t.mono, fontSize: 10.5, color: t.ink3 }}>{label}</Text>
      <Text numberOfLines={1} style={{ fontFamily: t.sans, fontSize: 15, fontWeight: '900',
        color: t.ink, marginTop: 4 }}>
        {value}
      </Text>
    </View>
  );
}

function SectionHeader({ icon: Icon, title, sub, color, t }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 13 }}>
      <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: t.surfaceWarm,
        alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={22} color={color || t.accentDeep} strokeWidth={2.5} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontFamily: t.sans, fontSize: 16, fontWeight: '900', color: t.ink }}>{title}</Text>
        {sub ? (
          <Text style={{ fontFamily: t.sans, fontSize: 12.5, color: t.ink2, lineHeight: 18, marginTop: 2 }}>
            {sub}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function SecurityBackupScreen({
  settings,
  security,
  authUser,
  authReady,
  preproductionAuthReady = false,
  syncStatus,
  syncOutbox,
  offlinePack,
  scans,
  feedbackCount,
  localBackup,
  onSetAppPin,
  onDisableAppPin,
  onLockNow,
  onToggleCloudBackup,
  onBackupNow,
  onRetryBackupsNow,
  onDeleteCloudBackup,
  onCreateLocalBackup,
  onRestoreLocalBackup,
  onExportData,
  onToggleAutoOfflinePack,
  onManageOfflinePack,
  onToggleSaveLabelImages,
  onClearLocalData,
  onSignIn,
}) {
  const { theme: t } = useTheme();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [status, setStatus] = useState('');
  const lockEnabled = isSecurityEnabled(security);
  const cloudEnabled = !!settings.cloudBackupEnabled;
  const autoOffline = !!settings.autoOfflinePack;
  const canSignIn = authReady || preproductionAuthReady;
  const freshness = offlineFreshness(offlinePack);
  const selectedPackLabel = offlinePack?.selectedPackIds?.length
    ? offlinePack.selectedPackIds.join(', ')
    : 'None';

  const savePin = async () => {
    setStatus('');
    if (pin !== confirmPin) {
      setStatus('PINs do not match.');
      return;
    }
    try {
      await onSetAppPin(pin);
      setPin('');
      setConfirmPin('');
      setStatus('App lock is on.');
    } catch (error) {
      setStatus(error?.message || 'Could not enable app lock.');
    }
  };

  const confirmDisablePin = () => {
    Alert.alert('Turn off app lock?', 'The app will still use encrypted storage, but opening Nyara will not require the app PIN.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Turn off', style: 'destructive', onPress: onDisableAppPin },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 18, paddingBottom: 30 }}>
      <ScreenIntro
        title="Security, backup, offline"
        sub="Controls for device privacy, cloud backup, local recovery, and offline scanning."
        t={t}
      />

      <Card t={t} style={{ marginBottom: 16 }}>
        <SectionHeader icon={LockKeyhole} title="App lock" sub="Adds a local PIN gate over the whole app." t={t} />
        {lockEnabled ? (
          <>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
              <Stat label="Status" value="On" t={t} />
              <Stat label="Auto-lock" value={`${settings.appLockTimeoutMinutes || 5} min`} t={t} />
            </View>
            <PrimaryButton onPress={onLockNow} t={t}>Lock now</PrimaryButton>
            <SecondaryButton onPress={confirmDisablePin} t={t} style={{ marginTop: 10 }}>
              Turn off app lock
            </SecondaryButton>
          </>
        ) : (
          <>
            <Text style={{ fontFamily: t.sans, fontSize: 13.5, color: t.ink2, lineHeight: 20, marginBottom: 12 }}>
              The PIN is salted and hashed locally. It is not uploaded and cannot be recovered.
            </Text>
            <TextInput
              value={pin}
              onChangeText={setPin}
              placeholder="Create PIN"
              placeholderTextColor={t.ink3}
              secureTextEntry
              keyboardType="number-pad"
              style={{ height: 46, borderRadius: 13, borderWidth: 1, borderColor: t.line,
                backgroundColor: t.surfaceWarm, paddingHorizontal: 13, fontFamily: t.sans,
                fontSize: 15, color: t.ink, marginBottom: 10 }}
            />
            <TextInput
              value={confirmPin}
              onChangeText={setConfirmPin}
              placeholder="Confirm PIN"
              placeholderTextColor={t.ink3}
              secureTextEntry
              keyboardType="number-pad"
              style={{ height: 46, borderRadius: 13, borderWidth: 1, borderColor: t.line,
                backgroundColor: t.surfaceWarm, paddingHorizontal: 13, fontFamily: t.sans,
                fontSize: 15, color: t.ink, marginBottom: 12 }}
            />
            <PrimaryButton onPress={savePin} disabled={!pin || !confirmPin} t={t}>Turn on app lock</PrimaryButton>
          </>
        )}
        {status ? (
          <Text style={{ fontFamily: t.sans, fontSize: 13, color: t.ink2, lineHeight: 19, marginTop: 10 }}>
            {status}
          </Text>
        ) : null}
      </Card>

      <Card t={t} style={{ marginBottom: 16 }}>
        <SectionHeader icon={CloudUpload} title="Cloud backup" sub="Optional account sync with a local retry queue." color="#0B8280" t={t} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: t.sans, fontSize: 14.5, fontWeight: '800', color: t.ink }}>
              Cloud backup
            </Text>
            <Text style={{ fontFamily: t.sans, fontSize: 12.5, color: t.ink2, lineHeight: 18, marginTop: 2 }}>
              {authUser?.email ? authUser.email : (authReady ? 'Sign in to use cloud backup.' : preproductionAuthReady ? 'Preproduction demo auth is available.' : 'Firebase is not configured.')}
            </Text>
          </View>
          <SwitchPill on={cloudEnabled} onPress={onToggleCloudBackup} t={t} />
        </View>
        <Text style={{ fontFamily: t.mono, fontSize: 11.5, color: t.ink3, lineHeight: 17, marginBottom: 12 }}>
          {syncStatus || 'Local mode'} · queue {syncOutbox.length}
        </Text>
        {authUser?.uid ? (
          <>
            <PrimaryButton onPress={onBackupNow} disabled={!cloudEnabled} t={t}>Back up now</PrimaryButton>
            <SecondaryButton onPress={onRetryBackupsNow} disabled={!cloudEnabled || !syncOutbox.length} t={t} style={{ marginTop: 10 }}>
              Retry queued backups now
            </SecondaryButton>
            <SecondaryButton onPress={onDeleteCloudBackup} t={t} style={{ marginTop: 10 }}>
              Delete cloud backup
            </SecondaryButton>
          </>
        ) : (
          <PrimaryButton onPress={onSignIn} disabled={!canSignIn} t={t}>Sign in for backup</PrimaryButton>
        )}
      </Card>

      <Card t={t} style={{ marginBottom: 16 }}>
        <SectionHeader icon={HardDriveDownload} title="Secure local checkpoint" sub="A rollback point saved in encrypted storage on this device." color="#765C9C" t={t} />
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
          <Stat label="Checkpoint" value={formatDate(localBackup?.createdAt)} t={t} />
          <Stat label="Scans" value={`${localBackup?.counts?.scans || 0}`} t={t} />
        </View>
        <PrimaryButton onPress={onCreateLocalBackup} t={t}>Create checkpoint</PrimaryButton>
        <SecondaryButton onPress={onRestoreLocalBackup} disabled={!localBackup} t={t} style={{ marginTop: 10 }}>
          Restore checkpoint
        </SecondaryButton>
        <SecondaryButton onPress={onExportData} t={t} style={{ marginTop: 10 }}>
          Export my data
        </SecondaryButton>
        <Text style={{ fontFamily: t.sans, fontSize: 12, color: t.ink3, lineHeight: 17, marginTop: 8 }}>
          Saves a JSON copy of your profile, severity levels, and scan diary to share or keep. Label photos stay on this phone — only their dates are included.
        </Text>
      </Card>

      <Card t={t} style={{ marginBottom: 16 }}>
        <SectionHeader icon={WifiOff} title="Offline readiness" sub="Keeps the scanner useful without network access." color="#E89318" t={t} />
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
          <Stat label="Offline terms" value={`${offlinePack?.termCount || 0}`} t={t} />
          <Stat label="Size" value={offlinePack ? formatBytes(offlinePack.bytes) : 'None'} t={t} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
          <Stat label="Built" value={formatDate(offlinePack?.downloadedAt)} t={t} />
          <Stat label="Freshness" value={freshness.label} t={t} />
        </View>
        <View style={{ borderRadius: 14, backgroundColor: t.surfaceWarm, borderWidth: 1,
          borderColor: t.lineSoft, padding: 12, marginBottom: 12 }}>
          <Text style={{ fontFamily: t.sans, fontSize: 13.2, fontWeight: '900', color: t.ink }}>
            {offlinePack ? 'Offline pack saved' : 'Offline pack not ready'}
          </Text>
          <Text style={{ fontFamily: t.sans, fontSize: 12.4, color: t.ink2, lineHeight: 18, marginTop: 3 }}>
            {freshness.detail}
          </Text>
          <Text style={{ fontFamily: t.mono, fontSize: 10.8, color: t.ink3, lineHeight: 16, marginTop: 6 }}>
            Packs: {selectedPackLabel}
          </Text>
        </View>
        <View style={{ marginBottom: 12 }}>
          <ProgressBar value={offlinePack ? 1 : 0.35} max={1} color="#E89318" t={t} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: t.sans, fontSize: 14.5, fontWeight: '800', color: t.ink }}>
              Auto-build offline pack
            </Text>
            <Text style={{ fontFamily: t.sans, fontSize: 12.5, color: t.ink2, lineHeight: 18, marginTop: 2 }}>
              Rebuilds the matcher pack when the profile changes.
            </Text>
          </View>
          <SwitchPill on={autoOffline} onPress={onToggleAutoOfflinePack} t={t} />
        </View>
        <PrimaryButton onPress={onManageOfflinePack} t={t}>Manage offline pack</PrimaryButton>
      </Card>

      <Card t={t} style={{ marginBottom: 16 }}>
        <SectionHeader icon={ShieldCheck} title="Data minimization" sub="Keep only what the app needs." t={t} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: t.sans, fontSize: 14.5, fontWeight: '800', color: t.ink }}>
              Save label photos
            </Text>
            <Text style={{ fontFamily: t.sans, fontSize: 12.5, color: t.ink2, lineHeight: 18, marginTop: 2 }}>
              Off means label images expire after 7 days. Product names and scan results stay in the diary.
            </Text>
          </View>
          <SwitchPill on={!!settings.saveLabelImages} onPress={onToggleSaveLabelImages} t={t} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Stat label="Scans" value={`${scans.length}`} t={t} />
          <Stat label="Feedback" value={`${feedbackCount}`} t={t} />
        </View>
        <SecondaryButton onPress={onClearLocalData} t={t} style={{ marginTop: 12 }}>
          Clear local data
        </SecondaryButton>
      </Card>

      <Overline t={t}>Security posture</Overline>
      <Text style={{ fontFamily: t.sans, fontSize: 12.8, color: t.ink2, lineHeight: 18, marginTop: 8 }}>
        App data is encrypted at rest on this device, cloud backup is optional, failed cloud saves remain queued locally, and scanning can run from the offline matcher pack.
      </Text>
    </ScrollView>
  );
}
