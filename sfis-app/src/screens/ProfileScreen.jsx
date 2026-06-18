import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Card, Overline, Pill, ProgressBar, ScreenIntro, SwitchPill } from '../components/DesignPrimitives';
import { MemberSearchSheet } from '../components/MemberSearchSheet';
import { FamilyTransferSheet } from '../components/FamilyTransferSheet';
import { profileIds, profileItems } from '../profile/profileModel';
import { FAMILY_POOL_ID, isFamilyPlan, memberRemaining, normalizeCommercial, planFor } from '../services/commercialModel';

export function ProfileScreen({
  profile = null,
  scans = [],
  feedbackCount = 0,
  productIssueCount = 0,
  productReviewQueue = [],
  settings = {},
  authUser = null,
  authReady = false,
  preproductionAuthReady = false,
  syncStatus = '',
  commercial = null,
  onAppearance,
  onEditProfile,
  onClearLocalData,
  onToggleSaveLabelImages,
  onSignIn,
  onSignOut,
  onAddMember,
  onRemoveMember,
  familyLedger = null,
  onTransferScans,
  onDesignPreview,
  onVisualConcept,
  onPlans,
  onReportIssue,
  onOpenReviewItem,
  onSecurityBackup,
}) {
  const { theme: t } = useTheme();
  const selected = useMemo(() => profileItems(profile), [profile]);
  const watchedIds = profileIds(profile);
  const memberCount = 1 + (profile?.familyMembers?.length || 0);
  const plan = planFor(normalizeCommercial(commercial).planId);
  const onFamilyPlan = isFamilyPlan(normalizeCommercial(commercial).planId);
  const [memberSearch, setMemberSearch] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const ledgerSelfPlusMembers = [{ id: 'self', name: profile?.name || 'You', child: false },
    ...((profile?.familyMembers || []).map((m) => ({ id: m.id, name: m.name, child: !!m.child })))];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 18, paddingBottom: 28 }}>
      <ScreenIntro title="Profile" sub="Your saved rules, severity levels, and local scan history." t={t} />

      <Card t={t} style={{ marginBottom: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: t.serif, fontSize: 21, fontWeight: '600', color: t.ink }}>
              {profile?.name || 'You'}
            </Text>
            <Text style={{ fontFamily: t.sans, fontSize: 13.5, color: t.ink2, lineHeight: 19, marginTop: 3 }}>
              {memberCount} of 5 family profiles used. A child counts as one profile.
            </Text>
          </View>
          <Pill t={t}>Self</Pill>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
          {selected.slice(0, 10).map((item) => (
            <Pill key={`${item.id}-${item.severity}`} t={t} palette={item.palette}>
              {item.label}: {item.severity}
            </Pill>
          ))}
          {selected.length > 10 ? <Pill t={t}>+{selected.length - 10} more</Pill> : null}
          {selected.length === 0 ? (
            <Text style={{ fontFamily: t.sans, fontSize: 13.5, color: t.ink2 }}>No profile selections yet.</Text>
          ) : null}
        </View>

        <Pressable onPress={onEditProfile} accessibilityRole="button" style={{ marginTop: 15, minHeight: 44, borderRadius: 12,
          backgroundColor: t.surfaceWarm, borderWidth: 1, borderColor: t.line, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: t.sans, fontSize: 14, fontWeight: '800', color: t.accentDeep }}>
            Edit watched items
          </Text>
        </Pressable>
      </Card>

      <Card t={t} style={{ marginBottom: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontFamily: t.sans, fontSize: 15, fontWeight: '800', color: t.ink }}>
              Account sync
            </Text>
            <Text style={{ fontFamily: t.sans, fontSize: 13, color: t.ink2, lineHeight: 19, marginTop: 4 }}>
              {authUser?.email ? authUser.email : (authReady ? 'Not signed in' : preproductionAuthReady ? 'Demo sign-in available' : 'Firebase keys not set')}
            </Text>
            <Text style={{ fontFamily: t.mono, fontSize: 11.5, color: t.ink3, lineHeight: 17, marginTop: 7 }}>
              {syncStatus || 'Local mode'}
            </Text>
          </View>
          <Pressable onPress={authUser ? onSignOut : onSignIn} accessibilityRole="button"
            style={{ minHeight: 38, borderRadius: 12, paddingHorizontal: 13,
              backgroundColor: t.surfaceWarm, borderWidth: 1, borderColor: t.line,
              alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: t.sans, fontSize: 13.5, fontWeight: '800', color: t.accentDeep }}>
              {authUser ? 'Sign out' : 'Sign in'}
            </Text>
          </Pressable>
        </View>
      </Card>

      <Card t={t} style={{ marginBottom: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontFamily: t.sans, fontSize: 15, fontWeight: '800', color: t.ink }}>
            Family profiles
          </Text>
          <Text style={{ fontFamily: t.mono, fontSize: 12.5, color: t.ink2 }}>{5 - memberCount} left</Text>
        </View>
        {/* avatar row: self + the gray "+" circle (same size) — founder spec */}
        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
          <View style={{ alignItems: 'center', gap: 6 }}>
            <View style={{ width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center',
              backgroundColor: t.accentSoft, borderWidth: 1, borderColor: t.accent }}>
              <Text style={{ fontFamily: t.serif, fontSize: 23, fontWeight: '700', color: t.accentDeep }}>
                {(profile?.name || 'You')[0].toUpperCase()}
              </Text>
            </View>
            <Text style={{ fontFamily: t.sans, fontSize: 12.5, fontWeight: '700', color: t.ink2 }}>
              {profile?.name || 'You'}
            </Text>
          </View>
          {(profile?.familyMembers || []).map((m) => {
            const memberName = m.name || 'Family member';
            return (
            <View key={m.id || memberName} style={{ alignItems: 'center', gap: 6 }}>
              <View style={{ width: 58, height: 58, borderRadius: m.child ? 18 : 29, alignItems: 'center',
                justifyContent: 'center', backgroundColor: m.child ? '#E7D9C4' : t.accentSoft,
                borderWidth: 1, borderColor: t.line }}>
                <Text style={{ fontFamily: t.serif, fontSize: 23, fontWeight: '700',
                  color: m.child ? '#8A6B3D' : t.accentDeep }}>
                  {memberName[0]}
                </Text>
              </View>
              <Text style={{ fontFamily: t.sans, fontSize: 12.5, fontWeight: '700', color: t.ink2 }}>
                {memberName.split(' ')[0]}
              </Text>
              {m.addedAt ? (
                <Text style={{ fontFamily: t.mono, fontSize: 9.5, color: t.ink3 }}>
                  as of {String(m.addedAt).slice(0, 10)}
                </Text>
              ) : null}
              <Pressable onPress={() => onRemoveMember?.(m)} accessibilityRole="button" hitSlop={8}>
                <Text style={{ fontFamily: t.sans, fontSize: 11.5, fontWeight: '800', color: t.ink3 }}>
                  Remove
                </Text>
              </Pressable>
            </View>
          );})}
          <Pressable onPress={() => setMemberSearch(true)} accessibilityRole="button"
            accessibilityLabel="Add family members" style={{ alignItems: 'center', gap: 6 }}>
            <View style={{ width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center',
              backgroundColor: t.lineSoft, borderWidth: 1, borderColor: t.line }}>
              <Text style={{ fontSize: 26, fontWeight: '600', color: t.ink2, marginTop: -2 }}>+</Text>
            </View>
            <Text style={{ fontFamily: t.sans, fontSize: 12.5, fontWeight: '700', color: t.ink3 }}>
              Add members
            </Text>
          </Pressable>
        </View>
      </Card>

      <MemberSearchSheet visible={memberSearch} onClose={() => setMemberSearch(false)}
        members={profile?.familyMembers || []} onAdd={(m) => onAddMember?.(m)}
        capReached={memberCount >= 5} t={t} />

      {onFamilyPlan && familyLedger ? (
        <Card t={t} style={{ marginBottom: 18 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontFamily: t.sans, fontSize: 15, fontWeight: '800', color: t.ink }}>
              Family scans this month
            </Text>
            <Pressable onPress={() => setTransferOpen(true)} accessibilityRole="button"
              style={{ minHeight: 34, borderRadius: 999, paddingHorizontal: 13, backgroundColor: t.surfaceWarm,
                borderWidth: 1, borderColor: t.line, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: t.sans, fontSize: 13, fontWeight: '800', color: t.accentDeep }}>Move scans</Text>
            </Pressable>
          </View>
          {ledgerSelfPlusMembers.map((m) => (
            <View key={m.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}>
              <Text style={{ fontFamily: t.sans, fontSize: 13.5, color: t.ink }}>{m.name}</Text>
              <Text style={{ fontFamily: t.mono, fontSize: 12.5, color: t.ink2 }}>
                {memberRemaining(familyLedger.members?.[m.id])} left
              </Text>
            </View>
          ))}
          {memberRemaining(familyLedger.members?.[FAMILY_POOL_ID]) > 0 ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderTopWidth: 1, borderTopColor: t.lineSoft, marginTop: 4 }}>
              <Text style={{ fontFamily: t.sans, fontSize: 13.5, fontWeight: '700', color: t.ink2 }}>Shared pool</Text>
              <Text style={{ fontFamily: t.mono, fontSize: 12.5, color: t.ink2 }}>
                {memberRemaining(familyLedger.members?.[FAMILY_POOL_ID])} left
              </Text>
            </View>
          ) : null}
          <Text style={{ fontFamily: t.sans, fontSize: 12, color: t.ink3, lineHeight: 17, marginTop: 10 }}>
            Each member gets their own monthly scans. Move unused scans to whoever needs them; if someone leaves, their scans go to the shared pool.
          </Text>
        </Card>
      ) : null}

      <FamilyTransferSheet visible={transferOpen} onClose={() => setTransferOpen(false)}
        ledger={familyLedger} members={ledgerSelfPlusMembers} onTransfer={onTransferScans} t={t} />

      <Card t={t} style={{ marginBottom: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontFamily: t.sans, fontSize: 15, fontWeight: '800', color: t.ink }}>
            Saved scans
          </Text>
          <Text style={{ fontFamily: t.mono, fontSize: 12.5, color: t.ink2 }}>{scans.length} saved</Text>
        </View>
        <ProgressBar value={Math.min(scans.length, 6)} max={6} color={t.accent} t={t} />
        <Text style={{ fontFamily: t.sans, fontSize: 13, color: t.ink2, lineHeight: 19, marginTop: 11 }}>
          {watchedIds.length} watched item{watchedIds.length === 1 ? '' : 's'} active. {feedbackCount} feedback entr{feedbackCount === 1 ? 'y' : 'ies'} saved locally.
          {productIssueCount ? ` ${productIssueCount} product issue${productIssueCount === 1 ? '' : 's'} queued.` : ''}
        </Text>
      </Card>

      <Card t={t} style={{ marginBottom: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12,
          marginBottom: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: t.sans, fontSize: 15, fontWeight: '900', color: t.ink }}>
              Product review queue
            </Text>
            <Text style={{ fontFamily: t.sans, fontSize: 12.5, color: t.ink2, lineHeight: 18, marginTop: 2 }}>
              Wrong, unsure, and product issue reports for founder review.
            </Text>
          </View>
          <Pill t={t} palette={productReviewQueue.length ? 'goal' : 'accent'}>
            {productReviewQueue.length}
          </Pill>
        </View>
        {productReviewQueue.length ? (
          <View style={{ gap: 8 }}>
            {productReviewQueue.slice(0, 4).map((entry) => (
              <Pressable key={entry.id} onPress={() => onOpenReviewItem?.(entry)}
                accessibilityRole="button"
                style={{ borderRadius: 14, backgroundColor: t.surfaceWarm, borderWidth: 1,
                  borderColor: t.lineSoft, padding: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ fontFamily: t.sans, fontSize: 14.2,
                      fontWeight: '900', color: t.ink }}>
                      {entry.product?.name || 'General product review'}
                    </Text>
                    <Text style={{ fontFamily: t.sans, fontSize: 12.3, color: t.ink2,
                      lineHeight: 17, marginTop: 2 }}>
                      {entry.label || 'Review'} · {String(entry.createdAt || '').slice(0, 10) || 'Saved'}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: t.sans, fontSize: 12.5, fontWeight: '900', color: t.accentDeep }}>
                    {entry.savedScanId ? 'Open' : 'Saved'}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={{ fontFamily: t.sans, fontSize: 13, color: t.ink2, lineHeight: 19 }}>
            No reports yet. When a result is marked Wrong or Unsure, it appears here.
          </Text>
        )}
        <Pressable onPress={onReportIssue} accessibilityRole="button" style={{ marginTop: 12, minHeight: 42,
          borderRadius: 12, backgroundColor: t.surfaceWarm, borderWidth: 1, borderColor: t.line,
          alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: t.sans, fontSize: 13.5, fontWeight: '900', color: t.accentDeep }}>
            Log review request
          </Text>
        </Pressable>
      </Card>

      <SettingsGroup title="App" t={t}>
        <SettingRow label="Security, backup, offline" sub="App lock, cloud backup, local checkpoint, offline pack" value="Open" onPress={onSecurityBackup} t={t} />
        <SettingRow label="Plans & ads" sub="Free uses house messages; result screens stay ad-free" value={plan.label} onPress={onPlans} t={t} />
        <SettingRow label="New UI preview" sub="A richer Nyara home concept to test in-app" value="View" onPress={onDesignPreview} t={t} />
        <SettingRow label="Visual concept" sub="Bolder colors and scan-first outlook options" value="View" onPress={onVisualConcept} t={t} />
        <SettingRow label="Appearance" sub="Background and accent colors" value="Theme" onPress={onAppearance} t={t} />
        <SettingRow
          label="Save label photos"
          sub="Off by default. If off, captured label images are removed from this phone after 7 days."
          onPress={onToggleSaveLabelImages}
          right={<SwitchPill on={!!settings.saveLabelImages} onPress={onToggleSaveLabelImages} t={t} />}
          t={t}
        />
        <SettingRow label="Result child mode" sub="Available from each result screen" value="Result" t={t} />
        <SettingRow label="Clear local data" sub="Remove profile, scans, and feedback from this device" value="Clear" onPress={onClearLocalData} danger t={t} />
        <SettingRow label="Report a product issue" sub={`${productIssueCount} queued for review`} value="Report" onPress={onReportIssue} t={t} last />
      </SettingsGroup>
    </ScrollView>
  );
}

