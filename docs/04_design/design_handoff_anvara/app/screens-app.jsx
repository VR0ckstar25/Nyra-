// screens-app.jsx — app shell: Diary (calendar/log), Patterns, Profile (family
// switching + token counter), plus reusable TokenCard + ErrorState.

function ScreenTitle({ title, sub, right }) {
  return (
    <div style={{ flex: '0 0 auto', padding: '6px 22px 12px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
      <div>
        <h1 style={{ fontFamily: T.serif, fontWeight: 600, fontSize: 28, letterSpacing: -.5, color: T.ink, margin: 0 }}>{title}</h1>
        {sub && <div style={{ fontFamily: T.sans, fontSize: 13.5, color: T.ink2, marginTop: 4 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

// ── Diary (calendar + day log) ──
function genDayTags(activity, today) {
  const palette = [T.amber, T.accent, T.goal.strong, T.intoler.strong];
  const tags = {};
  for (let d = 1; d < today; d++) {
    if (((d * 37 + 13) % 100) < activity) tags[d] = palette[(d * 7) % palette.length];
  }
  return tags;
}
function DiaryScreen({ onNav = () => {}, trackingDays = 14, scansSaved = 32, autoEntries = true, calendarActivity = 50 }) {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const firstOffset = 5; // June 2026 starts ~ Mon
  const today = 28;
  const DAY_TAGS = genDayTags(calendarActivity, today);
  return (
    <PhoneScreen bg={T.bg} scroll={false}>
      <StatusBar />
      <ScreenTitle title="Diary" sub="Your personal food record" />
      <div className="fs-scroll" style={{ flex: 1, padding: '0 18px 18px' }}>
        {/* gentle history marker (not a streak badge) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 15px', borderRadius: 15, background: T.accentTint, marginBottom: 16 }}>
          <span style={{ width: 38, height: 38, borderRadius: '50%', display: 'grid', placeItems: 'center', background: T.surface, boxShadow: T.shadowSoft }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={T.accent} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="7"/><path d="M9 5v4l2.6 1.6"/></svg>
          </span>
          <div>
            <div style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 15, color: T.ink }}>You’ve been tracking for {trackingDays} {trackingDays === 1 ? 'day' : 'days'}.</div>
            <div style={{ fontFamily: T.sans, fontSize: 13, color: T.ink2, marginTop: 1 }}>{scansSaved} {scansSaved === 1 ? 'scan' : 'scans'} saved so far — nicely done.</div>
          </div>
        </div>

        {/* month grid */}
        <div style={{ background: T.surface, borderRadius: 18, boxShadow: T.shadowSoft, padding: '16px 16px 18px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 600, color: T.ink }}>June 2026</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {['‹', '›'].map((a) => <button key={a} className="fs-press" style={{ width: 32, height: 32, borderRadius: 9, background: T.surfaceWarm, color: T.ink2, fontSize: 16, boxShadow: `inset 0 0 0 1px ${T.line}` }}>{a}</button>)}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 6 }}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <div key={i} style={{ textAlign: 'center', fontFamily: T.mono, fontSize: 10.5, color: T.ink3 }}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
            {Array.from({ length: firstOffset }).map((_, i) => <div key={'e' + i} />)}
            {days.map((d) => {
              const tag = DAY_TAGS[d]; const isToday = d === today;
              return (
                <div key={d} style={{ aspectRatio: '1', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                  background: isToday ? T.accent : (tag ? T.surfaceWarm : 'transparent') }}>
                  <span style={{ fontFamily: T.sans, fontSize: 13, fontWeight: isToday ? 700 : 500, color: isToday ? '#FBF7EF' : (d > today ? T.ink3 : T.ink) }}>{d}</span>
                  {tag && !isToday && <span style={{ width: 5, height: 5, borderRadius: '50%', background: tag }} />}
                  {isToday && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#FBF7EF' }} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* day log — chronological, auto-generated, editable */}
        <Overline>Today · 28 June</Overline>
        {autoEntries ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          {[
            { name: 'Harvest Trail Granola Bar', time: '10:24', dots: [T.amber, T.intoler.strong, T.goal.strong] },
            { name: 'Oat & Honey Crackers', time: '09:02', dots: [T.goal.strong] },
          ].map((e, i) => (
            <div key={i} style={{ background: T.surface, borderRadius: 15, boxShadow: T.shadowSoft, padding: '13px 15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {e.dots.map((c, k) => <span key={k} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />)}
                  <span style={{ fontFamily: T.mono, fontSize: 11, color: T.ink3 }}>{e.time}</span>
                </div>
                <button className="fs-press" style={{ fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, color: T.accent, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 1.5l2 2-6 6-2.5.5.5-2.5 6-6z"/></svg>
                  Tap to edit name
                </button>
              </div>
              <div style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 16, color: T.ink, marginTop: 8 }}>{e.name}</div>
              <button className="fs-press" style={{ marginTop: 9, height: 36, padding: '0 13px', borderRadius: 10, fontFamily: T.sans, fontSize: 13, fontWeight: 600, color: T.ink2, background: T.surfaceWarm, boxShadow: `inset 0 0 0 1px ${T.line}`, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 15, lineHeight: 1 }}>+</span> Add a note
              </button>
            </div>
          ))}
        </div>
        ) : (
          /* empty-but-not-broken state */
          <div style={{ marginTop: 12, background: T.surface, borderRadius: 15, boxShadow: T.shadowSoft, padding: '22px 18px', textAlign: 'center' }}>
            <div style={{ fontFamily: T.serif, fontSize: 17, color: T.ink, marginBottom: 5 }}>Nothing scanned yet today</div>
            <div style={{ fontFamily: T.sans, fontSize: 13.5, color: T.ink2, lineHeight: 1.5, marginBottom: 14 }}>Your first scan today will appear here on its own — no typing needed.</div>
            <button className="fs-press" onClick={() => onNav('scan')} style={{ height: 44, padding: '0 20px', borderRadius: 12, background: T.accentSoft, color: T.accentDeep, fontFamily: T.sans, fontWeight: 600, fontSize: 14.5 }}>Scan a label</button>
          </div>
        )}
      </div>
      <TabBar active="log" onChange={onNav} />
    </PhoneScreen>
  );
}

// ── Patterns (V1: ranked plain-text frequency list, not a chart) ──
function PatternsScreen({ onNav = () => {} }) {
  const rows = [
    { name: 'Added sugars', n: 14, cat: 'goal' },
    { name: 'Milk', n: 9, cat: 'intoler' },
    { name: 'Peanuts', n: 6, cat: 'allergen' },
    { name: 'Soy lecithin', n: 5, cat: 'goal' },
    { name: 'Palm oil', n: 4, cat: 'goal' },
    { name: 'Almonds', n: 3, cat: 'allergen' },
  ];
  const max = 14;
  return (
    <PhoneScreen bg={T.bg} scroll={false}>
      <StatusBar />
      <ScreenTitle title="Patterns" sub="What shows up most in your scans" />
      <div className="fs-scroll" style={{ flex: 1, padding: '0 22px 18px' }}>
        {/* gentle weekly insight (personal observation, not a report) */}
        <div style={{ background: T.surface, borderRadius: 16, boxShadow: T.shadowSoft, padding: '16px 17px', marginBottom: 18 }}>
          <Overline color={T.accent}>This week</Overline>
          <p style={{ fontFamily: T.serif, fontSize: 18, lineHeight: 1.4, color: T.ink, margin: '9px 0 0' }}>
            Added sugars came up in most of the snacks you scanned. Just something we noticed.
          </p>
        </div>

        <Overline>Most frequent · last 30 days</Overline>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 12 }}>
          {rows.map((r, i) => (
            <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 0', borderBottom: i < rows.length - 1 ? `1px solid ${T.lineSoft}` : 'none' }}>
              <span style={{ fontFamily: T.mono, fontSize: 13, color: T.ink3, width: 18 }}>{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 16, color: T.ink }}>{r.name}</div>
                <div style={{ height: 5, borderRadius: 3, background: T.lineSoft, marginTop: 7, overflow: 'hidden' }}>
                  <div style={{ width: (r.n / max * 100) + '%', height: '100%', borderRadius: 3, background: T[r.cat].strong }} />
                </div>
              </div>
              <span style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 14, color: T.ink2 }}>{r.n}×</span>
            </div>
          ))}
        </div>

        {/* near-empty / progress toward unlock — never a broken frame */}
        <div style={{ marginTop: 20, borderRadius: 16, background: T.accentTint, padding: '16px 17px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
            <span style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 14.5, color: T.ink }}>Deeper patterns unlock at 50 scans</span>
            <span style={{ fontFamily: T.mono, fontSize: 12.5, color: T.accentDeep }}>32 / 50</span>
          </div>
          <div style={{ height: 8, borderRadius: 5, background: 'rgba(46,95,91,.14)', overflow: 'hidden' }}>
            <div style={{ width: '64%', height: '100%', borderRadius: 5, background: T.accent }} />
          </div>
          <div style={{ fontFamily: T.sans, fontSize: 13, color: T.ink2, marginTop: 10 }}>18 more scans to go. No rush — your record builds as you shop.</div>
        </div>
      </div>
      <TabBar active="patterns" onChange={onNav} />
    </PhoneScreen>
  );
}

// ── Token counter card (gentle awareness; zero-state with warmth) ──
function TokenCard({ remaining = 7, total = 20 }) {
  const zero = remaining <= 0;
  return (
    <div style={{ borderRadius: 16, background: zero ? T.surfaceWarm : T.surface, boxShadow: T.shadowSoft, padding: '16px 17px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 15, color: T.ink }}>{zero ? 'You’ve used this month’s scans' : 'Scans this month'}</span>
        {!zero && <span style={{ fontFamily: T.mono, fontSize: 13, color: T.ink2 }}>{remaining} left</span>}
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} style={{ flex: 1, height: 7, borderRadius: 4, background: i < (total - remaining) ? T.line : T.accent, opacity: zero ? .4 : 1 }} />
        ))}
      </div>
      <div style={{ fontFamily: T.sans, fontSize: 13, color: T.ink2, lineHeight: 1.5, marginTop: 12 }}>
        {zero
          ? 'No worries — your saved diary and profile stay right here. More scans refresh next month, or you can add more any time.'
          : 'Resets on the 1st. You’re in no danger of running out this week.'}
      </div>
      {zero && <div style={{ marginTop: 13 }}><Btn size="md">Add more scans</Btn></div>}
    </div>
  );
}

// ── Profile (family switching + profile contents + settings) ──
const FAMILY = [
  { name: 'Maya', child: false, role: 'You', color: T.accentSoft, fg: T.accentDeep },
  { name: 'Theo', child: true, role: 'Child', color: '#E7D9C4', fg: '#8A6B3D' },
  { name: 'Ava', child: true, role: 'Child', color: '#E4DCEA', fg: '#6E5C86' },
];

function SIcon({ name }) {
  const p = {
    mail: <g><rect x="3" y="5" width="14" height="11" rx="2.2"/><path d="M3.5 6.5l6.5 4.5 6.5-4.5"/></g>,
    card: <g><rect x="3" y="5" width="14" height="10" rx="2.2"/><path d="M3 8.5h14M6 12.5h3"/></g>,
    bell: <g><path d="M10 3.5a4 4 0 0 1 4 4c0 4 1.5 5 1.5 5h-11s1.5-1 1.5-5a4 4 0 0 1 4-4z"/><path d="M8.5 16a1.6 1.6 0 0 0 3 0"/></g>,
    insight: <g><circle cx="10" cy="10" r="6"/><path d="M10 7v3l2 1.5"/></g>,
    text: <g><path d="M4 6h12M4 10h8M4 14h10"/></g>,
    contrast: <g><circle cx="10" cy="10" r="6.5"/><path d="M10 3.5v13a6.5 6.5 0 0 0 0-13z" fill="currentColor" stroke="none"/></g>,
    motion: <g><path d="M3 10h8M3 6h11M3 14h11"/><path d="M14.5 7.5L17 10l-2.5 2.5"/></g>,
    shield: <g><path d="M10 3l5 2v4c0 3.3-2.3 5.7-5 7-2.7-1.3-5-3.7-5-7V5l5-2z"/><path d="M7.7 10l1.7 1.7L13 8"/></g>,
    download: <g><path d="M10 3.5v8M6.5 8.5L10 12l3.5-3.5M4.5 14.5v1a1.5 1.5 0 0 0 1.5 1.5h8a1.5 1.5 0 0 0 1.5-1.5v-1"/></g>,
    flag: <g><path d="M5 3v14M5 4h8l-1.5 3L13 10H5"/></g>,
    clock: <g><circle cx="10" cy="10" r="6.5"/><path d="M10 6v4l2.5 1.5"/></g>,
    people: <g><circle cx="7.5" cy="8" r="2.6"/><path d="M3.4 16c.5-2.3 2.1-3.5 4.1-3.5s3.6 1.2 4.1 3.5"/><path d="M13 5.6a2.4 2.4 0 0 1 0 4.8M14.4 12.7c1.4.4 2.3 1.4 2.7 3.3"/></g>,
    power: <g><path d="M10 3.5v6"/><path d="M6 6.2a6 6 0 1 0 8 0"/></g>,
  }[name];
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{p}</svg>;
}

// product toggle — teal when on (never green/red)
function SToggle({ on, onChange }) {
  return (
    <button className="fs-press" role="switch" aria-checked={on} onClick={(e) => { e.stopPropagation(); onChange(!on); }}
      style={{ width: 46, height: 28, minWidth: 46, borderRadius: 999, padding: 3, background: on ? T.accent : T.line, transition: 'background .18s' }}>
      <span style={{ display: 'block', width: 22, height: 22, borderRadius: '50%', background: '#FFF',
        boxShadow: '0 1px 3px rgba(40,30,20,.25)', transform: on ? 'translateX(18px)' : 'none', transition: 'transform .18s' }} />
    </button>
  );
}

function SRow({ icon, label, sub, value, danger, toggle, on, onToggle, last }) {
  const interactive = !toggle;
  const fg = danger ? T.intoler.strong : T.ink;
  return (
    <div className={interactive ? 'fs-tap' : ''} onClick={toggle ? () => onToggle(!on) : undefined}
      style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 4px', minHeight: 52,
        borderTop: last ? 'none' : `1px solid ${T.lineSoft}`, cursor: 'pointer' }}>
      <span style={{ width: 34, height: 34, borderRadius: 10, flex: '0 0 34px', display: 'grid', placeItems: 'center',
        background: danger ? T.intoler.tint : T.surfaceWarm, color: danger ? T.intoler.strong : T.ink2 }}><SIcon name={icon} /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: T.sans, fontWeight: 600, fontSize: 15, color: fg }}>{label}</div>
        {sub && <div style={{ fontFamily: T.sans, fontSize: 12.5, color: T.ink3, marginTop: 1 }}>{sub}</div>}
      </div>
      {toggle ? <SToggle on={on} onChange={onToggle} /> : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {value && <span style={{ fontFamily: T.sans, fontSize: 13.5, color: T.ink2 }}>{value}</span>}
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke={T.ink3} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3.5L10.5 8 6 12.5"/></svg>
        </div>
      )}
    </div>
  );
}

function SGroup({ title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ marginBottom: 9 }}><Overline>{title}</Overline></div>
      <div style={{ background: T.surface, borderRadius: 16, boxShadow: T.shadowSoft, padding: '2px 14px' }}>{children}</div>
    </div>
  );
}

function ProfileHomeScreen({ onNav = () => {} }) {
  const [active, setActive] = React.useState('Maya');
  const isChild = (FAMILY.find((m) => m.name === active) || {}).child;
  const [s, setS] = React.useState({ weekly: true, followups: true, largeText: false, contrast: false, reduceMotion: false, plainNames: true });
  const set = (k) => (v) => setS((x) => ({ ...x, [k]: v }));

  return (
    <PhoneScreen bg={T.bg} scroll={false}>
      <StatusBar />
      <ScreenTitle title="Profiles" />
      <div className="fs-scroll" style={{ flex: 1, padding: '0 22px 18px' }}>
        {/* family switcher — single tap, child clearly different */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 22 }}>
          {FAMILY.map((m) => {
            const on = active === m.name;
            return (
              <button key={m.name} className="fs-press" onClick={() => setActive(m.name)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 60, height: 60, borderRadius: m.child ? 18 : '50%', display: 'grid', placeItems: 'center',
                  background: m.color, color: m.fg, fontFamily: T.serif, fontSize: 24, fontWeight: 600,
                  boxShadow: on ? `0 0 0 3px ${T.bg}, 0 0 0 5px ${T.accent}` : 'none' }}>{m.name[0]}</span>
                <span style={{ fontFamily: T.sans, fontSize: 13, fontWeight: on ? 700 : 600, color: on ? T.ink : T.ink2 }}>{m.name}</span>
              </button>
            );
          })}
          <button className="fs-press" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 60, height: 60, borderRadius: 18, display: 'grid', placeItems: 'center', background: T.surface, color: T.ink3, fontSize: 26, boxShadow: `inset 0 0 0 1.5px ${T.line}` }}>+</span>
            <span style={{ fontFamily: T.sans, fontSize: 13, fontWeight: 600, color: T.ink3 }}>Add</span>
          </button>
        </div>

        {/* current profile contents */}
        {[
          { t: 'Allergens', items: isChild ? ['Peanuts · Severe'] : ['Peanuts · Severe', 'Tree nuts · Severe'], cat: 'allergen' },
          { t: 'Intolerances', items: isChild ? [] : ['Lactose · Mild'], cat: 'intoler' },
          { t: 'Goals', items: isChild ? [] : ['Lower added sugar'], cat: 'goal' },
        ].map((g) => (
          <div key={g.t} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Overline>{g.t}</Overline>
              <button className="fs-press" style={{ fontFamily: T.sans, fontSize: 13, fontWeight: 600, color: T.accent }}>{g.items.length ? 'Edit' : 'Add'}</button>
            </div>
            {g.items.length ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {g.items.map((it) => (
                  <span key={it} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 38, padding: '0 14px', borderRadius: 999, background: T[g.cat].tint, boxShadow: `inset 0 0 0 1px ${T[g.cat].edge}`, fontFamily: T.sans, fontWeight: 600, fontSize: 14, color: T[g.cat].ink }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: T[g.cat].strong }} />{it}
                  </span>
                ))}
              </div>
            ) : (
              <div style={{ fontFamily: T.sans, fontSize: 13.5, color: T.ink3 }}>None added for {active} yet.</div>
            )}
          </div>
        ))}

        <div style={{ marginTop: 6, marginBottom: 22 }}><TokenCard remaining={7} /></div>

        {/* Account */}
        <SGroup title="Account">
          <SRow icon="mail" label="Email" sub="Syncs your profile & diary" value="maya@…" />
          <SRow icon="people" label="Family allergen session" sub="3 profiles · default for scans" value="On" />
          <SRow icon="card" label="Plan" sub="Free · 20 scans / month" value="Manage" last />
        </SGroup>

        {/* Child mode (per profile) */}
        <SGroup title="Mode">
          <SRow icon="people" label="Child mode" sub={isChild ? `On for ${active} — simpler, warmer screens` : 'Simplified screens for child profiles'}
            value={isChild ? 'On' : 'Off'} last />
        </SGroup>

        {/* Notifications */}
        <SGroup title="Gentle reminders">
          <SRow icon="insight" label="Weekly insight" sub="A short, personal observation" toggle on={s.weekly} onToggle={set('weekly')} />
          <SRow icon="bell" label="Helpful follow-ups" sub="Occasional, never pushy" toggle on={s.followups} onToggle={set('followups')} last />
        </SGroup>

        {/* Accessibility — core, not an afterthought */}
        <SGroup title="Accessibility">
          <SRow icon="text" label="Larger text" toggle on={s.largeText} onToggle={set('largeText')} />
          <SRow icon="contrast" label="Higher contrast" toggle on={s.contrast} onToggle={set('contrast')} />
          <SRow icon="motion" label="Reduce motion" toggle on={s.reduceMotion} onToggle={set('reduceMotion')} />
          <SRow icon="text" label="Plain-language names" sub="Common names first, everywhere" toggle on={s.plainNames} onToggle={set('plainNames')} last />
        </SGroup>

        {/* Privacy & data */}
        <SGroup title="Privacy & data">
          <SRow icon="shield" label="Privacy summary" sub="What we store, in plain words" />
          <SRow icon="download" label="Export my diary" sub="Download everything as a file" />
          <SRow icon="flag" label="Report a labeling error" />
          <SRow icon="clock" label="Database" sub="Current as of 28 May 2026" value="Updated" last />
        </SGroup>

        {/* Sign out */}
        <SGroup title=" ">
          <SRow icon="power" label="Sign out" danger last />
        </SGroup>

        <div style={{ fontFamily: T.mono, fontSize: 10.5, color: T.ink3, textAlign: 'center', marginTop: 4 }}>Anvara · v1.0</div>
      </div>
      <TabBar active="profile" onChange={onNav} />
    </PhoneScreen>
  );
}

