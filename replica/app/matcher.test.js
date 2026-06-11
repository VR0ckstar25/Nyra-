// NON-AUTHORITATIVE. The replica is a visual/flow reference only; its matcher.js
// is a frozen early prototype and will lag the real engine. The authoritative
// matcher + its regression suite live in the production React Native app:
//
//     cd sfis-app && npm run test:match     (sfis-app/src/match/scanMatch.test.js)
//
// Do not treat results from the replica matcher as truth. This stub exits 0 so it
// can't masquerade as a failing source-of-truth test.
console.log('SKIP: replica matcher is non-authoritative — run `cd sfis-app && npm run test:match`.');
process.exit(0);
