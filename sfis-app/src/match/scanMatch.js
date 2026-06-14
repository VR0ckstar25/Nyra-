// scanMatch.js — production matcher ported from the hardened reference engine.
// Pure JS: deterministic, offline, Node-testable, and Metro-compatible.
//
// Input: raw label text + selected profile ids + the bundled DB export.
// Selected ids may be parent ids ("milk", "almond") or sub-group ids
// ("allergen.milk", "allergen.treenut"). Output is ready for <ResultScreen/>.

const CAT_LABEL = {
  allergen: 'Allergen match',
  intolerance: 'Intolerance note',
  goal: 'May not align with your goals',
  dietary: "Doesn't fit your diet",
};

const DOMAIN_ORDER = ['allergen', 'intolerance', 'dietary', 'goal'];
const CONF = { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' };
const PRETTY = {
  'Milk and Dairy': 'Milk',
  Soybeans: 'Soy',
  'Tree Nuts': 'Tree nuts',
  'Crustacean Shellfish': 'Shellfish',
  'Mollusc Shellfish': 'Shellfish',
};

const TREE_NUT_PARENTS = new Set([
  'almond', 'walnut', 'cashew', 'pecan', 'pistachio',
  'hazelnut', 'brazil_nut', 'macadamia', 'pine_nut',
]);
const SHELLFISH_PARENTS = new Set(['crustacean', 'mollusc']);

const GROUPS = {
  milk: { id: 'allergen.milk', label: 'Milk and Dairy', cat: 'allergen' },
  egg: { id: 'allergen.egg', label: 'Eggs', cat: 'allergen' },
  wheat: { id: 'allergen.wheat', label: 'Wheat', cat: 'allergen' },
  soy: { id: 'allergen.soy', label: 'Soybeans', cat: 'allergen' },
  peanut: { id: 'allergen.peanut', label: 'Peanuts', cat: 'allergen' },
  fish: { id: 'allergen.fish', label: 'Fish', cat: 'allergen' },
  sesame: { id: 'allergen.sesame', label: 'Sesame', cat: 'allergen' },
  lactose: { id: 'intol.lactose', label: 'Lactose', cat: 'intolerance' },
  gluten: { id: 'intol.gluten', label: 'Gluten', cat: 'intolerance' },
  fructose: { id: 'intol.fructose', label: 'Fructose', cat: 'intolerance' },
  histamine: { id: 'intol.histamine', label: 'Histamine', cat: 'intolerance' },
  sulfites: { id: 'intol.sulfites', label: 'Sulfites', cat: 'intolerance' },
  caffeine: { id: 'intol.caffeine', label: 'Caffeine', cat: 'intolerance' },
  sweeteners: { id: 'intol.sweeteners', label: 'Artificial Sweeteners', cat: 'intolerance' },
  fodmaps: { id: 'intol.fodmaps', label: 'FODMAPs', cat: 'intolerance' },
};

for (const parent of TREE_NUT_PARENTS) GROUPS[parent] = { id: 'allergen.treenut', label: 'Tree Nuts', cat: 'allergen' };
for (const parent of SHELLFISH_PARENTS) GROUPS[parent] = { id: 'allergen.shellfish', label: 'Shellfish', cat: 'allergen' };

const SUBGROUPS = Object.values(GROUPS).reduce((acc, g) => {
  acc[g.id] = g;
  return acc;
}, {});

const PANTRY = new Set([
  'salt', 'sea salt', 'water', 'sugar', 'rice', 'carrot', 'ascorbic acid',
  'baking soda', 'baking powder', 'vanilla', 'vanilla extract', 'yeast',
  'citric acid', 'canola oil', 'sunflower oil', 'palm oil', 'maltodextrin',
]);

const ADVISORY_RE = /\b(?:may (?:also )?contain|may be present|contains? traces|traces of|made (?:in|on)|manufactured (?:in|on)|processed (?:in|on)|produced (?:in|on)|prepared (?:in|on)|packa?ged (?:in|on|where)|in (?:a|the) (?:facility|kitchen|plant|production line)|on (?:shared )?equipment|shared (?:equipment|line|facility)|(?:also )?(?:handles|processes)|not suitable for|cannot guarantee)\b/i;
// NOTE: bare "no" is deliberately NOT an opener — "no sugar added, peanuts" must
// still flag peanuts. Only explicit free-from claims free the allergens they name.
const FREE_OPEN_RE = /\b(?:free from(?: the following)?|free of|does ?n.?t contain|does not contain|contains no)\b/i;
const INLINE_FREE_RE = /\b([a-z][a-z]+)[- ]free\b/ig;
const ZERO_RE = /\b0\s*(?:g|mg)\s+([a-z][a-z]+)\b/ig;
const CONTAINS_RE = /\b(?:contains?|ingredients?|allergens?)\b/i;

const GOAL_KW = [
  { id: 'goal.less_sugar', cat: 'goal', common: 'Added sugars', kws: ['sugar', 'cane sugar', 'glucose', 'glucose syrup', 'corn syrup', 'fructose', 'sucrose', 'dextrose', 'honey', 'molasses', 'syrup'] },
  { id: 'goal.less_sodium', cat: 'goal', common: 'Sodium', kws: ['salt', 'sodium', 'monosodium glutamate', 'msg'] },
  { id: 'goal.less_sat_fat', cat: 'goal', common: 'Saturated fat', kws: ['palm oil', 'butter', 'coconut oil', 'lard', 'palm kernel oil'] },
  { id: 'goal.avoid_dates', cat: 'goal', common: 'Dates', kws: ['date', 'dates', 'date paste', 'date syrup', 'date sugar', 'medjool', 'deglet noor'] },
];
const DIET_KW = [
  { id: 'diet.vegan', cat: 'dietary', common: 'Animal-derived', kws: ['milk', 'butter', 'whey', 'casein', 'egg', 'eggs', 'honey', 'gelatin', 'gelatine', 'lard', 'fish', 'anchovy', 'anchovies', 'meat', 'beef', 'chicken', 'pork'] },
  { id: 'diet.vegetarian', cat: 'dietary', common: 'Meat or fish', kws: ['gelatin', 'gelatine', 'lard', 'fish', 'anchovy', 'meat', 'beef', 'chicken', 'pork', 'rennet'] },
  { id: 'diet.pescatarian', cat: 'dietary', common: 'Meat or poultry', kws: ['gelatin', 'gelatine', 'lard', 'meat', 'beef', 'chicken', 'pork', 'ham', 'bacon', 'lamb', 'mutton', 'veal', 'turkey', 'duck', 'goose'] },
  { id: 'diet.no_red_meat', cat: 'dietary', common: 'Red meat', kws: ['beef', 'lamb', 'mutton', 'veal', 'bison', 'venison'] },
  { id: 'diet.no_pork', cat: 'dietary', common: 'Pork', kws: ['pork', 'ham', 'bacon', 'lard', 'prosciutto', 'pepperoni', 'salami'] },
  { id: 'diet.no_poultry', cat: 'dietary', common: 'Poultry', kws: ['chicken', 'turkey', 'duck', 'goose'] },
];

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[‘’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function displayName(s) {
  return PRETTY[s] || s;
}

function titleCase(s) {
  return String(s).replace(/\b\w/g, (c) => c.toUpperCase());
}

function stem(w) {
  if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.length > 4 && w.endsWith('ses')) return w.slice(0, -2);
  if (w.length > 4 && w.endsWith('es') && /(x|s|ch|sh)es$/.test(w)) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}

function ocrKey(s) {
  return norm(s)
    .replace(/0/g, 'o')
    .replace(/[1!|]/g, 'l')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/rn/g, 'm')
    .replace(/\s+/g, '');
}

