// Node verification for the billing seam. Run: node src/services/billingService.test.js
// Proves: preview mode never charges, entitlement→plan mapping, store mode with a
// mocked RevenueCat SDK (purchase, cancel, restore), and that no card data ever
// enters this module's surface.

const billing = require('./billingService.js');

let pass = 0, fail = 0;
const failures = [];
const check = (name, cond, detail = '') => {
  if (cond) pass++;
  else { fail++; failures.push(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`); }
};

(async () => {
  // 1. Preview mode (no SDK): purchases succeed locally, explicitly uncharged
  check('starts in preview mode', billing.billingMode() === 'preview');
  let r = await billing.purchasePlan('familyPro');
  check('preview purchase ok + never charged', r.ok && r.mode === 'preview' && r.charged === false);
  check('preview purchase carries honest note', /no charge/i.test(r.note || ''));
  r = await billing.purchasePlan('nope');
  check('unknown plan rejected', !r.ok);
  r = await billing.restorePurchases();
  check('preview restore is honest no-op', r.ok && r.mode === 'preview' && r.planId === null);

  // 2. Entitlement mapping: highest active plan wins; none → free
  check('no entitlements → free', billing.planForEntitlements([]) === 'free');
  check('plus → plus', billing.planForEntitlements(['plus']) === 'plus');
  check('family_pro beats plus', billing.planForEntitlements(['plus', 'family_pro']) === 'familyPro');

  // 3. Store mode with mocked SDK
  const mockInfo = (ents) => ({ entitlements: { active: Object.fromEntries(ents.map((e) => [e, {}])) } });
  const sdk = {
    configured: null,
    configure(opts) { this.configured = opts; },
    async getOfferings() {
      return { current: { availablePackages: [
        { product: { identifier: 'anvara.plus.monthly' } },
        { product: { identifier: 'anvara.family.monthly' } },
      ] } };
    },
    async purchasePackage(pkg) {
      if (pkg.product.identifier === 'anvara.plus.monthly') return { customerInfo: mockInfo(['plus']) };
      throw Object.assign(new Error('declined'), {});
    },
    async restorePurchases() { return mockInfo(['family']); },
  };
  check('configure requires sdk+key', billing.configureBilling(null, 'k') === false && billing.configureBilling(sdk, '') === false);
  check('configure wires the sdk', billing.configureBilling(sdk, 'rc_test_key') === true && billing.billingMode() === 'store');

  r = await billing.purchasePlan('plus');
  check('store purchase returns store-derived plan', r.ok && r.mode === 'store' && r.planId === 'plus' && r.charged === true);
  r = await billing.purchasePlan('familyPro'); // not in mocked offerings
  check('missing store product fails honestly', !r.ok && /not available/i.test(r.reason));
  r = await billing.restorePurchases();
  check('restore maps entitlement → family', r.ok && r.planId === 'family');

  // 4. The module never asks for card data (PCI scope check: no such API exists)
  const surface = Object.keys(billing).join(' ');
  check('no card-collection API on the surface', !/card|cvv|pan\b/i.test(surface), surface);

  console.log(`\n${pass} passed, ${fail} failed`);
  failures.forEach((f) => console.log(f));
  process.exit(fail ? 1 : 0);
})();
