// billingService.js — the payments seam (founder decision 2026-06-12: RevenueCat).
//
// HOW NYARA GETS PAID (and why no card UI exists anywhere in this app):
//   customer pays Apple/Google with the payment method already on their store
//   account → the store takes its cut (15% small-business tier) → the store pays
//   out to the founder's bank (configured once in App Store Connect / Play
//   Console). RevenueCat only tracks WHO is entitled to WHICH plan — money and
//   card data never pass through it or us. We are out of PCI scope entirely.
//
// This module is the single seam: when store accounts exist, install
// react-native-purchases and pass it to configureBilling(). Until then every
// flow works in honest PREVIEW mode — no charge, clearly labeled.

import { PLAN_IDS } from './commercialModel.js';

// RevenueCat entitlement identifiers → Nyara plan ids
export const ENTITLEMENT_TO_PLAN = {
  individual: PLAN_IDS.individual,
  family: PLAN_IDS.family,
};

// Store product ids (must match App Store Connect / Play Console when created)
export const PRODUCTS = [
  { productId: 'nyara.individual.monthly', planId: PLAN_IDS.individual, entitlement: 'individual' },
  { productId: 'nyara.family.monthly', planId: PLAN_IDS.family, entitlement: 'family' },
];

let purchasesSdk = null; // react-native-purchases, injected when store accounts exist

export function configureBilling(sdk, apiKey) {
  if (!sdk || !apiKey) return false;
  purchasesSdk = sdk;
  sdk.configure({ apiKey });
  return true;
}

export function billingMode() {
  return purchasesSdk ? 'store' : 'preview';
}

export function planForEntitlements(activeEntitlements = []) {
  // highest plan wins if several are active
  const active = Array.isArray(activeEntitlements) ? activeEntitlements : [];
  const order = ['family', 'individual']; // family is the richer entitlement
  const hit = order.find((e) => active.includes(e));
  return hit ? ENTITLEMENT_TO_PLAN[hit] : PLAN_IDS.free;
}

// Purchase a plan. Preview mode: no charge, returns the plan so the UI can apply
// it locally with an explicit preview flag. Store mode: real StoreKit/Billing
// sheet via RevenueCat; entitlement comes back from the store receipt.
export async function purchasePlan(planId) {
  const product = PRODUCTS.find((p) => p.planId === planId);
  if (!product) return { ok: false, mode: billingMode(), reason: 'Unknown plan.' };
  if (!purchasesSdk) {
    return { ok: true, mode: 'preview', planId, charged: false,
      note: 'Preview only — store billing is not connected, no charge was made.' };
  }
  try {
    const offerings = await purchasesSdk.getOfferings();
    const pkg = offerings?.current?.availablePackages?.find(
      (p) => p?.product?.identifier === product.productId);
    if (!pkg) return { ok: false, mode: 'store', reason: 'Plan not available in the store yet.' };
    const { customerInfo } = await purchasesSdk.purchasePackage(pkg);
    const active = Object.keys(customerInfo?.entitlements?.active || {});
    return { ok: true, mode: 'store', planId: planForEntitlements(active), charged: true };
  } catch (error) {
    if (error?.userCancelled) return { ok: false, mode: 'store', reason: 'Purchase canceled.' };
    return { ok: false, mode: 'store', reason: error?.message || 'Purchase failed.' };
  }
}

// Restore purchases — the "backup" path for entitlements after reinstall/new phone.
export async function restorePurchases() {
  if (!purchasesSdk) {
    return { ok: true, mode: 'preview', planId: null,
      note: 'Preview only — nothing to restore until store billing is connected.' };
  }
  try {
    const customerInfo = await purchasesSdk.restorePurchases();
    const active = Object.keys(customerInfo?.entitlements?.active || {});
    return { ok: true, mode: 'store', planId: planForEntitlements(active) };
  } catch (error) {
    return { ok: false, mode: 'store', reason: error?.message || 'Restore failed.' };
  }
}
