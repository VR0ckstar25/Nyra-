import React, { useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '../theme/ThemeProvider';
import { matchScan } from '../match/scanMatch';
import data from '../data/allergens.json';
import { Card, PrimaryButton, ScreenIntro, SecondaryButton } from '../components/DesignPrimitives';
import { ocrAvailable, recognizeIngredientText } from '../services/ocrService';

export function CameraScreen({ profile, matcherData, onResult, onBack, onManual, onProcessingStart, onProcessingEnd }) {
  const { theme: t } = useTheme();
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const activeData = matcherData || data;
  const canUseOcr = ocrAvailable();

  const capture = async () => {
    if (!cameraRef.current || busy) return;
    const taskId = onProcessingStart ? onProcessingStart('camera-ocr', 'Camera OCR') : null;
    setBusy(true);
    setStatus('Reading label on this device…');
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, skipProcessing: false });
      const ocr = await recognizeIngredientText(photo.uri);
      const { findings, unverified } = matchScan(ocr.text, profile, activeData);
      onResult({
        findings,
        unverified,
        product: {
          name: 'Scanned label',
          brand: 'Camera OCR',
          date: new Date().toISOString().slice(0, 10),
        },
        ocr,
        image: {
          uri: photo.uri,
          capturedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      setStatus(error.message || 'OCR failed. You can still type the ingredients manually.');
    } finally {
      if (taskId && onProcessingEnd) onProcessingEnd(taskId);
      setBusy(false);
    }
  };

  if (!permission) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, padding: 18 }}>
        <ScreenIntro title="Camera scan" sub="Checking camera permission…" t={t} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, padding: 18 }}>
        <ScreenIntro title="Camera scan" sub="Camera access is needed only when you choose to scan a real label." t={t} />
        <Card t={t} style={{ marginBottom: 14 }}>
          <Text style={{ fontFamily: t.sans, fontSize: 13.5, color: t.ink2, lineHeight: 20 }}>
            Manual entry still works without camera access.
          </Text>
        </Card>
        <PrimaryButton onPress={requestPermission} t={t}>
          Allow camera
        </PrimaryButton>
        <SecondaryButton onPress={onManual || onBack} t={t} style={{ marginTop: 10 }}>
          Type ingredients
        </SecondaryButton>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ padding: 18, paddingBottom: 12 }}>
        <ScreenIntro
          title="Camera scan"
          sub="OCR runs on this device when using a development build. Photos are not uploaded."
          t={t}
        />
      </View>

      <View style={{ flex: 1, marginHorizontal: 18, borderRadius: 18, overflow: 'hidden',
        borderWidth: 1, borderColor: t.line, backgroundColor: t.ink }}>
        <CameraView ref={cameraRef} facing="back" style={{ flex: 1 }}>
          <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
            <View style={{ height: 180, borderRadius: 16, borderWidth: 2, borderColor: '#FFFFFF',
              backgroundColor: 'rgba(255,255,255,0.06)' }} />
          </View>
        </CameraView>
      </View>

      <View style={{ padding: 18, paddingTop: 14 }}>
        {status ? (
          <Text style={{ fontFamily: t.sans, fontSize: 13, color: t.ink2, lineHeight: 19, textAlign: 'center',
            marginBottom: 10 }}>
            {status}
          </Text>
        ) : null}

        {!canUseOcr ? (
          <Card t={t} style={{ padding: 13, marginBottom: 10 }}>
            <Text style={{ fontFamily: t.sans, fontSize: 13.5, color: t.ink2, lineHeight: 19 }}>
              OCR is installed for iOS/Android development builds. Expo Go and web cannot load the native OCR bridge.
            </Text>
          </Card>
        ) : null}

        <PrimaryButton onPress={capture} disabled={busy || !canUseOcr} t={t}>
          {busy ? 'Reading label…' : 'Scan ingredient label'}
        </PrimaryButton>
        <SecondaryButton onPress={onManual || onBack} t={t} style={{ marginTop: 10 }}>
          Type ingredients instead
        </SecondaryButton>
        <Pressable onPress={onBack} accessibilityRole="button"
          style={{ minHeight: 38, alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
          <Text style={{ fontFamily: t.sans, fontSize: 13, fontWeight: '700', color: t.ink3 }}>
            Back to scan
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
