import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import './ProductTour.css';

/* ═══════════════════════════════════════════════════════════════════════════
   TOUR STEP DEFINITIONS
   ═══════════════════════════════════════════════════════════════════════════ */
const EMPLOYEE_STEPS = [
  { target: 'sidebar-submit', title: 'Innovation Hub', body: 'This is where you share new ideas. You have 5 submission slots per month to help us shape the future.' },
  { target: 'template-card-0', title: 'Strategic Templates', body: 'Select the template category that best fits your innovation, such as Cost Optimization or Safety.', fallbackCenter: true },
  { target: 'ai-fill-box', title: 'Smart AI Assistant', body: 'Click the mic button to describe your idea in English, Hindi, or Hinglish. The AI will understand and fill out the form for you automatically.', fallbackCenter: true },
  { target: 'sidebar-myideas', title: 'Track Your Ideas', body: 'Monitor the status of your submissions. See when they move from draft to review or approval.' },
  { target: 'sidebar-community', title: 'Community Hub', body: 'Explore innovations from across the organization. Get inspired by what other teams are doing.' },
  { target: 'sidebar-projects', title: 'Project Lifecycle', body: 'Once approved, track your idea through execution. Manage tasks, milestones, and collaborate with teams.' },
  { target: 'sidebar-leaderboard', title: 'Innovation Rankings', body: 'Earn points for every idea and project. Climb the leaderboard to become a top innovator.' },
];

const EMPLOYEE_WELCOME_VOICE = {
  english: "Ready to turn your ideas into organizational impact? Select your voice language and let's take a quick tour.",
  hindi: "क्या आप अपने आईडिया से कंपनी में बदलाव लाना चाहते हैं? अपनी आवाज की भाषा चुनें और डेमो देखें।",
};
const EMPLOYEE_DONE_VOICE = {
  english: "Mission complete! You've mastered the basics and earned your first innovator points.",
  hindi: "बधाई हो! आपने ट्रेनिंग पूरी कर ली है और 5 पॉइंट्स जीत लिए हैं। अब आप अपना पहला आईडिया भेजने के लिए तैयार हैं।",
};

const ADMIN_STEPS = [
  { target: 'sidebar-assigned', title: 'Admin Dashboard', body: 'Welcome to your command center. All ideas requiring your administrative attention are organized here.' },
  { target: 'filter-action', title: 'Action Required', body: 'This filter shows new submissions waiting for your initial review or final sign-off.' },
  { target: 'filter-review', title: 'Under Review', body: 'Track ideas that you have personally moved from the submitted stage into the active review phase.' },
  { target: 'filter-approved', title: 'Approved Ideas', body: 'Access the archive of all innovations you have successfully cleared for implementation.' },
  { target: 'filter-rejected', title: 'Declined Ideas', body: 'Review submissions that did not meet the strategic criteria or were deemed unfeasible.' },
  { target: 'sidebar-team', title: 'Team Ideas', body: 'Monitor all ideas submitted by employees within your specific company or team to ensure internal alignment.' },
  { target: 'sidebar-projects', title: 'Project Pipeline', body: 'Track the real-world execution and impact of your approved innovations here.' },
  { target: 'sidebar-leaderboard', title: 'Top Innovators', body: 'Recognize and reward the individuals driving change in your organization.' }
];

const ADMIN_WELCOME_VOICE = {
  english: "Greetings, Admin! Ready to manage the innovation pipeline? Select your language and let's explore every filter in your dashboard.",
  hindi: "नमस्ते एडमिन! क्या आप Zuari के नए आइडियाज़ को मैनेज करने के लिए तैयार हैं? अपनी भाषा चुनें और चलिए डैशबोर्ड का छोटा सा टूर करते हैं।"
};

const ADMIN_DONE_VOICE = {
  english: "Admin guide complete! You now have a full overview of the review states and organizational tools.",
  hindi: "बधाई हो! एडमिन टूर पूरा हुआ। अब आप डैशबोर्ड को अच्छी तरह से इस्तेमाल करने के लिए तैयार हैं।"
};

/* ═══════════════════════════════════════════════════════════════════════════
   PRE-GENERATED AUDIO ENGINE
   Zero-cost, zero-latency playback of Gemini 2.5 Flash TTS
   ═══════════════════════════════════════════════════════════════════════════ */
