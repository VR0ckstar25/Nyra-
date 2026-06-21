// UpgradeScreen.jsx — the paywall shown when a Free user hits the monthly limit
// (founder: "make it appealing psychologically"). Ethical persuasion only — this is
// a health app, so NO fake countdowns, NO guilt, NO dark patterns (they'd poison the
// Mirror-Principle trust). What we DO use, all legitimate:
//   • Reciprocity/affirmation — acknowledge the habit they've built
//   • Concrete value — "unlimited" vs the cap they just hit
//   • Anchoring + "most popular" social proof on Individual
//   • Loss-of-momentum framing (calm: "pick up where you left off")
//   • Clear, honest reset fallback — they're never trapped

import React, { useState } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { Check, Sparkles, Users, Infinity as InfinityIcon } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { PrimaryButton } from '../components/DesignPrimitives';
import { PLAN_LEVELS, planFor } from '../services/commercialModel';

function resetLabel(iso) {
  if (!iso) return 'next month';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? 'next month' : d.toLocaleDateString([], { month: 'long', day: 'numeric' });
}

function PlanCard({ plan, selected, onSelect, t }) {
  const accent = plan.popular;
  return (
    <Pressable onPress={() => onSelect(plan.id)} accessibilityRole="radio"
      accessibilityState={{ selected }} accessibilityLabel={`${plan.label}, ${plan.price} ${plan.period}`}
      style={{ borderRadius: 18, borderWidth: selected ? 2 : 1,
        borderColor: selected ? t.accent : t.line, backgroundColor: selected ? t.accentTint : t.surface,
        padding: 16, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontFamily: t.serif, fontSize: 20, fontWeight: '700', color: t.ink }}>{plan.label}</Text>
          {plan.badge ? (
            <View style={{ backgroundColor: accent ? t.accent : t.surfaceWarm, borderRadius: 999,
              paddingHorizontal: 9, paddingVertical: 3, borderWidth: accent ? 0 : 1, borderColor: t.line }}>
              <Text style={{ fontFamily: t.sans, fontSize: 10.5, fontWeight: '900',
                color: accent ? t.onAccent : t.ink2 }}>{plan.badge.toUpperCase()}</Text>
            </View>
          ) : null}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontFamily: t.sans, fontSize: 17, fontWeight: '900', color: t.ink }}>{plan.price}</Text>
          <Text style={{ fontFamily: t.sans, fontSize: 11, color: t.ink3 }}>{plan.period}</Text>
        </View>
      </View>
      <Text style={{ fontFamily: t.sans, fontSize: 13, color: t.ink2, lineHeight: 19, marginTop: 6 }}>{plan.tagline}</Text>
      <View style={{ gap: 6, marginTop: 10 }}>
        {plan.features.slice(0, 3).map((f) => (
          <View key={f} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <Check size={15} color={t.accentDeep} strokeWidth={2.8} />
            <Text style={{ flex: 1, fontFamily: t.sans, fontSize: 12.8, color: t.ink2, lineHeight: 18 }}>{f}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

export function UpgradeScreen({ scanGate = {}, onChoosePlan, onMaybeLater, t: themeProp }) {
  const themeCtx = useTheme();
  const t = themeProp || themeCtx.theme;
  const paid = PLAN_LEVELS.filter((p) => p.id !== 'free');
  const [selected, setSelected] = useState((paid.find((p) => p.popular) || paid[0]).id);
  const used = scanGate.allowance || planFor('free').monthlyScans;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 22, paddingBottom: 34 }}>
      <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: t.accentTint,
        borderWidth: 1, borderColor: t.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <InfinityIcon size={28} color={t.accentDeep} strokeWidth={2.4} />
      </View>

      {/* Affirmation + concrete value, not guilt */}
      <Text accessibilityRole="header" style={{ fontFamily: t.serif, fontSize: 30, fontWeight: '600',
        color: t.ink, lineHeight: 36, marginBottom: 10 }}>
        You’ve used all {used} free scans this month.
      </Text>
      <Text style={{ fontFamily: t.sans, fontSize: 15.5, color: t.ink2, lineHeight: 23, marginBottom: 20 }}>
        You’re building a real habit of checking labels — nice. Go unlimited and never stop mid-aisle,
        or your free scans refresh on {resetLabel(scanGate.nextResetAt)}.
      </Text>

      {/* Value row — what unlimited unlocks */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 22 }}>
        {[{ icon: InfinityIcon, label: 'Unlimited scans' }, { icon: Sparkles, label: 'No house messages' }, { icon: Users, label: 'Up to 5 profiles' }].map(({ icon: Icon, label }) => (
          <View key={label} style={{ flex: 1, alignItems: 'center', backgroundColor: t.surface, borderRadius: 14,
            borderWidth: 1, borderColor: t.lineSoft, paddingVertical: 13, paddingHorizontal: 6 }}>
            <Icon size={20} color={t.accentDeep} strokeWidth={2.4} />
            <Text style={{ fontFamily: t.sans, fontSize: 11.5, fontWeight: '700', color: t.ink2,
              textAlign: 'center', marginTop: 7, lineHeight: 15 }}>{label}</Text>
          </View>
        ))}
      </View>

      {paid.map((plan) => (
        <PlanCard key={plan.id} plan={plan} selected={selected === plan.id} onSelect={setSelected} t={t} />
      ))}

      <PrimaryButton onPress={() => onChoosePlan?.(selected)} t={t} style={{ marginTop: 6 }}>
        Go unlimited
      </PrimaryButton>
      <Pressable onPress={onMaybeLater} accessibilityRole="button"
        style={{ alignSelf: 'center', minHeight: 44, justifyContent: 'center', marginTop: 8 }}>
        <Text style={{ fontFamily: t.sans, fontSize: 13.5, fontWeight: '700', color: t.ink3 }}>
          Maybe later — I’ll wait for {resetLabel(scanGate.nextResetAt)}
        </Text>
      </Pressable>
      <Text style={{ fontFamily: t.sans, fontSize: 11, color: t.ink3, lineHeight: 16, textAlign: 'center', marginTop: 14 }}>
        Billed through the App Store / Google Play. Cancel anytime — Nyara never sees your card.
      </Text>
    </ScrollView>
  );
}
