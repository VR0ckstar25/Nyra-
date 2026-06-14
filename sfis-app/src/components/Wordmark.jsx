// Wordmark.jsx — the Anvara wordmark. Works today on system fonts; when the brand
// serif (Source Serif 4) is loaded via expo-font it inherits automatically through
// theme.serif. The dot on the 'i'-less mark is a small fuchsia accent tittle that
// nods to the amber "finding present" dot without implying a verdict.

import React from 'react';
import { Text, View } from 'react-native';

export function Wordmark({ t, size = 28, color, accent, withDot = true }) {
  const ink = color || t.ink;
  const dot = accent || t.accent;
  return (
    <View accessibilityRole="header" accessibilityLabel="Anvara"
      style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
      <Text style={{ fontFamily: t.serif, fontSize: size, fontWeight: '600', color: ink, letterSpacing: 0.2 }}>
        Anvara
      </Text>
      {withDot ? (
        <View style={{ width: Math.max(5, size * 0.16), height: Math.max(5, size * 0.16),
          borderRadius: 999, backgroundColor: dot, marginLeft: 3, marginBottom: size * 0.16 }} />
      ) : null}
    </View>
  );
}

// Eyebrow + wordmark lockup for screen headers.
export function WordmarkLockup({ t, tagline = 'Shop with a little less worry' }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Wordmark t={t} size={30} />
      <Text style={{ fontFamily: t.sans, fontSize: 13, color: t.ink2, marginTop: 4 }}>
        {tagline}
      </Text>
    </View>
  );
}