function wEq(a, b) {
  return a === b || stem(a) === stem(b);
}

function containsWords(tokenWords, termWords) {
  if (!termWords.length || termWords.length > tokenWords.length) return false;
  for (let i = 0; i + termWords.length <= tokenWords.length; i++) {
    let ok = true;
    for (let j = 0; j < termWords.length; j++) {
      if (!wEq(tokenWords[i + j], termWords[j])) { ok = false; break; }
    }
    if (ok) return true;
  }
  return false;
}

function compactMatch(token, term) {
  const tc = token.replace(/\s+/g, '');
  const ec = term.replace(/\s+/g, '');
  if (ec.length < 4) return false;
  if (term.includes(' ')) return tc.includes(ec);
  return tc === ec;
}

function fuzzyMatch(token, term) {
  const tk = ocrKey(token);
  const ek = ocrKey(term);
  if (ek.length < 3) return false;
  if (tk === ek) return true;
  if (ek.length < 4) return false;
  if (term.includes(' ') && tk.includes(ek)) return true;
  if (!term.includes(' ') && tk.length === ek.length) return editDistanceLe1(tk, ek);
  return false;
}

function editDistanceLe1(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else { i++; j++; }
  }
  return edits + (i < a.length || j < b.length ? 1 : 0) <= 1;
}

