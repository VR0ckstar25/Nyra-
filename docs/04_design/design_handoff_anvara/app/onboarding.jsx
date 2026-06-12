// onboarding.jsx — pre-scan flow screens: Welcome, Profile question,
// Email, Camera capture (with family session), Processing.

// shared header with optional Skip (never guilt-inducing) + progress dots
function FlowHeader({ onBack, onSkip, step, total, dark }) {
  const c = dark ? 'rgba(255,255,255,.9)' : T.ink;
  return (
    <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 20px 10px' }}>
      {onBack ? (
        <button className="fs-press" onClick={onBack} style={{ width: 40, height: 40, borderRadius: 12, display: 'grid', placeItems: 'center', color: c }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M11 3.5L5.5 9l5.5 5.5"/></svg>
        </button>
      ) : <div style={{ width: 40 }} />}
      {total && (
        <div style={{ display: 'flex', gap: 6 }}>
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} style={{ width: i === step ? 22 : 7, height: 7, borderRadius: 4, transition: 'width .3s',
              background: i === step ? T.accent : (dark ? 'rgba(255,255,255,.3)' : T.line) }} />
          ))}
        </div>
      )}
      {onSkip ? (
        <button className="fs-press" onClick={onSkip} style={{ fontFamily: T.sans, fontSize: 14.5, fontWeight: 600, color: dark ? 'rgba(255,255,255,.8)' : T.ink2, padding: '8px 10px', minHeight: 40 }}>Skip</button>
      ) : <div style={{ width: 40 }} />}
    </div>
  );
}

// ── Welcome ──
function WelcomeScreen({ onNext }) {
  return (
    <PhoneScreen bg={T.bg} scroll={false}>
      <StatusBar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 26px 30px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* logo mark — simple geometric, calm */}
          <div style={{ width: 56, height: 56, borderRadius: 17, background: T.accent, display: 'grid', placeItems: 'center', marginBottom: 28, boxShadow: '0 6px 18px rgba(35,74,71,.25)' }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#FBF7EF" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="7"/><path d="M17.5 17.5L23 23"/></svg>
          </div>
          <h1 style={{ fontFamily: T.serif, fontWeight: 600, fontSize: 38, lineHeight: 1.08, letterSpacing: -.8, color: T.ink, margin: 0 }}>
            Shop with a<br />little less worry.
          </h1>
          <p style={{ fontFamily: T.sans, fontSize: 17, lineHeight: 1.55, color: T.ink2, margin: '18px 0 0', maxWidth: 320 }}>
            Scan a label and we’ll quietly reflect what’s inside against the things you and your family care about. No verdicts — just what’s there.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          <Btn onClick={onNext}>Get started</Btn>
          <Btn variant="ghost" onClick={onNext}>I already have an account</Btn>
        </div>
      </div>
    </PhoneScreen>
  );
}

// ── Profile question (tile grid + search + chips + severity) ──
const ALLERGEN_TILES = ['Peanuts', 'Tree nuts', 'Milk', 'Eggs', 'Wheat', 'Soy', 'Fish', 'Shellfish', 'Sesame', 'Gluten', 'Mustard', 'Celery'];
const SEVERITIES = ['Mild', 'Moderate', 'Severe'];

