import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { CheckCircle2, Eye, LockKeyhole, MessageSquareText, ShieldCheck } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Card, Overline, PrimaryButton, ScreenIntro, SecondaryButton } from '../components/DesignPrimitives';

const PROOF_POINTS = [
  {
    icon: Eye,
    title: 'Personal, not generic',
    sub: 'Nyara checks each label against the watchlist you just built, so the result starts with what matters to you.',
  },
  {
    icon: LockKeyhole,
    title: 'Private by default',
    sub: 'Your profile, scan diary, feedback, and offline pack are saved in encrypted device storage. Cloud backup is optional.',
  },
  {
    icon: MessageSquareText,
    title: 'Built to learn from issues',
    sub: 'Wrong or unsure results can be reported, saved, and backed up so the product gets more accountable over time.',
  },
];

export function CredibilityScreen({ onContinue, onSkip }) {
  const { theme: t } = useTheme();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 18, paddingBottom: 30 }}>
      <ScreenIntro
        title="Why Nyara feels different"
        sub="A quick trust check before the preview. No scare language, no fake certainty - just a calmer way to read labels."
        t={t}
      />

      <Card t={t} style={{ marginBottom: 14, backgroundColor: t.accentTint, borderColor: t.accentSoft }}>
        <View style={{ width: 54, height: 54, borderRadius: 17, backgroundColor: t.surface,
          borderWidth: 1, borderColor: t.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <ShieldCheck size={29} color={t.accentDeep} strokeWidth={2.5} />
        </View>
        <Overline t={t} color={t.accentDeep}>The promise</Overline>
        <Text style={{ fontFamily: t.serif, fontSize: 24, fontWeight: '600', color: t.ink,
          lineHeight: 31, marginTop: 8 }}>
          A second set of eyes for the aisle.
        </Text>
        <Text style={{ fontFamily: t.sans, fontSize: 13.8, color: t.ink2, lineHeight: 20, marginTop: 8 }}>
          Nyara does not replace the package. It makes the first pass faster, clearer, and easier to act on.
        </Text>
      </Card>

      <View style={{ gap: 12, marginBottom: 14 }}>
        {PROOF_POINTS.map((point) => {
          const Icon = point.icon;
          return (
            <Card key={point.title} t={t} style={{ flexDirection: 'row', gap: 13, alignItems: 'flex-start' }}>
              <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: t.surfaceWarm,
                borderWidth: 1, borderColor: t.line, alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={22} color={t.accentDeep} strokeWidth={2.4} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: t.sans, fontSize: 15.5, fontWeight: '900',
                  color: t.ink, lineHeight: 21 }}>
                  {point.title}
                </Text>
                <Text style={{ fontFamily: t.sans, fontSize: 12.9, color: t.ink2, lineHeight: 18, marginTop: 4 }}>
                  {point.sub}
                </Text>
              </View>
            </Card>
          );
        })}
      </View>

      <View style={{ borderRadius: 15, backgroundColor: t.surfaceWarm, borderWidth: 1,
        borderColor: t.line, padding: 13, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
          <CheckCircle2 size={21} color={t.accentDeep} strokeWidth={2.5} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: t.sans, fontSize: 13.5, fontWeight: '900', color: t.ink }}>
              Honest preproduction note
            </Text>
            <Text style={{ fontFamily: t.sans, fontSize: 12.6, color: t.ink2, lineHeight: 18, marginTop: 3 }}>
              The database is still marked draft until independent validation is complete. Nyara will keep showing that limit clearly.
            </Text>
          </View>
        </View>
      </View>

      <PrimaryButton onPress={onContinue} t={t}>
        Preview my first result
      </PrimaryButton>
      <SecondaryButton onPress={onSkip} t={t} style={{ marginTop: 10 }}>
        Skip to preview
      </SecondaryButton>
    </ScrollView>
  );
}