function parentGroup(parent) {
  return GROUPS[parent] || { id: parent, label: parent, cat: 'allergen' };
}

function selectedIdsFrom(input) {
  if (!input) return [];
  if (typeof input === 'string') return [input];
  if (!Array.isArray(input)) return [];
  return input.map((item) => (typeof item === 'string' ? item : item?.id)).filter(Boolean);
}

function makeWatchSet(ids, data) {
  const selected = new Set(ids || []);
  const groups = new Set();
  const parents = new Set();
  selected.forEach((id) => {
    if (SUBGROUPS[id]) groups.add(id);
    if (data.parents && data.parents[id]) {
      parents.add(id);
      groups.add(parentGroup(id).id);
    }
  });
  if (groups.has('allergen.treenut')) TREE_NUT_PARENTS.forEach((p) => parents.add(p));
  if (groups.has('allergen.shellfish')) SHELLFISH_PARENTS.forEach((p) => parents.add(p));
  return { selected, groups, parents };
}

function profileWatchEntries(profile) {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) return [];
  // Attribution keys MUST be unique: downstream collects profiles into a Map by id,
  // so a duplicate/colliding id silently drops a member from the result (review #10).
  const used = new Set();
  const uniqueId = (raw) => {
    let id = raw;
    let n = 1;
    while (used.has(id)) { id = `${raw}#${n++}`; }
    used.add(id);
    return id;
  };
  const entries = [{
    id: uniqueId(profile.id || 'self'),
    name: profile.name || 'You',
    child: profile.type === 'child' || !!profile.child,
    ids: selectedIdsFrom(profile.items || profile.watched),
  }];
  (profile.familyMembers || []).forEach((member, index) => {
    entries.push({
      id: uniqueId(member.id || `member-${index}`),
      name: member.name || 'Family member',
      child: member.type === 'child' || !!member.child,
      ids: selectedIdsFrom(member.watched || member.items),
    });
  });
  return entries;
}

function watchFromProfile(profile, data) {
  if (Array.isArray(profile) || typeof profile === 'string') {
    return { ...makeWatchSet(selectedIdsFrom(profile), data), profiles: [] };
  }

  const union = makeWatchSet([], data);
  const profiles = profileWatchEntries(profile).map((entry) => ({
    id: entry.id,
    name: entry.name,
    child: entry.child,
    watch: makeWatchSet(entry.ids, data),
  }));

  profiles.forEach((entry) => {
    entry.watch.selected.forEach((id) => union.selected.add(id));
    entry.watch.groups.forEach((id) => union.groups.add(id));
    entry.watch.parents.forEach((id) => union.parents.add(id));
  });

  return { ...union, profiles };
}

