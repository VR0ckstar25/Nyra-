// AppearanceScreen.jsx — Settings → Appearance. Background (5) × Accent (4) = 20.
// Live preview shows a real (minimal) match bar + button so the user sees their
// pick on the actual UI, and sees the FIXED safety colors do NOT change.

import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { BACKGROUND_PRESETS, ACCENT_PRESETS } from '../theme/tokens';

export function AppearanceScreen() {
  const { theme: t, keys, setTheme } = useTheme();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 22, paddingBottom: 48 }}>
      <Text style={{ fontFamily: t.serif, fontSize: 26, color: t.ink, marginBottom: 6 }}>Appearance</Text>
      <Text style={{ fontFamily: t.sans, fontSize: 14.5, color: t.ink2, lineHeight: 21, marginBottom: 22 }}>
        Make it yours. Pick a background and an accent — your allergen colors stay the same so findings always read the same way.
      </Text>

      <Preview t={t} />

      <SectionLabel t={t}>Background</SectionLabel>
      <SwatchGrid>
        {Object.entries(BACKGROUND_PRESETS).map(([key, p]) => (
          <Swatch key={key} label={p.label} selected={keys.background === key}
            ring={t.accent} onPress={() => setTheme({ background: key })}
            colors={[p.bg, p.bgDeep, p.surfaceWarm]} t={t} />
        ))}
      </SwatchGrid>

      <SectionLabel t={t}>Accent</SectionLabel>
      <SwatchGrid>
        {Object.entries(ACCENT_PRESETS).map(([key, p]) => (
          <Swatch key={key} label={p.label} selected={keys.accent === key}
            ring={t.accent} onPress={() => setTheme({ accent: key })}
            colors={[p.accent, p.accentDeep, p.accentSoft]} t={t} />
        ))}
      </SwatchGrid>
    </ScrollView>
  );
}

function Swatch({ label, colors, selected, ring, onPress, t }) {
  const [hero, ...rest] = colors;
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected }}
      style={{ width: '31%', marginBottom: 14 }}>
      <View style={{ height: 56, borderRadius: 14, overflow: 'hidden', flexDirection: 'row',
        borderWidth: selected ? 2.5 : 1, borderColor: selected ? ring : t.line, backgroundColor: hero }}>
        <View style={{ flex: 2, backgroundColor: hero }} />
        <View style={{ flex: 1 }}>
          {rest.map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
        </View>
      </View>
      <Text style={{ fontFamily: t.sans, fontSize: 12.5, fontWeight: '600',
        color: selected ? t.ink : t.ink2, marginTop: 6, textAlign: 'center' }}>{label}</Text>
    </Pressable>
  );
}

function SwatchGrid({ children }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>{children}</View>;
}

function SectionLabel({ children, t }) {
  return <Text style={{ fontFamily: t.mono, fontSize: 11, letterSpacing: 0, textTransform: 'uppercase',
    color: t.ink3, marginTop: 20, marginBottom: 12 }}>{children}</Text>;
}

function Preview({ t }) {
  return (
    <View style={{ backgroundColor: t.surface, borderRadius: t.radius, padding: 16,
      borderWidth: 1, borderColor: t.line, marginBottom: 8 }}>
      <Text style={{ fontFamily: t.mono, fontSize: 10.5, letterSpacing: 0, textTransform: 'uppercase',
        color: t.ink3, marginBottom: 12 }}>Preview</Text>
      <View style={{ flexDirection: 'row', borderRadius: 14, overflow: 'hidden', borderWidth: 1,
        borderColor: t.line, marginBottom: 14 }}>
        <View style={{ width: 5, backgroundColor: t.allergen.strong }} />
        <View style={{ flex: 1, padding: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: t.amber }} />
            <Text style={{ fontFamily: t.sans, fontSize: 12, fontWeight: '800', textTransform: 'uppercase',
              letterSpacing: 0, color: t.allergen.label }}>Allergen Match</Text>
          </View>
          <Text style={{ fontFamily: t.sans, fontSize: 16, fontWeight: '700', color: t.ink }}>Peanuts</Text>
        </View>
      </View>
      <View style={{ height: 48, borderRadius: 14, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: t.sans, fontSize: 15.5, fontWeight: '600', color: t.onAccent }}>Scan a label</Text>
      </View>
    </View>
  );
}
