import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Card, Chip, Overline, PrimaryButton, ScreenIntro } from '../components/DesignPrimitives';
import {
  buildSelfProfile,
  defaultSeverityFor,
  profileIds,
  profileItems,
  PROFILE_ITEMS as ALL_ITEMS,
  PROFILE_SECTIONS as SECTIONS,
  SEVERITY,
} from '../profile/profileModel';

// Founder decision (2026-06-11): hard cap of five watched items, all chosen on one
// screen — the constraint is the point: it makes the user prioritize what matters most.
const MAX_SELECTIONS = 5;

export function OnboardingScreen({ onDone, initialProfile = null, initialSelections = [] }) {
  const { theme: t } = useTheme();
  const initialIds = useMemo(() => profileIds(initialProfile).length ? profileIds(initialProfile) : initialSelections, [initialProfile, initialSelections]);
  const initialSeverity = useMemo(() => {
    const saved = Object.fromEntries(profileItems(initialProfile).map((item) => [item.id, item.severity]));
    return Object.fromEntries(initialIds.map((id) => [id, saved[id] || defaultSeverityFor(id)]));
  }, [initialProfile, initialIds]);
  const [selected, setSelected] = useState(() => new Set(initialIds));
  const [severity, setSeverity] = useState(() => initialSeverity);
  const [capNotice, setCapNotice] = useState(false);
  const [query, setQuery] = useState('');
  const [goalsOpen, setGoalsOpen] = useState(() => initialIds.some((id) => id.startsWith('goal.')));

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return ALL_ITEMS.filter((item) => {
      const haystack = [item.label, ...(item.aliases || [])].join(' ').toLowerCase();
      return haystack.includes(q);
    }).slice(0, 6);
  }, [query]);

  const itemById = useMemo(() => Object.fromEntries(ALL_ITEMS.map((item) => [item.id, item])), []);

  const toggle = (item) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
        setCapNotice(false);
      } else if (next.size >= MAX_SELECTIONS) {
        setCapNotice(true); // at the cap — force a prioritization choice, don't add
        return prev;
      } else {
        next.add(item.id);
      }
      return next;
    });
    setSeverity((prev) => {
      if (prev[item.id]) return prev;
      const scale = SEVERITY[item.palette] || SEVERITY.goal;
      return { ...prev, [item.id]: scale[Math.min(1, scale.length - 1)] };
    });
  };

  const finish = () => {
    onDone(buildSelfProfile(Array.from(selected), severity, initialProfile));
  };

  const count = selected.size;
  const atCap = count >= MAX_SELECTIONS;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 18, paddingBottom: 34 }}>
      <ScreenIntro
        title="What should Anvara watch for?"
        sub="Pick up to five things — the ones that matter most. Allergies stay first; intolerances, diet, and goals can sit beside them."
        t={t}
        right={
          <View style={{ minHeight: 30, paddingHorizontal: 11, borderRadius: 999, backgroundColor: atCap ? t.accent : t.surface,
            borderWidth: 1, borderColor: atCap ? t.accent : t.line, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: t.sans, fontSize: 12.5, fontWeight: '900', color: atCap ? t.onAccent : t.ink2 }}>
              {count} of {MAX_SELECTIONS}
            </Text>
          </View>
        }
      />

      <View style={{ backgroundColor: t.surface, borderRadius: 14, borderWidth: 1, borderColor: t.line,
        minHeight: 50, paddingHorizontal: 14, justifyContent: 'center', marginBottom: 10 }}>
        <TextInput value={query} onChangeText={setQuery} placeholder="Search ingredients, like whey or almonds"
          placeholderTextColor={t.ink3}
          autoCapitalize="none"
          style={{ fontFamily: t.sans, fontSize: 15, color: t.ink, minHeight: 48 }} />
      </View>

      {query.trim() ? (
        <Card t={t} style={{ paddingVertical: 4, marginBottom: 16 }}>
          {results.length ? results.map((item, i) => (
            <Pressable key={item.id} onPress={() => toggle(item)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12,
                borderBottomWidth: i < results.length - 1 ? 1 : 0, borderBottomColor: t.lineSoft }}>
              <Text style={{ width: 22, fontFamily: t.sans, fontSize: 19, color: selected.has(item.id) ? t.accent : t.ink3 }}>
                {selected.has(item.id) ? '✓' : '+'}
              </Text>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: t.sans, fontSize: 15.5, fontWeight: '800', color: t.ink }}>
                  {item.label}
                </Text>
                <Text style={{ fontFamily: t.sans, fontSize: 12.5, color: t.ink3, marginTop: 1 }}>
                  {item.section}
                </Text>
              </View>
              <Text style={{ fontFamily: t.sans, fontSize: 11.5, fontWeight: '800', color: t[item.palette].label }}>
                {item.palette}
              </Text>
            </Pressable>
          )) : (
            <Text style={{ fontFamily: t.sans, fontSize: 13.5, color: t.ink3, lineHeight: 19, paddingVertical: 12 }}>
              No local match yet. Try a common name, or pick from the lists below.
            </Text>
          )}
        </Card>
      ) : null}

      {SECTIONS.map((section) => {
        const hasSelected = section.items.some((item) => selected.has(item.id));
        const collapsed = section.optional && !goalsOpen && !hasSelected;
        return (
        <View key={section.title} style={{ marginBottom: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 10 }}>
            <Overline t={t} color={section.palette === 'allergen' ? t.allergen.label : undefined}>{section.title}</Overline>
            {section.badge ? (
              <View style={{ height: 22, paddingHorizontal: 8, borderRadius: 999, backgroundColor: t[section.palette].tint,
                borderWidth: 1, borderColor: t[section.palette].edge, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: t.sans, fontSize: 10.5, fontWeight: '900', color: t[section.palette].label }}>
                  {section.badge}
                </Text>
              </View>
            ) : null}
            {section.optional ? (
              <Pressable onPress={() => setGoalsOpen((open) => !open)} accessibilityRole="button" hitSlop={8}>
                <Text style={{ fontFamily: t.sans, fontSize: 12, fontWeight: '800', color: t.accentDeep }}>
                  {collapsed ? 'Show' : 'Hide'}
                </Text>
              </Pressable>
            ) : null}
          </View>
          {collapsed ? null : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
              {section.items.map((item) => {
                const isOn = selected.has(item.id);
                return (
                  <View key={item.id} style={{ opacity: atCap && !isOn ? 0.4 : 1 }}>
                    <Chip label={item.label} selected={isOn}
                      onPress={() => toggle({ ...item, palette: section.palette })} t={t} palette={section.palette} />
                  </View>
                );
              })}
            </View>
          )}
        </View>
      );})}

      {count > 0 ? (
        <View style={{ marginTop: 2, marginBottom: 18 }}>
          <Overline t={t}>Your selections and severity</Overline>
          <View style={{ gap: 10, marginTop: 12 }}>
            {Array.from(selected).map((id) => {
              const item = itemById[id] || { id, label: id, palette: 'goal' };
              const scale = SEVERITY[item.palette] || SEVERITY.goal;
              return (
                <Card key={id} t={t} style={{ padding: 13 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <Text style={{ flex: 1, fontFamily: t.sans, fontSize: 15.5, fontWeight: '800', color: t.ink }}>
                      {item.label}
                    </Text>
                    <Pressable onPress={() => toggle(item)} hitSlop={8}>
                      <Text style={{ fontFamily: t.sans, fontSize: 13, fontWeight: '800', color: t.ink3 }}>Remove</Text>
                    </Pressable>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 7, marginTop: 11 }}>
                    {scale.map((level) => {
                      const on = severity[id] === level;
                      return (
                        <Pressable key={level} onPress={() => setSeverity((prev) => ({ ...prev, [id]: level }))}
                          style={{ flex: 1, minHeight: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                            backgroundColor: on ? t.ink : t.surfaceWarm, borderWidth: on ? 0 : 1, borderColor: t.line }}>
                          <Text style={{ fontFamily: t.sans, fontSize: 12.5, fontWeight: '800',
                            color: on ? t.surface : t.ink2, textAlign: 'center' }}>
                            {level}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </Card>
              );
            })}
          </View>
        </View>
      ) : null}

      {capNotice ? (
        <View style={{ borderRadius: 14, backgroundColor: t.surfaceWarm, borderWidth: 1, borderColor: t.line,
          padding: 13, marginBottom: 12 }}>
          <Text style={{ fontFamily: t.sans, fontSize: 13.5, fontWeight: '800', color: t.ink }}>
            That's your five.
          </Text>
          <Text style={{ fontFamily: t.sans, fontSize: 12.5, color: t.ink2, lineHeight: 18, marginTop: 3 }}>
            Anvara watches up to five things so results stay focused. Remove one above to add another —
            keep the five that matter most to you.
          </Text>
        </View>
      ) : null}
      <PrimaryButton onPress={finish} disabled={count === 0} t={t}>
        Continue{count ? ` with ${count} of ${MAX_SELECTIONS} selected` : ''}
      </PrimaryButton>
    </ScrollView>
  );
}