function buildIndex(data) {
  const terms = [];
  const add = (row) => {
    const n = norm(row.term);
    if (!n) return;
    const parentMeta = data.parents[row.parent] || {};
    const group = parentGroup(row.parent);
    terms.push({
      n,
      w: n.split(' '),
      compact: n.replace(/\s+/g, ''),
      ocr: ocrKey(n),
      display: row.display || titleCase(n),
      parent: row.parent,
      groupId: group.id,
      groupLabel: group.label,
      parentCommon: row.parentCommon || parentMeta.common || titleCase(row.parent),
      cat: row.cat || parentMeta.cat || group.cat,
      matchClass: row.matchClass || 'DIRECT',
      note: row.note || null,
    });
  };
  (data.terms || []).forEach(add);

  // Group-level terms make generic PAL clauses like "not suitable for nut allergy
  // sufferers" distributable without inventing a specific nut.
  [
    { term: 'tree nut', parent: 'allergen.treenut', groupId: 'allergen.treenut', groupLabel: 'Tree Nuts', cat: 'allergen' },
    { term: 'tree nuts', parent: 'allergen.treenut', groupId: 'allergen.treenut', groupLabel: 'Tree Nuts', cat: 'allergen' },
    { term: 'nuts', parent: 'allergen.treenut', groupId: 'allergen.treenut', groupLabel: 'Tree Nuts', cat: 'allergen' },
    { term: 'dairy', parent: 'milk', groupId: 'allergen.milk', groupLabel: 'Milk and Dairy', cat: 'allergen' },
    { term: 'shellfish', parent: 'allergen.shellfish', groupId: 'allergen.shellfish', groupLabel: 'Shellfish', cat: 'allergen' },
  ].forEach((row) => {
    const n = norm(row.term);
    terms.push({
      n,
      w: n.split(' '),
      compact: n.replace(/\s+/g, ''),
      ocr: ocrKey(n),
      display: titleCase(n),
      parent: row.parent,
      groupId: row.groupId,
      groupLabel: row.groupLabel,
      parentCommon: row.groupLabel,
      cat: row.cat,
      matchClass: 'DIRECT',
      note: null,
      synthetic: true,
    });
  });

  const byParentTerms = {};
  terms.forEach((t) => {
    if (!t.synthetic) (byParentTerms[t.parent] = byParentTerms[t.parent] || []).push(t.display);
  });

  // template "what it is" text per parent, generated at export time from DB fields
  const parentInfo = {};
  Object.entries(data.parents || {}).forEach(([id, p]) => { if (p.info) parentInfo[id] = p.info; });

  return { terms, opaque: new Set((data.opaque || []).map(norm)), byParentTerms, parentInfo };
}

function plantDairyFalsePositive(token, term, parent) {
  const n = norm(token);
  const t = norm(term);
  // "Sunflower/canola/rapeseed lecithin" names a non-soy, non-egg source — the
  // generic AMBIGUOUS 'lecithin' terms must not fire on it (review finding).
  if ((parent === 'soy' || parent === 'egg')
    && /\b(?:sunflower|canola|rapeseed|rice)\s+lecithin\b/.test(n)
    && /lecithin/.test(t)) return true;
  if (parent !== 'milk') return false;
  const plantPrefix = /\b(?:coconut|almond|cashew|oat|soy|soya|rice|hemp|pea|macadamia|hazelnut|walnut|pistachio|peanut|cocoa|cacao|shea|sunflower|sesame)\s+(?:milk|butter|cream|cheese)\b/.test(n);
  const nonDairy = /\b(?:vegan|plant based|non dairy|dairy free)\b.*\b(?:milk|butter|cream|cheese)\b/.test(n);
  if ((plantPrefix || nonDairy) && ['milk', 'butter', 'cream', 'cheese', 'dairy'].includes(t)) return true;
  if (/\bcream\s+(?:of\s+)?tartar\b/.test(n) && t === 'cream') return true;
  return false;
}