class AudioEngine {
  constructor() {
    this.currentAudio = null;
  }
  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
    }
  }
  play(stepId, lang, onStart, onEnd) {
    this.stop();
    const langCode = lang === 'hindi' ? 'hi' : 'en';
    const url = `/tour-audio/${stepId}_${langCode}.wav`;
    
    this.currentAudio = new Audio(url);
    this.currentAudio.onplay = onStart;
    this.currentAudio.onended = onEnd;
    this.currentAudio.onerror = () => {
      console.warn('Audio file not found:', url);
      onEnd?.(); // Fallback if missing
    };
    
    this.currentAudio.play().catch(err => {
      console.error('Audio playback prevented:', err);
      onEnd?.();
    });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   GEOMETRY HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * Given a target element's bounding rect, determine where to place the
 * tooltip and arrow so that:
 *  - Sidebar items → tooltip to the RIGHT, arrow on left edge pointing left
 *  - Content items → tooltip BELOW or ABOVE depending on space
 *  - Arrow always points at exact centre of target
 */
function calcGeometry(targetEl) {
  const r = targetEl.getBoundingClientRect();
  
  // ── IMPORTANT: Account for global CSS zoom ──
  // The app uses html { zoom: 85% }. getBoundingClientRect() returns zoomed pixels.
  // When we set CSS top/left on our overlay, the browser will apply zoom *again*.
  // So we must divide by the zoom factor to get the correct CSS coordinate.
  let zoom = 1;
  try {
    const htmlZoom = parseFloat(getComputedStyle(document.documentElement).zoom);
    if (!isNaN(htmlZoom) && htmlZoom !== 0) zoom = htmlZoom;
  } catch (e) {
    // ignore
  }

  const rLeft   = r.left / zoom;
  const rTop    = r.top / zoom;
  const rWidth  = r.width / zoom;
  const rHeight = r.height / zoom;
  const rRight  = r.right / zoom;
  const rBottom = r.bottom / zoom;

  const tCX   = rLeft + rWidth / 2;
  const tCY   = rTop  + rHeight / 2;
  
  const PW    = 340;     // popup width
  const PH    = 230;     // estimated popup height
  const GAP   = 20;      // space between target edge and popup
  const M     = 16;      // viewport margin
  const A     = 10;      // arrow triangle size

  const isSidebar = targetEl.id?.startsWith('sidebar-');

  let popTop, popLeft, arrowTop, arrowLeft, arrowDir;

  const viewWidth  = window.innerWidth / zoom;
  const viewHeight = window.innerHeight / zoom;

  if (isSidebar) {
    // ── RIGHT of sidebar item ──
    popLeft  = rRight + GAP;
    popTop   = clamp(tCY - PH / 2, M, viewHeight - PH - M);
    arrowDir = 'left';
    arrowTop  = tCY - A;
    arrowLeft = popLeft - A;

    // If popup goes off-screen right, flip to right-edge with padding
    if (popLeft + PW > viewWidth - M) {
      popLeft = viewWidth - PW - M;
      arrowLeft = popLeft - A;
    }
  } else {
    // ── BELOW or ABOVE content item ──
    const spaceBelow = viewHeight - rBottom;
    popLeft = clamp(tCX - PW / 2, M, viewWidth - PW - M);

    if (spaceBelow >= PH + GAP + M) {
      // Below
      popTop   = rBottom + GAP;
      arrowDir = 'up';
      arrowTop  = popTop - A;
      arrowLeft = tCX - A;
    } else {
      // Above
      popTop   = rTop - PH - GAP;
      arrowDir = 'down';
      arrowTop  = popTop + PH;
      arrowLeft = tCX - A;
    }
  }

  // Clamp arrow so it doesn't go off viewport
  arrowLeft = clamp(arrowLeft, M, viewWidth - A * 2 - M);

  return {
    spotlight: {
      top:    rTop    - 6,
      left:   rLeft   - 6,
      width:  rWidth  + 12,
      height: rHeight + 12,
    },
    popup: { top: popTop, left: popLeft },
    arrow: { top: arrowTop, left: arrowLeft, dir: arrowDir },
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function ProductTour({ isOpen, onClose, isMandatory = false }) {
  const { user } = useAuth();
  const navigate  = useNavigate();

  // ── Mobile detection ─────────────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isOrgAdmin = user?.role === 'Org Admin';
  const STEPS = isOrgAdmin ? ADMIN_STEPS : EMPLOYEE_STEPS;
  const WELCOME = isOrgAdmin ? ADMIN_WELCOME_VOICE : EMPLOYEE_WELCOME_VOICE;
  const DONE = isOrgAdmin ? ADMIN_DONE_VOICE : EMPLOYEE_DONE_VOICE;
  const prefix = isOrgAdmin ? 'admin_' : '';

  const [phase, setPhase]         = useState('welcome'); // welcome | tour | done
  const [lang,  setLang]          = useState('english');
  const [step,  setStep]          = useState(0);
  const [playing, setPlaying]     = useState(false);
  const [xpEarned, setXpEarned]   = useState(0);

  // Geometry state for the tour phase
  const [geo, setGeo] = useState(null); // { spotlight, popup, arrow } | null
  const [centered, setCentered] = useState(false); // fallback centre mode

  const ttsRef = useRef(null);

  // ── Init AudioEngine once ──────────────────────────────────────────────
  useEffect(() => {
    ttsRef.current = new AudioEngine();
    return () => ttsRef.current?.stop();
  }, []);

  // ── Reset on open/close ────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setPhase('welcome');
      setStep(0);
      setPlaying(false);
      setGeo(null);
      setCentered(false);
    } else {
      ttsRef.current?.stop();
      // Remove any leftover highlights
      document.querySelectorAll('.tour-hi').forEach(el => el.classList.remove('tour-hi'));
    }
  }, [isOpen]);

  // ── Speak helper ───────────────────────────────────────────────────────
  const speak = useCallback((stepId, language) => {
    ttsRef.current?.play(
      `${prefix}${stepId}`, language,
      () => setPlaying(true),
      () => setPlaying(false)
    );
  }, [prefix]);

  // ── Auto-speak on welcome ─────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || phase !== 'welcome' || !user) return;
    const t = setTimeout(() => {
      speak('welcome', lang);
    }, 500);
    return () => { clearTimeout(t); ttsRef.current?.stop(); };
  }, [isOpen, phase]); // eslint-disable-line

  // ── Go to a specific tour step ─────────────────────────────────────────
  const goToStep = useCallback((idx, language) => {
    const lng = language || lang;
    const s   = STEPS[idx];
    if (!s) return;

    ttsRef.current?.stop();
    setStep(idx);
    
    // Remove old highlights
    document.querySelectorAll('.tour-hi').forEach(el => el.classList.remove('tour-hi'));

    // ── On MOBILE: skip all programmatic UI interactions — just speak ──
    if (isMobile) {
      setTimeout(() => speak(`step_${idx + 1}`, lng), 200);
      return;
    }

    // ── DESKTOP guided tour: trigger programmatic navigation ──────────
    // We intentionally DO NOT setGeo(null) or setCentered(false) here.
    // By keeping the old coordinates while we wait for the 400ms timeout,
    // the UI will smoothly "drift" from the old element to the new element
    // instead of flashing white and flying in from nowhere.

    // Trigger specific actions if needed
    if (s.target === 'ai-fill-box') {
      const templateEl = document.getElementById('template-card-0');
      if (templateEl) {
        templateEl.click(); // Open the form
        // Wait for the form to render, then click the AI button
        setTimeout(() => {
          const aiBtn = document.getElementById('ai-fill-btn');
          if (aiBtn) aiBtn.click();
        }, 150);
      }
    } else if (s.target.startsWith('filter-')) {
      if (window.location.pathname !== '/dashboard') navigate('/dashboard');
      setTimeout(() => {
        const filterBtn = document.getElementById(s.target);
        if (filterBtn) filterBtn.click();
      }, 100);
    } else if (s.target.startsWith('sidebar-')) {
      const el = document.getElementById(s.target);
      if (el) el.click();
    }

    setTimeout(() => {
      // Find the *visible* element (handles duplicate IDs between desktop and mobile sidebars)
      const elements = document.querySelectorAll(`[id="${s.target}"]`);
      const el = Array.from(elements).find(e => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });

      if (!el) {
        setCentered(true);
        speak(`step_${idx + 1}`, lng);
        return;
      }
      el.classList.add('tour-hi');
      el.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
      speak(`step_${idx + 1}`, lng);
    }, 400); // 400ms delay to allow all programmatic clicks/rendering to settle
  }, [lang, speak, isMobile]);

  // ── Continuous Tracking Loop (DESKTOP ONLY) ───────────────────────────
  // This ensures the spotlight tracks the element perfectly during smooth
  // scrolling, layout shifts (like Navbar logo loading), and CSS animations.
  useEffect(() => {
    if (!isOpen || phase !== 'tour' || isMobile) return;
    let animationFrameId;

    const trackTarget = () => {
      const cur = STEPS[step];
      if (!cur) return;
      
      const elements = document.querySelectorAll(`[id="${cur.target}"]`);
      const el = Array.from(elements).find(e => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      
      if (el && !centered) {
        const newGeo = calcGeometry(el);
        setGeo(prev => {
          if (!prev) return newGeo;
          if (
            Math.abs(prev.spotlight.top - newGeo.spotlight.top) > 1 ||
            Math.abs(prev.spotlight.left - newGeo.spotlight.left) > 1 ||
            Math.abs(prev.spotlight.width - newGeo.spotlight.width) > 1 ||
            Math.abs(prev.spotlight.height - newGeo.spotlight.height) > 1
          ) {
            return newGeo;
          }
          return prev;
        });
      }
      animationFrameId = requestAnimationFrame(trackTarget);
    };

    animationFrameId = requestAnimationFrame(trackTarget);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isOpen, phase, step, centered, isMobile]);

  // ── Launch ─────────────────────────────────────────────────────────────
  const launch = () => {
    ttsRef.current?.stop();
    navigate('/dashboard');
    setPhase('tour');
    setTimeout(() => goToStep(0, lang), 400);
  };

  // ── Next / Prev ────────────────────────────────────────────────────────
  const next = () => {
    if (step < STEPS.length - 1) goToStep(step + 1);
    else finish();
  };
  const prev = () => { if (step > 0) goToStep(step - 1); };

  // ── Play / Pause ───────────────────────────────────────────────────────
  const togglePlay = () => {
    if (playing) { ttsRef.current?.stop(); setPlaying(false); }
    else if (phase === 'welcome') speak('welcome', lang);
    else speak(`step_${step + 1}`, lang);
  };

  // ── Language switch ────────────────────────────────────────────────────
  const switchLang = (newLang) => {
    setLang(newLang);
    ttsRef.current?.stop(); setPlaying(false);
    if (phase === 'welcome') {
      setTimeout(() => speak('welcome', newLang), 200);
    } else if (phase === 'tour') {
      setTimeout(() => speak(`step_${step + 1}`, newLang), 200);
    }
  };

  // ── Finish ─────────────────────────────────────────────────────────────
  const finish = async () => {
    ttsRef.current?.stop();
    document.querySelectorAll('.tour-hi').forEach(el => el.classList.remove('tour-hi'));
    setGeo(null);
    try { const r = await api.completeTour(); setXpEarned(r.xpGranted || 0); }
    catch { setXpEarned(0); }
    setPhase('done');
    setTimeout(() => speak('done', lang), 400);
  };

  // ── Close ──────────────────────────────────────────────────────────────
  const close = () => {
    ttsRef.current?.stop();
    document.querySelectorAll('.tour-hi').forEach(el => el.classList.remove('tour-hi'));
    onClose();
    navigate('/dashboard');
  };

  // ── Resize handler: recalculate geometry (DESKTOP ONLY) ───────────────
  useEffect(() => {
    if (!isOpen || phase !== 'tour' || isMobile) return;
    const onResize = () => {
      const el = document.getElementById(STEPS[step]?.target);
      if (el) setGeo(calcGeometry(el));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isOpen, phase, step, isMobile]);

  if (!isOpen) return null;

  /* ═══════════════════════════════════════════════════════════════════════
     WELCOME
     ═══════════════════════════════════════════════════════════════════════ */
  if (phase === 'welcome') {
    return (
      <div className="tour-backdrop" role="dialog" aria-modal="true">
        <div className="tour-card tour-card-welcome">
          {!isMandatory && (
            <button className="tour-x" onClick={onClose} aria-label="Close">×</button>
          )}
          <div className="tour-emoji-box tour-emoji-welcome">⚡</div>
          <h2 className="tour-heading">{isOrgAdmin ? 'Greetings, Admin!' : `Welcome, ${user?.name}!`}</h2>
          <p className="tour-sub">
            {isOrgAdmin ? "Ready to manage the innovation pipeline? Select your language and let's explore your dashboard." : "Ready to turn your ideas into organizational impact? Select your voice language and take a quick tour."}
          </p>

          <div className="tour-lang-bar">
            <button className={`tour-lang ${lang === 'english' ? 'on' : ''}`}
              onClick={() => switchLang('english')}>🌐 English</button>
            <button className={`tour-lang ${lang === 'hindi' ? 'on' : ''}`}
              onClick={() => switchLang('hindi')}>🇮🇳 हिंदी</button>
          </div>

          <div className="tour-actions">
            <button className="tour-play-sm" onClick={togglePlay}>{playing ? '⏸' : '▶'}</button>
            <button className="tour-btn-primary" onClick={launch}>{isOrgAdmin ? 'Begin Admin Tour' : 'Launch Discovery Mission →'}</button>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════
     DONE
     ═══════════════════════════════════════════════════════════════════════ */
  if (phase === 'done') {
    return (
      <div className="tour-backdrop" role="dialog" aria-modal="true">
        <div className="tour-card tour-card-done">
          <div className="tour-emoji-box tour-emoji-done">🏆</div>
          <h2 className="tour-heading">{isOrgAdmin ? 'Admin Guide Complete!' : 'Mission Complete!'}</h2>
          <p className="tour-sub">
            {isOrgAdmin ? "You now have a full overview of the review states and organizational tools." : (
              <>You've mastered the discovery mission. {xpEarned > 0 && <span>We've credited <span className="tour-xp">+{xpEarned} XP</span> to your profile.</span>}</>
            )}
          </p>
          <button className="tour-btn-dark" onClick={close}>{isOrgAdmin ? 'Start Managing' : 'Start Innovating'}</button>
        </div>
      </div>
    );
  }


  /* ═══════════════════════════════════════════════════════════════════════
     MOBILE TOUR STEP — simple centered card, no spotlight, no element nav
     ═══════════════════════════════════════════════════════════════════════ */
  if (phase === 'tour' && isMobile) {
    const cur = STEPS[step];
    return (
      <div className="tour-backdrop" role="dialog" aria-modal="true">
        <div className="tour-card" style={{ maxWidth: '92vw', padding: '28px 22px 22px' }}>
          {/* Step badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span className="tour-tip-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              STEP {step + 1} / {STEPS.length}
            </span>
            <button className="tour-tip-lang" onClick={() => switchLang(lang === 'english' ? 'hindi' : 'english')}>
              {lang === 'english' ? '🌐 EN' : '🇮🇳 HI'}
            </button>
          </div>
          <h3 className="tour-tip-title" style={{ fontSize: 20, marginBottom: 10 }}>{cur.title}</h3>
          <p className="tour-tip-body">{cur.body}</p>
          {/* Nav */}
          <div className="tour-tip-nav" style={{ marginTop: 20 }}>
            <button className="tour-tip-back" onClick={prev} disabled={step === 0}>Back</button>
            <div className="tour-tip-right">
              <button className="tour-tip-play" onClick={togglePlay}>{playing ? '⏸' : '▶'}</button>
              {step < STEPS.length - 1 ? (
                <button className="tour-tip-next" onClick={next}>Continue →</button>
              ) : (
                <button className="tour-tip-finish" onClick={finish}>Complete Mission →</button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════
     DESKTOP TOUR STEP — spotlight + arrow + tooltip
     ═══════════════════════════════════════════════════════════════════════ */
  const cur = STEPS[step];

  // Arrow CSS classes
  const arrowCls = geo ? `tour-arr tour-arr-${geo.arrow.dir}` : '';

  return createPortal(
    <>
      {/* Spotlight overlay */}
      {geo ? (
        <div className="tour-spot-layer">
          <div className="tour-spot-hole" style={{
            top:    geo.spotlight.top,
            left:   geo.spotlight.left,
            width:  geo.spotlight.width,
            height: geo.spotlight.height,
          }} />
        </div>
      ) : (
        <div className="tour-backdrop" />
      )}

      {/* Arrow — independent fixed element */}
      {geo && (
        <div className={arrowCls} style={{ top: geo.arrow.top, left: geo.arrow.left }} />
      )}

      {/* Tooltip */}
      {(geo || centered) && (
        <div
          className="tour-tip"
          style={
            geo
              ? { top: geo.popup.top, left: geo.popup.left }
              : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
          }
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="tour-tip-head">
          <span className="tour-tip-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            STEP {step + 1} / {STEPS.length}
          </span>
          <button className="tour-tip-lang" onClick={() => switchLang(lang === 'english' ? 'hindi' : 'english')}>
            {lang === 'english' ? '🌐 EN' : '🇮🇳 HI'}
          </button>
        </div>

        <h3 className="tour-tip-title">{cur.title}</h3>
        <p className="tour-tip-body">{cur.body}</p>

        {/* Nav */}
        <div className="tour-tip-nav">
          <button className="tour-tip-back" onClick={prev} disabled={step === 0}>Back</button>
          <div className="tour-tip-right">
            <button className="tour-tip-play" onClick={togglePlay}>{playing ? '⏸' : '▶'}</button>
            {step < STEPS.length - 1 ? (
              <button className="tour-tip-next" onClick={next}>Continue →</button>
            ) : (
              <button className="tour-tip-finish" onClick={finish}>Complete Mission →</button>
            )}
          </div>
        </div>
      </div>
      )}
    </>,
    document.body
  );
}
