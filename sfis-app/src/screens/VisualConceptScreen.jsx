import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  BadgeCheck,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileText,
  LockKeyhole,
  Search,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from 'lucide-react-native';

const CONCEPTS = [
  {
    id: 'market-pop',
    name: 'Market Pop',
    mood: 'Bold, warm, shelf-ready',
    bg: '#FFF3E8',
    ink: '#24191F',
    muted: '#6B5960',
    panel: '#FFFFFF',
    panel2: '#FFF9F0',
    line: '#F0D8C8',
    primary: '#E3327E',
    primaryDark: '#9F1F57',
    cyan: '#009F9A',
    lime: '#87B900',
    amber: '#F5A300',
    coral: '#FF6448',
    cream: '#FFF8EE',
    buttonText: '#FFF9F2',
  },
  {
    id: 'electric-garden',
    name: 'Electric Garden',
    mood: 'Fresh, confident, high energy',
    bg: '#EFFBEF',
    ink: '#17251D',
    muted: '#53665A',
    panel: '#FFFFFF',
    panel2: '#F7FFF5',
    line: '#CFE8D4',
    primary: '#0A9C83',
    primaryDark: '#056B5D',
    cyan: '#2267D8',
    lime: '#A7C900',
    amber: '#F0A111',
    coral: '#E84D74',
    cream: '#F8FFF2',
    buttonText: '#FBFFF7',
  },
  {
    id: 'berry-volt',
    name: 'Berry Volt',
    mood: 'Premium, memorable, brave',
    bg: '#FFF0F6',
    ink: '#241824',
    muted: '#695867',
    panel: '#FFFFFF',
    panel2: '#FFF8FC',
    line: '#EBCADC',
    primary: '#B51F72',
    primaryDark: '#7E164F',
    cyan: '#00A6B7',
    lime: '#8BBE22',
    amber: '#F0A21B',
    coral: '#F15C4D',
    cream: '#FFF7EC',
    buttonText: '#FFF8F2',
  },
];

const FLOW = [
  {
    icon: FileText,
    title: 'Agreements first',
    sub: 'Safety and privacy before food details.',
  },
  {
    icon: UserRoundCheck,
    title: 'Account or local',
    sub: 'Sign in, or continue on this phone.',
  },
  {
    icon: Search,
    title: 'Build the watchlist',
    sub: 'Allergies first, then optional needs.',
  },
  {
    icon: BadgeCheck,
    title: 'Trust proof',
    sub: 'Why it helps, with limits clearly shown.',
  },
  {
    icon: Sparkles,
    title: 'Sample scan payoff',
    sub: 'Instant result using their own choices.',
  },
  {
    icon: ClipboardCheck,
    title: 'How to use it',
    sub: 'Short guide, then offline setup.',
  },
];

export function VisualConceptScreen() {
  const [activeId, setActiveId] = useState(CONCEPTS[0].id);
  const concept = CONCEPTS.find((item) => item.id === activeId) || CONCEPTS[0];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: concept.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 34 }}>
      <View style={{ marginBottom: 14 }}>
        <Text style={{ fontSize: 11, fontWeight: '900', color: concept.primaryDark,
          textTransform: 'uppercase', letterSpacing: 0 }}>
          Nyara v2 preview
        </Text>
        <Text style={{ fontSize: 31, lineHeight: 36, fontWeight: '900',
          color: concept.ink, marginTop: 5 }}>
          Less bland. More trust, more motion.
        </Text>
        <Text style={{ fontSize: 14, color: concept.muted, lineHeight: 20, marginTop: 6 }}>
          A bolder scanner-first direction with the onboarding process arranged like a modern conversion funnel.
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
        {CONCEPTS.map((item) => (
          <ConceptTab key={item.id} item={item} active={item.id === concept.id}
            onPress={() => setActiveId(item.id)} />
        ))}
      </View>

      <PhonePreview p={concept} />
      <OnboardingPreview p={concept} />
      <TrustAdPreview p={concept} />
      <PalettePreview p={concept} />
    </ScrollView>
  );
}

