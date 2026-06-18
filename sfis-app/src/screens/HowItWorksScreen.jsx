import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Camera, ClipboardCheck, ListChecks } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Card, Overline, PrimaryButton, ScreenIntro } from '../components/DesignPrimitives';

const STEPS = [
  {
    icon: Camera,
    title: 'Scan or paste the ingredient list.',
    sub: 'Use the camera when OCR is available, or paste ingredients manually when you want the most control.',
  },
  {
    icon: ListChecks,
    title: 'See your matches highlighted first.',
    sub: 'Nyara checks the label against your watchlist and separates clear matches from things it cannot verify yet.',
  },
  {
    icon: ClipboardCheck,
    title: 'Save the result to build your diary.',
    sub: 'Real scans become a useful record for patterns, repeat buys, and better follow-up later.',
  },
];

export function HowItWorksScreen({ onDone }) {
  const { theme: t } = useTheme();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 18, paddingBottom: 30 }}>
      <ScreenIntro
        title="Your calmer label routine"
        sub="Use Nyara as a second set of eyes: quick, specific, and honest about what it can and cannot confirm."
        t={t}
      />

      <Card t={t} style={{ marginBottom: 14 }}>
        <Overline t={t} color={t.accentDeep}>Why this helps</Overline>
        <Text style={{ fontFamily: t.serif, fontSize: 21, fontWeight: '600', color: t.ink,
          lineHeight: 28, marginTop: 8 }}>
          Less guessing in the aisle. More confidence before something goes in the cart.
        </Text>
        <Text style={{ fontFamily: t.sans, fontSize: 13.5, color: t.ink2, lineHeight: 20, marginTop: 8 }}>
          Your sample result used the watchlist you just built. Next, Nyara prepares the matching data it should keep ready on this phone.
        </Text>
      </Card>

      <View style={{ gap: 12, marginBottom: 16 }}>
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <Card key={step.title} t={t} style={{ flexDirection: 'row', gap: 13, alignItems: 'flex-start' }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: t.accentTint,
                borderWidth: 1, borderColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={23} color={t.accentDeep} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: t.mono, fontSize: 11, fontWeight: '800', color: t.ink3 }}>
                  Step {index + 1}
                </Text>
                <Text style={{ fontFamily: t.sans, fontSize: 15.5, fontWeight: '800',
                  color: t.ink, lineHeight: 21, marginTop: 3 }}>
                  {step.title}
                </Text>
                <Text style={{ fontFamily: t.sans, fontSize: 12.8, color: t.ink2, lineHeight: 18, marginTop: 4 }}>
                  {step.sub}
                </Text>
              </View>
            </Card>
          );
        })}
      </View>

      <PrimaryButton onPress={onDone} t={t}>
        Finish setup
      </PrimaryButton>
    </ScrollView>
  );
}
