// Node verification for the English-only capability notice.
// Run: node src/services/languageCheck.test.js  (wired into `npm test`)

const { nonEnglishNotice } = require('./languageCheck.js');

let pass = 0, fail = 0;
const failures = [];
const check = (name, cond, detail = '') => {
  if (cond) pass++;
  else { fail++; failures.push(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`); }
};

// English (incl. accented loan-words) must NOT trigger
check('plain English passes', nonEnglishNotice('Ingredients: wheat flour, sugar, peanut oil, salt.') === null);
check('accented loan-words pass', nonEnglishNotice('Café latte with açaí and jalapeño') === null);
check('empty/short passes', nonEnglishNotice('') === null && nonEnglishNotice('ok') === null);
check('digits/symbols only pass (not a language issue)', nonEnglishNotice('1234 -- 56.7 %%%') === null);

// Non-Latin scripts must trigger an honest notice
check('Cyrillic triggers', !!nonEnglishNotice('Состав: пшеничная мука, сахар, соль'));
check('CJK triggers', !!nonEnglishNotice('原料：小麦粉、砂糖、塩、ピーナッツ'));
check('Arabic triggers', !!nonEnglishNotice('المكونات: دقيق القمح، سكر، ملح'));
check('Hangul triggers', !!nonEnglishNotice('성분: 밀가루, 설탕, 소금'));
check('mostly-non-Latin mixed triggers', !!nonEnglishNotice('Sucre 砂糖 小麦 ピーナッツ 塩 牛乳'));

// The notice names the capability boundary honestly
const n = nonEnglishNotice('Состав: молоко');
check('notice mentions English-only + check packaging', /English/i.test(n) && /packaging/i.test(n), n);

console.log(`\n${pass} passed, ${fail} failed`);
failures.forEach((f) => console.log(f));
process.exit(fail ? 1 : 0);