// ── Reusable warm error state (every error offers a next step) ──
function ErrorState({ icon = 'cloud', title, body, primary, secondary }) {
  const icons = {
    cloud: <g fill="none" stroke={T.ink2} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M7 18h7a4 4 0 0 0 .6-7.96A5.5 5.5 0 0 0 4 11.5 3.5 3.5 0 0 0 5 18"/><path d="M9 13l2.5 2.5L16 11"/></g>,
    label: <g fill="none" stroke={T.ink2} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 9h18M7 14h5"/></g>,
  };
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 36px' }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: T.surface, boxShadow: T.shadowSoft, display: 'grid', placeItems: 'center', marginBottom: 20 }}>
        <svg width="28" height="28" viewBox="0 0 24 24">{icons[icon]}</svg>
      </div>
      <h2 style={{ fontFamily: T.serif, fontWeight: 600, fontSize: 24, letterSpacing: -.3, color: T.ink, margin: '0 0 10px' }}>{title}</h2>
      <p style={{ fontFamily: T.sans, fontSize: 15, lineHeight: 1.55, color: T.ink2, margin: '0 0 24px', maxWidth: 280 }}>{body}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 280 }}>
        <Btn>{primary}</Btn>
        {secondary && <Btn variant="ghost">{secondary}</Btn>}
      </div>
    </div>
  );
}

Object.assign(window, { ScreenTitle, DiaryScreen, PatternsScreen, TokenCard, ProfileHomeScreen, ErrorState, FAMILY });
