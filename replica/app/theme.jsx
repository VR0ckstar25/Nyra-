// theme.jsx — Anvara — shared design tokens + atoms.
// Exports to window so sibling babel scripts can use them.
// CONSTRAINTS ENCODED HERE (from Transfer Note v1.0):
//  • amber filled circle = "finding present" on EVERY match bar (universal indicator)
//  • bar tint differentiates category only: allergen=amber, intolerance=orange, goal=blue-gray
//  • NO red, NO green, NO scores/grades, NO safe-vs-unsafe. Mirror principle.

const T = {
  // — bright spring base (airy, fresh — not warm/cardboard) —
  bg:        '#E9F3FB',
  bgDeep:    '#D6E8F6',
  surface:   '#FFFFFF',
  surfaceWarm:'#F4FAFE',
  card:      '#FFFFFF',
  ink:       '#222932',   // cool near-black
  ink2:      '#5C6471',   // secondary
  ink3:      '#97A1AE',   // tertiary / placeholder
  line:      '#E2E8EF',   // cool hairline
  lineSoft:  '#EDF1F6',

  // — single vibrant primary accent (bright azure; NOT a semantic color) —
  accent:    '#1E86E0',
  accentDeep:'#1567B4',
  accentSoft:'#DCEBFA',
  accentTint:'#EFF6FD',

  // — universal "finding present" indicator (rich golden amber) —
  amber:     '#E89318',

  // — semantic bar palettes (tint/border/strong/ink) —
  allergen:  { tint:'#FDEBC9', edge:'#F4CE83', strong:'#D2870F', ink:'#7E5410', label:'#96640F' },
  intoler:   { tint:'#FBE2CC', edge:'#F1C198', strong:'#CA6A2C', ink:'#7E3E1A', label:'#A1531F' },
  goal:      { tint:'#E7E9F1', edge:'#CCD1E0', strong:'#6A7396', ink:'#414B66', label:'#4D5772' },
  unknown:   { ink:'#8E857A' },

  // type
  serif: "'Source Serif 4', Georgia, serif",
  sans:  "'Hanken Grotesk', -apple-system, system-ui, sans-serif",
  mono:  "'Spline Sans Mono', ui-monospace, monospace",

  radius: 18,
  shadowCard: '0 1px 2px rgba(53,40,24,.05), 0 8px 24px rgba(53,40,24,.07)',
  shadowSoft: '0 1px 2px rgba(53,40,24,.04), 0 2px 8px rgba(53,40,24,.05)',
  shadowLift: '0 -2px 12px rgba(53,40,24,.05), 0 16px 48px rgba(53,40,24,.14)',
};

const PHONE_W = 390;

// One-time base CSS
if (typeof document !== 'undefined' && !document.getElementById('fs-theme')) {
  const s = document.createElement('style');
  s.id = 'fs-theme';
  s.textContent = `
    .fs-root, .fs-root *{ box-sizing:border-box; }
    .fs-root{ font-family:${T.sans}; color:${T.ink}; -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility; }
    .fs-root button{ font-family:inherit; cursor:pointer; border:none; background:none; }
    .fs-scroll{ overflow-y:auto; overflow-x:hidden; -webkit-overflow-scrolling:touch; }
    .fs-scroll::-webkit-scrollbar{ width:0; display:none; }
    .fs-scroll{ scrollbar-width:none; }
    .fs-press{ transition:transform .12s ease, background .15s ease, box-shadow .15s ease; }
    .fs-press:active{ transform:scale(.975); }
    .fs-tap{ transition:background .14s ease, border-color .14s ease, transform .12s ease; }
    @keyframes fs-fade-up{ from{opacity:0; transform:translateY(10px);} to{opacity:1; transform:none;} }
    @keyframes fs-fade{ from{opacity:0;} to{opacity:1;} }
    @keyframes fs-sheet-up{ from{transform:translateY(100%);} to{transform:translateY(0);} }
    @keyframes fs-pulse{ 0%,100%{opacity:.55;} 50%{opacity:1;} }
    @keyframes fs-scanline{ 0%{transform:translateY(0);} 100%{transform:translateY(232px);} }
    @keyframes fs-spin{ to{ transform:rotate(360deg);} }
    @keyframes fs-pop{ 0%{transform:scale(.6); opacity:0;} 60%{transform:scale(1.08);} 100%{transform:scale(1); opacity:1;} }
    .fs-anim-up{ animation:fs-fade-up .5s cubic-bezier(.2,.7,.3,1) both; }
  `;
  document.head.appendChild(s);
}

// ── Phone screen container (no bezel — just a rounded screen) ──
function PhoneScreen({ children, bg, scroll = true, pad = false, style = {}, innerRef }) {
  return (
    <div className="fs-root" style={{ width: PHONE_W, height: '100%', background: bg || T.bg,
      display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', ...style }}>
      <div ref={innerRef} className={scroll ? 'fs-scroll' : ''}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0,
          padding: pad ? '0 22px' : 0 }}>
        {children}
      </div>
    </div>
  );
}