function tokenMatchesTerm(token, term) {
  const n = norm(token);
  if (!n) return false;
  const words = n.split(' ');
  if (containsWords(words, term.w)) return true;
  if (compactMatch(n, term.n)) return true;
  return fuzzyMatch(n, term.n);
}

function graphMatches(raw, index) {
  const best = {};
  const rank = { DIRECT: 0, DERIVED: 1, POSSIBLE: 2, AMBIGUOUS: 3 };
  index.terms.forEach((t) => {
    if (!tokenMatchesTerm(raw, t)) return;
    if (plantDairyFalsePositive(raw, t.n, t.parent)) return;
    const key = t.parent + '|' + t.groupId;
    const cur = best[key];
    if (!cur || t.w.length > cur.w.length || (t.w.length === cur.w.length && rank[t.matchClass] < rank[cur.matchClass])) {
      best[key] = t;
    }
  });
  return Object.values(best);
}

function expandTokens(text) {
  const out = [], inner = [];
  const base = text.replace(/\(([^()]*)\)/g, (m, g) => { inner.push(g); return ' '; });
  [base].concat(inner).forEach((s) => {
    const r = s.replace(/^[\s:;.\-–—•*]+|[\s:;.]+$/g, '').trim();
    if (r) out.push(r);
  });
  return out;
}

// A free-from claim frees ONLY the thing it literally names — a DIRECT match or
// the group's own name. "lactose-free" frees Lactose — NEVER the milk allergen,
// even though 'lactose' is a milk synonym: lactose-free dairy is full of milk
// protein and a milk-allergic user must still be warned (review-confirmed FN).
function markFree(txt, freeGroups, index) {
  const n = norm(txt);
  graphMatches(txt, index).forEach((m) => {
    const identity = m.matchClass === 'DIRECT'
      || n === norm(m.parentCommon) || n === norm(m.groupLabel)
      || wEq(n, norm(m.parentCommon)) || wEq(n, norm(m.groupLabel));
    if (identity) freeGroups.add(m.groupId);
  });
}

function isKnown(tok, index) {
  const n = norm(tok);
  return PANTRY.has(n) || index.opaque.has(n) || graphMatches(tok, index).length > 0;
}

// Plain-language basis for a match, by how it was determined. All entries are
// Anvara DRAFT data (pre independent validation), stated honestly per match.
const PROVENANCE_BASIS = {
  DIRECT: 'Matched an exact ingredient name on the label.',
  DERIVED: 'Matched a known alternate name for this ingredient.',
  POSSIBLE: 'This ingredient can sometimes contain it.',
  AMBIGUOUS: 'This term can refer to more than one source.',
  PAL: "From a precautionary 'may contain' statement.",
};
function provenanceFor(basisKey) {
  const basis = PROVENANCE_BASIS[basisKey] || PROVENANCE_BASIS.DIRECT;
  return `${basis} Anvara draft database — not independently validated yet.`;
}

// A diet/goal keyword is a marketing SLOGAN (not a present ingredient) only when a
// qualifier sits immediately beside it: "no sugar", "low sodium", "reduced fat",
// "sugar free", "fat free". Mere co-occurrence in a compound name does NOT qualify,
// so "free-range eggs", "low-sodium ham", "light brown sugar" still flag (review).
const GUARD_BEFORE = new Set(['no', 'low', 'less', 'reduced', 'zero', 'non']);
const GUARD_AFTER = new Set(['free']);
function negatedClaim(tokenWords, kwWords) {
  for (let i = 0; i + kwWords.length <= tokenWords.length; i++) {
    let ok = true;
    for (let j = 0; j < kwWords.length; j++) { if (!wEq(tokenWords[i + j], kwWords[j])) { ok = false; break; } }
    if (!ok) continue;
    const before = tokenWords[i - 1];
    const after = tokenWords[i + kwWords.length];
    if (before && GUARD_BEFORE.has(before)) return true;
    if (after && GUARD_AFTER.has(after)) return true;
  }
  return false;
}

