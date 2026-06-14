import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { AlertTriangle, BrainCircuit, CheckCircle2, ShieldCheck } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Card, Overline, ProgressBar, ScreenIntro } from '../components/DesignPrimitives';
import { HouseAdCard } from '../components/HouseAdCard';
import { analyzeScanPatterns, PATTERN_MIN_SCANS } from '../services/patternEngine';

export function PatternsScreen({ scans = [], houseAd = null, onAd, onScan }) {
  const { theme: t } = useTheme();
  const model = useMemo(() => analyzeScanPatterns(scans), [scans]);
  const max = Math.max(1, ...model.topFindings.map((row) => row.score));
  const progress = Math.min(model.scanCount, PATTERN_MIN_SCANS);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 18, paddingBottom: 28 }}>
      <ScreenIntro
        title="Patterns"
        sub="On-device summaries from real saved scans. No medical claims, no cloud training."
        t={t}
      />

      <HouseAdCard ad={houseAd} onPress={onAd} t={t} />

      <Card t={t} style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 13 }}>
          <View style={{ width: 46, height: 46, borderRadius: 15, backgroundColor: t.accentTint,
            borderWidth: 1, borderColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
            <BrainCircuit size={24} color={t.accentDeep} strokeWidth={2.5} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Overline t={t} color={t.accent}>{model.ready ? 'Pattern summary ready' : 'Collecting scans'}</Overline>
            <Text style={{ fontFamily: t.serif, fontSize: 20, lineHeight: 27, color: t.ink, marginTop: 6 }}>
              {model.summary}
            </Text>
            <Text style={{ fontFamily: t.sans, fontSize: 12.5, color: t.ink2, lineHeight: 18, marginTop: 6 }}>
              Local diary scorer. App analysis is private to this device and deterministic.
            </Text>
          </View>
        </View>
      </Card>

      <View style={{ borderRadius: 16, backgroundColor: t.surface, borderWidth: 1,
        borderColor: t.lineSoft, padding: 15, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
          <Text style={{ flex: 1, fontFamily: t.sans, fontSize: 15, fontWeight: '900', color: t.ink }}>
            Real scan readiness
          </Text>
          <Text style={{ fontFamily: t.mono, fontSize: 12.5, color: t.accentDeep }}>
            {progress} / {PATTERN_MIN_SCANS}
          </Text>
        </View>
        <ProgressBar value={progress} max={PATTERN_MIN_SCANS} color={t.accent} t={t} />
        <Text style={{ fontFamily: t.sans, fontSize: 12.7, color: t.ink2, lineHeight: 18, marginTop: 9 }}>
          Ignored {model.sampleIgnoredCount} sample scan{model.sampleIgnoredCount === 1 ? '' : 's'} so fictional data cannot unlock or rank patterns.
        </Text>
      </View>

      <Overline t={t}>Repeated findings</Overline>
      <Card t={t} style={{ paddingVertical: 6, marginTop: 12, marginBottom: 16 }}>
        {model.topFindings.length ? model.topFindings.map((row, i) => (
          <View key={`${row.cat}-${row.name}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13,
            borderBottomWidth: i < model.topFindings.length - 1 ? 1 : 0, borderBottomColor: t.lineSoft }}>
            <Text style={{ width: 22, textAlign: 'center', fontFamily: t.mono, fontSize: 12, color: t.ink3 }}>
              {i + 1}
            </Text>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontFamily: t.sans, fontSize: 15.5, fontWeight: '900', color: t.ink }}>
                {row.name}
              </Text>
              <Text style={{ fontFamily: t.sans, fontSize: 12.3, color: t.ink3, marginTop: 2 }}>
                {row.count} match{row.count === 1 ? '' : 'es'} · {row.contains} contains · {row.may} may
              </Text>
              <Text style={{ fontFamily: t.sans, fontSize: 12.1, color: t.ink2, lineHeight: 17, marginTop: 4 }}>
                Why shown: repeated across {row.days} day{row.days === 1 ? '' : 's'} and {row.productCount} product{row.productCount === 1 ? '' : 's'}.
              </Text>
              <View style={{ marginTop: 8 }}>
                <ProgressBar value={row.score} max={max} color={t[row.cat]?.strong || t.accent} t={t} />
              </View>
            </View>
            <Text style={{ fontFamily: t.mono, fontSize: 12, fontWeight: '900', color: t.ink2 }}>
              {Math.round(row.score * 100)}
            </Text>
          </View>
        )) : (
          <View style={{ paddingVertical: 10 }}>
            <Text style={{ fontFamily: t.sans, fontSize: 15, fontWeight: '900', color: t.ink }}>
              No matched ingredients saved yet.
            </Text>
            <Text style={{ fontFamily: t.sans, fontSize: 13.5, color: t.ink2, lineHeight: 19, marginTop: 4 }}>
              Run real scans to build the local pattern model.
            </Text>
          </View>
        )}
      </Card>

      <Overline t={t}>Model notes</Overline>
      <View style={{ gap: 10, marginTop: 12, marginBottom: 16 }}>
        {model.insights.map((insight) => (
          <Insight key={insight.id} insight={insight} t={t} />
        ))}
      </View>

      <Card t={t} style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          {model.clearance.ok ? (
            <CheckCircle2 size={22} color={t.accentDeep} strokeWidth={2.5} />
          ) : (
            <AlertTriangle size={22} color={t.amber} strokeWidth={2.5} />
          )}
          <Text style={{ flex: 1, fontFamily: t.sans, fontSize: 15.5, fontWeight: '900', color: t.ink }}>
            {model.clearance.ok ? 'Clearance OK' : 'Use extra caution'}
          </Text>
        </View>
        <Text style={{ fontFamily: t.sans, fontSize: 12.8, color: t.ink2, lineHeight: 19 }}>
          Unknown rate {Math.round(model.quality.unverifiedRate * 100)}% · issue rate {Math.round(model.quality.wrongRate * 100)}% · useful rate {Math.round(model.quality.usefulRate * 100)}%
        </Text>
        {model.clearance.warnings.length ? (
          <View style={{ marginTop: 10, gap: 5 }}>
            {model.clearance.warnings.map((warning) => (
              <Text key={warning} style={{ fontFamily: t.sans, fontSize: 12.8, color: t.ink2, lineHeight: 18 }}>
                {warning}
              </Text>
            ))}
          </View>
        ) : null}
      </Card>

      <View style={{ borderRadius: 16, backgroundColor: t.accentTint, padding: 16,
        borderWidth: 1, borderColor: t.accentSoft }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <ShieldCheck size={20} color={t.accentDeep} strokeWidth={2.5} />
          <Text style={{ flex: 1, fontFamily: t.sans, fontSize: 15, fontWeight: '900', color: t.ink }}>
            Privacy guardrail
          </Text>
        </View>
        <Text style={{ fontFamily: t.sans, fontSize: 13, color: t.ink2, lineHeight: 19 }}>
          This model runs from saved scan history on this device. It ranks diary patterns only; it does not diagnose, predict reactions, or replace label checks.
        </Text>
        <Pressable onPress={onScan} accessibilityRole="button" style={{ marginTop: 14, minHeight: 44, borderRadius: 12,
          backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: t.sans, fontSize: 14, fontWeight: '800', color: t.accentDeep }}>Scan another label</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Insight({ insight, t }) {
  const attention = insight.level === 'attention';
  return (
    <View style={{ borderRadius: 15, backgroundColor: attention ? t.surfaceWarm : t.surface,
      borderWidth: 1, borderColor: attention ? t.amber : t.lineSoft, padding: 13 }}>
      <Text style={{ fontFamily: t.sans, fontSize: 14.5, fontWeight: '900', color: t.ink }}>
        {insight.title}
      </Text>
      <Text style={{ fontFamily: t.sans, fontSize: 12.8, color: t.ink2, lineHeight: 18, marginTop: 3 }}>
        {insight.body}
      </Text>
    </View>
  );
}
