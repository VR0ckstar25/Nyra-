// languageCheck.js — honest capability boundary (founder decision 2026-06-18):
// Nyara's matcher only understands English ingredient terms. When a label looks
// like it's in another language/script we must SAY SO rather than silently return
// "nothing found" (which a user could mistake for "safe"). Pure + testable.

// Scripts the matcher cannot read at all — any significant presence = not English.
const NON_LATIN = /[Ѐ-ӿ֐-׿؀-ۿऀ-ॿ぀-ヿ㐀-鿿가-힯]/g;

// Returns an honest notice string if the text looks unreadable to our English-only
// matcher, else null. Conservative: only fires on a clear signal, never on normal
// English (which may contain the odd accented loan-word like "café" or "açaí").
export function nonEnglishNotice(text) {
  const raw = String(text || '').trim();
  if (raw.length < 3) return null;
  const letters = (raw.match(/\p{L}/gu) || []).length;
  if (!letters) return null; // digits/symbols only — not a language problem
  const nonLatin = (raw.match(NON_LATIN) || []).length;
  const latin = (raw.match(/[a-z]/gi) || []).length;
  // Trigger when a meaningful share of letters are non-Latin script, OR the text has
  // letters but almost no Latin letters at all.
  const nonLatinShare = nonLatin / letters;
  if (nonLatinShare >= 0.2 || (letters >= 6 && latin / letters < 0.4)) {
    return 'This label doesn’t look like English. Nyara can only read English ingredient labels right now, so it may have missed things — please check the original packaging.';
  }
  return null;
}
