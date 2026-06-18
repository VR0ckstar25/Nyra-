import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Megaphone } from 'lucide-react-native';
import { Card, Overline } from './DesignPrimitives';

export function HouseAdCard({ ad, onPress, t }) {
  if (!ad) return null;
  return (
    <Card t={t} style={{ marginBottom: 16, borderColor: t.accentSoft }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: t.accentTint,
          borderWidth: 1, borderColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Megaphone size={21} color={t.accentDeep} strokeWidth={2.4} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Overline t={t} color={t.accentDeep}>{ad.eyebrow || 'Nyara'}</Overline>
          <Text style={{ fontFamily: t.sans, fontSize: 16, fontWeight: '900', color: t.ink,
            lineHeight: 21, marginTop: 5 }}>
            {ad.title}
          </Text>
          <Text style={{ fontFamily: t.sans, fontSize: 12.8, color: t.ink2, lineHeight: 18, marginTop: 5 }}>
            {ad.body}
          </Text>
          {onPress ? (
            <Pressable onPress={onPress} accessibilityRole="button"
              style={{ alignSelf: 'flex-start', minHeight: 36, borderRadius: 11, paddingHorizontal: 12,
                backgroundColor: t.surfaceWarm, borderWidth: 1, borderColor: t.line,
                alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
              <Text style={{ fontFamily: t.sans, fontSize: 13, fontWeight: '800', color: t.accentDeep }}>
                {ad.action || 'Open'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Card>
  );
}
