// Node verification for the production matcher. Run: npm run test:match
const fs = require('fs');
const path = require('path');
const { matchScan } = require('./scanMatch.js');
const data = require('../data/allergens.json');

let pass = 0, fail = 0;
const failures = [];
const check = (name, cond, detail = '') => {
  if (cond) pass++;
  else { fail++; failures.push(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`); }
};

const ALL = Object.keys(data.parents);
const bar = (r, cat) => r.findings.find((f) => f.cat === cat);
const items = (r) => r.findings.flatMap((f) => f.items.map((it) => ({ ...it, cat: f.cat })));
const item = (r, common) => items(r).find((i) => i.common === common);
const hasKind = (r, common, kind) => item(r, common)?.kind === kind;
const noAllergen = (r) => !(bar(r, 'allergen')?.items || []).length;
const hasUnverified = (r, term) => r.unverified.some((u) => u.toLowerCase().includes(term.toLowerCase().split(' ')[0]));

console.log('=== Production matcher regression suite ===');

// Baseline/reference parity
let r = matchScan('Ingredients: wheat flour, sugar, peanut oil, whey, tahini, natural flavors, salt.',
  ['peanut', 'milk', 'sesame'], data);
check('baseline peanut -> Contains', hasKind(r, 'Peanuts', 'contains'));
check('baseline milk via whey -> Contains', hasKind(r, 'Milk', 'contains'));
check('baseline sesame via tahini -> Contains', hasKind(r, 'Sesame', 'contains'));
check('baseline wheat hidden if not on profile', !item(r, 'Wheat'));
check('baseline opaque natural flavors -> Could not verify', hasUnverified(r, 'natural flavors'));

r = matchScan('Ingredients: peanut flour.', {
  id: 'self',
  name: 'You',
  items: [],
  familyMembers: [
    { id: 'child-theo', name: 'Theo', child: true, watched: [{ id: 'peanut', severity: 'Strict avoid' }] },
  ],
}, data);
check('family member watched item flags peanut', hasKind(r, 'Peanuts', 'contains'), JSON.stringify(r));
check('family member profile tag is attached', item(r, 'Peanuts')?.profiles?.some((p) => p.name === 'Theo' && p.child), JSON.stringify(r));

r = matchScan('Ingredients: oats, sugar. May contain almonds.', ['almond'], data);
check('PAL almond -> May contain', hasKind(r, 'Almond', 'may'), JSON.stringify(r));
check('PAL note present', /may contain|cross-contact/i.test(item(r, 'Almond')?.note || ''));

r = matchScan('Ingredients: potatoes, canola oil, spices (sesame, wheat), salt. Contains: Wheat, Sesame.',
  ['sesame', 'wheat'], data);
check('parenthetical sesame -> Contains', hasKind(r, 'Sesame', 'contains'));
check('parenthetical wheat -> Contains', hasKind(r, 'Wheat', 'contains'));

r = matchScan('Ingredients: peanuts. May contain peanuts.', ['peanut'], data);
check('Contains beats PAL for same parent', hasKind(r, 'Peanuts', 'contains'));
check('Contains/PAL dedupes same parent', items(r).filter((i) => i.common === 'Peanuts').length === 1);

r = matchScan('milk/soy protein blend', ['milk', 'soy'], data);
check('slash milk/soy finds milk', hasKind(r, 'Milk', 'contains'));
check('slash milk/soy finds soy', hasKind(r, 'Soy', 'contains'));

r = matchScan('Processed in a facility that also handles peanuts', ['peanut'], data);
check('processed-in-facility PAL -> May contain', hasKind(r, 'Peanuts', 'may'));

r = matchScan('pea-\nnut flour', ['peanut'], data);
check('OCR hyphen line-break -> peanut', hasKind(r, 'Peanuts', 'contains'));

r = matchScan('contains no peanuts, peanut free', ['peanut'], data);
check('free-from peanut does not false-positive', !item(r, 'Peanuts'), JSON.stringify(r));

// Wave 2 — OCR tolerance
r = matchScan('Ingredients: mi1k, alrnonds, peanutbutter, egg5, c0d, soy lec ithin.',
  ['milk', 'almond', 'peanut', 'egg', 'fish', 'soy'], data);
check('OCR mi1k -> Milk', hasKind(r, 'Milk', 'contains'), JSON.stringify(r));
check('OCR alrnonds -> Almond', hasKind(r, 'Almond', 'contains'), JSON.stringify(r));
check('OCR peanutbutter -> Peanuts', hasKind(r, 'Peanuts', 'contains'), JSON.stringify(r));
check('OCR egg5 -> Eggs', hasKind(r, 'Eggs', 'contains'), JSON.stringify(r));
check('OCR c0d -> Fish', hasKind(r, 'Fish', 'contains'), JSON.stringify(r));
check('OCR soy lec ithin -> Soy May contain', hasKind(r, 'Soy', 'may'), JSON.stringify(r));

r = matchScan('p.e.a.n.u.t.s and pea nut pieces', ['peanut'], data);
check('OCR extra spaces/punctuation -> Peanuts', hasKind(r, 'Peanuts', 'contains'), JSON.stringify(r));

// Wave 3 — false-positive guards + dairy data gap
r = matchScan('coconut milk, cocoa butter, cream of tartar, butterfly pea tea',
  ['milk', 'peanut', 'almond'], data);
check('plant-word dairy/pea guards prevent allergen false positives', noAllergen(r), JSON.stringify(r));

r = matchScan('dairy-free cheese, vegan butter', ['milk'], data);
check('non-dairy cheese/butter guard prevents milk false positives', noAllergen(r), JSON.stringify(r));

r = matchScan('milk-free. contains milk powder', ['milk'], data);
check('free-from sentence does not suppress later milk finding', hasKind(r, 'Milk', 'contains'), JSON.stringify(r));

r = matchScan('peanut-free. made in a facility with peanuts', ['peanut'], data);
check('free-from sentence does not suppress later peanut PAL', hasKind(r, 'Peanuts', 'may'), JSON.stringify(r));

r = matchScan('may contain peanuts. milk', ['peanut', 'milk'], data);
check('PAL context does not leak across sentences to milk', hasKind(r, 'Milk', 'contains'), JSON.stringify(r));
check('PAL context remains on peanut sentence', hasKind(r, 'Peanuts', 'may'), JSON.stringify(r));

r = matchScan('cheese, butter, cream', ['milk', 'lactose'], data);
check('DB gap cheese/butter/cream -> Milk allergen', hasKind(r, 'Milk', 'contains'), JSON.stringify(r));
check('cheese/butter/cream still supports lactose intolerance', hasKind(r, 'Lactose', 'contains') || hasKind(r, 'Lactose', 'may'), JSON.stringify(r));

r = matchScan('almonds, walnuts, cashews', ['almond', 'walnut', 'cashew'], data);
check('multiple tree nuts collapse to Tree nuts group', hasKind(r, 'Tree nuts', 'contains'), JSON.stringify(r));
check('tree nut specifics retained', /Almond.*Walnut.*Cashew|Almond.*Cashew.*Walnut/.test(item(r, 'Tree nuts')?.technical || ''), JSON.stringify(item(r, 'Tree nuts')));

r = matchScan('fat-free milk', ['milk'], data);
check('fat-free milk still flags milk', hasKind(r, 'Milk', 'contains'), JSON.stringify(r));

r = matchScan('may contain milk, eggs, soy and tree nuts', ['milk', 'egg', 'soy', 'almond'], data);
check('PAL distributes to milk', hasKind(r, 'Milk', 'may'), JSON.stringify(r));
check('PAL distributes to egg', hasKind(r, 'Eggs', 'may'), JSON.stringify(r));
check('PAL distributes to soy', hasKind(r, 'Soy', 'may'), JSON.stringify(r));
check('PAL distributes to generic tree nuts', hasKind(r, 'Tree nuts', 'may'), JSON.stringify(r));

r = matchScan('Ingredients: honey, gelatin, salt.', ['diet.vegan'], data);
check('diet result stays in Diet category', !!bar(r, 'diet'), JSON.stringify(r));
check('diet result is not grouped under Goals', !bar(r, 'goal'), JSON.stringify(r));

r = matchScan('Ingredients: chicken broth, rice flour.', ['diet.pescatarian'], data);
check('pescatarian flags meat/poultry', hasKind(r, 'Meat or poultry', 'contains'), JSON.stringify(r));
r = matchScan('Ingredients: fish oil, oats.', ['diet.pescatarian'], data);
check('pescatarian allows fish without a diet finding', !bar(r, 'diet'), JSON.stringify(r));
r = matchScan('Ingredients: date paste, rolled oats.', ['goal.avoid_dates'], data);
check('avoid dates goal flags date ingredients', hasKind(r, 'Dates', 'contains'), JSON.stringify(r));
r = matchScan('Ingredients: beef tallow, salt.', ['diet.no_red_meat'], data);
check('no red meat flags beef', hasKind(r, 'Red meat', 'contains'), JSON.stringify(r));
r = matchScan('Ingredients: bacon bits, potato starch.', ['diet.no_pork'], data);
check('no pork flags bacon', hasKind(r, 'Pork', 'contains'), JSON.stringify(r));
r = matchScan('Ingredients: turkey broth, rice.', ['diet.no_poultry'], data);
check('no poultry flags turkey', hasKind(r, 'Poultry', 'contains'), JSON.stringify(r));

// Wave 4 — negation safety (adversarial review): a free-from / "no X" claim must
// never swallow a co-located REAL allergen in the same comma list.
r = matchScan('contains no artificial flavors, milk powder', ['milk'], data);
check('negation: "contains no artificial flavors, milk powder" -> Milk', hasKind(r, 'Milk', 'contains'), JSON.stringify(r));
r = matchScan('no sugar added, peanuts', ['peanut'], data);
check('negation: "no sugar added, peanuts" -> Peanuts', hasKind(r, 'Peanuts', 'contains'), JSON.stringify(r));
r = matchScan('no artificial colors, peanut flour', ['peanut'], data);
check('negation: "no artificial colors, peanut flour" -> Peanuts', hasKind(r, 'Peanuts', 'contains'), JSON.stringify(r));
r = matchScan('contains no peanuts', ['peanut'], data);
check('negation: "contains no peanuts" -> no peanut finding', !item(r, 'Peanuts'), JSON.stringify(r));

// Wave 5 — free-from / PAL safety (adversarial review): free-from must not create
// false positives, must not hide PAL, and PAL must not leak across sentences.
r = matchScan('dairy-free', ['milk'], data);
check('free-from: "dairy-free" -> no Milk false positive', !item(r, 'Milk'), JSON.stringify(r));
r = matchScan('dairy-free cheese', ['milk'], data);
check('free-from: "dairy-free cheese" -> no Milk false positive', !item(r, 'Milk'), JSON.stringify(r));
r = matchScan('peanut-free. made in a facility with peanuts', ['peanut'], data);
check('free-from never hides PAL: still May contain Peanuts', hasKind(r, 'Peanuts', 'may'), JSON.stringify(r));
r = matchScan('may contain peanuts. milk', ['peanut', 'milk'], data);
check('PAL does not leak past a sentence: milk -> Contains', hasKind(r, 'Milk', 'contains'), JSON.stringify(r));
check('PAL still applies in its own sentence: peanuts -> May contain', hasKind(r, 'Peanuts', 'may'), JSON.stringify(r));
r = matchScan('may contain peanuts, almonds and milk', ['peanut', 'almond', 'milk'], data);
check('multi-allergen PAL still distributes across commas (almond may)', hasKind(r, 'Almond', 'may'), JSON.stringify(r));

// Wave 6 — review-confirmed criticals: free-claims must free ONLY what they name,
// free-lists must distribute, marketing claims are not ingredients.
r = matchScan('lactose-free milk', ['milk'], data);
check('W6 "lactose-free milk" still flags the MILK allergen', hasKind(r, 'Milk', 'contains'), JSON.stringify(r));
r = matchScan('lactose free yogurt (milk)', ['milk'], data);
check('W6 parenthetical (milk) survives a lactose-free claim', hasKind(r, 'Milk', 'contains'), JSON.stringify(r));
r = matchScan('lactose-free milk', ['lactose'], data);
check('W6 lactose-free frees the LACTOSE intolerance itself', !item(r, 'Lactose'), JSON.stringify(r));
r = matchScan('Free from: milk, eggs, soy', ['milk', 'egg', 'soy'], data);
check('W6 free-list distributes (milk)', !item(r, 'Milk'), JSON.stringify(r));
check('W6 free-list distributes (eggs)', !item(r, 'Eggs'), JSON.stringify(r));
check('W6 free-list distributes (soy)', !item(r, 'Soy'), JSON.stringify(r));
r = matchScan('does not contain wheat, milk or eggs', ['wheat', 'milk', 'egg'], data);
check('W6 "does not contain a, b or c" distributes', r.findings.length === 0, JSON.stringify(r));
r = matchScan('free from the following: peanuts, tree nuts, sesame', ['peanut', 'almond', 'sesame'], data);
check('W6 "free from the following:" distributes', r.findings.length === 0, JSON.stringify(r));
r = matchScan('Free from: milk. peanut butter, sugar', ['milk', 'peanut'], data);
check('W6 free-list ends at the sentence: peanut still flags', hasKind(r, 'Peanuts', 'contains'), JSON.stringify(r));
r = matchScan('coconut milk, sugar', ['diet.vegan'], data);
check('W6 coconut milk is not Animal-derived', !item(r, 'Animal-derived'), JSON.stringify(r));
r = matchScan('milk, sugar', ['diet.vegan'], data);
check('W6 real milk IS Animal-derived', hasKind(r, 'Animal-derived', 'contains'), JSON.stringify(r));
r = matchScan('no sugar added, oats', ['goal.less_sugar'], data);
check('W6 "no sugar added" claim does not fire the sugar goal', !item(r, 'Added sugars'), JSON.stringify(r));
r = matchScan('low sodium soy sauce', ['goal.less_sodium'], data);
check('W6 "low sodium" claim does not fire the sodium goal', !item(r, 'Sodium'), JSON.stringify(r));

// Wave 6 — named-source lecithin + free-claim naming (adversarial review v2)
r = matchScan('sunflower lecithin, oats', ['soy', 'egg'], data);
check('named plant lecithin does not fire soy/egg', !item(r, 'Soy') && !item(r, 'Eggs'), JSON.stringify(r));
r = matchScan('soy lecithin', ['soy'], data);
check('soy lecithin still fires Soy may', hasKind(r, 'Soy', 'may'), JSON.stringify(r));
r = matchScan('lecithin', ['soy', 'egg'], data);
check('unsourced lecithin keeps both may (honest unknown)', hasKind(r, 'Soy', 'may') && hasKind(r, 'Eggs', 'may'), JSON.stringify(r));
r = matchScan('soy-free (soy lecithin)', ['soy'], data);
check('free claim never suppresses a token naming the allergen', hasKind(r, 'Soy', 'may'), JSON.stringify(r));

// Wave 7 — phrase-style free-from must not swallow a DIFFERENT present allergen
// in the same comma list (final review CRITICAL: silent allergen false-negative).
r = matchScan('Free from soy, casein', ['milk'], data);
check('free-list surfaces casein (milk) when claim names soy', hasKind(r, 'Milk', 'contains'), JSON.stringify(r));
r = matchScan('Free from: dairy, peanut butter', ['peanut'], data);
check('free-list surfaces peanut butter when claim names dairy', hasKind(r, 'Peanuts', 'contains'), JSON.stringify(r));
r = matchScan('Free from gluten, wheat flour', ['wheat'], data);
check('free-list surfaces wheat flour when claim names gluten', hasKind(r, 'Wheat', 'contains'), JSON.stringify(r));
// …but a free claim still suppresses the very allergen it names (no false positive)
r = matchScan('Free from dairy, casein', ['milk'], data);
check('free claim still suppresses its own named allergen (casein=dairy)', !item(r, 'Milk'), JSON.stringify(r));
r = matchScan('Free from milk, eggs, soy', ['milk', 'egg', 'soy'], data);
check('standard free-from list suppresses all named allergens', !item(r, 'Milk') && !item(r, 'Eggs') && !item(r, 'Soy'), JSON.stringify(r));

// Wave 7 — diet/goal marketing guard must be ADJACENT, not co-occurrence (review):
// real compound ingredients flag; genuine slogans stay suppressed.
r = matchScan('free-range eggs', ['diet.vegan'], data);
check('free-range eggs flags vegan (qualifier not adjacent to egg)', !!bar(r, 'diet'), JSON.stringify(r));
r = matchScan('low-sodium ham', ['diet.no_pork'], data);
check('low-sodium ham flags no-pork', hasKind(r, 'Pork', 'contains'), JSON.stringify(r));
r = matchScan('light brown sugar', ['goal.less_sugar'], data);
check('light brown sugar flags less-sugar', hasKind(r, 'Added sugars', 'contains'), JSON.stringify(r));
r = matchScan('no sugar added', ['goal.less_sugar'], data);
check('no sugar added stays suppressed (adjacent slogan)', !bar(r, 'goal'), JSON.stringify(r));
r = matchScan('low sodium soup', ['goal.less_sodium'], data);
check('low sodium soup stays suppressed', !bar(r, 'goal'), JSON.stringify(r));

// DB hostile challenge corpus: production matcher should resolve MATCH rows and
// surface OPAQUE rows under Could not verify.
// STRICT (adversarial review): a MATCH row must surface the EXPECTED allergen by
// name — "some finding exists" is not enough to prove the right one fired.
const GROUPED = { almond: 'Tree nuts', walnut: 'Tree nuts', cashew: 'Tree nuts', pecan: 'Tree nuts',
  pistachio: 'Tree nuts', hazelnut: 'Tree nuts', brazil_nut: 'Tree nuts', macadamia: 'Tree nuts',
  pine_nut: 'Tree nuts', crustacean: 'Shellfish', mollusc: 'Shellfish' };
const PRETTY_TEST = { 'Milk and Dairy': 'Milk', Soybeans: 'Soy', 'Tree Nuts': 'Tree nuts',
  'Crustacean Shellfish': 'Shellfish', 'Mollusc Shellfish': 'Shellfish' };
function expectedCommons(parent) {
  const c = data.parents[parent]?.common;
  return new Set([c, PRETTY_TEST[c], GROUPED[parent]].filter(Boolean));
}
// Wave 8 — diet/goal findings must carry a "what it is" info card (no pending-review)
[["diet.vegan","Animal-derived","Ingredients: honey."],["goal.less_sugar","Added sugars","Ingredients: cane sugar."],["diet.no_pork","Pork","Ingredients: bacon."]].forEach(([id,common,label])=>{
  const rr=matchScan(label,[id],data);
  const it=items(rr).find((x)=>x.common===common);
  check("diet/goal findings carry info: "+common, !!it && typeof it.info==="string" && it.info.length>20, JSON.stringify(it));
});

console.log('=== DB challenge_corpus.sql ===');
let corpusTotal = 0;
try {
  const sql = fs.readFileSync(path.join(__dirname, '../../../database/challenge_corpus.sql'), 'utf8');
  const valuesBlock = (sql.match(/INSERT INTO challenge_corpus[\s\S]*?;\n/) || [''])[0];
  const re = /\('([^']+)'\s*,\s*'(MATCH|OPAQUE|NONE)'\s*,\s*(NULL|'([^']*)')\)/g;
  let m;
  while ((m = re.exec(valuesBlock))) {
    const raw = m[1], type = m[2], parent = m[4] || null;
    corpusTotal++;
    const result = matchScan(raw, parent ? [parent] : ALL, data);
    if (type === 'MATCH') {
      const want = expectedCommons(parent);
      const got = items(result).some((i) => want.has(i.common));
      check(`corpus MATCH ${raw} -> ${parent}`, got, `wanted one of ${[...want].join('/')} — ${JSON.stringify(result)}`);
    } else if (type === 'OPAQUE') {
      check(`corpus OPAQUE ${raw}`, hasUnverified(result, raw), JSON.stringify(result));
    } else {
      check(`corpus NONE ${raw}`, noAllergen(result), JSON.stringify(result));
    }
  }
} catch (e) {
  check('challenge corpus readable', false, e.message);
}

console.log(`\n${pass} passed, ${fail} failed (${corpusTotal} corpus rows)`);
failures.slice(0, 80).forEach((f) => console.log(f));
process.exit(fail ? 1 : 0);