function buildItem(entry, index, isFamilySession = false) {
  const matches = entry.matches;
  const may = !matches.some((m) => !m.may);
  const pal = matches.every((m) => m.pal);
  const specifics = [...new Set(matches.map((m) => displayName(m.common)))];
  const multi = specifics.length > 1;
  const first = matches.find((m) => !m.may) || matches[0];
  const common = multi ? displayName(entry.groupLabel) : specifics[0];
  const profiles = entry.profiles ? Array.from(entry.profiles.values()) : [];
  const aka = (index.byParentTerms[first.parent] || [])
    .filter((x) => !specifics.some((s) => norm(s) === norm(x)))
    .slice(0, 4);

  const item = {
    common,
    technical: multi ? specifics.join(', ') : (pal ? undefined : first.token),
    kind: may ? 'may' : 'contains',
    note: pal ? "Listed as a 'may contain' / cross-contact note on the packaging."
      : may ? (first.note || 'May be present depending on source or manufacture.')
        : undefined,
    derivative: pal ? "Listed as a precautionary 'may contain' statement on the packaging."
      : `Found on this label${first.token ? ` as "${first.token}"` : ''}.`,
    correlation: `Matches ${entry.groupLabel} on your profile.`,
    aka,
    // template-generated "what it is" text from the DB export (pending content library)
    info: index.parentInfo[first.parent] || undefined,
    // Per-match provenance (review finding: the DRAFT banner was global only) —
    // names HOW this specific match was determined, plus the draft caveat. No
    // confidence meter (that distinction is banned and carried by the verb).
    provenance: provenanceFor(pal ? 'PAL' : first.matchClass),
  };
  // Attribution: in a SOLO session a self-only tag is noise, so suppress it. But in
  // a FAMILY session every finding must name who it's for — otherwise an adult's own
  // allergen renders untagged beside a child's tagged one and reads as "everyone's"
  // or the child's (review finding). So tag self too when the family has members.
  if (profiles.length && (isFamilySession || !(profiles.length === 1 && profiles[0].id === 'self'))) {
    item.profiles = profiles;
  }
  return item;
}

function watched(match, watch) {
  return watch.groups.has(match.groupId) || watch.parents.has(match.parent) || watch.selected.has(match.groupId);
}

