// FamilyTransferSheet.jsx — "Move scans" within a family plan (founder spec
// 2026-06-12: members can transfer unused monthly credits to each other; a
// departed member's leftover credits sit in a shared pool to hand out).
//
// Pure presentation over the tested ledger engine in commercialModel: it calls
// transferScans() and reports the {ok, reason} result honestly.

import React, { useMemo, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { FAMILY_POOL_ID, memberRemaining } from '../services/commercialModel';

const POOL = { id: FAMILY_POOL_ID, name: 'Shared pool', child: false };

export function FamilyTransferSheet({ visible, onClose, ledger, members = [], onTransfer, t }) {
  // rows = every member with a ledger entry, plus the pool if it holds credits.
  const rows = useMemo(() => {
    const list = members.map((m) => ({ ...m, remaining: memberRemaining(ledger?.members?.[m.id]) }));
    const poolLeft = memberRemaining(ledger?.members?.[FAMILY_POOL_ID]);
    if (poolLeft > 0) list.push({ ...POOL, remaining: poolLeft });
    return list;
  }, [members, ledger]);

  const [fromId, setFromId] = useState(null);
  const [toId, setToId] = useState(null);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const reset = () => { setFromId(null); setToId(null); setAmount(''); setError(''); setDone(''); };
  const close = () => { reset(); onClose(); };

  const submit = () => {
    setError(''); setDone('');
    const n = parseInt(amount, 10);
    const res = onTransfer?.(fromId, toId, n);
    if (!res) return;
    if (res.ok) {
      const fromName = rows.find((r) => r.id === fromId)?.name || 'member';
      const toName = rows.find((r) => r.id === toId)?.name || 'member';
      setDone(`Moved ${n} scan${n === 1 ? '' : 's'} from ${fromName} to ${toName}.`);
      setFromId(null); setToId(null); setAmount('');
    } else {
      setError(res.reason || 'Transfer could not be completed.');
    }
  };

  const Picker = ({ label, selectedId, onPick, excludeId }) => (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontFamily: t.sans, fontSize: 12.5, fontWeight: '800', color: t.ink2, marginBottom: 7 }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {rows.filter((r) => r.id !== excludeId).map((r) => {
          const on = selectedId === r.id;
          return (
            <Pressable key={r.id} onPress={() => onPick(r.id)} accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999,
                backgroundColor: on ? t.accent : t.surfaceWarm, borderWidth: 1,
                borderColor: on ? t.accent : t.line }}>
              <Text style={{ fontFamily: t.sans, fontSize: 13, fontWeight: '800',
                color: on ? t.onAccent : t.ink }}>
                {r.name.split(' ')[0]} · {r.remaining}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={close}>
      <Pressable onPress={close} style={{ flex: 1, backgroundColor: 'rgba(20,24,28,0.34)', justifyContent: 'flex-end' }}>
        <Pressable onPress={() => {}} style={{ backgroundColor: t.surface, borderTopLeftRadius: 22,
          borderTopRightRadius: 22, padding: 20, paddingBottom: 30, borderWidth: 1, borderColor: t.line }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontFamily: t.serif, fontSize: 21, fontWeight: '600', color: t.ink }}>
              Move scans
            </Text>
            <Pressable onPress={close} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
              <Text style={{ fontFamily: t.sans, fontSize: 14, fontWeight: '900', color: t.ink3 }}>Close</Text>
            </Pressable>
          </View>

          <Text style={{ fontFamily: t.sans, fontSize: 13, color: t.ink2, lineHeight: 19, marginBottom: 14 }}>
            Give a family member some of your unused scans this month. The number next to each name is what they have left.
          </Text>

          <Picker label="From" selectedId={fromId} onPick={(id) => { setFromId(id); setError(''); setDone(''); }} excludeId={toId} />
          <Picker label="To" selectedId={toId} onPick={(id) => { setToId(id); setError(''); setDone(''); }} excludeId={fromId} />

          <Text style={{ fontFamily: t.sans, fontSize: 12.5, fontWeight: '800', color: t.ink2, marginBottom: 7 }}>
            How many
          </Text>
          <TextInput value={amount} onChangeText={(v) => { setAmount(v.replace(/[^0-9]/g, '')); setError(''); setDone(''); }}
            keyboardType="number-pad" placeholder="0" placeholderTextColor={t.ink3}
            accessibilityLabel="Number of scans to move"
            style={{ backgroundColor: t.surfaceWarm, borderRadius: 12, borderWidth: 1, borderColor: t.line,
              paddingHorizontal: 14, height: 48, fontFamily: t.sans, fontSize: 16, color: t.ink }} />

          {error ? (
            <Text style={{ fontFamily: t.sans, fontSize: 12.5, color: t.allergen?.label || '#B23A48', marginTop: 10 }}>
              {error}
            </Text>
          ) : null}
          {done ? (
            <Text style={{ fontFamily: t.sans, fontSize: 12.5, color: t.accentDeep, marginTop: 10 }}>
              {done}
            </Text>
          ) : null}

          <Pressable onPress={submit} disabled={!fromId || !toId || !amount}
            accessibilityRole="button" accessibilityState={{ disabled: !fromId || !toId || !amount }}
            style={{ minHeight: 48, borderRadius: 14, marginTop: 16, alignItems: 'center', justifyContent: 'center',
              backgroundColor: (!fromId || !toId || !amount) ? t.lineSoft : t.accent }}>
            <Text style={{ fontFamily: t.sans, fontSize: 15, fontWeight: '900',
              color: (!fromId || !toId || !amount) ? t.ink3 : t.onAccent }}>
              Move scans
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
