// Node verification for the label-photo retention promise.
// Run: node src/services/localRetention.test.js  (wired into `npm test`)
// The settings copy promises: "If off, captured label images are removed from
// this phone after 7 days." These tests pin that promise to the code.

const { enrichCapturedImage, applyRetentionPolicy, cleanupExpiredLabelImages, LABEL_IMAGE_RETENTION_DAYS } = require('./localRetention.js');

let pass = 0, fail = 0;
const failures = [];
const check = (name, cond, detail = '') => {
  if (cond) pass++;
  else { fail++; failures.push(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`); }
};

const DAY = 24 * 60 * 60 * 1000;
const iso = (msFromNow) => new Date(Date.now() + msFromNow).toISOString();
const scanWith = (image) => ({ id: 's1', image });

// 1. Capture while toggle OFF → deadline ~7 days out
let img = enrichCapturedImage({ uri: 'file:///a.jpg' }, false);
check('off-capture gets a deadline', !!img.deleteAfter && !img.retainedOnDevice);
check('deadline is ~7 days', Math.abs(new Date(img.deleteAfter) - Date.now() - LABEL_IMAGE_RETENTION_DAYS * DAY) < 5000);

// 2. Capture while toggle ON → retained, no deadline (yet)
img = enrichCapturedImage({ uri: 'file:///b.jpg' }, true);
check('on-capture is retained with null deadline', img.retainedOnDevice && img.deleteAfter === null);

// 3. THE REVIEW BUG: toggle ON→OFF must stamp a real deadline on retained photos
let scans = [scanWith({ uri: 'file:///b.jpg', capturedAt: iso(-150 * DAY), retainedOnDevice: true, deleteAfter: null })];
let after = applyRetentionPolicy(scans, false);
check('toggle-off stamps deadline on retained photo', !!after[0].image.deleteAfter, JSON.stringify(after[0]));
check('stamped deadline starts NOW, not capture time', new Date(after[0].image.deleteAfter) > new Date(), after[0].image.deleteAfter);
check('retained flag cleared so cleanup can reap', after[0].image.retainedOnDevice === false);

// 4. Toggle stays ON → nothing changes
after = applyRetentionPolicy(scans, true);
check('toggle-on leaves retained photos alone', after[0].image.deleteAfter === null);

// 5. Cleanup reaps an expired photo (image nulled in the scan record)
(async () => {
  const expired = [scanWith({ uri: 'file:///c.jpg', capturedAt: iso(-10 * DAY), retainedOnDevice: false, deleteAfter: iso(-3 * DAY) })];
  const cleaned = await cleanupExpiredLabelImages(expired, false);
  check('expired photo removed from record', cleaned[0].image === null, JSON.stringify(cleaned[0]));

  // 6. Legacy null-deadline photo while OFF → repaired (deadline), NOT instantly deleted
  const legacy = [scanWith({ uri: 'file:///d.jpg', capturedAt: iso(-150 * DAY), retainedOnDevice: true, deleteAfter: null })];
  const repaired = await cleanupExpiredLabelImages(legacy, false);
  check('legacy retained photo gets deadline instead of living forever', !!repaired[0].image?.deleteAfter, JSON.stringify(repaired[0]));

  // 7. Fresh (unexpired) photo survives cleanup
  const fresh = [scanWith({ uri: 'file:///e.jpg', capturedAt: iso(-1 * DAY), retainedOnDevice: false, deleteAfter: iso(6 * DAY) })];
  const kept = await cleanupExpiredLabelImages(fresh, false);
  check('unexpired photo survives', !!kept[0].image);

  console.log(`\n${pass} passed, ${fail} failed`);
  failures.forEach((f) => console.log(f));
  process.exit(fail ? 1 : 0);
})();
