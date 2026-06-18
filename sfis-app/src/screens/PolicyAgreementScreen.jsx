import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { FileText, ShieldCheck } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Card, Overline, PrimaryButton, ScreenIntro, SecondaryButton } from '../components/DesignPrimitives';

export function PolicyAgreementScreen({ onAccept, onBack }) {
  const { theme: t } = useTheme();
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedSafety, setAcceptedSafety] = useState(false);
  const ready = acceptedPrivacy && acceptedSafety;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 18, paddingBottom: 30 }}>
      <ScreenIntro
        title="Before we personalize Nyara"
        sub="A few clear agreements first, so the app earns trust before asking about your food life."
        t={t}
      />

      <Card t={t} style={{ marginBottom: 14 }}>
        <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: t.accentTint,
          borderWidth: 1, borderColor: t.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <ShieldCheck size={27} color={t.accentDeep} strokeWidth={2.5} />
        </View>
        <Overline t={t}>Trust basics</Overline>
        <Text style={{ fontFamily: t.serif, fontSize: 21, lineHeight: 28, fontWeight: '600',
          color: t.ink, marginTop: 8 }}>
          Nyara helps you review labels. It does not replace your own label check.
        </Text>
        <Text style={{ fontFamily: t.sans, fontSize: 13.5, color: t.ink2, lineHeight: 20, marginTop: 8 }}>
          The database is still draft in preproduction, scans can miss words, and packaging should remain the final source before you buy or eat.
        </Text>
      </Card>

      <Card t={t} style={{ paddingVertical: 6, marginBottom: 14 }}>
        <AgreementRow
          checked={acceptedPrivacy}
          onPress={() => setAcceptedPrivacy((value) => !value)}
          icon={<FileText size={21} color={t.accentDeep} strokeWidth={2.4} />}
          title="I agree to Nyara's Terms and Privacy Notice."
          sub="Preproduction privacy posture: profile, diary, feedback, and offline packs stay encrypted on this device; cloud sync is optional."
          t={t}
        />
        <AgreementRow
          checked={acceptedSafety}
          onPress={() => setAcceptedSafety((value) => !value)}
          icon={<ShieldCheck size={21} color={t.accentDeep} strokeWidth={2.4} />}
          title="I understand Nyara is a support tool, not a safety guarantee."
          sub="Nyara can reduce label-reading friction, but you still need to check the original package."
          t={t}
        />
      </Card>

      <PrimaryButton onPress={onAccept} disabled={!ready} t={t}>
        Agree and continue
      </PrimaryButton>
      <SecondaryButton onPress={onBack} t={t} style={{ marginTop: 10 }}>
        Back
      </SecondaryButton>
    </ScrollView>
  );
}

function AgreementRow({ checked, onPress, icon, title, sub, t }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked }}
      style={{ flexDirection: 'row', gap: 12, paddingVertical: 12, paddingHorizontal: 10,
        borderBottomWidth: 1, borderBottomColor: t.lineSoft }}>
      <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: checked ? t.accent : t.surfaceWarm,
        borderWidth: 1, borderColor: checked ? t.accent : t.line, alignItems: 'center', justifyContent: 'center',
        marginTop: 2 }}>
        <Text style={{ fontFamily: t.sans, fontSize: 16, fontWeight: '900', color: checked ? t.onAccent : t.ink3 }}>
          {checked ? '✓' : ''}
        </Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {icon}
          <Text style={{ flex: 1, fontFamily: t.sans, fontSize: 14.8, fontWeight: '800', color: t.ink,
            lineHeight: 20 }}>
            {title}
          </Text>
        </View>
        <Text style={{ fontFamily: t.sans, fontSize: 12.7, color: t.ink2, lineHeight: 18, marginTop: 4 }}>
          {sub}
        </Text>
      </View>
    </Pressable>
  );
}
