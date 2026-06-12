// screens-result.jsx — Result Screen composition (the core surface) + Child-mode aware.

function ResultTopBar({ child, setChild, onBack }) {
  return (
    <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 16px 10px' }}>
      <button className="fs-press" onClick={onBack} style={{ width: 40, height: 40, borderRadius: 12, display: 'grid', placeItems: 'center', color: T.ink }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M11 3.5L5.5 9l5.5 5.5"/></svg>
      </button>
      <span style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 16, color: T.ink }}>Results</span>
      {/* child-mode toggle */}
      <div style={{ display: 'flex', background: T.surface, borderRadius: 999, padding: 3, boxShadow: `inset 0 0 0 1px ${T.line}` }}>
        {[['adult', 'Aa'], ['child', '☺']].map(([k, lbl]) => {
          const on = (k === 'child') === child;
          return (
            <button key={k} className="fs-press" onClick={() => setChild(k === 'child')}
              style={{ width: 38, height: 30, borderRadius: 999, fontFamily: T.sans, fontSize: k === 'child' ? 15 : 13.5, fontWeight: 700,
                color: on ? '#FBF7EF' : T.ink2, background: on ? T.accent : 'transparent' }}>{lbl}</button>
          );
        })}
      </div>
    </div>
  );
}

function ResultScreen({ child = false, setChild = () => {}, onBack = () => {}, variant = 'tint' }) {
  const [card, setCard] = React.useState(null); // { finding, item }
  const open = (finding, item) => setCard({ finding, item });

  return (
    <PhoneScreen bg={T.bg} scroll={false}>
      <StatusBar />
      <ResultTopBar child={child} setChild={setChild} onBack={onBack} />
      <div className="fs-scroll" style={{ flex: 1, padding: '4px 18px 26px' }}>
        {/* product summary */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: child ? 18 : 16 }}>
          <div style={{ width: 58, height: 58, borderRadius: 14, flex: '0 0 58px', background: 'repeating-linear-gradient(135deg, ' + T.surfaceWarm + ' 0 7px, ' + T.bgDeep + ' 7px 14px)', boxShadow: `inset 0 0 0 1px ${T.line}`, display: 'grid', placeItems: 'center' }}>
            <span style={{ fontFamily: T.mono, fontSize: 8, color: T.ink3 }}>label</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: T.serif, fontWeight: 600, fontSize: child ? 22 : 20, lineHeight: 1.1, color: T.ink, letterSpacing: -.3 }}>{DEMO.product}</div>
            <div style={{ fontFamily: T.sans, fontSize: 13.5, color: T.ink2, marginTop: 3 }}>{DEMO.brand} · scanned just now</div>
          </div>
        </div>

        {/* family session indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, color: T.ink3 }}>This session</span>
          <ProfileTag name="Maya" /><ProfileTag name="Theo" isChild />
        </div>

        {/* calm intro — never alarming, never a verdict */}
        <div style={{ fontFamily: T.serif, fontSize: child ? 21 : 18, lineHeight: 1.35, color: T.ink, margin: '2px 0 16px' }}>
          {child ? 'Here’s what’s inside that you told us about.' : 'Here’s what we found that matches your profile.'}
        </div>

        {/* match bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {DEMO.findings.map((f, i) => <MatchBar key={i} data={f} variant={variant} child={child} onOpen={open} />)}
        </div>

        {/* could not verify */}
        {!child && (
          <div style={{ marginTop: 22 }}>
            <CouldNotVerify data={DEMO.unverified} />
          </div>
        )}

        {/* emoji rating */}
        <div style={{ marginTop: 22 }}>
          <EmojiRating />
        </div>

        {/* footer */}
        {!child && (
          <div style={{ marginTop: 20 }}>
            <ResultFooter />
          </div>
        )}
        {child && (
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.ink3, textAlign: 'center', marginTop: 20, lineHeight: 1.6 }}>
            Always check with a grown-up.
          </div>
        )}
      </div>

      <InfoCard open={!!card} finding={card?.finding} item={card?.item} onClose={() => setCard(null)} />
    </PhoneScreen>
  );
}

Object.assign(window, { ResultScreen, ResultTopBar });
