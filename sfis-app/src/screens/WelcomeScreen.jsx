import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { PrimaryButton, SecondaryButton } from '../components/DesignPrimitives';
import { Wordmark } from '../components/Wordmark';

export function WelcomeScreen({ onStart, onSignIn }) {
  const { theme: t } = useTheme();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ flexGrow: 1, padding: 22 }}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <View style={{ marginBottom: 12 }}>
          <Wordmark t={t} size={26} />
        </View>
        <Text style={{ fontFamily: t.serif, fontSize: 34, fontWeight: '600', color: t.ink,
          lineHeight: 40, marginBottom: 10 }}>
          Shop with a little less worry.
        </Text>
        <Text style={{ fontFamily: t.sans, fontSize: 15.5, color: t.ink2, lineHeight: 22, marginBottom: 28 }}>
          We reflect what's inside against what you care about - no verdicts.
        </Text>

        <PrimaryButton onPress={onStart} t={t}>
          Get started
        </PrimaryButton>
        <SecondaryButton onPress={onSignIn} t={t} style={{ marginTop: 10 }}>
          I already have an account
        </SecondaryButton>
      </View>
    </ScrollView>
  );
}
