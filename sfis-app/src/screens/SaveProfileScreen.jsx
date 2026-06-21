import React, { useEffect, useState } from 'react';
import { ScrollView, Text, Pressable, View, TextInput } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '../theme/ThemeProvider';
import { Card, Overline, PrimaryButton, ScreenIntro, SecondaryButton } from '../components/DesignPrimitives';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';

export function SaveProfileScreen({
  hasProfile,
  onUseLocal,
  onBack,
  onEraseDevice,
  onEmailAuth,
  onGoogleToken,
  onDemoGoogleAuth,
  onAppleAuth,
  onResetPassword,
  authReady,
  preproductionAuthReady = false,
  authUser,
  syncStatus,
  recoveryMode = false,
}) {
  const { theme: t } = useTheme();
  const [status, setStatus] = useState('');
  const [email, setEmail] = useState(authUser?.email || '');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState('');
  // With no Firebase keys, email/password creates a LOCAL account (works offline,
  // no sync) — so the email path is always available; only Google/Apple need config.
  const localMode = !authReady && !preproductionAuthReady;
  const accountReady = !!authUser && !recoveryMode;
  const title = recoveryMode ? 'Reset app PIN' : accountReady ? 'Account ready' : hasProfile ? 'Save your profile' : 'Sign in';
  const sub = recoveryMode
    ? 'Sign in to the Nyara account connected to this device. Then Nyara can turn off the local app PIN so you can create a new one.'
    : accountReady
    ? hasProfile
      ? 'Your account is connected. Continue setup when you are ready.'
      : 'Your account is connected. Next, build the label watchlist Nyara should use.'
    : 'Create a local account with a username and password — it keeps your profile and diary on this phone. (Cloud sync comes later.)';

  const googleClientId = GOOGLE_WEB_CLIENT_ID || GOOGLE_IOS_CLIENT_ID || GOOGLE_ANDROID_CLIENT_ID || 'missing-google-client-id';
  const googleReady = !!(GOOGLE_WEB_CLIENT_ID || GOOGLE_IOS_CLIENT_ID || GOOGLE_ANDROID_CLIENT_ID);
  const demoAuth = !authReady && preproductionAuthReady;
  const appleLabel = !authReady ? 'Apple needs real setup'
    : busy === 'apple' ? 'Connecting Apple…' : 'Continue with Apple';
  const googleLabel = demoAuth ? (busy === 'google' ? 'Opening demo Google…' : 'Continue with Google (demo)')
    : !authReady || !googleReady ? 'Google sign-in not configured'
    : busy === 'google' ? 'Connecting Google…' : 'Continue with Google';
  const [googleRequest, googleResponse, promptGoogle] = Google.useIdTokenAuthRequest({
    clientId: googleClientId,
    webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
    scopes: ['openid', 'profile', 'email'],
    selectAccount: true,
  }, { scheme: 'nyara', path: 'oauthredirect' });

  const googleIdToken = googleResponse?.params?.id_token;
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      if (!authReady) {
        setStatus('Cloud sign-in is not configured yet. Local use is available now.');
        setBusy('');
        return;
      }
      if (!googleIdToken) {
        setStatus('Google did not return a usable sign-in token.');
        setBusy('');
        return;
      }
      setBusy('google');
      onGoogleToken(googleIdToken)
        .catch((error) => {
          setStatus(error.message || 'Google sign-in failed.');
          setBusy('');
        });
    } else if (googleResponse?.type === 'error') {
      setStatus(googleResponse.error?.message || 'Google sign-in failed.');
    }
  }, [googleResponse?.type, googleIdToken]);

  const callAuth = async (label, action) => {
    setBusy(label);
    setStatus('');
    try {
      await action();
    } catch (error) {
      setStatus(error.message || 'Sign-in failed.');
      setBusy('');
    }
  };

  const pressEmail = (mode) => {
    callAuth(mode, () => onEmailAuth({ email, password, username, mode }));
  };

  const pressGoogle = () => {
    if (busy) return;
    if (demoAuth) {
      setBusy('google');
      setStatus('');
      onDemoGoogleAuth()
        .catch((error) => {
          setStatus(error.message || 'Demo Google sign-in failed.');
          setBusy('');
        });
      return;
    }
    if (!authReady) {
      setStatus('Cloud sign-in is not configured yet. Local use is available now.');
      return;
    }
    if (!googleReady) {
      setStatus('Add Google OAuth client IDs in .env to enable Google sign-in.');
      return;
    }
    if (!googleRequest) {
      setStatus('Google sign-in is still loading. Try again in a moment.');
      return;
    }
    setBusy('google');
    setStatus('');
    promptGoogle()
      .then((response) => {
        if (response?.type && response.type !== 'success') {
          setStatus(response.type === 'cancel' ? 'Google sign-in was canceled.' : 'Google sign-in did not finish.');
          setBusy('');
        }
      })
      .catch((error) => {
        setStatus(error.message || 'Google sign-in failed.');
        setBusy('');
      });
  };

  const pressApple = () => {
    if (!authReady) {
      setStatus('Apple sign-in needs real Firebase and Apple OAuth setup. Use demo Google or email for this preproduction round.');
      return;
    }
    callAuth('apple', onAppleAuth);
  };

  const pressReset = () => {
    if (!authReady && !preproductionAuthReady) {
      setStatus('Firebase is not configured yet. Local use is available now.');
      return;
    }
    setBusy('reset');
    onResetPassword(email)
      .then((result) => setStatus(result?.preproduction
        ? 'Preproduction demo mode does not send password emails.'
        : 'Password reset email sent.'))
      .catch((error) => setStatus(error.message || 'Password reset failed.'))
      .finally(() => setBusy(''));
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 18, paddingBottom: 30 }}>
      <ScreenIntro title={title} sub={sub} t={t} />

      <Card t={t} style={{ marginBottom: 16 }}>
        <Overline t={t}>{recoveryMode ? 'App PIN recovery' : accountReady ? 'Signed in' : localMode ? 'Local account' : 'Free account'}</Overline>
        <Text style={{ fontFamily: t.serif, fontSize: 20, color: t.ink, lineHeight: 28, marginTop: 8 }}>
          {recoveryMode
            ? 'Your app PIN is local to this phone. We cannot read it or email it back.'
            : accountReady
            ? authUser.email || 'Your Nyara account is connected.'
            : localMode
            ? 'A username and password that lock your data on this phone.'
            : 'Sync saves your profile and scan diary across devices.'}
        </Text>
        <Text style={{ fontFamily: t.sans, fontSize: 13.5, color: t.ink2, lineHeight: 20, marginTop: 6 }}>
          {recoveryMode
            ? 'Signing in confirms the account before the local PIN is reset. If this profile was never connected to an account, recovery may require erasing this phone\'s Nyara data.'
            : accountReady
            ? 'You can continue to preferences now. Cloud backup follows your current backup setting.'
            : localMode
            ? 'Everything stays on this device — there is no cloud copy yet, so it cannot sync to another phone or be recovered if this phone is lost. Account sync arrives in a later update.'
            : 'Label photos stay on this phone. Cloud sync stores profile choices, product names, results, and feedback.'}
        </Text>
        {demoAuth ? (
          <Text style={{ fontFamily: t.sans, fontSize: 12.8, color: t.ink2, lineHeight: 18, marginTop: 8 }}>
            Preproduction mode is using local demo auth and a mock cloud store on this device. It proves the flow, not real account security.
          </Text>
        ) : null}
        <Text style={{ fontFamily: t.mono, fontSize: 11.5, color: t.ink3, lineHeight: 17, marginTop: 8 }}>
          {authReady ? (syncStatus || 'Firebase ready') : preproductionAuthReady ? (syncStatus || 'Preproduction demo auth active') : 'Local account · on-device only'}
        </Text>
      </Card>

      {!accountReady ? (
        <>
          <View style={{ gap: 10, marginBottom: 14 }}>
            <AuthButton label={appleLabel} onPress={pressApple} t={t}
              disabled={!!busy || !authReady} />
            <AuthButton label={googleLabel} onPress={pressGoogle} t={t}
              disabled={!!busy} />
          </View>

          <Card t={t} style={{ marginBottom: 14 }}>
            <Overline t={t}>{recoveryMode ? 'Account sign-in' : 'Email'}</Overline>
            {!recoveryMode ? (
              <TextInput value={username} onChangeText={setUsername} autoCapitalize="words" maxLength={24}
                placeholder="Username (shown in the app)" placeholderTextColor={t.ink3}
                accessibilityLabel="Username"
                style={{ backgroundColor: t.surfaceWarm, borderRadius: 12, borderWidth: 1, borderColor: t.line,
                  paddingHorizontal: 13, height: 46, fontFamily: t.sans, fontSize: 15, color: t.ink, marginTop: 12 }} />
            ) : null}
            <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"
              placeholder="Email" placeholderTextColor={t.ink3}
              style={{ backgroundColor: t.surfaceWarm, borderRadius: 12, borderWidth: 1, borderColor: t.line,
                paddingHorizontal: 13, height: 46, fontFamily: t.sans, fontSize: 15, color: t.ink, marginTop: 10 }} />
            <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Password"
              placeholderTextColor={t.ink3}
              style={{ backgroundColor: t.surfaceWarm, borderRadius: 12, borderWidth: 1, borderColor: t.line,
                paddingHorizontal: 13, height: 46, fontFamily: t.sans, fontSize: 15, color: t.ink, marginTop: 10 }} />
            {recoveryMode ? (
              <PrimaryButton onPress={() => pressEmail('sign-in')} t={t} disabled={!!busy} style={{ marginTop: 12 }}>
                Sign in and reset app PIN
              </PrimaryButton>
            ) : (
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <SecondaryButton onPress={() => pressEmail('create')} t={t} disabled={!!busy} style={{ flex: 1 }}>
                  Create
                </SecondaryButton>
                <PrimaryButton onPress={() => pressEmail('sign-in')} t={t} disabled={!!busy} style={{ flex: 1 }}>
                  Sign in
                </PrimaryButton>
              </View>
            )}
            <Pressable onPress={pressReset} accessibilityRole="button" disabled={!!busy}
              style={{ alignSelf: 'center', minHeight: 36, justifyContent: 'center', marginTop: 6 }}>
              <Text style={{ fontFamily: t.sans, fontSize: 13, fontWeight: '700', color: t.ink3 }}>
                {recoveryMode ? 'Forgot account password?' : 'Reset password'}
              </Text>
            </Pressable>
          </Card>
        </>
      ) : null}

      {status ? (
        <Card t={t} style={{ padding: 13, marginBottom: 14 }}>
          <Text style={{ fontFamily: t.sans, fontSize: 13.5, color: t.ink2, lineHeight: 19 }}>
            {status}
          </Text>
        </Card>
      ) : null}

      {recoveryMode ? (
        <View style={{ borderRadius: 14, backgroundColor: t.surfaceWarm, borderWidth: 1, borderColor: t.line,
          padding: 13, marginBottom: 12 }}>
          <Text style={{ fontFamily: t.sans, fontSize: 13.5, fontWeight: '800', color: t.ink }}>
            No account access?
          </Text>
          <Text style={{ fontFamily: t.sans, fontSize: 12.5, color: t.ink2, lineHeight: 18, marginTop: 3 }}>
            For a local-only profile, the app PIN is the protection. The fallback is erasing this phone's Nyara data and setting up again.
          </Text>
          {onEraseDevice ? (
            <SecondaryButton onPress={onEraseDevice} t={t} style={{ marginTop: 10 }}>
              Erase this phone's Nyara data
            </SecondaryButton>
          ) : null}
        </View>
      ) : accountReady ? (
        <PrimaryButton onPress={onUseLocal} t={t}>
          {hasProfile ? 'Continue setup' : 'Continue to preferences'}
        </PrimaryButton>
      ) : (
        <>
          {/* Skip path — allowed, but with an explicit recovery warning (founder decision 2026-06-11) */}
          <View style={{ borderRadius: 14, backgroundColor: t.surfaceWarm, borderWidth: 1, borderColor: t.line,
            padding: 13, marginBottom: 12 }}>
            <Text style={{ fontFamily: t.sans, fontSize: 13.5, fontWeight: '800', color: t.ink }}>
              Skipping keeps everything on this phone only.
            </Text>
            <Text style={{ fontFamily: t.sans, fontSize: 12.5, color: t.ink2, lineHeight: 18, marginTop: 3 }}>
              Without an account, your profile and diary can't be restored if this phone is lost,
              replaced, or the app is removed.
            </Text>
          </View>
          <PrimaryButton onPress={onUseLocal} t={t}>
            Skip for now — use on this phone
          </PrimaryButton>
        </>
      )}
      <SecondaryButton onPress={onBack} t={t} style={{ marginTop: 10 }}>
        {recoveryMode ? 'Back to PIN' : 'Back'}
      </SecondaryButton>
    </ScrollView>
  );
}

function AuthButton({ label, onPress, disabled, t }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button"
      style={{ minHeight: 48, borderRadius: 14, backgroundColor: t.surface,
        borderWidth: 1, borderColor: disabled ? t.line : t.accentSoft,
        alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 }}>
      <Text style={{ fontFamily: t.sans, fontSize: 15, fontWeight: '800',
        color: disabled ? t.ink3 : t.ink }}>
        {label}
      </Text>
    </Pressable>
  );
}
