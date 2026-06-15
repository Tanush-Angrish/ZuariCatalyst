import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

/* ═══════════════════════════════════════════════════════════════════
   FIRST IDEA NUDGE MODAL
   Shows once after:
     1. First-time walkthrough completes (auto tour), OR
     2. Returning login when tour is already done but no idea submitted.
   Disappears forever once the user submits their first idea.
   ═══════════════════════════════════════════════════════════════════ */

// ── Inline styles (no external CSS dependency) ──────────────────────
const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 99999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 12, 30, 0.72)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    animation: 'nudge-fade-in 0.35s ease both',
    padding: '16px',
  },
  card: {
    position: 'relative',
    width: '100%',
    maxWidth: '480px',
    borderRadius: '24px',
    background: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%)',
    boxShadow: '0 0 0 1px rgba(99,102,241,0.35), 0 32px 80px rgba(0,0,0,0.7), 0 0 60px rgba(99,102,241,0.18)',
    overflow: 'hidden',
    animation: 'nudge-card-in 0.45s cubic-bezier(.22,1,.36,1) both',
    padding: '40px 36px 32px',
  },
  glowRing: {
    position: 'absolute',
    top: '-80px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '320px',
    height: '320px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,0.22) 0%, rgba(99,102,241,0) 70%)',
    pointerEvents: 'none',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(99,102,241,0.18)',
    border: '1px solid rgba(99,102,241,0.4)',
    borderRadius: '999px',
    padding: '4px 14px',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#a5b4fc',
    marginBottom: '20px',
  },
  emojiBox: {
    width: '80px',
    height: '80px',
    borderRadius: '20px',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '40px',
    marginBottom: '20px',
    boxShadow: '0 8px 32px rgba(99,102,241,0.5)',
    animation: 'nudge-bounce 2.5s ease-in-out infinite',
  },
  heading: {
    fontSize: '26px',
    fontWeight: 800,
    color: '#fff',
    lineHeight: 1.2,
    marginBottom: '12px',
  },
  sub: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 1.65,
    marginBottom: '24px',
  },
  rewardBox: {
    borderRadius: '16px',
    background: 'rgba(99,102,241,0.12)',
    border: '1px solid rgba(99,102,241,0.3)',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '28px',
  },
  rewardIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    flexShrink: 0,
    boxShadow: '0 4px 16px rgba(245,158,11,0.4)',
  },
  rewardText: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#fbbf24',
    marginBottom: '2px',
    letterSpacing: '0.03em',
  },
  rewardDesc: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
  },
  rewardPts: {
    fontSize: '28px',
    fontWeight: 900,
    background: 'linear-gradient(135deg, #fbbf24, #f87171)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.02em',
    lineHeight: 1,
    flexShrink: 0,
  },
  ctaBtn: {
    width: '100%',
    padding: '15px 24px',
    borderRadius: '14px',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    border: 'none',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 4px 24px rgba(99,102,241,0.5)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease',
    marginBottom: '12px',
    letterSpacing: '0.01em',
  },
  dismissBtn: {
    width: '100%',
    padding: '10px',
    border: 'none',
    background: 'transparent',
    color: 'rgba(255,255,255,0.35)',
    fontSize: '13px',
    cursor: 'pointer',
    borderRadius: '10px',
    transition: 'color 0.15s ease',
  },
  sparkle: {
    position: 'absolute',
    borderRadius: '50%',
    pointerEvents: 'none',
    animation: 'nudge-float 4s ease-in-out infinite',
  },
  closeX: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    width: '32px',
    height: '32px',
    border: 'none',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '8px',
    color: 'rgba(255,255,255,0.5)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    transition: 'background 0.15s, color 0.15s',
    lineHeight: 1,
  },
};

const keyframes = `
@keyframes nudge-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes nudge-card-in {
  from { opacity: 0; transform: scale(0.88) translateY(24px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes nudge-bounce {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-8px); }
}
@keyframes nudge-float {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.6; }
  50%       { transform: translateY(-18px) scale(1.15); opacity: 0.3; }
}
@keyframes nudge-pulse-border {
  0%, 100% { box-shadow: 0 0 0 1px rgba(99,102,241,0.35), 0 32px 80px rgba(0,0,0,0.7), 0 0 60px rgba(99,102,241,0.18); }
  50%       { box-shadow: 0 0 0 2px rgba(99,102,241,0.55), 0 32px 80px rgba(0,0,0,0.7), 0 0 80px rgba(99,102,241,0.28); }
}
`;