function ProfileScreen({ onNext, onBack }) {
  const [sel, setSel] = React.useState({ Peanuts: 'Severe', 'Tree nuts': 'Severe', Milk: 'Mild' });
  const [q, setQ] = React.useState('');
  const toggle = (name) => setSel((s) => { const n = { ...s }; if (n[name]) delete n[name]; else n[name] = 'Moderate'; return n; });
  const setSev = (name, sv) => setSel((s) => ({ ...s, [name]: sv }));
  const suggestions = q.length > 0 ? ['Lupin', 'Sulphites', 'Pine nuts', 'Coconut'].filter((x) => x.toLowerCase().includes(q.toLowerCase())) : [];

  return (
    <PhoneScreen bg={T.bg} scroll={false}>
      <StatusBar />
      <FlowHeader onBack={onBack} onSkip={onNext} step={1} total={4} />
      <div className="fs-scroll" style={{ flex: 1, padding: '6px 22px 14px' }}>
        <h2 style={{ fontFamily: T.serif, fontWeight: 600, fontSize: 27, lineHeight: 1.15, letterSpacing: -.4, color: T.ink, margin: '0 0 6px' }}>
          What should we watch for?
        </h2>
        <p style={{ fontFamily: T.sans, fontSize: 15, color: T.ink2, margin: '0 0 18px', lineHeight: 1.45 }}>
          Pick any allergens. You can add intolerances and goals next.
        </p>

        {/* search w/ auto-suggest */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 50, padding: '0 16px', borderRadius: 14, background: T.surface, boxShadow: `inset 0 0 0 1.5px ${T.line}` }}>
            <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke={T.ink3} strokeWidth="1.7" strokeLinecap="round"><circle cx="7.5" cy="7.5" r="5"/><path d="M11.5 11.5L15 15"/></svg>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ingredients…"
              style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontFamily: T.sans, fontSize: 15.5, color: T.ink }} />
          </div>
          {suggestions.length > 0 && (
            <div style={{ position: 'absolute', top: 56, left: 0, right: 0, zIndex: 5, background: T.surface, borderRadius: 14, boxShadow: T.shadowCard, overflow: 'hidden' }}>
              {suggestions.map((s) => (
                <button key={s} className="fs-tap" onClick={() => { toggle(s); setQ(''); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', padding: '13px 16px', fontFamily: T.sans, fontSize: 15, color: T.ink, borderBottom: `1px solid ${T.lineSoft}` }}>
                  <span style={{ fontSize: 18, color: T.accent, lineHeight: 1 }}>+</span>{s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* preset tile grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9, marginBottom: 20 }}>
          {ALLERGEN_TILES.map((name) => {
            const on = !!sel[name];
            return (
              <button key={name} className="fs-tap" onClick={() => toggle(name)}
                style={{ minHeight: 54, padding: '8px 6px', borderRadius: 13, fontFamily: T.sans, fontWeight: 600, fontSize: 13.5,
                  color: on ? T.accentDeep : T.ink, background: on ? T.accentSoft : T.surface,
                  boxShadow: on ? `inset 0 0 0 2px ${T.accent}` : `inset 0 0 0 1.5px ${T.line}` }}>
                {name}
              </button>
            );
          })}
        </div>

        {/* selected chips w/ severity prompt below each */}
        {Object.keys(sel).length > 0 && (
          <div>
            <Overline>Your selections · severity</Overline>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
              {Object.entries(sel).map(([name, sv]) => (
                <div key={name} style={{ background: T.surface, borderRadius: 14, padding: '12px 14px', boxShadow: `inset 0 0 0 1px ${T.line}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 16, color: T.ink }}>{name}</span>
                    <button className="fs-press" onClick={() => toggle(name)} aria-label="Remove" style={{ width: 28, height: 28, borderRadius: '50%', display: 'grid', placeItems: 'center', color: T.ink3 }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M2 2l8 8M10 2l-8 8"/></svg>
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 7, marginTop: 10 }}>
                    {SEVERITIES.map((s) => {
                      const on = sv === s;
                      return (
                        <button key={s} className="fs-tap" onClick={() => setSev(name, s)}
                          style={{ flex: 1, minHeight: 38, borderRadius: 10, fontFamily: T.sans, fontWeight: 600, fontSize: 13,
                            color: on ? '#FBF7EF' : T.ink2, background: on ? T.ink : T.surfaceWarm,
                            boxShadow: on ? 'none' : `inset 0 0 0 1px ${T.line}` }}>{s}</button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div style={{ flex: '0 0 auto', padding: '12px 22px 26px', background: 'linear-gradient(transparent, ' + T.bg + ' 28%)' }}>
        <Btn onClick={onNext}>Continue</Btn>
      </div>
    </PhoneScreen>
  );
}

// ── Email screen (transparent, purpose statement most prominent) ──
function EmailScreen({ onNext, onBack }) {
  const [email, setEmail] = React.useState('');
  return (
    <PhoneScreen bg={T.bg} scroll={false}>
      <StatusBar />
      <FlowHeader onBack={onBack} onSkip={onNext} step={2} total={4} />
      <div className="fs-scroll" style={{ flex: 1, padding: '10px 26px' }}>
        <h2 style={{ fontFamily: T.serif, fontWeight: 600, fontSize: 27, lineHeight: 1.15, letterSpacing: -.4, color: T.ink, margin: '0 0 22px' }}>
          Where should we keep your record?
        </h2>
        <label style={{ fontFamily: T.sans, fontSize: 13.5, fontWeight: 700, color: T.ink2, letterSpacing: .2 }}>Email address</label>
        {/* purpose statement = most prominent text after the field label */}
        <p style={{ fontFamily: T.serif, fontSize: 20, lineHeight: 1.4, color: T.ink, margin: '8px 0 16px' }}>
          We use this only to save your profile and sync your diary across devices.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', height: 54, padding: '0 16px', borderRadius: 14, background: T.surface, boxShadow: `inset 0 0 0 1.5px ${T.line}` }}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontFamily: T.sans, fontSize: 16, color: T.ink }} />
        </div>
        {/* verbatim disclosure — owned by Content Library */}
        <div style={{ marginTop: 16, borderRadius: 12, background: T.surfaceWarm, border: `1px dashed ${T.line}`, padding: '13px 14px' }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: .8, textTransform: 'uppercase', color: T.ink3, marginBottom: 8 }}>Email disclosure · placed verbatim</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {['92%', '100%', '68%'].map((w, i) => <div key={i} style={{ height: 8, borderRadius: 4, background: T.lineSoft, width: w }} />)}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, fontFamily: T.sans, fontSize: 13, color: T.ink2 }}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke={T.accent} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M7.5 1.5l5 2v4c0 3-2.2 5.2-5 6.5-2.8-1.3-5-3.5-5-6.5v-4l5-2z"/><path d="M5.3 7.5l1.6 1.6 3-3.2"/></svg>
          We never sell your data or send marketing.
        </div>
      </div>
      <div style={{ flex: '0 0 auto', padding: '12px 26px 26px' }}>
        <Btn onClick={onNext}>Continue</Btn>
      </div>
    </PhoneScreen>
  );
}

// ── Camera capture (guided, family session) ──
function CameraScreen({ onCapture, onBack }) {
  const [members, setMembers] = React.useState([{ name: 'Maya', child: false }, { name: 'Theo', child: true }]);
  const remove = (name) => setMembers((m) => m.filter((x) => x.name !== name));
  return (
    <PhoneScreen bg="#1C1A17" scroll={false}>
      <StatusBar dark />
      <FlowHeader onBack={onBack} dark />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 20px 20px' }}>
        {/* viewfinder */}
        <div style={{ flex: 1, borderRadius: 22, position: 'relative', overflow: 'hidden',
          background: 'repeating-linear-gradient(135deg, #2A2722 0 14px, #2D2A24 14px 28px)', minHeight: 280 }}>
          {/* faux label */}
          <div style={{ position: 'absolute', inset: '22% 18%', borderRadius: 10, background: 'rgba(244,238,228,.07)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.08)' }} />
          {/* flatness-detection corners (encouraging, not correcting) */}
          {[['8%','8%','tl'],['8%','8%','tr'],['8%','8%','bl'],['8%','8%','br']].map(([t,l,k],i)=>{
            const pos = { tl:{top:'8%',left:'8%'}, tr:{top:'8%',right:'8%'}, bl:{bottom:'8%',left:'8%'}, br:{bottom:'8%',right:'8%'} }[k];
            const rot = { tl:0, tr:90, bl:270, br:180 }[k];
            return <svg key={i} width="34" height="34" viewBox="0 0 34 34" fill="none" stroke="#E7B45A" strokeWidth="3" strokeLinecap="round" style={{ position:'absolute', ...pos, transform:`rotate(${rot}deg)` }}><path d="M3 14V5a2 2 0 0 1 2-2h9"/></svg>;
          })}
          {/* scan line */}
          <div style={{ position: 'absolute', left: '8%', right: '8%', top: '8%', height: 2, background: 'linear-gradient(90deg, transparent, #E7B45A, transparent)', animation: 'fs-scanline 2.4s ease-in-out infinite alternate' }} />
          {/* encouraging prompt */}
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 18, display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 15px', borderRadius: 999, background: 'rgba(20,18,15,.7)', backdropFilter: 'blur(8px)', fontFamily: T.sans, fontSize: 13.5, fontWeight: 600, color: '#F4EEE4' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#E7B45A', animation: 'fs-pulse 1.4s infinite' }} />
              Looking good — hold steady
            </div>
          </div>
        </div>

        {/* family allergen session */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
            <span style={{ fontFamily: T.sans, fontSize: 13, fontWeight: 700, color: 'rgba(244,238,228,.85)' }}>Scanning for this session</span>
            <button className="fs-press" style={{ fontFamily: T.sans, fontSize: 13, fontWeight: 600, color: '#E7B45A' }}>+ Add member</button>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {members.map((m) => (
              <span key={m.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 36, padding: '0 8px 0 8px', borderRadius: 999, background: 'rgba(244,238,228,.1)', color: '#F4EEE4', fontFamily: T.sans, fontWeight: 600, fontSize: 14 }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 800,
                  background: m.child ? '#E7D9C4' : T.accentSoft, color: m.child ? '#8A6B3D' : T.accentDeep }}>{m.name[0]}</span>
                {m.name}
                <button className="fs-press" onClick={() => remove(m.name)} aria-label="Remove" style={{ width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center', color: 'rgba(244,238,228,.6)' }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7"/></svg>
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* capture */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
          <button className="fs-press" onClick={onCapture} aria-label="Capture"
            style={{ width: 72, height: 72, borderRadius: '50%', background: '#F4EEE4', display: 'grid', placeItems: 'center', boxShadow: '0 0 0 4px rgba(244,238,228,.25)' }}>
            <span style={{ width: 58, height: 58, borderRadius: '50%', boxShadow: `inset 0 0 0 3px #1C1A17` }} />
          </button>
        </div>
      </div>
    </PhoneScreen>
  );
}

// ── Processing (engagement moment, plain language, user's own names) ──
function ProcessingScreen({ onDone }) {
  const steps = [
    'Reading the label…',
    'Looking for peanuts and almonds…',
    'Checking for milk…',
    'Comparing with your sugar goal…',
    'Putting your results together…',
  ];
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    if (i >= steps.length) { const t = setTimeout(onDone, 420); return () => clearTimeout(t); }
    const t = setTimeout(() => setI((x) => x + 1), i === 0 ? 700 : 760);
    return () => clearTimeout(t);
  }, [i]);
  return (
    <PhoneScreen bg={T.bg} scroll={false}>
      <StatusBar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 30px 40px' }}>
        {/* active ring */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 34 }}>
          <div style={{ width: 76, height: 76, position: 'relative' }}>
            <svg width="76" height="76" viewBox="0 0 76 76" style={{ animation: 'fs-spin 1.6s linear infinite' }}>
              <circle cx="38" cy="38" r="32" fill="none" stroke={T.line} strokeWidth="5" />
              <circle cx="38" cy="38" r="32" fill="none" stroke={T.accent} strokeWidth="5" strokeLinecap="round" strokeDasharray="50 160" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
              <AmberDot size={16} />
            </div>
          </div>
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: T.ink3, textAlign: 'center', marginBottom: 16 }}>Reading your label</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {steps.map((s, k) => {
            const done = k < i, active = k === i;
            return (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: k > i ? .32 : 1, transition: 'opacity .4s' }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', flex: '0 0 22px', display: 'grid', placeItems: 'center',
                  background: done ? T.accent : (active ? T.accentSoft : T.surface), boxShadow: done ? 'none' : `inset 0 0 0 1.5px ${T.line}` }}>
                  {done && <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="#FBF7EF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 5.5l2.3 2.3L9 3"/></svg>}
                  {active && <span style={{ width: 7, height: 7, borderRadius: '50%', background: T.accent, animation: 'fs-pulse 1s infinite' }} />}
                </span>
                <span style={{ fontFamily: T.serif, fontSize: 18, color: active ? T.ink : T.ink2, fontWeight: active ? 600 : 400 }}>{s}</span>
              </div>
            );
          })}
        </div>
      </div>
    </PhoneScreen>
  );
}

Object.assign(window, { FlowHeader, WelcomeScreen, ProfileScreen, EmailScreen, CameraScreen, ProcessingScreen });
