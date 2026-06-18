import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Card, Overline, PrimaryButton, ProgressBar, ScreenIntro, SecondaryButton, SwitchPill } from '../components/DesignPrimitives';
import { OFFLINE_PACKS, estimateOfflinePack, formatBytes, recommendedOfflinePackIds } from '../services/offlinePacks';

function formatTime(value) {
  if (!value) return 'Not downloaded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Downloaded';
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function PackRow({ pack, selected, recommended, onToggle, t }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13,
      borderBottomWidth: 1, borderBottomColor: t.lineSoft }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <Text style={{ fontFamily: t.sans, fontSize: 15, fontWeight: '800', color: t.ink }}>
            {pack.title}
          </Text>
          {recommended ? (
            <Text style={{ fontFamily: t.mono, fontSize: 10.5, fontWeight: '800', color: t.accentDeep,
              backgroundColor: t.accentTint, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3 }}>
              recommended
            </Text>
          ) : null}
        </View>
        <Text style={{ fontFamily: t.sans, fontSize: 12.7, color: t.ink2, lineHeight: 18, marginTop: 3 }}>
          {pack.sub}
        </Text>
      </View>
      <SwitchPill on={selected} onPress={onToggle} t={t} />
    </View>
  );
}

export function GettingReadyScreen({ profile, offlinePack, onDownload, onDone }) {
  const { theme: t } = useTheme();
  const recommended = useMemo(() => recommendedOfflinePackIds(profile), [profile]);
  const [selected, setSelected] = useState(
    offlinePack?.selectedPackIds?.length ? offlinePack.selectedPackIds : recommended,
  );
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const selectedKey = selected.join('|');
  const estimate = useMemo(() => estimateOfflinePack(profile, selected), [profile, selectedKey]);
  const downloaded = !!offlinePack?.data;
  const selectedSet = new Set(selected);
  const recommendedSet = new Set(recommended);

  const toggle = (id) => {
    setSelected((prev) => {
      const exists = prev.includes(id);
      if (exists && prev.length === 1) {
        setStatus('Keep at least one offline pack selected.');
        return prev;
      }
      setStatus('');
      return exists ? prev.filter((item) => item !== id) : [...prev, id];
    });
  };

  const download = async () => {
    setBusy(true);
    setStatus('Building offline matcher pack...');
    try {
      const saved = await onDownload(selected);
      setStatus(`Saved ${saved.termCount} matcher terms (${formatBytes(saved.bytes)}) on this device.`);
    } catch (error) {
      setStatus(error?.message || 'Offline pack could not be saved on this device.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 18, paddingBottom: 30 }}>
      <ScreenIntro
        title="Getting ready"
        sub="Choose what Nyara keeps available for scanning without network access."
        t={t}
      />

      <Card t={t} style={{ marginBottom: 16 }}>
        <Overline t={t} color={t.accent}>Offline matcher</Overline>
        <View style={{ marginTop: 12, marginBottom: 12 }}>
          <ProgressBar value={downloaded ? 3 : 2} max={3} color={t.accent} t={t} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Metric label="Estimated size" value={formatBytes(estimate.bytes)} t={t} />
          <Metric label="Terms" value={`${estimate.termCount}`} t={t} />
          <Metric label="Saved" value={downloaded ? formatTime(offlinePack.downloadedAt) : 'No'} t={t} wide />
        </View>
      </Card>

      <Card t={t} style={{ paddingVertical: 4, marginBottom: 16 }}>
        {OFFLINE_PACKS.map((pack, index) => (
          <View key={pack.id} style={{ paddingHorizontal: 12 }}>
            <PackRow pack={pack} selected={selectedSet.has(pack.id)}
              recommended={recommendedSet.has(pack.id)} onToggle={() => toggle(pack.id)} t={t} />
            {index === OFFLINE_PACKS.length - 1 ? <View style={{ height: 1, backgroundColor: t.surface }} /> : null}
          </View>
        ))}
      </Card>

      <Card t={t} style={{ marginBottom: 16 }}>
        <Overline t={t}>Privacy posture</Overline>
        <Text style={{ fontFamily: t.sans, fontSize: 13.5, color: t.ink2, lineHeight: 20, marginTop: 8 }}>
          Profile, scan diary, feedback, backup queue, and offline packs are saved in encrypted device storage. Label photos stay off by default and expire after 7 days unless you choose to keep them.
        </Text>
      </Card>

      {status ? (
        <Text style={{ fontFamily: t.sans, fontSize: 13, color: t.ink2, lineHeight: 19, marginBottom: 12,
          textAlign: 'center' }}>
          {status}
        </Text>
      ) : null}

      <PrimaryButton onPress={download} disabled={busy} t={t}>
        {busy ? 'Saving offline pack...' : downloaded ? 'Update offline pack' : 'Download selected packs'}
      </PrimaryButton>
      <SecondaryButton onPress={onDone} t={t} style={{ marginTop: 10 }}>
        Go to Diary
      </SecondaryButton>
    </ScrollView>
  );
}

function Metric({ label, value, t, wide }) {
  return (
    <View style={{ flex: wide ? 1.3 : 1, minHeight: 64, borderRadius: 13, backgroundColor: t.surfaceWarm,
      borderWidth: 1, borderColor: t.lineSoft, padding: 10, justifyContent: 'center' }}>
      <Text numberOfLines={1} style={{ fontFamily: t.mono, fontSize: 10.5, color: t.ink3 }}>
        {label}
      </Text>
      <Text numberOfLines={2} style={{ fontFamily: t.sans, fontSize: 14.5, fontWeight: '900', color: t.ink,
        marginTop: 4 }}>
        {value}
      </Text>
    </View>
  );
}
