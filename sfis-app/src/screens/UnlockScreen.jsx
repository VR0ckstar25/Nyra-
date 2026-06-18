import React, { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { LockKeyhole } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Card, PrimaryButton, ScreenIntro, SecondaryButton } from '../components/DesignPrimitives';

export function UnlockScreen({ onUnlock, onForgotPin, lockoutText = '' }) {
  const { theme: t } = useTheme();
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState(lockoutText);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (lockoutText) setStatus(lockoutText);
  }, [lockoutText]);

  const submit = async () => {
    setBusy(true);
    setStatus('');
    try {
      const result = await onUnlock(pin);
      if (!result?.ok) {
        setStatus(result?.error || 'Unlock failed.');
        setPin('');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, padding: 18, justifyContent: 'center' }}>
      <View style={{ alignItems: 'center', marginBottom: 18 }}>
        <View style={{ width: 66, height: 66, borderRadius: 22, backgroundColor: t.accentTint,
          borderWidth: 1, borderColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          <LockKeyhole size={32} color={t.accentDeep} strokeWidth={2.6} />
        </View>
      </View>

      <ScreenIntro title="Unlock Nyara" sub="Your profile, scans, feedback, and backups are protected on this device." t={t} />

      <Card t={t} style={{ marginBottom: 14 }}>
        <TextInput
          value={pin}
          onChangeText={setPin}
          placeholder="App PIN"
          placeholderTextColor={t.ink3}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="number-pad"
          style={{ height: 48, borderRadius: 13, borderWidth: 1, borderColor: t.line,
            backgroundColor: t.surfaceWarm, paddingHorizontal: 13, fontFamily: t.sans,
            fontSize: 16, color: t.ink }}
        />
        {status ? (
          <Text style={{ fontFamily: t.sans, fontSize: 13, color: t.amber, lineHeight: 19, marginTop: 10 }}>
            {status}
          </Text>
        ) : null}
      </Card>

      <PrimaryButton onPress={submit} disabled={busy || !pin.trim() || !!lockoutText} t={t}>
        {busy ? 'Checking...' : 'Unlock'}
      </PrimaryButton>
      <SecondaryButton onPress={onForgotPin} t={t} style={{ marginTop: 10 }}>
        Forgot app PIN?
      </SecondaryButton>
      <Text style={{ fontFamily: t.sans, fontSize: 12.5, color: t.ink3, lineHeight: 18,
        textAlign: 'center', marginTop: 10 }}>
        Resetting the app PIN requires signing in to the Nyara account connected to this device.
      </Text>
    </View>
  );
}
