import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { Camera, Keyboard } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { matchScan } from '../match/scanMatch';
import { nonEnglishNotice } from '../services/languageCheck';
import data from '../data/allergens.json';
import { TUTORIAL } from '../data/tutorial';
import { Card, PrimaryButton, ScreenIntro } from '../components/DesignPrimitives';
import { profileIds } from '../profile/profileModel';

function resetLabel(iso) {
  if (!iso) return 'next month';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'next month';
  return d.toLocaleDateString([], { month: 'long', day: 'numeric' });
}

export function ScanScreen({ profile, matcherData, scanGate = null, onUpgrade, onResult, onCamera }) {
  const { theme: t } = useTheme();
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [review, setReview] = useState(null);
  const [manual, setManual] = useState(false); // manual entry is a fallback, not the primary path
  const watchedIds = profileIds(profile);
  const activeData = matcherData || data;
  // Real scans are gated by the monthly quota; samples stay free so people can
  // always see how Nyara works even at the cap.
  const blocked = !!scanGate && scanGate.allowed === false;

  const prepareReview = () => {
    if (!text.trim()) return;
    setReview({
      text,
      name: name.trim() || 'Unnamed Product',
      brand: brand.trim(),
      date: new Date().toISOString().slice(0, 10),
    });
  };

  const run = () => {
    if (!review?.text?.trim()) return;
    const productName = review.name || 'Unnamed Product';
    const { findings, unverified } = matchScan(review.text, profile, activeData);
    onResult({
      findings,
      unverified,
      languageNotice: nonEnglishNotice(review.text),
      product: { name: productName, brand: review.brand, date: review.date },
      ocr: { text: review.text, confidence: null, capturedAt: new Date().toISOString(), source: 'manual' },
    });
  };

  const runSample = () => {
    const { findings, unverified } = matchScan(TUTORIAL.text, profile, activeData);
    onResult({
      findings,
      unverified,
      product: { name: TUTORIAL.name, brand: TUTORIAL.brand, date: TUTORIAL.date },
    }, { source: 'sample', persist: true });
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 18, paddingBottom: 28 }}>
      <ScreenIntro
        title="Check a label"
        sub="Start with the camera, or paste ingredients when a label is hard to scan."
        t={t}
      />

      <View style={{ borderRadius: 14, backgroundColor: t.surfaceWarm, borderWidth: 1,
        borderColor: t.line, padding: 13, marginBottom: 14 }}>
        <Text style={{ fontFamily: t.sans, fontSize: 13.5, fontWeight: '900', color: t.ink }}>
          Draft data check
        </Text>
        <Text style={{ fontFamily: t.sans, fontSize: 12.5, color: t.ink2, lineHeight: 18, marginTop: 3 }}>
          Nyara is still in preproduction. Use results as a second pass, then verify the original package.
        </Text>
      </View>

      {scanGate && !scanGate.unlimited ? (
        blocked ? (
          <View style={{ borderRadius: 14, backgroundColor: t.accentTint, borderWidth: 1,
            borderColor: t.accentSoft, padding: 14, marginBottom: 14 }}>
            <Text style={{ fontFamily: t.sans, fontSize: 14, fontWeight: '900', color: t.ink }}>
              You've used all {scanGate.allowance} free scans this month
            </Text>
            <Text style={{ fontFamily: t.sans, fontSize: 12.5, color: t.ink2, lineHeight: 18, marginTop: 3 }}>
              Go unlimited to keep scanning, or your free scans refresh on {resetLabel(scanGate.nextResetAt)}. You can still run the sample anytime.
            </Text>
            {onUpgrade ? (
              <PrimaryButton onPress={onUpgrade} t={t} style={{ marginTop: 12 }}>
                Go unlimited
              </PrimaryButton>
            ) : null}
          </View>
        ) : (
          <Text style={{ fontFamily: t.mono, fontSize: 11.5, color: t.ink3, marginBottom: 14 }}>
            {scanGate.remaining} of {scanGate.allowance} free scans left this month · resets {resetLabel(scanGate.nextResetAt)}
          </Text>
        )
      ) : null}

      <Pressable onPress={onCamera} disabled={blocked} accessibilityRole="button"
        accessibilityState={{ disabled: blocked }}
        accessibilityLabel="Scan ingredient label with camera"
        style={{ minHeight: 142, borderRadius: 18, marginBottom: 16, padding: 18, opacity: blocked ? 0.5 : 1,
          backgroundColor: t.accent, borderWidth: 1, borderColor: t.accentDeep,
          flexDirection: 'row', alignItems: 'center', gap: 16,
          shadowColor: t.accentDeep, shadowOpacity: 0.18, shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 }, elevation: 5 }}>
        <View style={{ width: 66, height: 66, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.22)',
          alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)' }}>
          <Camera size={34} color={t.onAccent} strokeWidth={2.4} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: t.sans, fontSize: 23, lineHeight: 28, fontWeight: '900', color: t.onAccent }}>
            Scan ingredient label
          </Text>
          <Text style={{ fontFamily: t.sans, fontSize: 13.5, lineHeight: 19, color: t.onAccent, opacity: 0.86, marginTop: 5 }}>
            Camera reads the label, then you review before Nyara checks it.
          </Text>
        </View>
        <Text style={{ fontFamily: t.sans, fontSize: 30, fontWeight: '800', color: t.onAccent }}>›</Text>
      </Pressable>

      {/* Manual entry is a FALLBACK behind a quiet link — the camera is the product.
          Kept available because on-device OCR isn't proven on real labels yet; if the
          camera can't read a pack, the user still needs a way in. */}
      {!manual ? (
        <Pressable onPress={() => setManual(true)} accessibilityRole="button"
          style={{ alignSelf: 'center', minHeight: 44, justifyContent: 'center', marginTop: 2 }}>
          <Text style={{ fontFamily: t.sans, fontSize: 13.5, fontWeight: '700', color: t.ink3 }}>
            Camera can't read it? Enter the label by hand
          </Text>
        </Pressable>
      ) : (
      <Card t={t} style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            <View style={{ width: 32, height: 32, borderRadius: 11, backgroundColor: t.surfaceWarm,
              borderWidth: 1, borderColor: t.line, alignItems: 'center', justifyContent: 'center' }}>
              <Keyboard size={17} color={t.accentDeep} strokeWidth={2.4} />
            </View>
            <Text style={{ fontFamily: t.sans, fontSize: 16, fontWeight: '900', color: t.ink }}>
              Enter the label by hand
            </Text>
          </View>
          <Pressable onPress={() => { setManual(false); setReview(null); }} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close manual entry">
            <Text style={{ fontFamily: t.sans, fontSize: 13, fontWeight: '900', color: t.ink3 }}>Close</Text>
          </Pressable>
        </View>

        <TextInput value={name} onChangeText={(value) => { setName(value); setReview(null); }} placeholder="Product name (optional)"
          placeholderTextColor={t.ink3}
          style={{ backgroundColor: t.surfaceWarm, borderRadius: 12, borderWidth: 1, borderColor: t.line,
            paddingHorizontal: 14, height: 46, fontFamily: t.sans, fontSize: 15, color: t.ink, marginBottom: 12 }} />

        <TextInput value={brand} onChangeText={(value) => { setBrand(value); setReview(null); }} placeholder="Brand (optional)"
          placeholderTextColor={t.ink3}
          style={{ backgroundColor: t.surfaceWarm, borderRadius: 12, borderWidth: 1, borderColor: t.line,
            paddingHorizontal: 14, height: 46, fontFamily: t.sans, fontSize: 15, color: t.ink, marginBottom: 12 }} />

        <TextInput value={text} onChangeText={(value) => { setText(value); setReview(null); }} placeholder="Ingredients: …" placeholderTextColor={t.ink3}
          multiline textAlignVertical="top"
          style={{ backgroundColor: t.surfaceWarm, borderRadius: 12, borderWidth: 1, borderColor: t.line,
            padding: 14, minHeight: 132, fontFamily: t.sans, fontSize: 15, color: t.ink, lineHeight: 21 }} />

        {review ? (
          <View style={{ borderRadius: 14, backgroundColor: t.accentTint, borderWidth: 1,
            borderColor: t.accentSoft, padding: 13, marginTop: 14 }}>
            <Text style={{ fontFamily: t.sans, fontSize: 13.5, fontWeight: '900', color: t.ink }}>
              Review before Nyara saves this scan
            </Text>
            <Text style={{ fontFamily: t.sans, fontSize: 12.5, color: t.ink2, lineHeight: 18, marginTop: 4 }}>
              Product: {review.name}{review.brand ? ` · ${review.brand}` : ''}. Edit the fields above if anything looks off.
            </Text>
          </View>
        ) : null}

        <PrimaryButton onPress={review ? run : prepareReview} disabled={!text.trim() || blocked} t={t} style={{ marginTop: 14 }}>
          {review ? 'Save and check ingredients' : 'Review typed ingredients'}
        </PrimaryButton>
      </Card>
      )}

      <Pressable onPress={runSample} accessibilityRole="button"
        style={{ alignSelf: 'center', minHeight: 44, justifyContent: 'center', marginTop: 6 }}>
        <Text style={{ fontFamily: t.sans, fontSize: 13, fontWeight: '700', color: t.accentDeep }}>
          See how a result looks — try a sample
        </Text>
      </Pressable>

      <Text style={{ fontFamily: t.mono, fontSize: 11, color: t.ink3, marginTop: 18, lineHeight: 17 }}>
        Profile: {watchedIds.length} watched item{watchedIds.length === 1 ? '' : 's'} active. Deterministic matching · no ML · runs offline.
      </Text>
    </ScrollView>
  );
}
