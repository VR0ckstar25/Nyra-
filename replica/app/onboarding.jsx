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
function WelcomeScreen({ onNext, onSignIn, onSample = () => {} }) {
  return (
    <PhoneScreen bg={T.bg} scroll={false}>
      <StatusBar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 26px 30px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* logo mark — simple geometric, calm */}
          <div style={{ width: 56, height: 56, borderRadius: 17, background: T.accent, display: 'grid', placeItems: 'center', marginBottom: 28, boxShadow: '0 6px 18px rgba(35,74,71,.25)' }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#FBF7EF" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="7"/><path d="M17.5 17.5L23 23"/></svg>
          </div>
          <div style={{ fontFamily: T.serif, fontWeight: 600, fontSize: 21, letterSpacing: .5, color: T.accentDeep, margin: '0 0 20px' }}>Anvara</div>
          <h1 style={{ fontFamily: T.serif, fontWeight: 600, fontSize: 38, lineHeight: 1.08, letterSpacing: -.8, color: T.ink, margin: 0 }}>
            Shop with a<br />little less worry.
          </h1>
          <p style={{ fontFamily: T.sans, fontSize: 17, lineHeight: 1.55, color: T.ink2, margin: '18px 0 0', maxWidth: 320 }}>
            Scan a label and we’ll quietly reflect what’s inside against the things you and your family care about. No verdicts — just what’s there.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          <Btn onClick={onNext}>Get started</Btn>
          <Btn variant="ghost" onClick={onSignIn}>I already have an account</Btn>
          <button className="fs-press" onClick={onSample} style={{ fontFamily: T.sans, fontSize: 13.5, fontWeight: 600, color: T.accentDeep, padding: '4px 0' }}>
            Try a sample scan first →
          </button>
        </div>
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
            <button className="fs-press" onClick={() => window.openInfo({ title: 'Add someone to this scan', sub: 'Choose which family profiles this scan should check against.', lines: 3 })} style={{ fontFamily: T.sans, fontSize: 13, fontWeight: 600, color: '#E7B45A' }}>+ Add member</button>
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

Object.assign(window, { FlowHeader, WelcomeScreen, CameraScreen, ProcessingScreen });
