// introContent.js — first-run intro slides (pure data so it's node-testable).
// Teaches the Mirror Principle before sign-up; stays verdict-free and honest.
export const INTRO_SLIDES = [
  {
    key: 'reflect',
    title: 'A mirror, not a judge',
    body: 'Tell Nyara what you avoid. Scan a label, and we reflect what is inside it against your list. We never call a product good or bad and never give a score — you stay in charge of the call.',
    points: ['You set what matters', 'We show what we found', 'You decide'],
  },
  {
    key: 'three-answers',
    title: 'Three honest answers',
    body: 'Every item we surface is one of three things — never a green light.',
    points: ['Contains — it is listed on the label', 'May contain — a “may contain” / shared-line note', 'Could not verify — we could not read or confirm it'],
  },
  {
    key: 'honesty',
    title: 'We tell you what we don’t know',
    body: 'The ingredient data is still in draft and English-only for now, and a scan can miss text. When we are unsure, we say so — and we always point you back to the original package.',
    points: ['Draft data, clearly flagged', 'Photos stay on your phone', 'Always check the packaging'],
  },
];
