import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  Bell,
  ChevronRight,
  CloudCheck,
  Download,
  HeartPulse,
  LockKeyhole,
  ScanLine,
  ShieldCheck,
  Sparkles,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Card, Overline, PrimaryButton, ProgressBar, SecondaryButton } from '../components/DesignPrimitives';
import { HouseAdCard } from '../components/HouseAdCard';
import { formatBytes } from '../services/offlinePacks';

function latestScan(scans) {
  return [...(scans || [])].sort((a, b) => String(b.savedAt || '').localeCompare(String(a.savedAt || '')))[0] || null;
}

function findingCount(scan) {
  return (scan?.findings || []).reduce((sum, finding) => sum + (finding.items?.length || 0), 0);
}

export function DesignPreviewScreen({ scans = [], offlinePack, ad = null, onScan, onDownload, onDiary, onPlans }) {
  const { theme: t } = useTheme();
  const latest = latestScan(scans);
  const realScanCount = scans.filter((scan) => scan.source !== 'sample').length;
  const patternProgress = Math.min(realScanCount, 6);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 18, paddingBottom: 30 }}>
      <View style={{ borderRadius: 22, backgroundColor: t.surface, borderWidth: 1, borderColor: t.accentSoft,
        padding: 18, marginBottom: 16, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 7, backgroundColor: t.accent }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Overline t={t} color={t.accentDeep}>Nyara daily</Overline>
            <Text style={{ fontFamily: t.serif, fontSize: 28, lineHeight: 33, fontWeight: '600',
              color: t.ink, marginTop: 7 }}>
              Scan calmly, save what matters.
            </Text>
          </View>
          <View style={{ width: 62, height: 62, borderRadius: 19, backgroundColor: t.accentTint,
            borderWidth: 1, borderColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
            <ScanLine size={31} color={t.accentDeep} strokeWidth={2.6} />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 17 }}>
          <StatusChip icon={ShieldCheck} label="Profile" value="Active" color={t.accentDeep} t={t} />
          <StatusChip icon={Download} label="Offline" value={offlinePack ? `${offlinePack.termCount}` : 'Set up'} color="#0B8280" t={t} />
          <StatusChip icon={Bell} label="Review" value={`${realScanCount}`} color="#765C9C" t={t} />
        </View>

        <PrimaryButton onPress={onScan} t={t} style={{ marginTop: 16 }}>
          Scan a label
        </PrimaryButton>
      </View>

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        <MomentumCard title="Diary" value={`${realScanCount}`} sub="real scans" icon={HeartPulse} color={t.accentDeep} t={t} onPress={onDiary} />
        <MomentumCard title="Patterns" value={`${patternProgress}/6`} sub="to summary" icon={Sparkles} color="#E89318" t={t} />
      </View>

      <HouseAdCard ad={ad} onPress={onPlans} t={t} />

      <Card t={t} style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Overline t={t}>Latest result</Overline>
            <Text numberOfLines={1} style={{ fontFamily: t.sans, fontSize: 18, fontWeight: '900',
              color: t.ink, marginTop: 7 }}>
              {latest?.product?.name || 'No saved scan yet'}
            </Text>
            <Text style={{ fontFamily: t.sans, fontSize: 13, color: t.ink2, lineHeight: 19, marginTop: 4 }}>
              {latest
                ? `${findingCount(latest)} matched item${findingCount(latest) === 1 ? '' : 's'} saved to Diary.`
                : 'Your first real scan becomes the starting point for Diary and Patterns.'}
            </Text>
          </View>
          <ChevronRight size={22} color={t.ink3} strokeWidth={2.4} />
        </View>
      </Card>

      <Card t={t} style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          marginBottom: 10 }}>
          <View style={{ flex: 1 }}>
            <Overline t={t} color="#0B8280">Offline pack</Overline>
            <Text style={{ fontFamily: t.sans, fontSize: 16, fontWeight: '900', color: t.ink, marginTop: 6 }}>
              {offlinePack ? `${offlinePack.termCount} terms ready` : 'Not downloaded yet'}
            </Text>
          </View>
          <View style={{ width: 43, height: 43, borderRadius: 14, backgroundColor: '#EBF8F7',
            alignItems: 'center', justifyContent: 'center' }}>
            <Download size={22} color="#0B8280" strokeWidth={2.5} />
          </View>
        </View>
        <ProgressBar value={offlinePack ? 1 : 0.35} max={1} color="#0EA5A2" t={t} />
        <Text style={{ fontFamily: t.sans, fontSize: 12.8, color: t.ink2, lineHeight: 18, marginTop: 9 }}>
          {offlinePack
            ? `${formatBytes(offlinePack.bytes)} stored locally for the matcher.`
            : 'Download a pack to keep scanning reliable when the network is weak.'}
        </Text>
        <SecondaryButton onPress={onDownload} t={t} style={{ marginTop: 13 }}>
          Manage offline pack
        </SecondaryButton>
      </Card>

      <View style={{ gap: 10 }}>
        <TrustRow icon={LockKeyhole} title="Encrypted on this device" sub="Profile, scans, feedback, and backup queue use SecureStore." color={t.accentDeep} t={t} />
        <TrustRow icon={CloudCheck} title="Backup retries" sub="Cloud failures stay queued locally with the reason shown." color="#0B8280" t={t} />
      </View>
    </ScrollView>
  );
}

function StatusChip({ icon: Icon, label, value, color, t }) {
  return (
    <View style={{ flex: 1, minHeight: 74, borderRadius: 16, borderWidth: 1, borderColor: t.lineSoft,
      backgroundColor: t.surfaceWarm, padding: 10, justifyContent: 'space-between' }}>
      <Icon size={18} color={color} strokeWidth={2.4} />
      <View>
        <Text numberOfLines={1} style={{ fontFamily: t.mono, fontSize: 10.5, color: t.ink3 }}>{label}</Text>
        <Text numberOfLines={1} style={{ fontFamily: t.sans, fontSize: 14, fontWeight: '900', color: t.ink }}>{value}</Text>
      </View>
    </View>
  );
}

function MomentumCard({ title, value, sub, icon: Icon, color, t, onPress }) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper onPress={onPress} accessibilityRole={onPress ? 'button' : undefined}
      style={{ flex: 1, minHeight: 116, borderRadius: 18, backgroundColor: t.surface,
        borderWidth: 1, borderColor: t.lineSoft, padding: 14 }}>
      <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: t.surfaceWarm,
        alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <Icon size={20} color={color} strokeWidth={2.4} />
      </View>
      <Text style={{ fontFamily: t.sans, fontSize: 13, fontWeight: '800', color: t.ink2 }}>{title}</Text>
      <Text style={{ fontFamily: t.serif, fontSize: 28, fontWeight: '600', color: t.ink, marginTop: 1 }}>{value}</Text>
      <Text style={{ fontFamily: t.sans, fontSize: 12, color: t.ink3 }}>{sub}</Text>
    </Wrapper>
  );
}

function TrustRow({ icon: Icon, title, sub, color, t }) {
  return (
    <View style={{ minHeight: 72, borderRadius: 16, backgroundColor: t.surface, borderWidth: 1,
      borderColor: t.lineSoft, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: t.surfaceWarm,
        alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={21} color={color} strokeWidth={2.4} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontFamily: t.sans, fontSize: 14.5, fontWeight: '900', color: t.ink }}>{title}</Text>
        <Text style={{ fontFamily: t.sans, fontSize: 12.5, color: t.ink2, lineHeight: 18, marginTop: 2 }}>{sub}</Text>
      </View>
    </View>
  );
}
