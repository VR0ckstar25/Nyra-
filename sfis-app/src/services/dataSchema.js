// dataSchema.js — runtime validation + versioned migration for stored / synced data.
// JS app, so "typed schemas" = runtime shape validation at the trust boundary
// (corrupted local stores, hostile cloud payloads). Pure + node-testable; no RN imports.
//
// Two jobs:
//   1. validate(kind, raw) → { ok, value, errors } — sanitises and reports what was wrong
//      (errors feed monitoring; value is always safe to use even when ok=false).
//   2. migrateStored(blob) → upgrades an old persisted { schemaVersion, ... } shape to
//      CURRENT via an ordered migration registry, so model changes never brick a device.

const { normalizeCommercial } = require('./commercialModel.js');

const SCHEMA_VERSION = 3; // keep in lockstep with localDataStore.LOCAL_SCHEMA_VERSION

const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const arr = (x) => (Array.isArray(x) ? x : []);
const str = (x, d = '') => (typeof x === 'string' ? x : d);

const WATCHLIST_CAP = 8;
const FAMILY_CAP = 4; // members besides self (5 profiles total)

// ── validators: always return a SAFE value, plus errors describing what was dropped ──
function validateWatchItem(raw) {
  const errors = [];
  if (!isObj(raw)) return { ok: false, value: null, errors: ['watch item not an object'] };
  const id = str(raw.id);
  if (!id) errors.push('watch item missing id');
  const value = { id, severity: str(raw.severity, 'Flag it') };
  return { ok: errors.length === 0 && !!id, value: id ? value : null, errors };
}

function validateProfile(raw) {
  const errors = [];
  if (!isObj(raw)) return { ok: false, value: null, errors: ['profile not an object'] };
  const items = [];
  const seen = new Set();
  arr(raw.items).forEach((it) => {
    const r = validateWatchItem(it);
    if (!r.value) { errors.push(...r.errors); return; }
    if (seen.has(r.value.id)) { errors.push(`duplicate watch id ${r.value.id}`); return; }
    seen.add(r.value.id);
    items.push(r.value);
  });
  if (items.length > WATCHLIST_CAP) { errors.push(`watchlist over cap (${items.length}>${WATCHLIST_CAP})`); items.length = WATCHLIST_CAP; }
  const members = arr(raw.familyMembers).filter(isObj).slice(0, FAMILY_CAP).map((m) => ({
    id: str(m.id) || undefined, name: str(m.name, 'Family member'), child: !!m.child,
    watched: arr(m.watched).filter(isObj), addedAt: str(m.addedAt) || undefined,
  }));
  const value = { name: str(raw.name, 'You'), items, familyMembers: members };
  return { ok: errors.length === 0, value, errors };
}

function validateScan(raw) {
  const errors = [];
  if (!isObj(raw)) return { ok: false, value: null, errors: ['scan not an object'] };
  if (!raw.id) errors.push('scan missing id');
  const value = {
    id: str(raw.id) || null,
    savedAt: str(raw.savedAt) || null,
    source: str(raw.source, 'manual'),
    product: isObj(raw.product) ? raw.product : {},
    findings: arr(raw.findings),
    unverified: arr(raw.unverified),
    ocr: isObj(raw.ocr) ? raw.ocr : null,
    image: isObj(raw.image) ? raw.image : null,
  };
  return { ok: !!value.id && errors.length === 0, value, errors };
}

function validateFeedback(raw) {
  const errors = [];
  if (!isObj(raw)) return { ok: false, value: null, errors: ['feedback not an object'] };
  if (!raw.id) errors.push('feedback missing id');
  const value = {
    id: str(raw.id) || null,
    label: str(raw.label),
    category: str(raw.category, 'result_feedback'),
    createdAt: str(raw.createdAt) || null,
    savedScanId: raw.savedScanId == null ? null : str(raw.savedScanId),
  };
  return { ok: !!value.id && errors.length === 0, value, errors };
}

function validateCloudSnapshot(raw) {
  const errors = [];
  const src = isObj(raw) ? raw : {};
  const profile = src.profile == null ? null : validateProfile(src.profile);
  // keep only entries that validated to a real id (a malformed {} yields a safe value
  // object with id:null — that must NOT survive into the snapshot).
  const scans = arr(src.scans).map(validateScan).filter((r) => r.value && r.value.id);
  const feedback = arr(src.feedback).map(validateFeedback).filter((r) => r.value && r.value.id);
  [profile, ...scans, ...feedback].forEach((r) => r && r.errors && errors.push(...r.errors));
  return {
    ok: errors.length === 0,
    value: { profile: profile ? profile.value : null, scans: scans.map((r) => r.value), feedback: feedback.map((r) => r.value) },
    errors,
  };
}

function validateCommercial(raw) {
  // commercialModel already hard-normalises (unknown plan → free); wrap it for a uniform shape.
  return { ok: true, value: normalizeCommercial(raw), errors: [] };
}

const VALIDATORS = { profile: validateProfile, scan: validateScan, feedback: validateFeedback, cloudSnapshot: validateCloudSnapshot, commercial: validateCommercial };
function validate(kind, raw) {
  const fn = VALIDATORS[kind];
  if (!fn) return { ok: false, value: null, errors: [`unknown schema kind: ${kind}`] };
  return fn(raw);
}

// ── migration runner ────────────────────────────────────────────────────────
// Ordered transforms from version N to N+1. Add an entry when the model changes;
// nothing else needs to know about old shapes. Unknown/missing version → treat as 1.
const MIGRATIONS = {
  // 1 → 2: scans gained an explicit `source`; default legacy scans to 'manual'.
  2: (data) => ({ ...data, scans: arr(data.scans).map((s) => (isObj(s) ? { source: 'manual', ...s } : s)) }),
  // 2 → 3: family members may lack `addedAt`; leave undefined (UI handles it). Identity-safe.
  3: (data) => data,
};

function migrateStored(blob) {
  if (!isObj(blob)) return { schemaVersion: SCHEMA_VERSION, data: {}, migrated: false, from: 0 };
  let from = Number.isInteger(blob.schemaVersion) ? blob.schemaVersion : 1;
  let data = isObj(blob.data) ? blob.data : blob;
  const start = from;
  while (from < SCHEMA_VERSION) {
    const step = MIGRATIONS[from + 1];
    if (step) data = step(data);
    from += 1;
  }
  return { schemaVersion: SCHEMA_VERSION, data, migrated: start < SCHEMA_VERSION, from: start };
}

module.exports = {
  SCHEMA_VERSION, WATCHLIST_CAP, FAMILY_CAP,
  validate, validateProfile, validateScan, validateFeedback, validateCloudSnapshot, validateCommercial,
  migrateStored,
};
