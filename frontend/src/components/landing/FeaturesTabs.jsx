import React, { useState } from 'react';

export default function FeaturesTabs() {
  const [activeFeat, setActiveFeat] = useState(0);

  return (
    <div id="features" className="features-outer">
      <div className="features-wrap">
        <div className="feat-intro">
          <div className="sr">
            <div className="sec-eyebrow" style={{ display: 'inline-flex', marginBottom: '14px', background: 'var(--teal-l)', color: 'var(--teal)', fontSize: '11px', fontWeight: '800', letterSpacing: '0.05em' }}>FEATURES</div>
            <h2 className="sec-h">Everything your org needs<br/>to make ideas matter</h2>
          </div>
          <p className="sec-p sr">Structured for enterprise. Simple enough that employees actually use it every day.</p>
        </div>

        <div className="feat-pills sr" id="featPills">
          <div className={`feat-pill ${activeFeat === 0 ? 'active' : ''}`} onClick={() => setActiveFeat(0)}>Categorised templates</div>
          <div className={`feat-pill ${activeFeat === 1 ? 'active' : ''}`} onClick={() => setActiveFeat(1)}>Gemini AI</div>
          <div className={`feat-pill ${activeFeat === 2 ? 'active' : ''}`} onClick={() => setActiveFeat(2)}>SLA review</div>
          <div className={`feat-pill ${activeFeat === 3 ? 'active' : ''}`} onClick={() => setActiveFeat(3)}>Idea to project</div>
          <div className={`feat-pill ${activeFeat === 4 ? 'active' : ''}`} onClick={() => setActiveFeat(4)}>Points &amp; leaderboard</div>
          <div className={`feat-pill ${activeFeat === 5 ? 'active' : ''}`} onClick={() => setActiveFeat(5)}>Audit trail</div>
        </div>

        <div id="featPanels" className="sr">

          {activeFeat === 0 && (
            <div className="feat-panel active">
              <div className="htab-card" style={{ background: 'linear-gradient(145deg,#EEF0FF,#F5F7FF)' }}>
                <div className="htab-text">
                  <div className="htab-eyebrow" style={{ color: 'var(--accent)', fontWeight: 800 }}>CHOICE</div>
                  <h3 className="htab-title">Pick a template and go</h3>
                  <p className="htab-desc">Employees choose from categorised templates — Process, Product, Cost Saving, Culture, Customer, and more. Each has mandatory fields, ensuring every proposal is well thought-out before it even hits the queue. No more blank page paralysis.</p>
                </div>
                <div className="htab-mockup">
                  <div className="htab-shell">
                    <div className="htab-topbar"><div className="htd" style={{ background: '#FF5F57' }}></div><div className="htd" style={{ background: '#FEBC2E' }}></div><div className="htd" style={{ background: '#28C840' }}></div><div className="htab-url">catalyst.zuarione.com/submit</div></div>
                    <div className="htab-body">
                      <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '12px', color: 'var(--ink)', marginBottom: '10px' }}>Choose a template</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '6px', marginBottom: '12px' }}>
                        <div style={{ background: 'var(--purple-l)', border: '1.5px solid var(--purple)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}><div style={{ fontSize: '16px', marginBottom: '3px' }}>⚙️</div><div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--purple)', fontFamily: 'var(--fd)' }}>Process</div></div>
                        <div style={{ background: 'var(--bg)', border: '1px solid rgba(15,14,26,.09)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}><div style={{ fontSize: '16px', marginBottom: '3px' }}>💼</div><div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ink2)', fontFamily: 'var(--fd)' }}>Product</div></div>
                        <div style={{ background: 'var(--bg)', border: '1px solid rgba(15,14,26,.09)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}><div style={{ fontSize: '16px', marginBottom: '3px' }}>💡</div><div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ink2)', fontFamily: 'var(--fd)' }}>Cost saving</div></div>
                        <div style={{ background: 'var(--bg)', border: '1px solid rgba(15,14,26,.09)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}><div style={{ fontSize: '16px', marginBottom: '3px' }}>🌱</div><div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ink2)', fontFamily: 'var(--fd)' }}>Culture</div></div>
                        <div style={{ background: 'var(--bg)', border: '1px solid rgba(15,14,26,.09)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}><div style={{ fontSize: '16px', marginBottom: '3px' }}>🤝</div><div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ink2)', fontFamily: 'var(--fd)' }}>Customer</div></div>
                        <div style={{ background: 'var(--bg)', border: '1px solid rgba(15,14,26,.09)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}><div style={{ fontSize: '16px', marginBottom: '3px' }}>…</div><div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ink2)', fontFamily: 'var(--fd)' }}>General</div></div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ flex: 1, background: 'var(--bg)', border: '1px solid rgba(15,14,26,.09)', borderRadius: '6px', padding: '7px 9px', fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--fb)' }}>📷 Image</div>
                        <div style={{ flex: 1, background: 'var(--bg)', border: '1px solid rgba(15,14,26,.09)', borderRadius: '6px', padding: '7px 9px', fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--fb)' }}>📎 File link</div>
                        <div style={{ flex: 1, background: 'var(--bg)', border: '1px solid rgba(15,14,26,.09)', borderRadius: '6px', padding: '7px 9px', fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--fb)' }}>🎤 Voice note</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeFeat === 1 && (
            <div className="feat-panel active">
              <div className="htab-card" style={{ background: 'linear-gradient(145deg,#F0EEFF,#F8F5FF)' }}>
                <div className="htab-text">
                  <div className="htab-eyebrow">AI Powered</div>
                  <h3 className="htab-title">Describe it. Gemini does the rest.</h3>
                  <p className="htab-desc">Employees describe their idea in their own words — text or voice. Gemini reads it, writes a one-line summary, extracts keyword tags, picks the right template, and fills the form. It also checks if a similar idea already exists before submission.</p>
                </div>
                <div className="htab-mockup" style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '10px', left: '-20px', textAlign: 'center' }}><div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.07em', lineHeight: 1.3, fontFamily: 'var(--fb)' }}>Gemini<br/>fills form</div><div style={{ fontSize: '18px', color: 'var(--accent)' }}>&#8600;</div></div>
                  <div className="htab-shell">
                    <div className="htab-topbar"><div className="htd" style={{ background: '#FF5F57' }}></div><div className="htd" style={{ background: '#FEBC2E' }}></div><div className="htd" style={{ background: '#28C840' }}></div><div className="htab-url">catalyst.zuarione.com/submit</div></div>
                    <div className="htab-body">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: 'var(--purple-l)', border: '1.5px solid rgba(91,76,245,.2)', borderRadius: '9px', marginBottom: '12px' }}><div style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'linear-gradient(135deg,#4285F4,#EA4335,#FBBC05,#34A853)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 800, color: '#fff', flexShrink: 0 }}>G</div><span style={{ fontSize: '11px', color: 'var(--purple)', fontFamily: 'var(--fb)', fontStyle: 'italic' }}>"We should consolidate our SaaS tools..."</span></div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--teal)', marginBottom: '10px', fontFamily: 'var(--fb)', fontWeight: 600 }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--teal)' }}></div>Gemini is filling your form...</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                        <div style={{ background: 'var(--bg)', border: '1px solid rgba(15,14,26,.09)', borderRadius: '7px', padding: '8px 10px' }}><div style={{ fontSize: '9px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '3px', fontFamily: 'var(--fb)' }}>Idea title</div><div style={{ fontSize: '11px', color: 'var(--ink2)', fontFamily: 'var(--fb)' }}>Consolidate overlapping SaaS subscriptions</div></div>
                        <div style={{ background: 'var(--bg)', border: '1px solid rgba(15,14,26,.09)', borderRadius: '7px', padding: '8px 10px' }}><div style={{ fontSize: '9px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '3px', fontFamily: 'var(--fb)' }}>Tags</div><div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}><span style={{ padding: '2px 7px', background: 'var(--teal-l)', border: '1px solid rgba(14,158,120,.2)', borderRadius: '999px', fontSize: '9px', color: 'var(--teal)', fontFamily: 'var(--fb)' }}>cost reduction</span><span style={{ padding: '2px 7px', background: 'var(--teal-l)', border: '1px solid rgba(14,158,120,.2)', borderRadius: '999px', fontSize: '9px', color: 'var(--teal)', fontFamily: 'var(--fb)' }}>SaaS</span><span style={{ padding: '2px 7px', background: 'var(--teal-l)', border: '1px solid rgba(14,158,120,.2)', borderRadius: '999px', fontSize: '9px', color: 'var(--teal)', fontFamily: 'var(--fb)' }}>procurement</span></div></div>
                      </div>
                    </div>
                  </div>
                  <div style={{ position: 'absolute', bottom: '16px', right: '-32px', textAlign: 'center' }}><div style={{ fontSize: '18px', color: 'var(--accent)' }}>&#8598;</div><div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.07em', lineHeight: 1.3, fontFamily: 'var(--fb)' }}>Duplicate<br/>check</div></div>
                </div>
              </div>
            </div>
          )}

          {activeFeat === 2 && (
            <div className="feat-panel active">
              <div className="htab-card" style={{ background: 'linear-gradient(145deg,#FFF8EE,#FFFBF5)' }}>
                <div className="htab-text">
                  <div className="htab-eyebrow">Admin</div>
                  <h3 className="htab-title">No idea sits unreviewed for more than 7 days</h3>
                  <p className="htab-desc">Every submitted idea starts a 7-day SLA clock. The Community Manager gets nudged when ideas approach the deadline. If still unresolved, the Central Admin is automatically escalated. Every idea gets a fair look — guaranteed.</p>
                </div>
                <div className="htab-mockup">
                  <div className="htab-shell">
                    <div className="htab-topbar"><div className="htd" style={{ background: '#FF5F57' }}></div><div className="htd" style={{ background: '#FEBC2E' }}></div><div className="htd" style={{ background: '#28C840' }}></div><div className="htab-url">catalyst.zuarione.com/cm/review</div></div>
                    <div className="htab-body">
                      <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '12px', color: 'var(--ink)', marginBottom: '10px' }}>Review queue <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '11px' }}>(7 pending)</span></div>
                      <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}><div style={{ padding: '3px 9px', borderRadius: '999px', background: 'var(--ink)', fontSize: '9px', fontWeight: 600, color: '#fff', fontFamily: 'var(--fb)' }}>All</div><div style={{ padding: '3px 9px', borderRadius: '999px', border: '1px solid rgba(15,14,26,.1)', fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--fb)' }}>SLA at risk</div><div style={{ padding: '3px 9px', borderRadius: '999px', border: '1px solid rgba(15,14,26,.1)', fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--fb)' }}>Duplicate flagged</div></div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '10px' }}>
                        <div style={{ background: 'var(--bg)', border: '1px solid rgba(15,14,26,.08)', borderRadius: '8px', padding: '10px 12px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--amber)', flexShrink: 0, marginTop: '4px' }}></div><div style={{ flex: 1 }}><div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink2)', fontFamily: 'var(--fb)' }}>Automate weekly status reports</div><div style={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--fb)', marginTop: '2px' }}>Priya R. · 2d ago · <span style={{ color: 'var(--teal)' }}>▲ 12</span></div></div><div style={{ display: 'flex', gap: '4px' }}><div style={{ padding: '3px 8px', background: 'var(--teal-l)', borderRadius: '4px', fontSize: '9px', fontWeight: 700, color: 'var(--teal)', fontFamily: 'var(--fb)' }}>Approve</div><div style={{ padding: '3px 8px', background: '#FEE8E8', borderRadius: '4px', fontSize: '9px', fontWeight: 700, color: '#C42B2B', fontFamily: 'var(--fb)' }}>Reject</div></div></div>
                        <div style={{ background: 'var(--bg)', border: '1px solid rgba(15,14,26,.08)', borderRadius: '8px', padding: '10px 12px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C42B2B', flexShrink: 0, marginTop: '4px' }}></div><div style={{ flex: 1 }}><div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink2)', fontFamily: 'var(--fb)' }}>Knowledge base for new joiners</div><div style={{ fontSize: '9px', color: '#C42B2B', fontFamily: 'var(--fb)', marginTop: '2px' }}>⚠ Duplicate flagged</div></div><div style={{ padding: '3px 8px', background: 'var(--bg3)', borderRadius: '4px', fontSize: '9px', fontWeight: 700, color: 'var(--body)', fontFamily: 'var(--fb)' }}>Review</div></div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 10px', background: 'var(--amber-l)', border: '1px solid rgba(212,130,10,.18)', borderRadius: '7px' }}><span style={{ fontSize: '12px' }}>⏱</span><span style={{ fontSize: '10px', color: 'var(--amber)', fontFamily: 'var(--fb)', flex: 1 }}>2 ideas approaching 7-day SLA</span><span style={{ padding: '2px 7px', background: 'rgba(212,130,10,.15)', borderRadius: '999px', fontSize: '9px', color: 'var(--amber)', fontWeight: 700, fontFamily: 'var(--fb)' }}>Act now</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeFeat === 3 && (
            <div className="feat-panel active">
              <div className="htab-card" style={{ background: 'linear-gradient(145deg,#EDFAF5,#F5FDF9)' }}>
                <div className="htab-text">
                  <div className="htab-eyebrow">Admin</div>
                  <h3 className="htab-title">From idea to action plan in one click</h3>
                  <p className="htab-desc">Approved ideas convert to projects instantly — a project ID is generated. Admins can add steps manually or ask Gemini to generate an action plan. Each step has a status, optional deadline, and a threaded chat with @mention notifications.</p>
                </div>
                <div className="htab-mockup">
                  <div className="htab-shell">
                    <div className="htab-topbar"><div className="htd" style={{ background: '#FF5F57' }}></div><div className="htd" style={{ background: '#FEBC2E' }}></div><div className="htd" style={{ background: '#28C840' }}></div><div className="htab-url">catalyst.zuarione.com/project/PRJ-042</div></div>
                    <div className="htab-body">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid rgba(15,14,26,.07)' }}><div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '10px', color: 'var(--purple)', background: 'var(--purple-l)', padding: '2px 7px', borderRadius: '4px' }}>PRJ-042</div><div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink2)', flex: 1, fontFamily: 'var(--fb)' }}>Automate status reports</div><div style={{ padding: '2px 7px', background: 'var(--teal-l)', borderRadius: '999px', fontSize: '9px', color: 'var(--teal)', fontWeight: 700, fontFamily: 'var(--fb)' }}>In Progress</div></div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        <div style={{ display: 'flex', gap: '8px', padding: '7px 0', borderBottom: '1px solid rgba(15,14,26,.05)' }}><div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>✓</div><div style={{ flex: 1 }}><div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink2)', fontFamily: 'var(--fb)' }}>Define scope and stakeholders</div><div style={{ fontSize: '9px', color: 'var(--teal)', fontFamily: 'var(--fb)' }}>Done · Mar 10</div></div></div>
                        <div style={{ display: 'flex', gap: '8px', padding: '7px 0', borderBottom: '1px solid rgba(15,14,26,.05)' }}><div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>2</div><div style={{ flex: 1 }}><div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink2)', fontFamily: 'var(--fb)' }}>Build automation workflow</div><div style={{ fontSize: '9px', color: 'var(--purple)', fontFamily: 'var(--fb)' }}>In progress · Mar 22</div></div></div>
                        <div style={{ display: 'flex', gap: '8px', padding: '7px 0' }}><div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--bg2)', border: '1.5px solid rgba(15,14,26,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700, color: 'var(--muted)', flexShrink: 0 }}>3</div><div style={{ flex: 1 }}><div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--fb)' }}>Pilot with one team</div><div style={{ fontSize: '9px', color: 'var(--pale)', fontFamily: 'var(--fb)' }}>To do · Apr 1</div></div></div>
                      </div>
                      <div style={{ background: 'var(--bg)', border: '1px solid rgba(15,14,26,.07)', borderRadius: '7px', padding: '8px 10px', marginTop: '10px' }}><div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--pale)', fontWeight: 700, marginBottom: '6px', fontFamily: 'var(--fb)' }}>Step chat</div><div style={{ fontSize: '10px', color: 'var(--ink2)', fontFamily: 'var(--fb)' }}><span style={{ color: 'var(--purple)', fontWeight: 600 }}>@Priya</span> can you share Zapier credentials?</div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeFeat === 4 && (
            <div className="feat-panel active">
              <div className="htab-card" style={{ background: 'linear-gradient(145deg,#FFF9EE,#FFFDF5)' }}>
                <div className="htab-text">
                  <div className="htab-eyebrow">Engagement</div>
                  <h3 className="htab-title">Make innovation a daily habit</h3>
                  <p className="htab-desc">Every action on Catalyst earns points — submitting (10), getting approved (25), converting to a project (50), upvotes received (5), project completed (100). A live leaderboard shows the top innovators, keeping the culture alive every day.</p>
                </div>
                <div className="htab-mockup">
                  <div className="htab-shell">
                    <div className="htab-topbar"><div className="htd" style={{ background: '#FF5F57' }}></div><div className="htd" style={{ background: '#FEBC2E' }}></div><div className="htd" style={{ background: '#28C840' }}></div><div className="htab-url">catalyst.zuarione.com/leaderboard</div></div>
                    <div className="htab-body">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}><div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '12px', color: 'var(--ink)' }}>Top innovators</div><div style={{ fontSize: '9px', color: 'var(--muted)', background: 'var(--bg)', border: '1px solid rgba(15,14,26,.09)', borderRadius: '999px', padding: '2px 8px', fontFamily: 'var(--fb)' }}>March 2026</div></div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 0', borderBottom: '1px solid rgba(15,14,26,.06)' }}><div style={{ width: '16px', fontFamily: 'var(--fd)', fontSize: '11px', fontWeight: 700, color: '#D4820A', textAlign: 'center' }}>1</div><div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#5B4CF5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700, color: '#fff', fontFamily: 'var(--fd)' }}>PR</div><div style={{ flex: 1 }}><div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink2)', fontFamily: 'var(--fb)' }}>Priya Raghavan</div><div style={{ height: '3px', background: 'var(--bg2)', borderRadius: '2px', marginTop: '3px', overflow: 'hidden' }}><div style={{ height: '100%', width: '100%', background: 'linear-gradient(90deg,var(--purple),#8B72F8)', borderRadius: '2px' }}></div></div></div><div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '13px', color: 'var(--purple)' }}>840</div></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 0', borderBottom: '1px solid rgba(15,14,26,.06)' }}><div style={{ width: '16px', fontFamily: 'var(--fd)', fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textAlign: 'center' }}>2</div><div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#0E9E78', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700, color: '#fff', fontFamily: 'var(--fd)' }}>AK</div><div style={{ flex: 1 }}><div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink2)', fontFamily: 'var(--fb)' }}>Arjun Kapoor</div><div style={{ height: '3px', background: 'var(--bg2)', borderRadius: '2px', marginTop: '3px', overflow: 'hidden' }}><div style={{ height: '100%', width: '86%', background: 'linear-gradient(90deg,var(--purple),#8B72F8)', borderRadius: '2px' }}></div></div></div><div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '13px', color: 'var(--purple)' }}>725</div></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 0', borderBottom: '1px solid rgba(15,14,26,.06)' }}><div style={{ width: '16px', fontFamily: 'var(--fd)', fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textAlign: 'center' }}>3</div><div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#D4820A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700, color: '#fff', fontFamily: 'var(--fd)' }}>SM</div><div style={{ flex: 1 }}><div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink2)', fontFamily: 'var(--fb)' }}>Sara Mehta</div><div style={{ height: '3px', background: 'var(--bg2)', borderRadius: '2px', marginTop: '3px', overflow: 'hidden' }}><div style={{ height: '100%', width: '73%', background: 'linear-gradient(90deg,var(--purple),#8B72F8)', borderRadius: '2px' }}></div></div></div><div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '13px', color: 'var(--purple)' }}>612</div></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 0' }}><div style={{ width: '16px', fontFamily: 'var(--fd)', fontSize: '11px', fontWeight: 700, color: 'var(--pale)', textAlign: 'center' }}>4</div><div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#003580', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700, color: '#fff', fontFamily: 'var(--fd)' }}>RJ</div><div style={{ flex: 1 }}><div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink2)', fontFamily: 'var(--fb)' }}>Rohan Joshi</div><div style={{ height: '3px', background: 'var(--bg2)', borderRadius: '2px', marginTop: '3px', overflow: 'hidden' }}><div style={{ height: '100%', width: '70%', background: 'linear-gradient(90deg,var(--purple),#8B72F8)', borderRadius: '2px' }}></div></div></div><div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '13px', color: 'var(--purple)' }}>589</div></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeFeat === 5 && (
            <div className="feat-panel active">
              <div className="htab-card" style={{ background: 'linear-gradient(145deg,#F0FDF4,#F7FFF9)' }}>
                <div className="htab-text">
                  <div className="htab-eyebrow">Enterprise</div>
                  <h3 className="htab-title">Every action, logged. Nothing lost.</h3>
                  <p className="htab-desc">Every status change, comment, step update, and attachment action is logged with a timestamp, the actor's name, and a before/after value. Central Admin can view the full audit log per idea or project. CM sees their entity only.</p>
                </div>
                <div className="htab-mockup">
                  <div className="htab-shell">
                    <div className="htab-topbar"><div className="htd" style={{ background: '#FF5F57' }}></div><div className="htd" style={{ background: '#FEBC2E' }}></div><div className="htd" style={{ background: '#28C840' }}></div><div className="htab-url">catalyst.zuarione.com/audit</div></div>
                    <div className="htab-body">
                      <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '12px', color: 'var(--ink)', marginBottom: '10px' }}>Audit log &mdash; PRJ-042</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}><div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--purple-l)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: 'var(--purple)', fontFamily: 'var(--fd)', flexShrink: 0 }}>CM</div><div style={{ flex: 1, background: 'var(--bg)', border: '1px solid rgba(15,14,26,.08)', borderRadius: '7px', padding: '8px 10px' }}><div style={{ fontSize: '10px', color: 'var(--ink2)', fontFamily: 'var(--fb)' }}>Status changed <span style={{ color: 'var(--amber)', fontWeight: 600 }}>Under Review</span> &rarr; <span style={{ color: 'var(--teal)', fontWeight: 600 }}>Approved</span></div><div style={{ fontSize: '9px', color: 'var(--muted)', marginTop: '2px', fontFamily: 'var(--fb)' }}>Community Manager · Mar 14, 10:32am</div></div></div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}><div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--teal-l)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: 'var(--teal)', fontFamily: 'var(--fd)', flexShrink: 0 }}>CA</div><div style={{ flex: 1, background: 'var(--bg)', border: '1px solid rgba(15,14,26,.08)', borderRadius: '7px', padding: '8px 10px' }}><div style={{ fontSize: '10px', color: 'var(--ink2)', fontFamily: 'var(--fb)' }}>Idea converted to <span style={{ color: 'var(--purple)', fontWeight: 600 }}>PRJ-042</span></div><div style={{ fontSize: '9px', color: 'var(--muted)', marginTop: '2px', fontFamily: 'var(--fb)' }}>Central Admin · Mar 15, 9:14am</div></div></div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}><div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#2563EB', fontFamily: 'var(--fd)', flexShrink: 0 }}>PR</div><div style={{ flex: 1, background: 'var(--bg)', border: '1px solid rgba(15,14,26,.08)', borderRadius: '7px', padding: '8px 10px' }}><div style={{ fontSize: '10px', color: 'var(--ink2)', fontFamily: 'var(--fb)' }}>Step 1 marked <span style={{ color: 'var(--teal)', fontWeight: 600 }}>Done</span></div><div style={{ fontSize: '9px', color: 'var(--muted)', marginTop: '2px', fontFamily: 'var(--fb)' }}>Priya Raghavan · Mar 16, 2:45pm</div></div></div>
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
