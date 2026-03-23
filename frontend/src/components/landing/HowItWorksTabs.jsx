import React, { useState } from 'react';

export default function HowItWorksTabs() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div id="how-it-works" className="htab-outer">
      <div className="htab-inner">

        <div className="htab-header sr">
          <div className="sec-eyebrow" style={{ display: 'inline-flex', marginBottom: '14px' }}>How it works</div>
          <h2 className="sec-h">One platform. The complete idea lifecycle.</h2>
          <p className="sec-p">From the moment an employee has a thought, Catalyst manages every step — with AI doing the heavy lifting.</p>
        </div>

        {/* PILL TABS */}
        <div className="htab-pills sr" id="htabPills">
          <div className={`htab-pill ${activeTab === 0 ? 'active' : ''}`} onClick={() => setActiveTab(0)}>Submit an idea</div>
          <div className={`htab-pill ${activeTab === 1 ? 'active' : ''}`} onClick={() => setActiveTab(1)}>Review &amp; decide</div>
          <div className={`htab-pill ${activeTab === 2 ? 'active' : ''}`} onClick={() => setActiveTab(2)}>Convert to project</div>
          <div className={`htab-pill ${activeTab === 3 ? 'active' : ''}`} onClick={() => setActiveTab(3)}>Ideas Hub</div>
          <div className={`htab-pill ${activeTab === 4 ? 'active' : ''}`} onClick={() => setActiveTab(4)}>Points &amp; leaderboard</div>
        </div>

        {/* PANELS */}
        <div id="htabPanels" className="sr">

          {/* PANEL 0: Submit */}
          {activeTab === 0 && (
            <div className="htab-panel active">
              <div className="htab-card">
                <div className="htab-text">
                  <div className="htab-eyebrow">Submit an idea</div>
                  <h3 className="htab-title">Every great idea starts with one click</h3>
                  <p className="htab-desc">Employees pick from categorised templates — Process, Product, Cost Saving, Culture, and more. Or they just describe their idea to Gemini in text or voice, and AI fills the form, tags it, and checks for duplicates automatically.</p>
                </div>
                <div className="htab-mockup" style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '10px', left: '-20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.07em', lineHeight: 1.3, fontFamily: 'var(--fb)' }}>Gemini<br/>fills form</div>
                    <div style={{ fontSize: '20px', color: 'var(--accent)', marginTop: '2px' }}>&#8600;</div>
                  </div>
                  <div className="htab-shell">
                    <div className="htab-topbar"><div className="htd" style={{ background: '#FF5F57' }}></div><div className="htd" style={{ background: '#FEBC2E' }}></div><div className="htd" style={{ background: '#28C840' }}></div><div className="htab-url">catalyst.io/submit</div></div>
                    <div className="htab-body">
                      <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '12px', color: 'var(--ink)', marginBottom: '10px' }}>Choose a template</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '6px', marginBottom: '12px' }}>
                        <div style={{ background: 'var(--purple-l)', border: '1.5px solid var(--purple)', borderRadius: '8px', padding: '9px', textAlign: 'center' }}><div style={{ fontSize: '15px', marginBottom: '2px' }}>⚙️</div><div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--purple)', fontFamily: 'var(--fd)' }}>Process</div></div>
                        <div style={{ background: 'var(--bg)', border: '1px solid rgba(15,14,26,.09)', borderRadius: '8px', padding: '9px', textAlign: 'center' }}><div style={{ fontSize: '15px', marginBottom: '2px' }}>💼</div><div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--ink2)', fontFamily: 'var(--fd)' }}>Product</div></div>
                        <div style={{ background: 'var(--bg)', border: '1px solid rgba(15,14,26,.09)', borderRadius: '8px', padding: '9px', textAlign: 'center' }}><div style={{ fontSize: '15px', marginBottom: '2px' }}>💡</div><div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--ink2)', fontFamily: 'var(--fd)' }}>Cost saving</div></div>
                      </div>
                      <div style={{ background: 'var(--bg)', border: '1px solid rgba(15,14,26,.09)', borderRadius: '7px', padding: '8px 10px', marginBottom: '8px' }}>
                        <div style={{ fontSize: '9px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '3px', fontFamily: 'var(--fb)' }}>Idea title</div>
                        <div style={{ fontSize: '11px', color: 'var(--ink2)', fontFamily: 'var(--fb)', border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 8px', background: 'var(--purple-l)' }}>Automate weekly status reports</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 10px', background: 'var(--purple-l)', border: '1px solid rgba(91,76,245,.2)', borderRadius: '7px' }}>
                        <div style={{ width: '18px', height: '18px', borderRadius: '5px', background: 'linear-gradient(135deg,#4285F4,#EA4335,#FBBC05,#34A853)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 800, color: '#fff', flexShrink: 0 }}>G</div>
                        <span style={{ fontSize: '10px', color: 'var(--purple)', fontFamily: 'var(--fb)' }}>Describe to Gemini — it fills this for you</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ position: 'absolute', bottom: '20px', right: '-24px', textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', color: 'var(--accent)' }}>&#8598;</div>
                    <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.07em', lineHeight: 1.3, fontFamily: 'var(--fb)' }}>Duplicate<br/>check</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PANEL 1: Review */}
          {activeTab === 1 && (
            <div className="htab-panel active">
              <div className="htab-card" style={{ background: 'linear-gradient(145deg,#FFF8EE,#FFFBF5)' }}>
                <div className="htab-text">
                  <div className="htab-eyebrow">Review &amp; decide</div>
                  <h3 className="htab-title">No idea sits in review for more than 7 days</h3>
                  <p className="htab-desc">The Community Manager gets a single queue of all submitted ideas — filterable by status, upvotes, and duplicate flags. A built-in SLA timer nudges them if an idea is sitting unreviewed, and escalates to Central Admin if still unacted upon.</p>
                </div>
                <div className="htab-mockup" style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '16px', right: '-28px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.07em', lineHeight: 1.3, fontFamily: 'var(--fb)' }}>SLA<br/>timer</div>
                    <div style={{ fontSize: '20px', color: 'var(--accent)' }}>&#8601;</div>
                  </div>
                  <div className="htab-shell">
                    <div className="htab-topbar"><div className="htd" style={{ background: '#FF5F57' }}></div><div className="htd" style={{ background: '#FEBC2E' }}></div><div className="htd" style={{ background: '#28C840' }}></div><div className="htab-url">catalyst.io/cm/review</div></div>
                    <div className="htab-body">
                      <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '12px', color: 'var(--ink)', marginBottom: '10px' }}>Review queue <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '11px' }}>(7 pending)</span></div>
                      <div style={{ display: 'flex', gap: '5px', marginBottom: '10px', flexWrap: 'wrap' }}>
                        <div style={{ padding: '3px 9px', borderRadius: '999px', background: 'var(--ink)', fontSize: '9px', fontWeight: 600, color: '#fff', fontFamily: 'var(--fb)' }}>All</div>
                        <div style={{ padding: '3px 9px', borderRadius: '999px', border: '1px solid rgba(15,14,26,.1)', fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--fb)' }}>Under Review</div>
                        <div style={{ padding: '3px 9px', borderRadius: '999px', border: '1px solid rgba(15,14,26,.1)', fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--fb)' }}>SLA at risk</div>
                      </div>
                      <div style={{ background: 'var(--bg)', border: '1px solid rgba(15,14,26,.08)', borderRadius: '8px', padding: '10px 12px', marginBottom: '7px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--amber)', flexShrink: 0, marginTop: '4px' }}></div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink2)', fontFamily: 'var(--fb)' }}>Automate weekly status reports</div>
                          <div style={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--fb)', marginTop: '2px' }}>Priya R. · 2 days ago · <span style={{ color: 'var(--teal)' }}>▲ 12 upvotes</span></div>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <div style={{ padding: '3px 8px', background: 'var(--teal-l)', borderRadius: '4px', fontSize: '9px', fontWeight: 700, color: 'var(--teal)', fontFamily: 'var(--fb)' }}>Approve</div>
                          <div style={{ padding: '3px 8px', background: '#FEE8E8', borderRadius: '4px', fontSize: '9px', fontWeight: 700, color: '#C42B2B', fontFamily: 'var(--fb)' }}>Reject</div>
                        </div>
                      </div>
                      <div style={{ background: 'var(--bg)', border: '1px solid rgba(15,14,26,.08)', borderRadius: '8px', padding: '10px 12px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C42B2B', flexShrink: 0, marginTop: '4px' }}></div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink2)', fontFamily: 'var(--fb)' }}>Knowledge base for new joiners</div>
                          <div style={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--fb)', marginTop: '2px' }}>Arjun K. · 5 days ago · <span style={{ color: '#C42B2B' }}>⚠ Duplicate flagged</span></div>
                        </div>
                        <div style={{ padding: '3px 8px', background: 'var(--bg3)', borderRadius: '4px', fontSize: '9px', fontWeight: 700, color: 'var(--body)', fontFamily: 'var(--fb)' }}>Review</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 10px', background: 'var(--amber-l)', border: '1px solid rgba(212,130,10,.18)', borderRadius: '7px', marginTop: '8px' }}>
                        <span style={{ fontSize: '12px' }}>⏱</span>
                        <span style={{ fontSize: '10px', color: 'var(--amber)', fontFamily: 'var(--fb)', flex: 1 }}>2 ideas approaching 7-day SLA</span>
                        <span style={{ padding: '2px 7px', background: 'rgba(212,130,10,.15)', borderRadius: '999px', fontSize: '9px', color: 'var(--amber)', fontWeight: 700, fontFamily: 'var(--fb)' }}>Act now</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PANEL 2: Project */}
          {activeTab === 2 && (
            <div className="htab-panel active">
              <div className="htab-card" style={{ background: 'linear-gradient(145deg,#EDFAF5,#F5FDF9)' }}>
                <div className="htab-text">
                  <div className="htab-eyebrow">Convert to project</div>
                  <h3 className="htab-title">Approved ideas become projects in one click</h3>
                  <p className="htab-desc">Org Admins convert approved ideas to projects — a project ID is auto-generated. Add action steps manually or let Gemini generate them. Each step has a status, optional deadline, and in-thread @mention chat for real collaboration.</p>
                </div>
                <div className="htab-mockup" style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '10px', right: '-32px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.07em', lineHeight: 1.3, fontFamily: 'var(--fb)' }}>AI-generated<br/>steps</div>
                    <div style={{ fontSize: '20px', color: 'var(--accent)' }}>&#8601;</div>
                  </div>
                  <div className="htab-shell">
                    <div className="htab-topbar"><div className="htd" style={{ background: '#FF5F57' }}></div><div className="htd" style={{ background: '#FEBC2E' }}></div><div className="htd" style={{ background: '#28C840' }}></div><div className="htab-url">catalyst.io/project/PRJ-042</div></div>
                    <div className="htab-body">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid rgba(15,14,26,.07)' }}>
                        <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '10px', color: 'var(--purple)', background: 'var(--purple-l)', padding: '2px 7px', borderRadius: '4px' }}>PRJ-042</div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink2)', flex: 1, fontFamily: 'var(--fb)' }}>Automate status reports</div>
                        <div style={{ padding: '2px 7px', background: 'var(--teal-l)', borderRadius: '999px', fontSize: '9px', color: 'var(--teal)', fontWeight: 700, fontFamily: 'var(--fb)' }}>In Progress</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        <div style={{ display: 'flex', gap: '8px', padding: '7px 0', borderBottom: '1px solid rgba(15,14,26,.05)' }}>
                          <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700, color: '#fff', flexShrink: 0, fontFamily: 'var(--fd)' }}>✓</div>
                          <div style={{ flex: 1 }}><div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink2)', fontFamily: 'var(--fb)' }}>Define scope</div><div style={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--fb)' }}>Mar 10 · <span style={{ color: 'var(--teal)' }}>Done</span></div></div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', padding: '7px 0', borderBottom: '1px solid rgba(15,14,26,.05)' }}>
                          <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700, color: '#fff', flexShrink: 0, fontFamily: 'var(--fd)' }}>2</div>
                          <div style={{ flex: 1 }}><div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink2)', fontFamily: 'var(--fb)' }}>Build Zapier workflow</div><div style={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--fb)' }}>Mar 22 · <span style={{ color: 'var(--purple)' }}>In progress</span></div></div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', padding: '7px 0' }}>
                          <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--bg2)', border: '1.5px solid rgba(15,14,26,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700, color: 'var(--muted)', flexShrink: 0, fontFamily: 'var(--fd)' }}>3</div>
                          <div style={{ flex: 1 }}><div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', fontFamily: 'var(--fb)' }}>Pilot with one team</div><div style={{ fontSize: '9px', color: 'var(--pale)', fontFamily: 'var(--fb)' }}>Apr 1 · To do</div></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PANEL 3: Ideas Hub */}
          {activeTab === 3 && (
            <div className="htab-panel active">
              <div className="htab-card" style={{ background: 'linear-gradient(145deg,#F0EEFF,#F7F5FF)' }}>
                <div className="htab-text">
                  <div className="htab-eyebrow">Ideas Hub</div>
                  <h3 className="htab-title">See what your colleagues are thinking</h3>
                  <p className="htab-desc">All submitted, approved, and converted ideas are visible as cards in the Ideas Hub — each with a Gemini-generated one-line summary. Employees upvote the ideas they believe in, giving admins a clear signal on what the organisation actually wants built.</p>
                </div>
                <div className="htab-mockup" style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', bottom: '20px', left: '-28px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.07em', lineHeight: 1.3, fontFamily: 'var(--fb)' }}>One vote<br/>per person</div>
                    <div style={{ fontSize: '20px', color: 'var(--accent)' }}>&#8599;</div>
                  </div>
                  <div className="htab-shell">
                    <div className="htab-topbar"><div className="htd" style={{ background: '#FF5F57' }}></div><div className="htd" style={{ background: '#FEBC2E' }}></div><div className="htd" style={{ background: '#28C840' }}></div><div className="htab-url">catalyst.io/hub</div></div>
                    <div className="htab-body">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--bg)', border: '1px solid rgba(15,14,26,.09)', borderRadius: '7px', padding: '7px 10px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>🔍</span>
                        <span style={{ fontSize: '11px', color: 'var(--pale)', fontFamily: 'var(--fb)' }}>Search ideas...</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
                        <div style={{ background: 'var(--bg)', border: '1px solid rgba(15,14,26,.08)', borderRadius: '8px', padding: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}><div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#5B4CF5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', fontWeight: 700, color: '#fff', fontFamily: 'var(--fd)' }}>PR</div><div style={{ fontSize: '9px', fontWeight: 600, color: 'var(--ink2)', fontFamily: 'var(--fb)' }}>Priya R.</div></div>
                          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--fd)', marginBottom: '4px', lineHeight: 1.3 }}>Weekly report automation</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ padding: '2px 7px', border: '1.5px solid var(--purple)', borderRadius: '999px', fontSize: '9px', color: 'var(--purple)', fontWeight: 600, fontFamily: 'var(--fb)', background: 'var(--purple-l)' }}>▲ 12</div><div style={{ padding: '1px 6px', background: 'var(--teal-l)', borderRadius: '999px', fontSize: '8px', color: 'var(--teal)', fontWeight: 700, fontFamily: 'var(--fb)' }}>Process</div></div>
                        </div>
                        <div style={{ background: 'var(--bg)', border: '1px solid rgba(15,14,26,.08)', borderRadius: '8px', padding: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}><div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#D4820A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', fontWeight: 700, color: '#fff', fontFamily: 'var(--fd)' }}>AK</div><div style={{ fontSize: '9px', fontWeight: 600, color: 'var(--ink2)', fontFamily: 'var(--fb)' }}>Arjun K.</div></div>
                          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--fd)', marginBottom: '4px', lineHeight: 1.3 }}>Monthly innovation sprint</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ padding: '2px 7px', border: '1px solid rgba(15,14,26,.1)', borderRadius: '999px', fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--fb)' }}>▲ 8</div><div style={{ padding: '1px 6px', background: 'var(--purple-l)', borderRadius: '999px', fontSize: '8px', color: 'var(--purple)', fontWeight: 700, fontFamily: 'var(--fb)' }}>Culture</div></div>
                        </div>
                        <div style={{ background: 'var(--bg)', border: '1px solid rgba(15,14,26,.08)', borderRadius: '8px', padding: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}><div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#003580', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', fontWeight: 700, color: '#fff', fontFamily: 'var(--fd)' }}>SM</div><div style={{ fontSize: '9px', fontWeight: 600, color: 'var(--ink2)', fontFamily: 'var(--fb)' }}>Sara M.</div></div>
                          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--fd)', marginBottom: '4px', lineHeight: 1.3 }}>Vendor consolidation</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ padding: '2px 7px', border: '1px solid rgba(15,14,26,.1)', borderRadius: '999px', fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--fb)' }}>▲ 5</div><div style={{ padding: '1px 6px', background: 'var(--amber-l)', borderRadius: '999px', fontSize: '8px', color: 'var(--amber)', fontWeight: 700, fontFamily: 'var(--fb)' }}>Cost saving</div></div>
                        </div>
                        <div style={{ background: 'var(--bg)', border: '1px solid rgba(15,14,26,.08)', borderRadius: '8px', padding: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}><div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', fontWeight: 700, color: '#fff', fontFamily: 'var(--fd)' }}>RJ</div><div style={{ fontSize: '9px', fontWeight: 600, color: 'var(--ink2)', fontFamily: 'var(--fb)' }}>Rohan J.</div></div>
                          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--fd)', marginBottom: '4px', lineHeight: 1.3 }}>Customer feedback loop</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ padding: '2px 7px', border: '1px solid rgba(15,14,26,.1)', borderRadius: '999px', fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--fb)' }}>▲ 3</div><div style={{ padding: '1px 6px', background: '#EFF6FF', borderRadius: '999px', fontSize: '8px', color: '#2563EB', fontWeight: 700, fontFamily: 'var(--fb)' }}>Customer</div></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PANEL 4: Leaderboard */}
          {activeTab === 4 && (
            <div className="htab-panel active">
              <div className="htab-card" style={{ background: 'linear-gradient(145deg,#FFF9EE,#FFFDF5)' }}>
                <div className="htab-text">
                  <div className="htab-eyebrow">Points &amp; leaderboard</div>
                  <h3 className="htab-title">Make innovation a habit, not a one-off</h3>
                  <p className="htab-desc">Every action earns points — submitting (10), getting approved (25), converting to a project (50), receiving upvotes (5), completing a project (100). A live leaderboard shows the top 5 innovators, keeping the culture of ideas alive every single day.</p>
                </div>
                <div className="htab-mockup" style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '10px', right: '-32px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.07em', lineHeight: 1.3, fontFamily: 'var(--fb)' }}>Auto<br/>awarded</div>
                    <div style={{ fontSize: '20px', color: 'var(--accent)' }}>&#8601;</div>
                  </div>
                  <div className="htab-shell">
                    <div className="htab-topbar"><div className="htd" style={{ background: '#FF5F57' }}></div><div className="htd" style={{ background: '#FEBC2E' }}></div><div className="htd" style={{ background: '#28C840' }}></div><div className="htab-url">catalyst.io/leaderboard</div></div>
                    <div className="htab-body">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '12px', color: 'var(--ink)' }}>Top innovators</div>
                        <div style={{ fontSize: '9px', color: 'var(--muted)', background: 'var(--bg)', border: '1px solid rgba(15,14,26,.09)', borderRadius: '999px', padding: '2px 8px', fontFamily: 'var(--fb)' }}>March 2026</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', borderBottom: '1px solid rgba(15,14,26,.06)' }}>
                          <div style={{ width: '18px', fontFamily: 'var(--fd)', fontSize: '11px', fontWeight: 700, color: '#D4820A', textAlign: 'center' }}>1</div>
                          <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#5B4CF5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#fff', fontFamily: 'var(--fd)' }}>PR</div>
                          <div style={{ flex: 1 }}><div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink2)', fontFamily: 'var(--fb)' }}>Priya Raghavan</div><div style={{ height: '3px', background: 'var(--bg2)', borderRadius: '2px', marginTop: '3px', overflow: 'hidden' }}><div style={{ height: '100%', width: '100%', borderRadius: '2px', background: 'linear-gradient(90deg,var(--purple),#8B72F8)' }}></div></div></div>
                          <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '13px', color: 'var(--purple)' }}>840</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', borderBottom: '1px solid rgba(15,14,26,.06)' }}>
                          <div style={{ width: '18px', fontFamily: 'var(--fd)', fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textAlign: 'center' }}>2</div>
                          <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#0E9E78', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#fff', fontFamily: 'var(--fd)' }}>AK</div>
                          <div style={{ flex: 1 }}><div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink2)', fontFamily: 'var(--fb)' }}>Arjun Kapoor</div><div style={{ height: '3px', background: 'var(--bg2)', borderRadius: '2px', marginTop: '3px', overflow: 'hidden' }}><div style={{ height: '100%', width: '86%', borderRadius: '2px', background: 'linear-gradient(90deg,var(--purple),#8B72F8)' }}></div></div></div>
                          <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '13px', color: 'var(--purple)' }}>725</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', borderBottom: '1px solid rgba(15,14,26,.06)' }}>
                          <div style={{ width: '18px', fontFamily: 'var(--fd)', fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textAlign: 'center' }}>3</div>
                          <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#D4820A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#fff', fontFamily: 'var(--fd)' }}>SM</div>
                          <div style={{ flex: 1 }}><div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink2)', fontFamily: 'var(--fb)' }}>Sara Mehta</div><div style={{ height: '3px', background: 'var(--bg2)', borderRadius: '2px', marginTop: '3px', overflow: 'hidden' }}><div style={{ height: '100%', width: '73%', borderRadius: '2px', background: 'linear-gradient(90deg,var(--purple),#8B72F8)' }}></div></div></div>
                          <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '13px', color: 'var(--purple)' }}>612</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
                          <div style={{ width: '18px', fontFamily: 'var(--fd)', fontSize: '11px', fontWeight: 700, color: 'var(--pale)', textAlign: 'center' }}>4</div>
                          <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#003580', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#fff', fontFamily: 'var(--fd)' }}>RJ</div>
                          <div style={{ flex: 1 }}><div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink2)', fontFamily: 'var(--fb)' }}>Rohan Joshi</div><div style={{ height: '3px', background: 'var(--bg2)', borderRadius: '2px', marginTop: '3px', overflow: 'hidden' }}><div style={{ height: '100%', width: '70%', borderRadius: '2px', background: 'linear-gradient(90deg,var(--purple),#8B72F8)' }}></div></div></div>
                          <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '13px', color: 'var(--purple)' }}>589</div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '6px', marginTop: '10px' }}>
                        <div style={{ background: 'var(--bg)', border: '1px solid rgba(15,14,26,.08)', borderRadius: '7px', padding: '7px', textAlign: 'center' }}><div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '14px', color: 'var(--purple)' }}>10</div><div style={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--fb)' }}>Submitted</div></div>
                        <div style={{ background: 'var(--bg)', border: '1px solid rgba(15,14,26,.08)', borderRadius: '7px', padding: '7px', textAlign: 'center' }}><div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '14px', color: 'var(--teal)' }}>50</div><div style={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--fb)' }}>Converted</div></div>
                        <div style={{ background: 'var(--bg)', border: '1px solid rgba(15,14,26,.08)', borderRadius: '7px', padding: '7px', textAlign: 'center' }}><div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '14px', color: 'var(--accent)' }}>100</div><div style={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--fb)' }}>Project done</div></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
