// Node verification for the OCR service's node-reachable branches (review #9 noted
// it had no JS test). The native-module-present branches (real text / empty text)
// run only on a device build and are exercised in the physical S24 scan test.
// Run: node src/services/ocrService.test.js  (wired into `npm test`)

const ocr = require('./ocrService.js');

let pass = 0, fail = 0;
const failures = [];
const check = (name, cond, detail = '') => {
  if (cond) pass++;
  else { fail++; failures.push(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`); }
};

(async () => {
  // In plain node the native 'nyara-ocr' module can't resolve → unavailable path.
  check('ocrAvailable() is false without the native module', ocr.ocrAvailable() === false);

  // No image → explicit error, never a silent empty result.
  let threw = '';
  try { await ocr.recognizeIngredientText(''); } catch (e) { threw = e.message; }
  check('recognizeIngredientText("") throws No image', /no image/i.test(threw), threw);

  threw = '';
  try { await ocr.recognizeIngredientText(null); } catch (e) { threw = e.message; }
  check('recognizeIngredientText(null) throws', !!threw);

  // With a uri but no native module → honest "needs a dev build / not installed" error,
  // not a crash and not a fake result.
  threw = '';
  try { await ocr.recognizeIngredientText('file:///x.jpg'); } catch (e) { threw = e.message; }
  check('unavailable module → honest capability error', /dev(elopment)? build|not installed|native/i.test(threw), threw);

  console.log(`\n${pass} passed, ${fail} failed`);
  failures.forEach((f) => console.log(f));
  process.exit(fail ? 1 : 0);
})();