// ── Minimal status bar (no device bezel, just the screen's top row) ──
function StatusBar({ dark = false, time = '9:41' }) {
  const c = dark ? 'rgba(255,255,255,.92)' : T.ink;
  return (
    <div style={{ height: 44, flex: '0 0 44px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '0 24px', color: c }}>
      <span style={{ fontFamily: T.sans, fontWeight: 600, fontSize: 14.5, letterSpacing: .2 }}>{time}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width="17" height="11" viewBox="0 0 17 11" fill={c}><rect x="0" y="6" width="3" height="5" rx="1"/><rect x="4.5" y="4" width="3" height="7" rx="1"/><rect x="9" y="2" width="3" height="9" rx="1"/><rect x="13.5" y="0" width="3" height="11" rx="1"/></svg>
        <svg width="22" height="11" viewBox="0 0 22 11" fill="none"><rect x="1" y="1" width="18" height="9" rx="2.5" stroke={c} strokeOpacity=".5"/><rect x="3" y="3" width="13" height="5" rx="1" fill={c}/><rect x="20" y="3.5" width="1.5" height="4" rx="1" fill={c} fillOpacity=".5"/></svg>
      </div>
    </div>
  );
}

// ── Universal "finding present" amber circle ──
function AmberDot({ size = 14 }) {
  return <span style={{ width: size, height: size, borderRadius: '50%', background: T.amber,
    boxShadow: `0 0 0 4px ${T.amber}22`, flex: '0 0 auto', display: 'inline-block' }} />;
}

// ── Primary / secondary / ghost button ──
function Btn({ children, onClick, variant = 'primary', full = true, size = 'lg', style = {}, disabled }) {
  const sz = size === 'lg' ? { h: 54, fs: 16.5, px: 24, r: 15 } : { h: 44, fs: 15, px: 18, r: 12 };
  const base = { height: sz.h, minHeight: 44, fontFamily: T.sans, fontWeight: 600, fontSize: sz.fs,
    borderRadius: sz.r, padding: `0 ${sz.px}px`, width: full ? '100%' : 'auto',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9,
    letterSpacing: .1, opacity: disabled ? .45 : 1, pointerEvents: disabled ? 'none' : 'auto' };
  const looks = {
    primary: { background: T.accent, color: '#FBF7EF', boxShadow: '0 2px 10px rgba(35,74,71,.22)' },
    secondary:{ background: T.surface, color: T.ink, boxShadow: `inset 0 0 0 1.5px ${T.line}` },
    soft:    { background: T.accentSoft, color: T.accentDeep },
    ghost:   { background: 'transparent', color: T.ink2 },
  }[variant];
  return <button className="fs-press" onClick={onClick} style={{ ...base, ...looks, ...style }}>{children}</button>;
}

// ── Removable chip (profile selections, family members) ──
function Chip({ children, onRemove, tone = 'neutral', size = 'md' }) {
  const tones = {
    neutral: { bg: T.surface, bd: T.line, fg: T.ink },
    accent:  { bg: T.accentSoft, bd: 'transparent', fg: T.accentDeep },
  }[tone];
  const sm = size === 'sm';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: sm ? 5 : 7,
      height: sm ? 30 : 38, padding: sm ? '0 10px' : `0 ${onRemove ? 8 : 14}px 0 14px`,
      borderRadius: 999, background: tones.bg, boxShadow: `inset 0 0 0 1.5px ${tones.bd}`,
      color: tones.fg, fontFamily: T.sans, fontWeight: 600, fontSize: sm ? 13 : 14.5 }}>
      {children}
      {onRemove && (
        <button className="fs-press" onClick={onRemove} aria-label="Remove"
          style={{ width: 24, height: 24, minWidth: 24, borderRadius: '50%', display: 'grid', placeItems: 'center',
            color: tones.fg, opacity: .65 }}>
          <svg width="11" height="11" viewBox="0 0 11 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M2 2l7 7M9 2l-7 7"/></svg>
        </button>
      )}
    </span>
  );
}

function Divider({ style }) { return <div style={{ height: 1, background: T.line, ...style }} />; }

