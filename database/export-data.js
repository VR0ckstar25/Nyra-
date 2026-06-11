#!/usr/bin/env node
// export-data.js — single source of truth → RN data export.
// Reads sfis_ingredients.db and writes ../sfis-app/src/data/allergens.json
// (the shape the production matcher consumes: { version, note, terms, opaque, parents }).
//
// Usage:  node database/export-data.js
// Requires the sqlite3 CLI (PATH, or $SQLITE, or the Android platform-tools copy).
// This script is the ONLY sanctioned way to regenerate the export — never hand-edit
// allergens.json (that's what caused the cheese/butter/cream DB↔JSON drift).

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DB = path.join(__dirname, 'sfis_ingredients.db');
const OUT = path.join(__dirname, '..', 'sfis-app', 'src', 'data', 'allergens.json');

function findSqlite() {
  const candidates = [
    process.env.SQLITE,
    'sqlite3',
    path.join(process.env.HOME || '', 'Library/Android/sdk/platform-tools/sqlite3'),
    '/usr/bin/sqlite3', '/opt/homebrew/bin/sqlite3',
  ].filter(Boolean);
  for (const c of candidates) {
    try { execFileSync(c, ['--version'], { stdio: 'ignore' }); return c; } catch (e) { /* next */ }
  }
  throw new Error('sqlite3 CLI not found. Set $SQLITE to its path.');
}
const SQLITE = findSqlite();
const q = (sql) => JSON.parse(execFileSync(SQLITE, ['-json', DB, sql], { encoding: 'utf8' }) || '[]');

const CAT = { ALLERGEN: 'allergen', INTOLERANCE: 'intolerance', DIETARY_PREFERENCE: 'dietary', GOAL: 'goal' };

const synRows = q(`SELECT s.normalized_term AS term, s.term AS display, s.parent_id AS parent,
    p.common_name AS parentCommon, p.domain AS domain,
    COALESCE(s.match_class,'DERIVED') AS matchClass, s.cross_note AS note
  FROM synonyms s JOIN parents p ON p.parent_id = s.parent_id
  ORDER BY p.domain, s.parent_id, s.term;`);

const parentRows = q(`SELECT parent_id AS id, common_name AS common, domain,
    COALESCE(regulatory_major_allergen,0) AS major, COALESCE(technical_name,'') AS technical
  FROM parents ORDER BY domain, parent_id;`);
const opaqueRows = q(`SELECT DISTINCT normalized_term AS term FROM opaque_terms WHERE normalized_term IS NOT NULL ORDER BY term;`);
const metaRows = q(`SELECT key, value FROM db_metadata;`);
const meta = Object.fromEntries(metaRows.map((r) => [r.key, r.value]));

// Dedupe by (parent, normalized term) — duplicates across seed files otherwise leak
// into the app as "Butter, Butter" aliases. Warn so the seed-level root cause stays visible.
const seen = new Set(); const dupes = [];
const terms = [];
synRows.forEach((r) => {
  const k = `${r.parent}|${r.term}`;
  if (seen.has(k)) { dupes.push(k); return; }
  seen.add(k);
  terms.push({ term: r.term, display: r.display, parent: r.parent, parentCommon: r.parentCommon,
    cat: CAT[r.domain] || 'allergen', matchClass: r.matchClass, note: r.note || null });
});
if (dupes.length) console.warn(`WARN: ${dupes.length} duplicate synonym rows skipped (fix the seeds): ${dupes.join(', ')}`);

// ── Template info cards ──────────────────────────────────────────────────────
// Standard 2-sentence pattern with DB-substituted facts (founder decision: one
// template, not hand-written unique copy). Purely descriptive — no advice, no
// verdicts. Replaced later by validated content-library text per information_cards.
// Wording notes (founder feedback 2026-06-11): don't headline "Big 9" — not every
// allergen we track is one, and the badge reads as ranking. No "trigger" — clinical
// and alarming. Tone: warm, factual, validating; never advice, never a verdict.
// Phrasings are chosen to stay grammatical for singular AND plural names
// ("Peanuts", "Milk and Dairy", "Sulfites").
function infoFor(p, hiddenNames) {
  const names = hiddenNames.slice(0, 3);
  const nameClause = names.length >= 2
    ? `On labels it can also show up as ${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}.`
    : (names.length === 1
      ? `On labels it can also show up as ${names[0]}.`
      : `We're still mapping the other names it can hide behind.`);
  if (p.domain === 'ALLERGEN') {
    const status = p.major
      ? `U.S. food labels are required to declare ${p.common.toLowerCase()} whenever it's an ingredient.`
      : `U.S. labels aren't required to call out ${p.common.toLowerCase()}, so it can be easy to miss in an ingredient list.`;
    return `${status} ${nameClause}`;
  }
  if (p.domain === 'INTOLERANCE') {
    return `Many people find ${p.common.toLowerCase()} hard on their body. It isn't an allergy, but the discomfort is real — so we watch for it just as carefully. ${nameClause}`;
  }
  return `We check every label against this preference for you. ${nameClause}`;
}

const parents = {};
parentRows.forEach((r) => {
  const hidden = terms
    .filter((t) => t.parent === r.id && (t.matchClass === 'DERIVED' || t.matchClass === 'DIRECT'))
    .map((t) => t.display)
    .filter((d) => d.toLowerCase() !== r.common.toLowerCase());
  parents[r.id] = { common: r.common, cat: CAT[r.domain] || 'allergen', info: infoFor(r, hidden) };
});
const opaque = opaqueRows.map((r) => r.term);

const out = {
  version: meta.seed_version || 'unversioned-draft',
  generatedAt: new Date().toISOString().slice(0, 10), // = the app's "data current as of"
  validationState: meta.validation_state || 'PRE_VALIDATION',
  note: 'DRAFT data — not validated; prototype only. Generated by database/export-data.js — do not hand-edit. Info text is template-generated; pending content library.',
  terms, opaque, parents,
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
console.log(`wrote ${OUT}\n  terms=${terms.length}  parents=${Object.keys(parents).length}  opaque=${opaque.length}  version=${out.version} asOf=${out.generatedAt}  (sqlite: ${SQLITE})`);
