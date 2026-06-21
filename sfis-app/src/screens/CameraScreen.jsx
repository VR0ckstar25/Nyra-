import React, { useRef, useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ClipboardCheck } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { matchScan } from '../match/scanMatch';
import data from '../data/allergens.json';
import { Card, PrimaryButton, ScreenIntro, SecondaryButton } from '../components/DesignPrimitives';
import { ocrAvailable, recognizeIngredientText } from '../services/ocrService';
import { nonEnglishNotice } from '../services/languageCheck';

export function CameraScreen({ profile, matcherData, scanGate = null, onUpgrade, onResult, onBack, onManual, onProcessingStart, onProcessingEnd }) {
  const { theme: t } = useTheme();
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [pendingScan, setPendingScan] = useState(null);
  const activeData = matcherData || data;
  const canUseOcr = ocrAvailable();
  const blocked = !!scanGate && scanGate.allowed === false;

  const capture = async () => {
    // Defense in depth: the camera tile is disabled at the cap, but never start a
    // capture if the monthly quota is exhausted.
    if (blocked) { setStatus('You have used all your scans this month. See plans for more.'); return; }
    if (!cameraRef.current || busy) return;
    const taskId = onProcessingStart ? onProcessingStart('camera-ocr', 'Reading label') : null;
    setBusy(true);
    setPendingScan(null);
    setStatus('Reading label on this device…');
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, skipProcessing: false });
      const ocr = await recognizeIngredientText(photo.uri);
      setPendingScan({
        ocr,
        image: {
          uri: photo.uri,
          capturedAt: new Date().toISOString(),
        },
        product: {
          name: 'Scanned label',
          brand: '',
          date: new Date().toISOString().slice(0, 10),
        },
      });
      setStatus('Review the product and ingredient text before checking.');
    } catch (error) {
      setStatus(error.message || 'OCR failed. You can still type the ingredients manually.');
    } finally {
      if (taskId && onProcessingEnd) onProcessingEnd(taskId);
      setBusy(false);
    }
  };

  // DEV-ONLY: prove the OCR→match pipeline against a real label image pushed to the
  // device (adb push label.jpg /sdcard/Download/test-label.jpg), bypassing the live
  // camera so it works on the emulator. Never ships — gated by __DEV__ below.
  const devTestOcr = async () => {
    if (busy) return;
    // App-scoped external dir is readable without storage permissions (push there with:
    // adb push test-label.jpg /sdcard/Android/data/com.nyara.app/files/test-label.jpg)
    const devUri = 'file:///sdcard/Android/data/com.nyara.app/files/test-label.jpg';
    setBusy(true); setPendingScan(null);
    setStatus('DEV: running OCR on the pushed test label…');
    try {
      const ocr = await recognizeIngredientText(devUri);
      setPendingScan({
        ocr,
        image: { uri: devUri, capturedAt: new Date().toISOString() },
        product: { name: 'DEV test label', brand: '', date: new Date().toISOString().slice(0, 10) },
      });
      setStatus(`DEV: OCR read ${ocr.text.length} chars. Review + check.`);
    } catch (error) {
      setStatus(`DEV OCR failed: ${error.message}`);
    } finally {
      setBusy(false);
    }
  };

  const checkIngredients = () => {
    if (!pendingScan) return;
    try {
      setStatus('Checking ingredients…');
      const { findings, unverified } = matchScan(pendingScan.ocr.text, profile, activeData);
      onResult({
        findings,
        unverified,
        languageNotice: nonEnglishNotice(pendingScan.ocr.text),
        product: pendingScan.product,
        ocr: pendingScan.ocr,
        image: pendingScan.image,
      });
    } catch (error) {
      setStatus(error.message || 'Could not check those ingredients.');
    }
  };

  const updatePendingProduct = (patch) => {
    setPendingScan((current) => current ? {
      ...current,
      product: { ...(current.product || {}), ...patch },
    } : current);
  };

  const updatePendingText = (text) => {
    setPendingScan((current) => current ? {
      ...current,
      ocr: { ...(current.ocr || {}), text },
    } : current);
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
        <View style={{ borderRadius: 14, backgroundColor: t.surfaceWarm, borderWidth: 1,
          borderColor: t.line, padding: 12, marginTop: 10 }}>
          <Text style={{ fontFamily: t.sans, fontSize: 13.2, fontWeight: '900', color: t.ink }}>
            Draft data check
          </Text>
          <Text style={{ fontFamily: t.sans, fontSize: 12.3, color: t.ink2, lineHeight: 17, marginTop: 3 }}>
            OCR and matching can miss things. Verify the package before buying or eating.
          </Text>
        </View>
      </View>

      <View style={{ flex: 1, marginHorizontal: 18, borderRadius: 18, overflow: 'hidden',
        borderWidth: 1, borderColor: t.line, backgroundColor: t.ink }}>
        <CameraView ref={cameraRef} facing="back" style={{ flex: 1 }}>
          <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
            <View style={{ position: 'absolute', top: 16, left: 16, right: 16, minHeight: 36,
              borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.88)', paddingHorizontal: 13,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <ClipboardCheck size={16} color={t.accentDeep} strokeWidth={2.4} />
              <Text style={{ fontFamily: t.sans, fontSize: 12.5, fontWeight: '900', color: t.accentDeep }}>
                Ingredient scanner
              </Text>
            </View>
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

        {pendingScan ? (
          <View style={{ borderRadius: 16, backgroundColor: t.surface, borderWidth: 1, borderColor: t.accentSoft,
            padding: 14, marginBottom: 10, shadowColor: t.accentDeep, shadowOpacity: 0.08,
            shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
              <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: t.accentTint,
                alignItems: 'center', justifyContent: 'center' }}>
                <ClipboardCheck size={18} color={t.accentDeep} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: t.sans, fontSize: 15.5, fontWeight: '900', color: t.ink }}>
                  Ingredients ready
                </Text>
                <Text style={{ fontFamily: t.sans, fontSize: 12.5, color: t.ink3, marginTop: 1 }}>
                  Edit anything OCR misread, then check it against the profile.
                </Text>
              </View>
            </View>
            <TextInput
              value={pendingScan.product?.name || ''}
              onChangeText={(value) => updatePendingProduct({ name: value })}
              placeholder="Product name"
              placeholderTextColor={t.ink3}
              style={{ backgroundColor: t.surfaceWarm, borderRadius: 12, borderWidth: 1, borderColor: t.line,
                paddingHorizontal: 12, height: 42, fontFamily: t.sans, fontSize: 14, color: t.ink, marginTop: 11 }}
            />
            <TextInput
              value={pendingScan.product?.brand || ''}
              onChangeText={(value) => updatePendingProduct({ brand: value })}
              placeholder="Brand"
              placeholderTextColor={t.ink3}
              style={{ backgroundColor: t.surfaceWarm, borderRadius: 12, borderWidth: 1, borderColor: t.line,
                paddingHorizontal: 12, height: 42, fontFamily: t.sans, fontSize: 14, color: t.ink, marginTop: 8 }}
            />
            <TextInput
              value={pendingScan.ocr?.text || ''}
              onChangeText={updatePendingText}
              placeholder="Recognized ingredients"
              placeholderTextColor={t.ink3}
              multiline
              textAlignVertical="top"
              style={{ backgroundColor: t.surfaceWarm, borderRadius: 12, borderWidth: 1, borderColor: t.line,
                padding: 12, minHeight: 92, fontFamily: t.sans, fontSize: 13.5, color: t.ink,
                lineHeight: 19, marginTop: 8 }}
            />
            <Text style={{ fontFamily: t.sans, fontSize: 12, color: t.ink3, lineHeight: 17, marginTop: 8 }}>
              OCR confidence: {Number.isFinite(pendingScan.ocr?.confidence) ? `${Math.round(pendingScan.ocr.confidence * 100)}%` : 'not reported'}.
              Retake or edit when the text looks uncertain.
            </Text>
          </View>
        ) : null}

        <PrimaryButton onPress={pendingScan ? checkIngredients : capture}
          disabled={busy || (!pendingScan && !canUseOcr) || (pendingScan && !pendingScan.ocr?.text?.trim())} t={t}
          style={pendingScan ? { minHeight: 58, shadowColor: t.accentDeep, shadowOpacity: 0.16,
            shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4 } : undefined}>
          {pendingScan ? 'Check ingredients' : (busy ? 'Reading label…' : 'Scan ingredient label')}
        </PrimaryButton>
        {pendingScan ? (
          <SecondaryButton onPress={capture} disabled={busy || !canUseOcr} t={t} style={{ marginTop: 10 }}>
            Scan again
          </SecondaryButton>
        ) : null}
        <SecondaryButton onPress={onManual || onBack} t={t} style={{ marginTop: 10 }}>
          Type ingredients instead
        </SecondaryButton>
        {__DEV__ ? (
          <SecondaryButton onPress={devTestOcr} disabled={busy} t={t} style={{ marginTop: 10 }}>
            DEV: OCR a pushed test image
          </SecondaryButton>
        ) : null}
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
