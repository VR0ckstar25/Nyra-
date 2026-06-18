// MemberSearchSheet.jsx — the "+ Add members" flow (founder spec 2026-06-11):
// tapping the gray + circle opens a search bar; matches can be added to the family.
// Currently searches the four TEST accounts (src/data/testAccounts.js) so the whole
// flow works end-to-end before real account lookup ships; the search source swaps
// to the live user directory when accounts launch.

import React, { useMemo, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { searchTestAccounts } from '../data/testAccounts';

export function MemberSearchSheet({ visible, onClose, onAdd, members = [], capReached = false, t }) {
  const [query, setQuery] = useState('');
  const existingIds = useMemo(() => members.map((m) => m.id), [members]);
  const results = useMemo(() => searchTestAccounts(query, existingIds), [query, existingIds]);

  const close = () => { setQuery(''); onClose(); };
  const add = (account) => { onAdd?.(account); setQuery(''); };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={close}>
      <Pressable onPress={close} style={{ flex: 1, backgroundColor: 'rgba(20,24,28,0.34)', justifyContent: 'flex-end' }}>
        <Pressable onPress={() => {}} style={{ backgroundColor: t.surface, borderTopLeftRadius: 22,
          borderTopRightRadius: 22, padding: 20, paddingBottom: 30, borderWidth: 1, borderColor: t.line }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontFamily: t.serif, fontSize: 21, fontWeight: '600', color: t.ink }}>
              Add a family member
            </Text>
            <Pressable onPress={close} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
              <Text style={{ fontFamily: t.sans, fontSize: 14, fontWeight: '900', color: t.ink3 }}>Close</Text>
            </Pressable>
          </View>

          <View style={{ backgroundColor: t.surfaceWarm, borderRadius: 14, borderWidth: 1, borderColor: t.line,
            minHeight: 50, paddingHorizontal: 14, justifyContent: 'center', marginBottom: 12 }}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name or email"
              placeholderTextColor={t.ink3}
              autoCapitalize="none"
              autoFocus
              accessibilityLabel="Search for a family member"
              style={{ fontFamily: t.sans, fontSize: 15, color: t.ink, minHeight: 48 }}
            />
          </View>

          {capReached ? (
            <View style={{ borderRadius: 14, backgroundColor: t.surfaceWarm, borderWidth: 1, borderColor: t.line,
              padding: 14, marginBottom: 10 }}>
              <Text style={{ fontFamily: t.sans, fontSize: 13.5, color: t.ink2, lineHeight: 19 }}>
                A family supports up to 5 profiles, and you're at the limit.
              </Text>
            </View>
          ) : null}

          {query.trim() ? (
            results.length ? (
              <View style={{ gap: 8 }}>
                {results.map((account) => (
                  <View key={account.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12,
                    borderRadius: 14, backgroundColor: t.surfaceWarm, borderWidth: 1, borderColor: t.line, padding: 12 }}>
                    <View style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: account.child ? '#E7D9C4' : t.accentSoft }}>
                      <Text style={{ fontFamily: t.serif, fontSize: 17, fontWeight: '700',
                        color: account.child ? '#8A6B3D' : t.accentDeep }}>
                        {account.name[0]}
                      </Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontFamily: t.sans, fontSize: 15, fontWeight: '800', color: t.ink }}>
                        {account.name}{account.child ? '  ·  child' : ''}
                      </Text>
                      <Text style={{ fontFamily: t.sans, fontSize: 12.5, color: t.ink3, marginTop: 1 }}>
                        {account.email}
                      </Text>
                    </View>
                    <Pressable onPress={() => add(account)} disabled={capReached}
                      accessibilityRole="button" accessibilityLabel={`Add ${account.name}`}
                      style={{ minHeight: 36, borderRadius: 999, paddingHorizontal: 14,
                        backgroundColor: capReached ? t.line : t.accent, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontFamily: t.sans, fontSize: 13, fontWeight: '900',
                        color: capReached ? t.ink3 : t.onAccent }}>
                        Add
                      </Text>
                    </Pressable>
                  </View>
                ))}
                <Text style={{ fontFamily: t.mono, fontSize: 10.5, color: t.ink3, marginTop: 4 }}>
                  Test directory — live account search arrives with sign-in.
                </Text>
              </View>
            ) : (
              <View style={{ borderRadius: 14, backgroundColor: t.surfaceWarm, borderWidth: 1, borderColor: t.line, padding: 14 }}>
                <Text style={{ fontFamily: t.sans, fontSize: 14, fontWeight: '800', color: t.ink }}>
                  No members found for “{query.trim()}”
                </Text>
                <Text style={{ fontFamily: t.sans, fontSize: 13, color: t.ink2, lineHeight: 19, marginTop: 4 }}>
                  This build searches the four test accounts (try “Maya”, “Theo”, “Ava” or “Rohan”).
                  Live account search arrives with sign-in.
                </Text>
              </View>
            )
          ) : (
            <Text style={{ fontFamily: t.sans, fontSize: 13, color: t.ink2, lineHeight: 19 }}>
              Search for someone who already uses Nyara. Each member keeps their own watched items.
              Scans check everyone on the family profile at once. Child profiles use simpler result wording when a match applies.
              A family supports up to 5 profiles.
            </Text>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
