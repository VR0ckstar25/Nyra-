// Node verification for the first-run intro content (the "missing intro").
// The intro must TEACH the Mirror Principle before sign-up and stay verdict-free.
// Run: node src/services/introContent.test.js  (wired into `npm test`)

const { INTRO_SLIDES } = require('../data/introContent.js');

let pass = 0, fail = 0;
const failures = [];
const check = (name, cond, detail = '') => {
  if (cond) pass++;
  else { fail++; failures.push(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`); }
};

const all = JSON.stringify(INTRO_SLIDES).toLowerCase();

check('has at least 3 slides', INTRO_SLIDES.length >= 3);
check('every slide has title, body, points', INTRO_SLIDES.every((s) => s.title && s.body && Array.isArray(s.points) && s.points.length));
check('teaches the three answers (contains/may/could not verify)', all.includes('contains') && all.includes('may contain') && all.includes('could not verify'));
check('states no verdict / no score', all.includes('no safe') || all.includes('no verdict') || all.includes('not a judge'));
check('flags draft data honesty', all.includes('draft'));
check('points back to the packaging', all.includes('packaging') || all.includes('package'));
check('photos-stay-local privacy promise present', all.includes('phone') || all.includes('device'));
// must NOT use verdict/fear language anywhere in the intro
const banned = ['unsafe', 'safe to eat', 'danger', 'do not eat', 'avoid this product'];
check('no verdict/fear language', !banned.some((b) => all.includes(b)), banned.filter((b) => all.includes(b)).join(','));

console.log(`\n${pass} passed, ${fail} failed`);
failures.forEach((f) => console.log(f));
process.exit(fail ? 1 : 0);
