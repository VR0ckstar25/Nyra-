// result.jsx — THE core surface (locked layout, Transfer Note §6) + demo data.
// Composes: match bars → info card → Could Not Verify → footer → emoji rating.
// Match bars carry a UNIVERSAL amber dot; bar tint = category only.

const Chevron = ({ c = T.ink3, s = 16 }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3.5L10.5 8 6 12.5"/></svg>
);

// confidence meter — calm, never alarming
function Confidence({ level }) {
  const n = level === 'High' ? 3 : level === 'Medium' ? 2 : 1;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ display: 'inline-flex', gap: 3 }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ width: 14, height: 5, borderRadius: 3,
            background: i < n ? T.ink2 : T.line }} />
        ))}
      </span>
      <span style={{ fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, color: T.ink2 }}>{level} confidence</span>
    </span>
  );
}

// profile attribution tag (family session)
function ProfileTag({ name, isChild }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 22, padding: '0 9px 0 6px',
      borderRadius: 999, background: 'rgba(255,255,255,.7)', boxShadow: `inset 0 0 0 1px ${T.line}`,
      fontFamily: T.sans, fontSize: 11.5, fontWeight: 700, color: T.ink2 }}>
      <span style={{ width: 14, height: 14, borderRadius: '50%', display: 'grid', placeItems: 'center',
        background: isChild ? '#E7D9C4' : T.accentSoft, color: isChild ? '#8A6B3D' : T.accentDeep,
        fontSize: 8.5, fontWeight: 800 }}>{name[0]}</span>
      {name}
    </span>
  );
}

// ── Match bar — variant: 'tint' (default) | 'edge' | 'minimal' ──
function MatchBar({ data, variant = 'tint', onOpen, child = false }) {
  const pal = T[data.cat];
  const labelColor = child ? T.ink : pal.label;
  const headFs = child ? 16 : 13.5;

  const wrapBase = { borderRadius: 18, overflow: 'hidden' };
  const wrap = {
    tint:   { ...wrapBase, background: pal.tint, boxShadow: `inset 0 0 0 1px ${pal.edge}, 0 2px 12px rgba(70,45,20,.06)` },
    edge:   { ...wrapBase, background: T.surface, boxShadow: T.shadowSoft, display: 'flex' },
    minimal:{ ...wrapBase, background: T.surface, boxShadow: `inset 0 0 0 1px ${T.line}` },
  }[variant];

  const Items = (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {data.items.map((it, i) => (
        <button key={i} className="fs-tap" onClick={() => onOpen(data, it)}
          style={{ display: 'flex', alignItems: 'flex-start', gap: 12, textAlign: 'left',
            padding: child ? '15px 4px' : '13px 4px', borderTop: i ? `1px solid ${variant === 'tint' ? pal.edge : T.lineSoft}` : 'none',
            background: 'transparent', width: '100%' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* common name ALWAYS larger than technical name; technical sits directly below */}
            <div style={{ fontFamily: T.sans, fontWeight: 700, fontSize: child ? 21 : 18,
              color: T.ink, letterSpacing: -.2, lineHeight: 1.15 }}>{it.common}</div>
            {it.technical && !child && (
              <div style={{ fontFamily: T.sans, fontWeight: 500, fontSize: 13.5, color: T.ink2, marginTop: 2 }}>
                ({it.technical})
              </div>
            )}
            {it.note && (
              <div style={{ fontFamily: T.sans, fontSize: 13.5, color: T.ink2, marginTop: 3 }}>{it.note}</div>
            )}
            {it.profiles && (
              <div style={{ display: 'flex', gap: 6, marginTop: 9, flexWrap: 'wrap' }}>
                {it.profiles.map((p) => <ProfileTag key={p.name} name={p.name} isChild={p.child} />)}
              </div>
            )}
          </div>
          <span style={{ marginTop: 4 }}><Chevron c={labelColor} /></span>
        </button>
      ))}
    </div>
  );

  const Header = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
      <AmberDot size={child ? 16 : 14} />
      <span style={{ fontFamily: T.sans, fontWeight: 700, fontSize: headFs, letterSpacing: child ? 0 : .3,
        textTransform: child ? 'none' : 'uppercase', color: labelColor }}>{child ? data.childLabel : data.label}</span>
    </div>
  );

  if (variant === 'edge') {
    return (
      <div style={wrap}>
        <div style={{ width: 6, flex: '0 0 6px', background: pal.strong }} />
        <div style={{ flex: 1, padding: '15px 16px 9px' }}>{Header}{Items}</div>
      </div>
    );
  }
  return <div style={{ ...wrap, padding: variant === 'minimal' ? '15px 16px 9px' : '16px 17px 10px' }}>{Header}{Items}</div>;
}