function matchingProfiles(match, watch) {
  const out = [];
  const seen = new Set();
  (watch.profiles || []).forEach((profile) => {
    if (!profile.name || !watched(match, profile.watch)) return;
    const key = profile.id || `${profile.name}-${profile.child ? 'child' : 'adult'}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ id: key, name: profile.name, child: !!profile.child });
  });
  return out;
}

function kwHit(tokenWords, kws) {
  return kws.some((k) => containsWords(tokenWords, norm(k).split(' ')));
}

function matchScan(rawText, profile, data) {
  const index = buildIndex(data);
  const watch = watchFromProfile(profile, data);
  const text0 = (' ' + String(rawText || '') + ' ')
    .replace(/-\s*[\r\n]+\s*/g, '')
    .replace(/\b(?:[a-z]\.){2,}[a-z]?\b/gi, (m) => m.replace(/\./g, ''));
  // Sentences (period / newline) bound PAL context: "may contain peanuts. milk"
  // must NOT mark milk as 'may'. Within a sentence, commas/semicolons are list items.
  const sentences = text0.split(/(?<!\d)\.(?!\d)|\n+/).map((s) => s.trim()).filter(Boolean);

  const recs = [];
  const unverified = new Set();

  // does this token literally NAME the group (a DIRECT identity term appears in it)?
  // "soy lecithin" names soy; "cheese" does not name milk/dairy. A free-from claim
  // may suppress derived forms ("dairy-free cheese") but never an explicit naming —
  // "soy-free (soy lecithin)" must still surface the contradiction.
  const namesGroup = (tok, groupId) => {
    const tw = norm(tok).split(' ');
    return index.terms.some((t) => t.groupId === groupId && t.matchClass === 'DIRECT' && containsWords(tw, t.w));
  };

  const record = (tok, contextMay, segFree) => {
    let identified = false;
    graphMatches(tok, index).forEach((m) => {
      if (segFree && segFree.has(m.groupId) && !namesGroup(tok, m.groupId)) { identified = true; return; } // freed by a claim in THIS segment ("dairy-free cheese")
      identified = true;
      const may = contextMay || m.matchClass === 'POSSIBLE' || m.matchClass === 'AMBIGUOUS';
      recs.push({
        groupId: m.groupId,
        groupLabel: m.groupLabel,
        parent: m.parent,
        cat: m.cat,
        common: m.parentCommon,
        token: tok,
        matchClass: m.matchClass,
        confidence: m.matchClass === 'DIRECT' || m.matchClass === 'DERIVED' ? 'HIGH' : 'MEDIUM',
        may,
        pal: contextMay,
        note: m.note,
      });
    });

    const tw = norm(tok).split(' ');
    // A keyword only counts as a suppressible marketing slogan when a qualifier sits
    // RIGHT NEXT TO it ("no sugar", "sugar free") — not merely co-present in a longer
    // ingredient name (review fix). Plant forms ("coconut milk") use the dairy guard.
    GOAL_KW.forEach((g) => {
      if (!watch.selected.has(g.id)) return;
      const hitKw = g.kws.find((k) => containsWords(tw, norm(k).split(' ')));
      if (hitKw && !negatedClaim(tw, norm(hitKw).split(' '))) {
        identified = true;
        recs.push({ groupId: g.id, groupLabel: g.common, parent: g.id, cat: 'goal', common: g.common, token: tok, matchClass: 'DERIVED', confidence: 'MEDIUM', may: false, pal: false });
      }
    });
    DIET_KW.forEach((g) => {
      if (!watch.selected.has(g.id)) return;
      const hitKw = g.kws.find((k) => containsWords(tw, norm(k).split(' ')) && !plantDairyFalsePositive(tok, norm(k), 'milk'));
      if (hitKw && !negatedClaim(tw, norm(hitKw).split(' '))) {
        identified = true;
        recs.push({ groupId: g.id, groupLabel: g.common, parent: g.id, cat: 'dietary', common: g.common, token: tok, matchClass: 'DERIVED', confidence: 'MEDIUM', may: false, pal: false });
      }
    });

    return identified || isKnown(tok, index);
  };

  sentences.forEach((sentence) => {
    let ctx = 'CONTAINS'; // resets per sentence — PAL/MAY never leaks past a period/newline
    // A free-from claim that NAMES an allergen ("Free from: milk, …") distributes
    // across the rest of its comma list — but only while each list item is a bare
    // allergen term. "Contains no artificial flavors, milk powder" frees nothing
    // (artificial flavors isn't an identity match), so milk powder still flags.
    let freeRun = false;
    const runFree = new Set(); // groups freed by the free-claim spanning THIS run's segments
    sentence.split(/[,;]+| but /i).map((p) => p.trim()).filter(Boolean).forEach((seg) => {
      let s = seg;
      const segFree = new Set(); // groups freed by a claim in THIS segment (e.g. "dairy-free cheese")
      s = s.replace(ZERO_RE, (m, w) => { markFree(w, segFree, index); return ' '; });
      s = s.replace(INLINE_FREE_RE, (m, w) => { markFree(w, segFree, index); return ' '; });

      const advisory = ADVISORY_RE.test(s);
      const freeOpen = !advisory && FREE_OPEN_RE.test(s);
      if (advisory) { ctx = 'MAY'; freeRun = false; runFree.clear(); }
      else if (freeOpen) ctx = 'CONTAINS';
      else if (CONTAINS_RE.test(s)) { ctx = 'CONTAINS'; freeRun = false; runFree.clear(); }
      let segCtx = freeOpen ? 'FREE' : ctx;

      const cleaned = s
        .replace(ADVISORY_RE, ' ')
        .replace(FREE_OPEN_RE, ' ')
        .replace(CONTAINS_RE, ' ')
        .replace(/\b(?:the following|those|traces?|an?|of|that|with|present|sufferers|allergy|advice|or|and)\b/ig, ' ');

      const toks = expandTokens(cleaned);
      // continuation of a free-list: every token is a bare graph term (≤3 words)
      if (segCtx !== 'FREE' && freeRun && toks.length &&
          toks.every((tk) => norm(tk).split(' ').length <= 3 && graphMatches(tk, index).length > 0)) {
        segCtx = 'FREE';
      }

      let freedHere = 0;
      toks.forEach((tok) => {
        if (segCtx === 'FREE') {
          const before = segFree.size;
          markFree(tok, segFree, index);
          segFree.forEach((g) => runFree.add(g)); // remember across the run's segments
          if (segFree.size > before) { freedHere++; return; } // this token IS part of the free claim
          // CRITICAL FIX (final review): markFree freed nothing for this token. If the
          // run's free claim already covers the token's group it's redundant ("Free
          // from dairy, casein" — casein is the freed dairy) → suppress. Otherwise it's
          // a DIFFERENT, genuinely-present ingredient riding in the same free-list
          // ("Free from soy, casein" — casein is milk) → surface it, never swallow.
          const groups = graphMatches(tok, index).map((m) => m.groupId);
          const coveredByRun = groups.length > 0 && groups.every((g) => runFree.has(g));
          if (coveredByRun) return;
          const surfaced = record(tok, false, segFree);
          const fn = norm(tok);
          if (index.opaque.has(fn)) unverified.add(fn);
          else if (!surfaced && /[a-z]{2,}/i.test(tok)) unverified.add(fn);
          return;
        }
        const identified = record(tok, segCtx === 'MAY', segFree);
        const n = norm(tok);
        if (index.opaque.has(n)) unverified.add(n);
        else if (segCtx === 'CONTAINS' && !identified && /[a-z]{2,}/i.test(tok)) unverified.add(n);
      });
      // the list keeps distributing only if the free claim actually named allergens
      if (freeOpen) freeRun = freedHere > 0 || segFree.size > 0;
      else if (segCtx !== 'FREE') freeRun = false;
    });
  });

  const byGroup = {};
  recs.forEach((r) => {
    if (!watched(r, watch)) return;
    const entry = byGroup[r.groupId] || {
      groupId: r.groupId,
      groupLabel: r.groupLabel,
      cat: r.cat,
      matches: [],
      profiles: new Map(),
    };
    matchingProfiles(r, watch).forEach((profile) => entry.profiles.set(profile.id, profile));
    entry.matches.push(r);
    byGroup[r.groupId] = entry;
  });

  const isFamilySession = (watch.profiles || []).length > 1; // self + at least one member
  const byCat = {};
  Object.values(byGroup).forEach((entry) => {
    (byCat[entry.cat] = byCat[entry.cat] || []).push(buildItem(entry, index, isFamilySession));
  });

  const findings = DOMAIN_ORDER.filter((cat) => byCat[cat] && byCat[cat].length).map((cat) => ({
    cat: cat === 'dietary' ? 'diet' : cat,
    label: CAT_LABEL[cat],
    items: byCat[cat].sort((a, b) => (a.kind === b.kind ? a.common.localeCompare(b.common) : a.kind === 'contains' ? -1 : 1)),
  }));

  return { findings, unverified: [...unverified].filter(Boolean).map(titleCase) };
}

module.exports = { matchScan };
