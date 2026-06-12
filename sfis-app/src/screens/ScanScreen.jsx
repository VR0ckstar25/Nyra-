import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { matchScan } from '../match/scanMatch';
import data from '../data/allergens.json';
import { TUTORIAL } from '../data/tutorial';
import { Card, Overline, PrimaryButton, ScreenIntro, SecondaryButton } from '../components/DesignPrimitives';
import { profileIds } from '../profile/profileModel';

export function ScanScreen({ profile, matcherData, onResult, onCamera }) {
  const { theme: t } = useTheme();
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const watchedIds = profileIds(profile);
  const activeData = matcherData || data;

  const run = (rawText, productName) => {
    const { findings, unverified } = matchScan(rawText, profile, activeData);
    onResult({
      findings,
      unverified,
      product: { name: productName || 'Unnamed Product', brand: productName ? '' : 'Manual entry', date: new Date().toISOString().slice(0, 10) },
    });
  };

  const loadSample = () => { setText(TUTORIAL.text); setName(TUTORIAL.name); };
  const runSample = () => {
    const { findings, unverified } = matchScan(TUTORIAL.text, profile, activeData);
    onResult({
      findings,
      unverified,
      product: { name: TUTORIAL.name, brand: TUTORIAL.brand, date: TUTORIAL.date },
    });
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 18, paddingBottom: 28 }}>
      <ScreenIntro
        title="Check a label"
        sub="Use camera OCR, paste ingredients, or run the tutorial label."
        t={t}
      />

      <Card t={t} style={{ marginBottom: 16 }}>
        <Overline t={t}>Current build</Overline>
        <Text style={{ fontFamily: t.sans, fontSize: 13.5, color: t.ink2, lineHeight: 20, marginTop: 8 }}>
          Manual entry, sample scans, and camera OCR use the production matcher offline. OCR runs on-device in iOS and Android development builds.
        </Text>
      </Card>

      <TextInput value={name} onChangeText={setName} placeholder="Product name (optional)"
        placeholderTextColor={t.ink3}
        style={{ backgroundColor: t.surface, borderRadius: 12, borderWidth: 1, borderColor: t.line,
          paddingHorizontal: 14, height: 46, fontFamily: t.sans, fontSize: 15, color: t.ink, marginBottom: 12 }} />

      <TextInput value={text} onChangeText={setText} placeholder="Ingredients: …" placeholderTextColor={t.ink3}
        multiline textAlignVertical="top"
        style={{ backgroundColor: t.surface, borderRadius: 12, borderWidth: 1, borderColor: t.line,
          padding: 14, minHeight: 150, fontFamily: t.sans, fontSize: 15, color: t.ink, lineHeight: 21 }} />

      <PrimaryButton onPress={() => run(text, name)} disabled={!text.trim()} t={t} style={{ marginTop: 16 }}>
        Check typed ingredients
      </PrimaryButton>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
        <SecondaryButton onPress={loadSample} t={t} style={{ flex: 1 }}>
          Load sample text
        </SecondaryButton>
        <SecondaryButton onPress={runSample} t={t} style={{ flex: 1 }}>
          Run sample
        </SecondaryButton>
      </View>

      <Pressable onPress={onCamera}
        style={{ minHeight: 50, borderRadius: 14, marginTop: 10, alignItems: 'center', justifyContent: 'center',
          backgroundColor: t.surfaceWarm, borderWidth: 1, borderColor: t.line }}>
        <Text style={{ fontFamily: t.sans, fontSize: 15, fontWeight: '800', color: t.accentDeep }}>
          Open camera OCR
        </Text>
        <Text style={{ fontFamily: t.sans, fontSize: 12, color: t.ink3, marginTop: 2 }}>
          on-device, no photo upload
        </Text>
      </Pressable>

      <Text style={{ fontFamily: t.mono, fontSize: 11, color: t.ink3, marginTop: 18, lineHeight: 17 }}>
        Profile: {watchedIds.length} watched item{watchedIds.length === 1 ? '' : 's'} active. Deterministic matching · no ML · runs offline.
      </Text>
    </ScrollView>
  );
}