// Floating sparkle dots for ambiance
const SPARKLES = [
  { size: 8, top: '12%', left: '8%', delay: '0s', color: '#818cf8' },
  { size: 5, top: '20%', right: '10%', delay: '1.2s', color: '#a78bfa' },
  { size: 6, bottom: '25%', left: '5%', delay: '0.6s', color: '#6366f1' },
  { size: 4, bottom: '15%', right: '8%', delay: '2s', color: '#c4b5fd' },
  { size: 7, top: '55%', left: '3%', delay: '1.8s', color: '#818cf8' },
];

export default function FirstIdeaNudgeModal({ onDismiss }) {
  const navigate = useNavigate();
  const [hoverCta, setHoverCta] = useState(false);
  const [hoverDismiss, setHoverDismiss] = useState(false);

  // Inject keyframes once
  useEffect(() => {
    if (document.getElementById('nudge-kf')) return;
    const style = document.createElement('style');
    style.id = 'nudge-kf';
    style.textContent = keyframes;
    document.head.appendChild(style);
  }, []);

  const handleCTA = () => {
    onDismiss();          // close popup, but don't mark as "submitted" — it'll reappear next login
    navigate('/dashboard'); // Navigate to the Submit Idea tab (the default employee dashboard view)
  };

  return createPortal(
    <div style={styles.backdrop} role="dialog" aria-modal="true" aria-labelledby="nudge-heading">
      <div style={{
        ...styles.card,
        animation: 'nudge-card-in 0.45s cubic-bezier(.22,1,.36,1) both, nudge-pulse-border 3s ease-in-out 1s infinite',
      }}>
        {/* Ambient glow ring */}
        <div style={styles.glowRing} aria-hidden="true" />

        {/* Floating sparkles */}
        {SPARKLES.map((s, i) => (
          <div
            key={i}
            aria-hidden="true"
            style={{
              ...styles.sparkle,
              width: s.size,
              height: s.size,
              top: s.top,
              left: s.left,
              right: s.right,
              bottom: s.bottom,
              backgroundColor: s.color,
              animationDelay: s.delay,
            }}
          />
        ))}

        {/* Close X button */}
        <button
          id="nudge-close-btn"
          style={{
            ...styles.closeX,
            background: hoverDismiss ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.08)',
            color: hoverDismiss ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)',
          }}
          onClick={onDismiss}
          onMouseEnter={() => setHoverDismiss(true)}
          onMouseLeave={() => setHoverDismiss(false)}
          aria-label="Dismiss"
        >
          ×
        </button>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Badge */}
          <div style={styles.badge}>
            <span>⚡</span>
            <span>Limited — First Submission Only</span>
          </div>

          {/* Emoji */}
          <div style={styles.emojiBox} aria-hidden="true">💡</div>

          {/* Heading */}
          <h2 id="nudge-heading" style={styles.heading}>
            Your First Idea is Worth <span style={{ background: 'linear-gradient(90deg,#818cf8,#c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>50 Points!</span>
          </h2>

          {/* Sub-text */}
          <p style={styles.sub}>
            You haven't submitted your first idea yet! Take the leap — share an innovation, a cost-saving tweak, or a bold new approach. Your organization is waiting to hear from you.
          </p>

          {/* Reward highlight box */}
          <div style={styles.rewardBox}>
            <div style={styles.rewardIcon}>🏆</div>
            <div style={styles.rewardText}>
              <div style={styles.rewardTitle}>FIRST IDEA BONUS</div>
              <div style={styles.rewardDesc}>One-time reward · Added instantly to your profile</div>
            </div>
            <div style={styles.rewardPts}>+50</div>
          </div>

          {/* CTA */}
          <button
            id="nudge-submit-idea-btn"
            style={{
              ...styles.ctaBtn,
              transform: hoverCta ? 'translateY(-2px) scale(1.01)' : 'translateY(0) scale(1)',
              boxShadow: hoverCta
                ? '0 8px 32px rgba(99,102,241,0.7)'
                : '0 4px 24px rgba(99,102,241,0.5)',
            }}
            onClick={handleCTA}
            onMouseEnter={() => setHoverCta(true)}
            onMouseLeave={() => setHoverCta(false)}
          >
            <span>✨</span>
            Submit My First Idea &amp; Earn 50 pts
            <span style={{ marginLeft: '2px' }}>→</span>
          </button>

          {/* Dismiss */}
          <button
            style={{
              ...styles.dismissBtn,
              color: hoverDismiss ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.35)',
            }}
            onClick={onDismiss}
            onMouseEnter={() => setHoverDismiss(true)}
            onMouseLeave={() => setHoverDismiss(false)}
          >
            Remind me later
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