function SettingsGroup({ title, children, t }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Overline t={t}>{title}</Overline>
      <Card t={t} style={{ paddingVertical: 2, marginTop: 10 }}>
        {children}
      </Card>
    </View>
  );
}

function SettingRow({ label, sub, value, right, onPress, danger, t, last }) {
  const Container = onPress ? Pressable : View;
  const pressProps = onPress ? { onPress, accessibilityRole: 'button' } : {};

  return (
    <Container {...pressProps}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 58, paddingVertical: 10,
        borderBottomWidth: last ? 0 : 1, borderBottomColor: t.lineSoft }}>
      <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: t.surfaceWarm,
        borderWidth: 1, borderColor: t.line, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: danger ? t.amber : (onPress ? t.accent : t.ink3) }} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontFamily: t.sans, fontSize: 15, fontWeight: '700', color: t.ink }}>
          {label}
        </Text>
        {sub ? (
          <Text style={{ fontFamily: t.sans, fontSize: 12.5, color: t.ink3, lineHeight: 18, marginTop: 1 }}>
            {sub}
          </Text>
        ) : null}
      </View>
      {right || (
        <Text style={{ fontFamily: t.sans, fontSize: 13.5, fontWeight: '700',
          color: danger ? t.amber : t.accentDeep }}>
          {value || ''}
        </Text>
      )}
    </Container>
  );
}
