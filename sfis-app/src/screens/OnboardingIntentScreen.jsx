import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Baby, HeartPulse, Leaf, ListPlus, ShieldAlert } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Card, Overline, PrimaryButton, ScreenIntro, SecondaryButton } from '../components/DesignPrimitives';

const INTENTS = [
  {
    id: 'allergy',
    icon: ShieldAlert,
    title: 'A known allergy',
    sub: 'Start with exact allergens and make every result show the label evidence.',
  },
  {
    id: 'family',
    icon: Baby,
    title: 'A child or family profile',
    sub: 'Keep results clear about which person each finding applies to.',
  },
  {
    id: 'intolerance',
    icon: HeartPulse,
    title: 'An intolerance',
    sub: 'Track ingredients that may matter, with beta labels where the science is less direct.',
  },
  {
    id: 'diet',
    icon: Leaf,
    title: 'A diet or ingredient choice',
    sub: 'Add things like pescatarian, no pork, vegan, or specific ingredients to avoid.',
  },
  {
    id: 'mixed',
    icon: ListPlus,
    title: 'A little of everything',
    sub: 'Build one focused watchlist across allergies, intolerances, diet, and goals.',
  },
];

export function OnboardingIntentScreen({ onContinue, onSkip }) {
  const { theme: t } = useTheme();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 18, paddingBottom: 30 }}>
      <ScreenIntro
        title="What brings you to Nyara?"
        sub="One quick question helps shape the watchlist step. Nothing is selected for you."
        t={t}
      />

      <Card t={t} style={{ marginBottom: 14, backgroundColor: t.accentTint, borderColor: t.accentSoft }}>
        <Overline t={t} color={t.accentDeep}>Personal setup</Overline>
        <Text style={{ fontFamily: t.serif, fontSize: 22, fontWeight: '600', color: t.ink,
          lineHeight: 29, marginTop: 8 }}>
          Build the scan around your real shopping life.
        </Text>
        <Text style={{ fontFamily: t.sans, fontSize: 13.5, color: t.ink2, lineHeight: 20, marginTop: 8 }}>
          Nyara will still ask you to choose the exact items next, so there are no hidden defaults.
        </Text>
      </Card>

      <View style={{ gap: 10, marginBottom: 14 }}>
        {INTENTS.map((intent) => {
          const Icon = intent.icon;
          return (
            <Pressable key={intent.id} onPress={() => onContinue?.(intent)}
              accessibilityRole="button"
              style={{ borderRadius: 18 }}>
              <Card t={t} style={{ flexDirection: 'row', gap: 13, alignItems: 'flex-start', padding: 14 }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: t.surfaceWarm,
                  borderWidth: 1, borderColor: t.line, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={23} color={t.accentDeep} strokeWidth={2.4} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontFamily: t.sans, fontSize: 15.5, fontWeight: '900',
                    color: t.ink, lineHeight: 21 }}>
                    {intent.title}
                  </Text>
                  <Text style={{ fontFamily: t.sans, fontSize: 12.8, color: t.ink2, lineHeight: 18, marginTop: 4 }}>
                    {intent.sub}
                  </Text>
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>

      <PrimaryButton onPress={() => onContinue?.(INTENTS[0])} t={t}>
        Start with allergies
      </PrimaryButton>
      <SecondaryButton onPress={onSkip} t={t} style={{ marginTop: 10 }}>
        Skip this question
      </SecondaryButton>
    </ScrollView>
  );
}

