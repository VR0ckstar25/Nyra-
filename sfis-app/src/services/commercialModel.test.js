// Node verification for Anvara commercial/ad guardrails.

const {
  normalizeCommercial,
  PLAN_IDS,
  shouldShowHouseAds,
  houseAdForContext,
  updateCommercialPlan,
} = require('./commercialModel.js');

let pass = 0, fail = 0;
const failures = [];
const check = (name, cond, detail = '') => {
  if (cond) pass++;
  else { fail++; failures.push(`FAIL  ${name}${detail ? ` - ${detail}` : ''}`); }
};

console.log('=== Commercial plan + ad guardrail suite ===');

let commercial = normalizeCommercial(null);
check('default plan is Free', commercial.planId === PLAN_IDS.free, JSON.stringify(commercial));
check('Free can show house ads on Home', shouldShowHouseAds(commercial, 'home'));
check('Free never shows ads on Result', !shouldShowHouseAds(commercial, 'result'));
check('Free result ad payload is null', houseAdForContext(commercial, 'result') === null);

commercial = updateCommercialPlan(commercial, PLAN_IDS.individual);
check('Individual plan selected', commercial.planId === PLAN_IDS.individual, JSON.stringify(commercial));
check('Plus hides house ads on Home', !shouldShowHouseAds(commercial, 'home'));
check('paid preview is not store billing', commercial.billingMode === 'preview');

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) {
  console.error(failures.join('\n'));
  process.exit(1);
}