function ConceptTab({ item, active, onPress }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: active }}
      style={{ flex: 1, minHeight: 82, borderRadius: 17, padding: 10,
        backgroundColor: active ? item.ink : item.panel,
        borderWidth: 1, borderColor: active ? item.ink : item.line }}>
      <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
        {[item.primary, item.cyan, item.lime, item.amber].map((color) => (
          <View key={color} style={{ width: 14, height: 14, borderRadius: 5,
            backgroundColor: color, borderWidth: 1, borderColor: 'rgba(255,255,255,0.65)' }} />
        ))}
      </View>
      <Text numberOfLines={1} style={{ fontSize: 12.5, fontWeight: '900',
        color: active ? item.buttonText : item.ink }}>
        {item.name}
      </Text>
      <Text numberOfLines={2} style={{ fontSize: 10.5, fontWeight: '700',
        color: active ? '#F9DBEA' : item.muted, lineHeight: 13, marginTop: 2 }}>
        {item.mood}
      </Text>
    </Pressable>
  );
}

function PhonePreview({ p }) {
  return (
    <View style={{ borderRadius: 30, backgroundColor: p.ink, padding: 10, marginBottom: 16,
      shadowColor: p.primaryDark, shadowOpacity: 0.18, shadowRadius: 22,
      shadowOffset: { width: 0, height: 10 }, elevation: 7 }}>
      <View style={{ borderRadius: 24, backgroundColor: p.panel2, overflow: 'hidden',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' }}>
        <View style={{ minHeight: 164, padding: 17, backgroundColor: p.primary }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, fontWeight: '900', color: p.buttonText,
              textTransform: 'uppercase', letterSpacing: 0 }}>
              Nyara
            </Text>
            <View style={{ height: 26, paddingHorizontal: 9, borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center',
              justifyContent: 'center' }}>
              <Text style={{ fontSize: 10.5, fontWeight: '900', color: p.buttonText }}>4 watched</Text>
            </View>
          </View>

          <Text style={{ fontSize: 31, lineHeight: 35, fontWeight: '900',
            color: p.buttonText, marginTop: 22 }}>
            Check the label before it hits the cart.
          </Text>
          <Text style={{ fontSize: 13.2, lineHeight: 19, color: p.buttonText,
            opacity: 0.88, marginTop: 7 }}>
            Fast scan, clear matches, honest unknowns.
          </Text>
        </View>

        <View style={{ padding: 14 }}>
          <Pressable accessibilityRole="button" style={{ minHeight: 72, borderRadius: 20,
            backgroundColor: p.ink, flexDirection: 'row', alignItems: 'center',
            gap: 12, paddingHorizontal: 14, shadowColor: p.ink, shadowOpacity: 0.2,
            shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 5 }}>
            <View style={{ width: 48, height: 48, borderRadius: 16,
              backgroundColor: p.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={26} color={p.buttonText} strokeWidth={2.7} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 18, lineHeight: 22, fontWeight: '900',
                color: p.buttonText }}>
                Scan ingredient label
              </Text>
              <Text style={{ fontSize: 12.4, color: '#F1E7DA', marginTop: 2 }}>
                Camera first, paste anytime
              </Text>
            </View>
            <ChevronRight size={23} color={p.buttonText} strokeWidth={2.8} />
          </Pressable>

          <View style={{ flexDirection: 'row', gap: 9, marginTop: 12 }}>
            <Metric p={p} color={p.cyan} label="Private" value="Local" icon={LockKeyhole} />
            <Metric p={p} color={p.amber} label="Found" value="Milk" icon={ShieldCheck} />
            <Metric p={p} color={p.lime} label="Diary" value="6" icon={CheckCircle2} />
          </View>
        </View>
      </View>
    </View>
  );
}

function Metric({ p, color, label, value, icon: Icon }) {
  return (
    <View style={{ flex: 1, minHeight: 82, borderRadius: 18, padding: 10,
      backgroundColor: p.panel, borderWidth: 1, borderColor: p.line }}>
      <Icon size={19} color={color} strokeWidth={2.5} />
      <Text style={{ fontSize: 10.5, fontWeight: '800', color: p.muted, marginTop: 10 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 16, fontWeight: '900', color: p.ink }}>
        {value}
      </Text>
    </View>
  );
}

function OnboardingPreview({ p }) {
  return (
    <View style={{ borderRadius: 24, backgroundColor: p.panel, borderWidth: 1,
      borderColor: p.line, padding: 15, marginBottom: 16 }}>
      <Text style={{ fontSize: 11, fontWeight: '900', color: p.primaryDark,
        textTransform: 'uppercase', letterSpacing: 0 }}>
        Onboarding structure
      </Text>
      <Text style={{ fontSize: 22, lineHeight: 27, fontWeight: '900', color: p.ink, marginTop: 5 }}>
        The flow we should copy as a pattern, not as a design.
      </Text>
      <Text style={{ fontSize: 13, color: p.muted, lineHeight: 19, marginTop: 5, marginBottom: 12 }}>
        Permission, account, personalization, credibility, payoff, then instruction. That order sells the product before it asks for habits.
      </Text>

      <View style={{ gap: 9 }}>
        {FLOW.map((step, index) => {
          const Icon = step.icon;
          const colors = [p.primary, p.cyan, p.lime, p.amber, p.coral, p.primaryDark];
          const color = colors[index % colors.length];
          return (
            <View key={step.title} style={{ minHeight: 67, borderRadius: 18,
              backgroundColor: index === 4 ? p.cream : p.panel2, borderWidth: 1,
              borderColor: p.line, padding: 11, flexDirection: 'row',
              alignItems: 'center', gap: 11 }}>
              <View style={{ width: 42, height: 42, borderRadius: 15,
                backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={21} color={p.buttonText} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 11, fontWeight: '900', color: color,
                  textTransform: 'uppercase', letterSpacing: 0 }}>
                  {String(index + 1).padStart(2, '0')}
                </Text>
                <Text style={{ fontSize: 15, lineHeight: 19, fontWeight: '900', color: p.ink }}>
                  {step.title}
                </Text>
                <Text style={{ fontSize: 12.3, color: p.muted, lineHeight: 17, marginTop: 1 }}>
                  {step.sub}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function TrustAdPreview({ p }) {
  return (
    <View style={{ borderRadius: 24, backgroundColor: p.ink, padding: 16, marginBottom: 16 }}>
      <Text style={{ fontSize: 11, fontWeight: '900', color: p.amber,
        textTransform: 'uppercase', letterSpacing: 0 }}>
        Credibility screen copy direction
      </Text>
      <Text style={{ fontSize: 24, lineHeight: 29, fontWeight: '900',
        color: p.buttonText, marginTop: 6 }}>
        Built for people who read every label twice.
      </Text>
      <Text style={{ fontSize: 13, color: '#E8D9CA', lineHeight: 19, marginTop: 7 }}>
        The pitch should feel like relief, not hype: private, specific, honest about unknowns, and fast enough for the grocery aisle.
      </Text>

      <View style={{ flexDirection: 'row', gap: 9, marginTop: 14 }}>
        <TrustPill p={p} color={p.primary} label="On-device OCR" />
        <TrustPill p={p} color={p.cyan} label="No result ads" />
      </View>
      <View style={{ flexDirection: 'row', gap: 9, marginTop: 9 }}>
        <TrustPill p={p} color={p.lime} label="Offline packs" />
        <TrustPill p={p} color={p.amber} label="Draft data disclosed" />
      </View>
    </View>
  );
}

function TrustPill({ p, color, label }) {
  return (
    <View style={{ flex: 1, minHeight: 42, borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.14)', flexDirection: 'row',
      alignItems: 'center', gap: 8, paddingHorizontal: 9 }}>
      <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: color }} />
      <Text numberOfLines={2} style={{ flex: 1, fontSize: 11.5, lineHeight: 15,
        fontWeight: '900', color: p.buttonText }}>
        {label}
      </Text>
    </View>
  );
}

function PalettePreview({ p }) {
  const swatches = [
    ['Primary', p.primary],
    ['Fresh', p.cyan],
    ['Growth', p.lime],
    ['Warm', p.amber],
    ['Pop', p.coral],
  ];

  return (
    <View style={{ borderRadius: 24, backgroundColor: p.panel, borderWidth: 1,
      borderColor: p.line, padding: 15 }}>
      <Text style={{ fontSize: 13, fontWeight: '900', color: p.ink, marginBottom: 11 }}>
        Color ingredients
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {swatches.map(([label, color]) => (
          <View key={label} style={{ flex: 1 }}>
            <View style={{ height: 52, borderRadius: 15, backgroundColor: color,
              borderWidth: 1, borderColor: 'rgba(36,25,31,0.08)' }} />
            <Text numberOfLines={1} style={{ fontSize: 10.5, fontWeight: '900',
              color: p.muted, marginTop: 6 }}>
              {label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
