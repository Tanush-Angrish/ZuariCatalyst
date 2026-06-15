import React, { useEffect, useState, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Button } from '../ui/Button';
import { X } from 'lucide-react';
import ProductTour from '../ProductTour';
import FirstIdeaNudgeModal from '../FirstIdeaNudgeModal';
import { useTour } from '../../context/TourContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export default function DashboardLayout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { isTourActive, startTour, endTour } = useTour();
  const { user } = useAuth();
  const [isMandatory, setIsMandatory] = useState(false);
  const [tourChecked, setTourChecked] = useState(false);

  // ── First-Idea Nudge state ──────────────────────────────────────────
  // showNudge: whether to render the popup RIGHT NOW
  // nudgeReady: all checks done, we know nudge should appear
  // wasAutoTour: true when this session triggered the mandatory walkthrough
  const [showNudge, setShowNudge] = useState(false);
  const [nudgeEligible, setNudgeEligible] = useState(false); // user hasn't submitted any idea
  const wasAutoTour = useRef(false); // did this session auto-launch the mandatory tour?

  // Close menu on route change
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // ── Tour auto-launch check ──────────────────────────────────────────
  useEffect(() => {
    if (!user || tourChecked) return;

    // Only auto-launch for roles that actually have a tour
    if (user.role !== 'Employee' && user.role !== 'Org Admin') {
      setTourChecked(true);
      return;
    }

    api.getTourStatus()
      .then(({ hasCompletedTour }) => {
        setTourChecked(true);
        if (!hasCompletedTour) {
          // First-time user — launch mandatory walkthrough
          setIsMandatory(true);
          wasAutoTour.current = true;
          startTour();
        }
      })
      .catch(() => setTourChecked(true)); // fail silently
  }, [user, tourChecked, startTour]);

  // ── Nudge eligibility check (Employees only) ────────────────────────
  // Run once after tourChecked is settled. We check nudge-status which
  // tells us: (a) has tour been completed, (b) has first idea been submitted.
  useEffect(() => {
    if (!user || !tourChecked || user.role !== 'Employee') return;

    api.getNudgeStatus()
      .then(({ hasCompletedTour, hasSubmittedFirstIdea }) => {
        if (!hasSubmittedFirstIdea) {
          setNudgeEligible(true);
          // If tour is already done (returning user), show nudge immediately.
          // If tour just started (wasAutoTour), wait — we'll show after tour finishes.
          if (hasCompletedTour && !isTourActive) {
            setShowNudge(true);
          }
        }
      })
      .catch(() => {}); // fail silently
  }, [user, tourChecked]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Show nudge AFTER the auto-tour finishes ─────────────────────────
  // When the mandatory tour becomes inactive and it was an auto-tour session,
  // and the user is still nudge-eligible, pop the nudge.
  const prevTourActive = useRef(isTourActive);
  useEffect(() => {
    const justFinished = prevTourActive.current && !isTourActive;
    prevTourActive.current = isTourActive;

    if (justFinished && wasAutoTour.current && nudgeEligible) {
      // Small delay so tour done-screen doesn't overlap
      const t = setTimeout(() => setShowNudge(true), 600);
      return () => clearTimeout(t);
    }
  }, [isTourActive, nudgeEligible]);

  const handleTourClose = () => {
    // If mandatory (first-time), only allow closing via Finish button
    if (isMandatory && isTourActive) return;
    endTour();
  };

  const handleTourOpen = () => {
    setIsMandatory(false); // manual replay is never mandatory
    wasAutoTour.current = false; // manual tour should NOT trigger nudge afterwards
    startTour();
  };

  // Dismiss nudge (just hide for this session; it re-appears next login
  // until hasSubmittedFirstIdea becomes true from the backend)
  const handleNudgeDismiss = () => setShowNudge(false);

  return (
    <div className="h-full flex flex-col bg-gray-50 relative">
      <Navbar onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#fdfdfd]">
          <div key={location.pathname} className="w-full max-w-[1600px] animate-fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Navigation Drawer */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white flex flex-col transform transition-all duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full shadow-none pointer-events-none'}`}>
        <div className="h-16 flex items-center justify-between px-4 border-b shrink-0">
          <span className="text-xl font-bold text-[#1d3368] pl-2">Navigation</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(false)}
            className="hover:bg-gray-100/50"
          >
            <X className="h-6 w-6 text-gray-500" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Sidebar isMobile />
        </div>
      </div>

      {/* Product Tour */}
      <ProductTour
        isOpen={isTourActive}
        onClose={endTour}
        isMandatory={isMandatory}
      />

      {/* First-Idea Nudge Popup */}
      {showNudge && (
        <FirstIdeaNudgeModal onDismiss={handleNudgeDismiss} />
      )}
    </div>
  );
}

