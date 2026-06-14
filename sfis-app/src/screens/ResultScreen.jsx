import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { MatchBar } from '../components/MatchBar';
import { Card, Pill, PrimaryButton } from '../components/DesignPrimitives';
import data from '../data/allergens.json';

// DB currency = the date the bundled export was generated from the database —
// distinct from the scan date and the sample date.
const DB_AS_OF = data.generatedAt || data.version || 'unknown';
const FOOTER =
  'Based on the label as we read it. Always check the original packaging. ' +
  'Ingredient data current as of {DATE}. Scan may not capture all ingredients - ' +
  'we show what we could read. ' +
  "Precautionary allergen statements such as 'may contain' may not always be captured.";

export function ResultScreen({ findings = [], unverified = [], product = {}, onFeedback, nextLabel, onNext }) {
  const { theme: t } = useTheme();
  const familyProfiles = profilesFromFindings(findings);
  // Auto kid-mode only when EVERY matched profile is a child — otherwise an adult's
  // own allergen would get reframed in child wording (review finding). Mixed scans
  // stay in standard mode; kid view remains one tap away.
  const hasChildMatch = familyProfiles.some((profile) => profile.child);
  const childOnly = familyProfiles.length > 0 && familyProfiles.every((profile) => profile.child);
  const [childMode, setChildMode] = useState(() => childOnly);
  const [detail, setDetail] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const nothing = findings.length === 0;

  useEffect(() => {
    setChildMode(childOnly);
  }, [childOnly, product?.name, product?.date]);

  return (
    <>
      <ScrollView style={{ flex: 1, backgroundColor: t.bg }}
        contentContainerStyle={{ padding: 18, paddingBottom: 34 }}>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <View style={{ width: 58, height: 58, borderRadius: 14, backgroundColor: t.surfaceWarm,
            borderWidth: 1, borderColor: t.line, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: t.mono, fontSize: 9, color: t.ink3 }}>label</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontFamily: t.serif, fontSize: childMode ? 24 : 22, fontWeight: '600',
              color: t.ink, lineHeight: childMode ? 29 : 27 }}>
              {product.name || 'Unnamed Product'}
            </Text>
            <Text style={{ fontFamily: t.sans, fontSize: 13.5, color: t.ink2, marginTop: 2 }}>
              {[product.brand, product.date].filter(Boolean).join(' · ') || 'Scanned just now'}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 16, gap: 12 }}>
          <Text style={{ flex: 1, fontFamily: t.serif, fontSize: childMode ? 21 : 18,
            lineHeight: childMode ? 28 : 25, color: t.ink }}>
            {nothing
              ? (childMode ? 'Nothing from your list showed up in what we could read. Still check the pack.' : 'Nothing in what we could read matched your profile. Always check the packaging too.')
              : (childMode ? 'Here is what is inside that you told us about.' : 'Here is what we found that matches your profile.')}
          </Text>
          <View style={{ flexDirection: 'row', backgroundColor: t.surface, borderRadius: 999,
            borderWidth: 1, borderColor: t.line, padding: 3 }}>
            {[
              { key: false, label: 'Aa' },
              { key: true, label: 'Kid' },
            ].map((mode) => {
              const on = childMode === mode.key;
              return (
                <Pressable key={String(mode.key)} onPress={() => setChildMode(mode.key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={mode.key ? 'Kid mode: simpler words, larger type' : 'Standard mode'}
                  style={{ minWidth: 38, height: 30, borderRadius: 999, alignItems: 'center',
                    justifyContent: 'center', backgroundColor: on ? t.accent : 'transparent',
                    paddingHorizontal: 8 }}>
                  <Text style={{ fontFamily: t.sans, fontSize: 12.5, fontWeight: '900',
                    color: on ? t.onAccent : t.ink2 }}>
                    {mode.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ borderRadius: 14, backgroundColor: t.surfaceWarm, borderWidth: 1,
          borderColor: t.line, padding: 13, marginBottom: 14 }}>
          <Text style={{ fontFamily: t.sans, fontSize: 13.5, fontWeight: '800', color: t.ink }}>
            Draft data
          </Text>
          <Text style={{ fontFamily: t.sans, fontSize: 12.5, color: t.ink2, lineHeight: 18, marginTop: 3 }}>
            The ingredient database is not independently validated yet. Check the original package before acting on a result.
          </Text>
        </View>

        {familyProfiles.length ? (
          <Card t={t} style={{ marginBottom: 14, padding: 13 }}>
            <Text style={{ fontFamily: t.sans, fontSize: 13.5, fontWeight: '900', color: t.ink }}>
              Family profiles matched
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {familyProfiles.map((profile) => (
                <ProfileChip key={profile.id || profile.name} profile={profile} t={t} />
              ))}
            </View>
            <Text style={{ fontFamily: t.sans, fontSize: 12.5, color: t.ink2, lineHeight: 18, marginTop: 9 }}>
              Matches may apply to only the profiles shown on each item.
            </Text>
          </Card>
        ) : null}

        {findings.map((f, i) => (
          <MatchBar key={`${f.label}-${i}`} data={f} child={childMode} onOpen={(finding, item) => setDetail({ finding, item })} />
        ))}

        {nothing ? (
          <Card t={t} style={{ marginBottom: 14 }}>
            <Text style={{ fontFamily: t.sans, fontSize: childMode ? 17 : 15, color: t.ink, lineHeight: childMode ? 24 : 21 }}>
              Nothing from your profile in what we could read.
            </Text>
            <Text style={{ fontFamily: t.sans, fontSize: 13, color: t.ink2, marginTop: 4, lineHeight: 19 }}>
              Always check the original packaging.
            </Text>
          </Card>
        ) : null}

        {unverified.length > 0 ? (
          <View style={{ marginTop: 8, marginBottom: 16 }}>
            <Text style={{ fontFamily: t.sans, fontWeight: '800', fontSize: childMode ? 15 : 13, color: t.ink2, marginBottom: 8 }}>
              {childMode ? "Things we couldn't check" : 'Could not verify'}
            </Text>
            <Card t={t} style={{ padding: 14 }}>
              {unverified.map((ing, i) => (
                <Text key={`${ing}-${i}`} style={{ fontFamily: t.sans, fontSize: childMode ? 15 : 14, color: t.unknownInk, lineHeight: childMode ? 23 : 22 }}>
                  {ing}
                </Text>
              ))}
              <Text style={{ fontFamily: t.sans, fontSize: childMode ? 13.5 : 12.5, color: t.ink3, marginTop: 8, lineHeight: childMode ? 20 : 18 }}>
                {childMode
                  ? "We're not sure about these. Check the pack with a grown-up."
                  : 'These ingredients are not in our current database. Check the original label or product source.'}
              </Text>
            </Card>
          </View>
        ) : null}

        <Card t={t} style={{ marginTop: 4, marginBottom: 16 }}>
          <Text style={{ fontFamily: t.sans, fontSize: 14, fontWeight: '800', color: t.ink, marginBottom: 10 }}>
            Was this result useful?
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {['Clear', 'Unsure', 'Wrong'].map((label) => {
              const selected = feedback === label;
              return (
                <Pressable key={label} onPress={() => { setFeedback(label); onFeedback?.(label); }}
                  accessibilityRole="button" accessibilityState={{ selected }}
                  style={{ flex: 1, minHeight: 40, borderRadius: 12,
                    backgroundColor: selected ? t.accent : t.surfaceWarm, borderWidth: 1,
                    borderColor: selected ? t.accent : t.line, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: t.sans, fontSize: 13, fontWeight: '800',
                    color: selected ? t.onAccent : t.ink2 }}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {feedback ? (
            <Text style={{ fontFamily: t.sans, fontSize: 12.5, color: t.ink3, marginTop: 8 }}>
              Noted as {feedback.toLowerCase()} — thank you.
            </Text>
          ) : null}
        </Card>

        {nextLabel && onNext ? (
          <PrimaryButton onPress={onNext} t={t} style={{ marginBottom: 16 }}>
            {nextLabel}
          </PrimaryButton>
        ) : null}

        <View style={{ borderTopWidth: 1, borderTopColor: t.lineSoft, paddingTop: 14, marginTop: 2 }}>
          {childMode ? (
            <Text style={{ fontFamily: t.sans, fontSize: 13, color: t.ink2, lineHeight: 19 }}>
              We might miss things on the label — and "may contain" warnings don't always get read.
              Always check the pack with a grown-up.
            </Text>
          ) : (
            <Text style={{ fontFamily: t.sans, fontSize: 11.5, color: t.ink3, lineHeight: 17 }}>
              {FOOTER.replace('{DATE}', DB_AS_OF)}
            </Text>
          )}
        </View>
      </ScrollView>

      <DetailSheet detail={detail} onClose={() => setDetail(null)} t={t} />
    </>
  );
}

function DetailSheet({ detail, onClose, t }) {
  const item = detail?.item;
  const finding = detail?.finding;
  const profiles = uniqueProfiles(item?.profiles || []);

  return (
    <Modal transparent visible={!!detail} animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(20,24,28,0.34)', justifyContent: 'flex-end' }}>
        <Pressable onPress={() => {}} style={{ backgroundColor: t.surface, borderTopLeftRadius: 22,
          borderTopRightRadius: 22, padding: 20, paddingBottom: 28, borderWidth: 1, borderColor: t.line }}>
          {item ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: t.serif, fontSize: 24, fontWeight: '600', color: t.ink }}>
                    {item.common}
                  </Text>
                  <Text style={{ fontFamily: t.sans, fontSize: 13.5, color: t.ink2, marginTop: 3 }}>
                    {finding?.label || 'Match details'}
                  </Text>
                </View>
                <Pressable onPress={onClose} hitSlop={10}>
                  <Text style={{ fontFamily: t.sans, fontSize: 14, fontWeight: '900', color: t.ink3 }}>Close</Text>
                </Pressable>
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                <Pill t={t} palette={finding?.cat || 'accent'}>
                  {item.kind === 'may' ? 'May contain' : 'Contains'}
                </Pill>
                {/* Confidence pill removed — match_semantics.md explicitly bans a
                    confidence meter on results (Issue 6), and the value was
                    fabricated from match_class anyway (review finding). */}
              </View>

              {profiles.length ? (
                <View style={{ marginTop: 16 }}>
                  <Text style={{ fontFamily: t.sans, fontSize: 12.5, fontWeight: '900', color: t.ink3, marginBottom: 8 }}>
                    Applies to profile
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {profiles.map((profile) => <ProfileChip key={profile.id || profile.name} profile={profile} t={t} />)}
                  </View>
                </View>
              ) : null}

              <DetailLine label="Read as" value={item.technical || item.common} t={t} />
              <DetailLine label="What it is" value={item.info || 'Detailed explanation pending review.'} t={t} />
              {item.info ? (
                <Text style={{ fontFamily: t.sans, fontSize: 11.5, color: t.ink3, marginTop: 4, lineHeight: 16 }}>
                  Auto-generated from our ingredient database — full descriptions are being reviewed.
                </Text>
              ) : null}
              <DetailLine label="Why it matched" value={item.correlation || item.derivative || item.note} t={t} />
              {item.derivative ? <DetailLine label="Label evidence" value={item.derivative} t={t} /> : null}
              {item.note ? <DetailLine label="Note" value={item.note} t={t} /> : null}
              {item.provenance ? <DetailLine label="Data source" value={item.provenance} t={t} /> : null}

              {item.aka && item.aka.length ? (
                <View style={{ marginTop: 16 }}>
                  <Text style={{ fontFamily: t.sans, fontSize: 12.5, fontWeight: '900', color: t.ink3, marginBottom: 8 }}>
                    Also known as
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {item.aka.slice(0, 6).map((aka) => <Pill key={aka} t={t}>{aka}</Pill>)}
                  </View>
                </View>
              ) : null}
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function profilesFromFindings(findings) {
  return uniqueProfiles((findings || []).flatMap((finding) => (
    (finding.items || []).flatMap((item) => item.profiles || [])
  )));
}

function uniqueProfiles(profiles) {
  const seen = new Set();
  return (profiles || []).filter((profile) => {
    const key = profile.id || profile.name;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function ProfileChip({ profile, t }) {
  const name = profile.name || 'Profile';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 28,
      paddingHorizontal: 10, paddingLeft: 7, borderRadius: 999,
      backgroundColor: profile.child ? '#FBF1DF' : t.accentTint,
      borderWidth: 1, borderColor: profile.child ? '#E8D2A9' : t.accentSoft }}>
      <View style={{ width: 17, height: 17, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
        backgroundColor: profile.child ? '#E7D9C4' : t.accentSoft }}>
        <Text style={{ fontFamily: t.sans, fontSize: 9, fontWeight: '900',
          color: profile.child ? '#8A6B3D' : t.accentDeep }}>
          {name.slice(0, 1)}
        </Text>
      </View>
      <Text style={{ fontFamily: t.sans, fontSize: 12.5, fontWeight: '800',
        color: profile.child ? '#7A5B31' : t.accentDeep }}>
        {profile.child ? `${name} (child)` : name}
      </Text>
    </View>
  );
}

function DetailLine({ label, value, t }) {
  if (!value) return null;
  return (
    <View style={{ marginTop: 16 }}>
      <Text style={{ fontFamily: t.sans, fontSize: 12.5, fontWeight: '900', color: t.ink3, marginBottom: 4 }}>
        {label}
      </Text>
      <Text style={{ fontFamily: t.sans, fontSize: 14.5, color: t.ink, lineHeight: 21 }}>
        {value}
      </Text>
    </View>
  );
}
