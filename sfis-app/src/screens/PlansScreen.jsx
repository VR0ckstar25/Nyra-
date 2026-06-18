import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { BadgeDollarSign, Check, ShieldCheck } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Card, Overline, PrimaryButton, ScreenIntro, SecondaryButton } from '../components/DesignPrimitives';
import { billingStatus, normalizeCommercial, planFor, PLAN_LEVELS } from '../services/commercialModel';

export function PlansScreen({ commercial, onSelectPlan, onRestore, onBack }) {
  const { theme: t } = useTheme();
  const normalized = useMemo(() => normalizeCommercial(commercial), [commercial]);
  const [selected, setSelected] = useState(normalized.planId);
  const current = planFor(normalized.planId);
  const selectedPlan = planFor(selected);
  const changed = selectedPlan.id !== current.id;

  const save = () => {
    onSelectPlan?.(selectedPlan.id);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 18, paddingBottom: 30 }}>
      <ScreenIntro
        title="Plans & ads"
        sub="Set the commercial logic now: Free can show house messages, paid levels remove them. Store billing is still a launch dependency."
        t={t}
      />

      <Card t={t} style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 46, height: 46, borderRadius: 15, backgroundColor: t.accentTint,
            borderWidth: 1, borderColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
            <BadgeDollarSign size={24} color={t.accentDeep} strokeWidth={2.5} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Overline t={t}>Billing status</Overline>
            <Text style={{ fontFamily: t.sans, fontSize: 14.5, fontWeight: '800', color: t.ink,
              lineHeight: 20, marginTop: 4 }}>
              {billingStatus(normalized)}
            </Text>
          </View>
        </View>
      </Card>

      <View style={{ gap: 12, marginBottom: 16 }}>
        {PLAN_LEVELS.map((plan) => {
          const active = selected === plan.id;
          const currentPlan = normalized.planId === plan.id;
          return (
            <Pressable key={plan.id} onPress={() => setSelected(plan.id)}
              accessibilityRole="radio" accessibilityState={{ selected: active }}
              style={{ borderRadius: 18 }}>
              <Card t={t} style={{ borderColor: active ? t.accent : t.lineSoft, borderWidth: active ? 2 : 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Text style={{ fontFamily: t.serif, fontSize: 22, lineHeight: 28,
                        fontWeight: '600', color: t.ink }}>
                        {plan.label}
                      </Text>
                      <Text style={{ fontFamily: t.mono, fontSize: 10.5, fontWeight: '800',
                        color: t.accentDeep, backgroundColor: t.accentTint, borderRadius: 999,
                        paddingHorizontal: 8, paddingVertical: 3 }}>
                        {plan.badge}
                      </Text>
                    </View>
                    <Text style={{ fontFamily: t.sans, fontSize: 13.2, color: t.ink2,
                      lineHeight: 19, marginTop: 6 }}>
                      {plan.summary}
                    </Text>
                  </View>
                  <View style={{ minWidth: 58, alignItems: 'flex-end' }}>
                    <Text style={{ fontFamily: t.sans, fontSize: 14.5, fontWeight: '900', color: t.ink }}>
                      {plan.price}
                    </Text>
                    {active ? <Check size={22} color={t.accentDeep} strokeWidth={2.8} /> : null}
                  </View>
                </View>

                <View style={{ gap: 8, marginTop: 13 }}>
                  {plan.features.map((feature) => (
                    <View key={feature} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                      <Check size={16} color={t.accentDeep} strokeWidth={2.6} />
                      <Text style={{ flex: 1, fontFamily: t.sans, fontSize: 12.8,
                        color: t.ink2, lineHeight: 18 }}>
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>

                {currentPlan ? (
                  <Text style={{ fontFamily: t.mono, fontSize: 11, fontWeight: '800',
                    color: t.ink3, marginTop: 12 }}>
                    Current preview level
                  </Text>
                ) : null}
              </Card>
            </Pressable>
          );
        })}
      </View>

      <Card t={t} style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <ShieldCheck size={21} color={t.accentDeep} strokeWidth={2.5} />
          <Overline t={t} color={t.accentDeep}>Ad policy</Overline>
        </View>
        <Text style={{ fontFamily: t.sans, fontSize: 13.2, color: t.ink2, lineHeight: 19 }}>
          Ads are limited to house messages in Free while billing is in preview mode. Result screens,
          camera/OCR, and allergy detail sheets stay ad-free so nothing competes with safety-critical reading.
        </Text>
      </Card>

      <PrimaryButton onPress={save} disabled={!changed} t={t}>
        {changed ? `Choose ${selectedPlan.label}` : `${current.label} selected`}
      </PrimaryButton>
      {onRestore ? (
        <SecondaryButton onPress={onRestore} t={t} style={{ marginTop: 10 }}>
          Restore purchases
        </SecondaryButton>
      ) : null}
      <Text style={{ fontFamily: t.sans, fontSize: 11.5, color: t.ink3, lineHeight: 16, textAlign: 'center', marginTop: 10 }}>
        Payment is handled by the App Store / Google Play with the card already on your phone — Nyara never sees or stores card details.
      </Text>
      <SecondaryButton onPress={onBack} t={t} style={{ marginTop: 10 }}>
        Back
      </SecondaryButton>
    </ScrollView>
  );
}