// ── Info card — slides up when a finding is tapped (§6.2) ──
function InfoCard({ open, finding, item, onClose }) {
  if (!finding) return null;
  const pal = T[finding.cat];
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 40,
      display: open ? 'flex' : 'none', flexDirection: 'column', justifyContent: 'flex-end',
      background: 'rgba(30,24,16,.34)', animation: 'fs-fade .2s both' }}>
      <div onClick={(e) => e.stopPropagation()} className="fs-scroll"
        style={{ background: T.surface, borderRadius: '24px 24px 0 0', maxHeight: '86%',
          boxShadow: T.shadowLift, animation: 'fs-sheet-up .34s cubic-bezier(.2,.8,.25,1) both',
          padding: '10px 22px 30px' }}>
        <div style={{ width: 40, height: 5, borderRadius: 3, background: T.line, margin: '0 auto 16px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
          <AmberDot />
          <span style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: pal.label }}>{finding.label}</span>
        </div>

        {/* common name large, technical in parentheses below */}
        <div style={{ fontFamily: T.serif, fontWeight: 600, fontSize: 32, lineHeight: 1.05, color: T.ink, letterSpacing: -.4 }}>{item.common}</div>
        {item.technical && (
          <div style={{ fontFamily: T.sans, fontSize: 15, color: T.ink2, marginTop: 5 }}>({item.technical})</div>
        )}

        {/* derivative context sentence */}
        {item.derivative && (
          <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 12, background: pal.tint,
            fontFamily: T.sans, fontSize: 14.5, lineHeight: 1.5, color: pal.ink }}>{item.derivative}</div>
        )}

        {/* also labeled as — masking layer */}
        {item.aka && (
          <div style={{ marginTop: 16 }}>
            <Overline>Also labeled as</Overline>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 9 }}>
              {item.aka.map((a) => (
                <span key={a} style={{ fontFamily: T.sans, fontSize: 13.5, fontWeight: 600, color: T.ink2,
                  padding: '5px 11px', borderRadius: 999, background: T.surfaceWarm, boxShadow: `inset 0 0 0 1px ${T.line}` }}>{a}</span>
              ))}
            </div>
          </div>
        )}

        {/* plain-language description — CONTENT PENDING, held gracefully */}
        <div style={{ marginTop: 20 }}>
          <Overline>What it is</Overline>
          <div style={{ marginTop: 9 }}>
            <PendingBlock lines={3} label="Content pending · Content Library v1.1" />
          </div>
        </div>

        {/* correlation to declared profile + confidence */}
        <div style={{ marginTop: 18, padding: '15px 16px', borderRadius: 14, background: T.surfaceWarm, boxShadow: `inset 0 0 0 1px ${T.line}` }}>
          <Overline>In your profile</Overline>
          <div style={{ fontFamily: T.sans, fontSize: 15, lineHeight: 1.5, color: T.ink, margin: '8px 0 12px' }}>{item.correlation}</div>
          <Confidence level={item.confidence} />
        </div>

        <div style={{ fontFamily: T.mono, fontSize: 10.5, color: T.ink3, textAlign: 'center', marginTop: 18, lineHeight: 1.5 }}>
          Reflects your declared profile. Not medical or safety advice.
        </div>
        <div style={{ marginTop: 16 }}>
          <Btn variant="secondary" onClick={onClose}>Close</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Could Not Verify zone (§6.3) ──
