import React, { useState } from 'react';

export default function HeroRightMockup() {
  const [activeMock, setActiveMock] = useState(0);

  const getMockUrl = () => {
    switch (activeMock) {
      case 0: return 'catalyst.zuarione.com/dashboard';
      case 1: return 'catalyst.zuarione.com/submit';
      case 2: return 'catalyst.zuarione.com/idea-hub';
      case 3: return 'catalyst.zuarione.com/leaderboard';
      case 4: return 'catalyst.zuarione.com/projects';
      default: return 'catalyst.zuarione.com/dashboard';
    }
  };

  return (
    <div className="hero-right">
      <div className="hero-app">
        <div className="app-topbar">
          <div className="app-dot" style={{ background: '#FF5F57' }}></div>
          <div className="app-dot" style={{ background: '#FEBC2E' }}></div>
          <div className="app-dot" style={{ background: '#28C840' }}></div>
          <div className="app-url" style={{ transition: 'all 0.3s ease' }} id="mockUrl">{getMockUrl()}</div>
        </div>
        <div className="app-body">
          <div className="app-sidebar">
            <div className="app-logo-row"><span className="alt">Catalyst</span></div>
            <div className={`app-nav ${activeMock === 0 ? 'on' : ''}`} onClick={() => setActiveMock(0)}>&#9632;&nbsp; Dashboard</div>
            <div className={`app-nav ${activeMock === 1 ? 'on' : ''}`} onClick={() => setActiveMock(1)}>&#43;&nbsp; Submit Idea</div>
            <div className={`app-nav ${activeMock === 2 ? 'on' : ''}`} onClick={() => setActiveMock(2)}>&#9651;&nbsp; Ideas Hub</div>
            <div className={`app-nav ${activeMock === 3 ? 'on' : ''}`} onClick={() => setActiveMock(3)}>&#9733;&nbsp; Leaderboard</div>
            <div className={`app-nav ${activeMock === 4 ? 'on' : ''}`} onClick={() => setActiveMock(4)}>&#9635;&nbsp; Projects</div>
          </div>
          <div className="app-content" id="mockContent">

            {/* SCREEN 0: Dashboard */}
            {activeMock === 0 && (
              <div className="mock-screen" id="ms0">
                <div className="app-h">My Ideas</div>
                <div className="app-stats">
                  <div className="as"><div className="as-l">Submitted</div><div className="as-v" style={{ color: '#2563EB' }}>8</div><div className="as-c" style={{ color: '#0E9E78' }}>+2 this month</div></div>
                  <div className="as"><div className="as-l">In Review</div><div className="as-v" style={{ color: '#D4820A' }}>3</div><div className="as-c" style={{ color: '#D4820A' }}>avg 4 days</div></div>
                  <div className="as"><div className="as-l">Converted</div><div className="as-v" style={{ color: '#0E9E78' }}>2</div><div className="as-c" style={{ color: '#0E9E78' }}>to projects</div></div>
                </div>
                <div className="app-ideas">
                  <div className="ai-row"><div className="ai-dot" style={{ background: '#0E9E78' }}></div><div className="ai-t">Automate onboarding with AI reminders</div><div className="ai-tag tag-converted">Converted</div></div>
                  <div className="ai-row"><div className="ai-dot" style={{ background: '#D4820A' }}></div><div className="ai-t">Cross-department knowledge sharing portal</div><div className="ai-tag tag-review">Under Review</div></div>
                  <div className="ai-row"><div className="ai-dot" style={{ background: '#5B4CF5' }}></div><div className="ai-t">Monthly innovation sprint for product teams</div><div className="ai-tag tag-approved">Approved</div></div>
                  <div className="ai-row"><div className="ai-dot" style={{ background: '#2563EB' }}></div><div className="ai-t">Reduce meeting overhead with async standups</div><div className="ai-tag tag-submitted">Submitted</div></div>
                </div>
              </div>
            )}

            {/* SCREEN 1: Submit Idea */}
            {activeMock === 1 && (
              <div className="mock-screen" id="ms1">
                <div className="app-h">Submit an idea</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '6px', marginBottom: '10px' }}>
                  <div style={{ background: 'var(--purple-l)', border: '1.5px solid var(--purple)', borderRadius: '7px', padding: '8px', textAlign: 'center' }}><div style={{ fontSize: '14px', marginBottom: '2px' }}>⚙️</div><div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--purple)', fontFamily: 'var(--fd)' }}>Process</div></div>
                  <div style={{ background: 'var(--bg)', border: '1px solid rgba(15,14,26,.09)', borderRadius: '7px', padding: '8px', textAlign: 'center' }}><div style={{ fontSize: '14px', marginBottom: '2px' }}>💼</div><div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--ink2)', fontFamily: 'var(--fd)' }}>Product</div></div>
                  <div style={{ background: 'var(--bg)', border: '1px solid rgba(15,14,26,.09)', borderRadius: '7px', padding: '8px', textAlign: 'center' }}><div style={{ fontSize: '14px', marginBottom: '2px' }}>💡</div><div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--ink2)', fontFamily: 'var(--fd)' }}>Cost saving</div></div>
                  <div style={{ background: 'var(--bg)', border: '1px solid rgba(15,14,26,.09)', borderRadius: '7px', padding: '8px', textAlign: 'center' }}><div style={{ fontSize: '14px', marginBottom: '2px' }}>🌱</div><div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--ink2)', fontFamily: 'var(--fd)' }}>Culture</div></div>
                  <div style={{ background: 'var(--bg)', border: '1px solid rgba(15,14,26,.09)', borderRadius: '7px', padding: '8px', textAlign: 'center' }}><div style={{ fontSize: '14px', marginBottom: '2px' }}>🤝</div><div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--ink2)', fontFamily: 'var(--fd)' }}>Customer</div></div>
                  <div style={{ background: 'var(--bg)', border: '1px solid rgba(15,14,26,.09)', borderRadius: '7px', padding: '8px', textAlign: 'center' }}><div style={{ fontSize: '14px', marginBottom: '2px' }}>···</div><div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--ink2)', fontFamily: 'var(--fd)' }}>General</div></div>
                </div>
                <div style={{ background: 'var(--bg)', border: '1px solid rgba(15,14,26,.09)', borderRadius: '7px', padding: '7px 9px', marginBottom: '7px' }}>
                  <div style={{ fontSize: '9px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '3px', fontFamily: 'var(--fb)' }}>Idea title</div>
                  <div style={{ fontSize: '11px', color: 'var(--ink2)', fontFamily: 'var(--fb)', border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '4px 7px', background: 'var(--purple-l)' }}>Automate weekly status reports</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 9px', background: 'var(--purple-l)', border: '1px solid rgba(91,76,245,.2)', borderRadius: '7px' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'linear-gradient(135deg,#4285F4,#EA4335,#FBBC05,#34A853)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 800, color: '#fff', flexShrink: 0 }}>G</div>
                  <span style={{ fontSize: '10px', color: 'var(--purple)', fontFamily: 'var(--fb)' }}>Or describe to Gemini — it fills this for you</span>
                </div>
              </div>
            )}

            {/* SCREEN 2: Ideas Hub */}
            {activeMock === 2 && (
              <div className="mock-screen" id="ms2">
                <div className="app-h">Ideas Hub</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg)', border: '1px solid rgba(15,14,26,.09)', borderRadius: '6px', padding: '6px 9px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--muted)' }}>🔍</span>
                  <span style={{ fontSize: '10px', color: 'var(--pale)', fontFamily: 'var(--fb)' }}>Search ideas...</span>
                </div>
                <div className="app-ideas">
                  <div className="ai-row"><div className="ai-dot" style={{ background: '#5B4CF5' }}></div><div className="ai-t">Weekly report automation</div><div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ padding: '2px 6px', border: '1.5px solid var(--purple)', borderRadius: '999px', fontSize: '9px', color: 'var(--purple)', fontWeight: 600, fontFamily: 'var(--fb)', background: 'var(--purple-l)' }}>▲ 12</div></div></div>
                  <div className="ai-row"><div className="ai-dot" style={{ background: '#D4820A' }}></div><div className="ai-t">Monthly innovation sprint</div><div style={{ padding: '2px 6px', border: '1px solid rgba(15,14,26,.1)', borderRadius: '999px', fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--fb)' }}>▲ 8</div></div>
                  <div className="ai-row"><div className="ai-dot" style={{ background: '#003580' }}></div><div className="ai-t">Vendor consolidation framework</div><div style={{ padding: '2px 6px', border: '1px solid rgba(15,14,26,.1)', borderRadius: '999px', fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--fb)' }}>▲ 5</div></div>
                  <div className="ai-row"><div className="ai-dot" style={{ background: '#2563EB' }}></div><div className="ai-t">Customer feedback loop</div><div style={{ padding: '2px 6px', border: '1px solid rgba(15,14,26,.1)', borderRadius: '999px', fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--fb)' }}>▲ 3</div></div>
                </div>
              </div>
            )}

            {/* SCREEN 3: Leaderboard */}
            {activeMock === 3 && (
              <div className="mock-screen" id="ms3">
                <div className="app-h">Leaderboard</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 0', borderBottom: '1px solid rgba(15,14,26,.06)' }}>
                    <div style={{ width: '16px', fontFamily: 'var(--fd)', fontSize: '11px', fontWeight: 700, color: '#D4820A', textAlign: 'center' }}>1</div>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#5B4CF5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700, color: '#fff', fontFamily: 'var(--fd)' }}>PR</div>
                    <div style={{ flex: 1 }}><div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink2)', fontFamily: 'var(--fb)' }}>Priya Raghavan</div><div style={{ height: '3px', background: 'var(--bg2)', borderRadius: '2px', marginTop: '3px', overflow: 'hidden' }}><div style={{ height: '100%', width: '100%', background: 'linear-gradient(90deg,var(--purple),#8B72F8)', borderRadius: '2px' }}></div></div></div>
                    <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '13px', color: 'var(--purple)' }}>840</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 0', borderBottom: '1px solid rgba(15,14,26,.06)' }}>
                    <div style={{ width: '16px', fontFamily: 'var(--fd)', fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textAlign: 'center' }}>2</div>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#0E9E78', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700, color: '#fff', fontFamily: 'var(--fd)' }}>AK</div>
                    <div style={{ flex: 1 }}><div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink2)', fontFamily: 'var(--fb)' }}>Arjun Kapoor</div><div style={{ height: '3px', background: 'var(--bg2)', borderRadius: '2px', marginTop: '3px', overflow: 'hidden' }}><div style={{ height: '100%', width: '86%', background: 'linear-gradient(90deg,var(--purple),#8B72F8)', borderRadius: '2px' }}></div></div></div>
                    <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '13px', color: 'var(--purple)' }}>725</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 0', borderBottom: '1px solid rgba(15,14,26,.06)' }}>
                    <div style={{ width: '16px', fontFamily: 'var(--fd)', fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textAlign: 'center' }}>3</div>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#D4820A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700, color: '#fff', fontFamily: 'var(--fd)' }}>SM</div>
                    <div style={{ flex: 1 }}><div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink2)', fontFamily: 'var(--fb)' }}>Sara Mehta</div><div style={{ height: '3px', background: 'var(--bg2)', borderRadius: '2px', marginTop: '3px', overflow: 'hidden' }}><div style={{ height: '100%', width: '73%', background: 'linear-gradient(90deg,var(--purple),#8B72F8)', borderRadius: '2px' }}></div></div></div>
                    <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '13px', color: 'var(--purple)' }}>612</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 0', borderBottom: '1px solid rgba(15,14,26,.06)' }}>
                    <div style={{ width: '16px', fontFamily: 'var(--fd)', fontSize: '11px', fontWeight: 700, color: 'var(--pale)', textAlign: 'center' }}>4</div>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#003580', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700, color: '#fff', fontFamily: 'var(--fd)' }}>RJ</div>
                    <div style={{ flex: 1 }}><div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink2)', fontFamily: 'var(--fb)' }}>Rohan Joshi</div><div style={{ height: '3px', background: 'var(--bg2)', borderRadius: '2px', marginTop: '3px', overflow: 'hidden' }}><div style={{ height: '100%', width: '70%', background: 'linear-gradient(90deg,var(--purple),#8B72F8)', borderRadius: '2px' }}></div></div></div>
                    <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '13px', color: 'var(--purple)' }}>589</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 0' }}>
                    <div style={{ width: '16px', fontFamily: 'var(--fd)', fontSize: '11px', fontWeight: 700, color: 'var(--pale)', textAlign: 'center' }}>5</div>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700, color: '#fff', fontFamily: 'var(--fd)' }}>NT</div>
                    <div style={{ flex: 1 }}><div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink2)', fontFamily: 'var(--fb)' }}>Neha Tiwari</div><div style={{ height: '3px', background: 'var(--bg2)', borderRadius: '2px', marginTop: '3px', overflow: 'hidden' }}><div style={{ height: '100%', width: '52%', background: 'linear-gradient(90deg,var(--purple),#8B72F8)', borderRadius: '2px' }}></div></div></div>
                    <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '13px', color: 'var(--purple)' }}>441</div>
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN 4: Projects */}
            {activeMock === 4 && (
              <div className="mock-screen" id="ms4">
                <div className="app-h">Projects</div>
                <div className="app-ideas">
                  <div className="ai-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', width: '100%' }}>
                      <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '9px', color: 'var(--purple)', background: 'var(--purple-l)', padding: '1px 6px', borderRadius: '3px' }}>PRJ-042</div>
                      <div className="ai-t">Automate weekly status reports</div>
                      <div className="ai-tag" style={{ background: 'var(--teal-l)', color: 'var(--teal)' }}>Active</div>
                    </div>
                    <div style={{ width: '100%', background: 'var(--bg2)', borderRadius: '3px', height: '4px', overflow: 'hidden' }}><div style={{ height: '100%', width: '60%', background: 'var(--teal)', borderRadius: '3px' }}></div></div>
                    <div style={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--fb)' }}>3 of 5 steps done · Due Apr 10</div>
                  </div>
                  <div className="ai-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', width: '100%' }}>
                      <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: '9px', color: 'var(--purple)', background: 'var(--purple-l)', padding: '1px 6px', borderRadius: '3px' }}>PRJ-038</div>
                      <div className="ai-t">Onboarding AI reminders</div>
                      <div className="ai-tag" style={{ background: '#E8F7F2', color: '#0E9E78' }}>Done</div>
                    </div>
                    <div style={{ width: '100%', background: 'var(--bg2)', borderRadius: '3px', height: '4px', overflow: 'hidden' }}><div style={{ height: '100%', width: '100%', background: 'var(--teal)', borderRadius: '3px' }}></div></div>
                    <div style={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--fb)' }}>5 of 5 steps done · Closed Mar 1</div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