// ── Bottom tab bar (app shell) ──
function TabBar({ active = 'scan', onChange = () => {} }) {
  const items = [
    ['scan', 'Scan', (c) => <g fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8V6.2A2.2 2.2 0 0 1 5.2 4H7l1.2-1.6h4.6L14 4h1.8A2.2 2.2 0 0 1 18 6.2V8"/><rect x="3" y="8" width="15" height="9.5" rx="2.4"/><circle cx="10.5" cy="12.6" r="3"/></g>],
    ['log', 'Diary', (c) => <g fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="4" width="14" height="13.5" rx="2.4"/><path d="M3.5 8h14M7 2.6v2.8M14 2.6v2.8"/><circle cx="7.4" cy="11.6" r="1" fill={c} stroke="none"/><circle cx="10.5" cy="11.6" r="1" fill={c} stroke="none"/><circle cx="13.6" cy="11.6" r="1" fill={c} stroke="none"/></g>],
    ['patterns', 'Patterns', (c) => <g fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 17V9.5M8 17V4.5M12.5 17v-5M17 17V7.5"/></g>],
    ['profile', 'Profile', (c) => <g fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="10.5" cy="7.5" r="3.4"/><path d="M4.5 17.4c.7-3.3 3.1-5 6-5s5.3 1.7 6 5"/></g>],
  ];
  return (
    <div style={{ flex: '0 0 auto', display: 'flex', background: 'rgba(255,255,255,.86)',
      backdropFilter: 'blur(14px)', borderTop: `1px solid ${T.line}`, padding: '8px 8px 22px' }}>
      {items.map(([key, label, icon]) => {
        const on = active === key;
        const c = on ? T.accent : T.ink3;
        return (
          <button key={key} className="fs-press" onClick={() => onChange(key)}
            style={{ flex: 1, minHeight: 44, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '4px 0' }}>
            <svg width="21" height="21" viewBox="0 0 21 21">{icon(c)}</svg>
            <span style={{ fontSize: 10.5, fontWeight: on ? 700 : 600, color: c, letterSpacing: .2 }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// little label-overline
function Overline({ children, color }) {
  return <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase',
    color: color || T.ink3, fontWeight: 500 }}>{children}</div>;
}

// graceful CONTENT PENDING placeholder block
function PendingBlock({ lines = 3, label = 'Content pending', style = {} }) {
  return (
    <div style={{ borderRadius: 12, background: T.surfaceWarm, border: `1px dashed ${T.line}`,
      padding: '14px 15px', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.ink3 }} />
        <span style={{ fontFamily: T.mono, fontSize: 10.5, letterSpacing: .8, textTransform: 'uppercase', color: T.ink3 }}>{label}</span>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} style={{ height: 9, borderRadius: 5, marginBottom: 8, background: T.lineSoft,
          width: i === lines - 1 ? '62%' : ['96%', '88%', '92%', '80%'][i % 4] }} />
      ))}
    </div>
  );
}

// ── Global "info to be added" sheet ───────────────────────────────────────
// Any screen can call window.openInfo({ title, sub, lines, body }) to surface a
// bottom sheet. Used for every interaction whose real content/behaviour is still
// pending the founder's sign-off — so the flow is fully clickable, and each tap
// honestly says what still needs to be decided rather than going nowhere.
const INFO = { fn: null };
window.openInfo = (payload) => { if (INFO.fn) INFO.fn(payload || {}); };

function InfoSheet() {
  const [data, setData] = React.useState(null);
  React.useEffect(() => { INFO.fn = setData; return () => { INFO.fn = null; }; }, []);
  if (!data) return null;
  const close = () => setData(null);
  return (
    <div onClick={close} style={{ position: 'absolute', inset: 0, zIndex: 50,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      background: 'rgba(30,24,16,.34)', animation: 'fs-fade .2s both' }}>
      <div onClick={(e) => e.stopPropagation()} className="fs-scroll"
        style={{ background: T.surface, borderRadius: '24px 24px 0 0', maxHeight: '86%',
          boxShadow: T.shadowLift, animation: 'fs-sheet-up .34s cubic-bezier(.2,.8,.25,1) both',
          padding: '10px 22px 30px' }}>
        <div style={{ width: 40, height: 5, borderRadius: 3, background: T.line, margin: '0 auto 18px' }} />
        <div style={{ fontFamily: T.serif, fontWeight: 600, fontSize: 26, lineHeight: 1.1, color: T.ink, letterSpacing: -.4 }}>
          {data.title || 'Coming soon'}
        </div>
        {data.sub && (
          <div style={{ fontFamily: T.sans, fontSize: 14.5, lineHeight: 1.5, color: T.ink2, marginTop: 8 }}>{data.sub}</div>
        )}
        <div style={{ marginTop: 18 }}>
          {data.body || <PendingBlock lines={data.lines || 3} label="Info to be added" />}
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 10.5, color: T.ink3, textAlign: 'center', marginTop: 18, lineHeight: 1.5 }}>
          Structure & flow only — final content is pending sign-off.
        </div>
        <div style={{ marginTop: 16 }}>
          <Btn variant="secondary" onClick={close}>Close</Btn>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { T, PHONE_W, PhoneScreen, StatusBar, AmberDot, Btn, Chip, Divider, TabBar, Overline, PendingBlock, InfoSheet });