function CouldNotVerify({ data }) {
  return (
    <div>
      <Divider style={{ margin: '6px 0 18px' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <span style={{ width: 26, height: 26, borderRadius: 8, background: T.surface, boxShadow: `inset 0 0 0 1.5px ${T.line}`,
          display: 'grid', placeItems: 'center', color: T.ink3 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M7 1.5l5.5 3v5L7 12.5 1.5 9.5v-5L7 1.5z"/><path d="M7 7v.01M7 4.2v1.6" /></svg>
        </span>
        <span style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 16, color: T.ink }}>Could not verify</span>
      </div>
      <div style={{ fontFamily: T.sans, fontSize: 13.5, color: T.ink2, lineHeight: 1.5, marginBottom: 14 }}>
        We couldn’t match these against your profile yet. They aren’t findings — just ingredients we don’t have full information on.
      </div>
      {data.map((g, gi) => (
        <div key={gi} style={{ marginBottom: gi < data.length - 1 ? 14 : 0 }}>
          <div style={{ fontFamily: T.mono, fontSize: 10.5, letterSpacing: .6, textTransform: 'uppercase', color: T.ink3, marginBottom: 8 }}>{g.tier}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {g.items.map((n) => (
              <span key={n} style={{ fontFamily: T.sans, fontSize: 14.5, fontWeight: 500, color: T.unknown.ink,
                padding: '7px 12px', borderRadius: 10, background: T.surface, boxShadow: `inset 0 0 0 1px ${T.line}` }}>{n}</span>
            ))}
          </div>
          {g.connectivity && (
            <button className="fs-press" style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 7,
              fontFamily: T.sans, fontSize: 13, fontWeight: 600, color: T.accent }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M6.5 2v4.5l3 1.5M6.5 12A5.5 5.5 0 1 1 12 6.5"/></svg>
              Check for an update
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Footer (§6.4) — disclaimer verbatim placeholder, currency, report link ──
function ResultFooter() {
  return (
    <div style={{ marginTop: 4 }}>
      {/* verbatim disclaimer — exact wording owned by Content Library, never altered */}
      <div style={{ borderRadius: 12, background: T.surfaceWarm, border: `1px dashed ${T.line}`, padding: '13px 14px' }}>
        <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: .8, textTransform: 'uppercase', color: T.ink3, marginBottom: 8 }}>Mandatory disclaimer · placed verbatim</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {['96%', '100%', '74%'].map((w, i) => <div key={i} style={{ height: 8, borderRadius: 4, background: T.lineSoft, width: w }} />)}
        </div>
      </div>
      <div style={{ fontFamily: T.mono, fontSize: 11, color: T.ink3, lineHeight: 1.7, marginTop: 14 }}>
        Database current as of 28 May 2026.<br />Always check the original packaging.
      </div>
      <button className="fs-press" style={{ marginTop: 12, fontFamily: T.sans, fontSize: 13.5, fontWeight: 600,
        color: T.accent, textDecoration: 'underline', textUnderlineOffset: 3 }}>Report a labeling error</button>
    </div>
  );
}

// ── Emoji rating + rotating micro-confirmation (§6.5, §8) ──
const MICRO_CONFIRMS = [
  'Thanks — that helps us read labels better for you.',
  'Noted. Your record just got a little richer.',
  'Got it. We’ll keep this in mind next time.',
  'Appreciated. This is saved to your diary.',
  'Thank you for telling us.',
  'Logged. Your history keeps growing.',
];
function EmojiRating() {
  const [picked, setPicked] = React.useState(null);
  const [msg, setMsg] = React.useState('');
  const recent = React.useRef([]);
  const faces = ['😟', '🙁', '😐', '🙂', '😊'];
  const pick = (i) => {
    setPicked(i);
    let pool = MICRO_CONFIRMS.map((_, k) => k).filter((k) => !recent.current.includes(k));
    if (!pool.length) pool = MICRO_CONFIRMS.map((_, k) => k);
    const k = pool[Math.floor(Math.random() * pool.length)];
    recent.current = [...recent.current, k].slice(-5); // no repeat within 5
    setMsg(MICRO_CONFIRMS[k]);
  };
  return (
    <div style={{ borderRadius: 18, background: T.surface, boxShadow: T.shadowSoft, padding: '18px 18px 20px', textAlign: 'center' }}>
      {picked == null ? (
        <React.Fragment>
          <div style={{ fontFamily: T.serif, fontSize: 17, color: T.ink, marginBottom: 3 }}>How was this scan?</div>
          <div style={{ fontFamily: T.sans, fontSize: 12.5, color: T.ink3, marginBottom: 14 }}>Optional — scroll past any time</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
            {faces.map((f, i) => (
              <button key={i} className="fs-press" onClick={() => pick(i)}
                style={{ width: 50, height: 50, borderRadius: 14, fontSize: 26, background: T.surfaceWarm,
                  boxShadow: `inset 0 0 0 1px ${T.line}` }}>{f}</button>
            ))}
          </div>
        </React.Fragment>
      ) : (
        <div style={{ animation: 'fs-pop .4s both', padding: '6px 0' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>{faces[picked]}</div>
          <div style={{ fontFamily: T.serif, fontSize: 17, lineHeight: 1.4, color: T.ink, maxWidth: 260, margin: '0 auto' }}>{msg}</div>
        </div>
      )}
    </div>
  );
}

// ── Demo scenario data (multiple findings) ──
const DEMO = {
  product: 'Harvest Trail Granola Bar',
  brand: 'Field & Oat Co.',
  findings: [
    { cat: 'allergen', label: 'Allergen match', childLabel: 'Things you’re allergic to',
      items: [
        { common: 'Peanuts', technical: 'Arachis hypogaea', derivative: 'Listed on this label as “peanuts.”',
          aka: ['groundnuts', 'pindar', 'mandelona', 'arachis oil'],
          profiles: [{ name: 'Maya' }, { name: 'Theo', child: true }],
          correlation: 'Matches Peanuts on 2 profiles in this session — Maya and Theo.', confidence: 'High' },
        { common: 'Almonds', technical: 'Prunus dulcis', derivative: 'A tree nut listed in this product’s nut blend.',
          aka: ['ground almonds', 'almond flour', 'marzipan'],
          profiles: [{ name: 'Maya' }],
          correlation: 'Matches Tree nuts on Maya’s profile.', confidence: 'High' },
      ] },
    { cat: 'intoler', label: 'Intolerance note', childLabel: 'Things that upset your tummy',
      items: [
        { common: 'Milk', technical: 'whey, milk solids', derivative: 'Appears here as “whey,” which comes from milk.',
          aka: ['whey', 'casein', 'milk solids', 'lactose'],
          profiles: [{ name: 'Maya' }],
          correlation: 'Relates to Lactose on Maya’s profile.', confidence: 'Medium' },
      ] },
    { cat: 'goal', label: 'May not align with your goals', childLabel: 'Things you’re cutting back on',
      items: [
        { common: 'Added sugars', technical: 'cane sugar, glucose syrup', derivative: 'Two added sweeteners appear in the first five ingredients.',
          note: 'Relates to your goal: lower added sugar.',
          correlation: 'You set a goal to lower added sugar. This product lists two added sweeteners early in the ingredients.', confidence: 'Medium' },
      ] },
  ],
  unverified: [
    { tier: 'Not in our database', items: ['Natural flavoring', 'Rosemary extract'] },
    { tier: 'Database updating — check back soon', items: ['Mixed tocopherols'], connectivity: true },
  ],
};

Object.assign(window, { MatchBar, InfoCard, CouldNotVerify, ResultFooter, EmojiRating, Confidence, ProfileTag, Chevron, DEMO });
