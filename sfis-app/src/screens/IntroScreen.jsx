// IntroScreen.jsx — first-run product intro (founder: "we're missing the intro").
// A short, calm, swipe/Next walkthrough that teaches the Mirror Principle BEFORE
// sign-up so the result surface is never a surprise: Nyara reflects, it doesn't
// judge. Content is data-driven (INTRO_SLIDES) so it's unit-testable and easy to
// reword. No verdicts, no fear language — consistent with the result screen.

import React, { useState } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { PrimaryButton } from '../components/DesignPrimitives';
import { Wordmark } from '../components/Wordmark';
import { INTRO_SLIDES } from '../data/introContent';

function Dot({ active, t }) {
  return (
    <View style={{ width: active ? 22 : 8, height: 8, borderRadius: 999,
      backgroundColor: active ? t.accent : t.line, marginHorizontal: 3 }} />
  );
}

export function IntroScreen({ onDone, onSkip }) {
  const { theme: t } = useTheme();
  const [i, setI] = useState(0);
  const slide = INTRO_SLIDES[i];
  const last = i === INTRO_SLIDES.length - 1;
  const next = () => (last ? onDone?.() : setI((n) => Math.min(n + 1, INTRO_SLIDES.length - 1)));
  const back = () => setI((n) => Math.max(n - 1, 0));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ flexGrow: 1, padding: 22 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Wordmark t={t} size={22} />
        <Pressable onPress={onSkip} accessibilityRole="button" hitSlop={10}>
          <Text style={{ fontFamily: t.sans, fontSize: 14, fontWeight: '800', color: t.ink3 }}>Skip</Text>
        </Pressable>
      </View>

      <View style={{ flex: 1, justifyContent: 'center', paddingVertical: 24 }}>
        <Text accessibilityRole="header" style={{ fontFamily: t.serif, fontSize: 32, fontWeight: '600',
          color: t.ink, lineHeight: 38, marginBottom: 12 }}>
          {slide.title}
        </Text>
        <Text style={{ fontFamily: t.sans, fontSize: 15.5, color: t.ink2, lineHeight: 23, marginBottom: 22 }}>
          {slide.body}
        </Text>
        <View style={{ gap: 11 }}>
          {slide.points.map((p) => (
            <View key={p} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 11 }}>
              <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: t.accent, marginTop: 7 }} />
              <Text style={{ flex: 1, fontFamily: t.sans, fontSize: 14.5, color: t.ink, lineHeight: 21 }}>{p}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
        {INTRO_SLIDES.map((s, idx) => <Dot key={s.key} active={idx === i} t={t} />)}
      </View>

      <PrimaryButton onPress={next} t={t}>
        {last ? 'Set up my watchlist' : 'Next'}
      </PrimaryButton>
      {i > 0 ? (
        <Pressable onPress={back} accessibilityRole="button" style={{ alignSelf: 'center', minHeight: 40, justifyContent: 'center', marginTop: 8 }}>
          <Text style={{ fontFamily: t.sans, fontSize: 13.5, fontWeight: '700', color: t.ink3 }}>Back</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}
