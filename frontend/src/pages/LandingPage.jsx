import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// MSAL / Outlook SSO imports removed — see msalConfig.js
import { ArrowRight, AlertCircle, X, Check, Activity, Shield, Lightbulb, ChevronUp } from 'lucide-react';

import './LandingPage.css';
import HeroRightMockup from '../components/landing/HeroRightMockup';
import HowItWorksTabs from '../components/landing/HowItWorksTabs';
import FeaturesTabs from '../components/landing/FeaturesTabs';

const ALLOWED_DOMAIN = '@adventz.com';

export default function LandingPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScrollTopToggle = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScrollTopToggle);
    return () => window.removeEventListener('scroll', handleScrollTopToggle);
  }, []);

  // Scroll Reveal Logic
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        } else {
          entry.target.classList.remove('visible');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.sr').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    // Frontend domain validation
    if (!email.toLowerCase().endsWith(ALLOWED_DOMAIN)) {
      setError(`Only ${ALLOWED_DOMAIN} email addresses are allowed.`);
      return;
    }
    setLoading(true);
    try {
      await login(email.toLowerCase(), password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // handleOutlookLogin removed — MSAL/Outlook SSO is disabled

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white" style={{fontFamily: 'var(--fb)'}}>
      {/* NAVBAR */}
      <header className="fixed top-0 w-full z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 transition-all">
        <div className="flex items-center justify-between py-4 md:py-5 px-4 lg:px-12 max-w-[1440px] mx-auto z-10 relative">
          
          {/* Left Side: Zuari Logo + vertical divider + Catalyst Logo */}
          <div className="flex items-center gap-3 md:gap-6">
            <img 
              src="https://www.zuariindustries.in/assets/web/img/logo/zuari_logo.png" 
              alt="Zuari Industries" 
              className="h-6 md:h-10 object-contain shrink-0"
            />
            
            <div className="h-6 md:h-10 w-[1px] md:w-[1.5px] bg-[#E5E7EB] rounded-full shrink-0"></div> {/* Divider */}
            
            <div className="flex items-center gap-2 md:gap-2.5">
              <div className="flex flex-col justify-center">
                <span className="text-[20px] md:text-[28px] font-extrabold text-[#1d3368] tracking-tight leading-none" style={{fontFamily: 'var(--fd)'}}>
                  Catalyst
                </span>
                <span className="hidden sm:block text-[9px] font-extrabold text-[#4B5563] tracking-[0.15em] uppercase mt-1.5">
                  Ignite. Innovate. Implement.
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-8 ml-auto">
            {/* Center/Right Nav Links */}
            <nav className="hidden md:flex gap-10 text-[14.5px] font-bold text-[#4B5563] ml-4 mr-4">
              <button onClick={() => scrollToSection('how-it-works')} className="hover:text-[#1d3368] transition-colors">How it works</button>
              <button onClick={() => scrollToSection('features')} className="hover:text-[#1d3368] transition-colors">Features</button>
              <button onClick={() => scrollToSection('for-your-team')} className="hover:text-[#1d3368] transition-colors">For your team</button>
            </nav>

            {/* Far Right: Sign In + Adventz Logo */}
            <div className="flex gap-4 md:gap-6 items-center shrink-0">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-[#1d3368] hover:bg-[#162750] text-white rounded-[12px] md:rounded-full px-4 md:px-8 py-2 md:py-2.5 text-[12px] md:text-[14.5px] font-bold transition-all shadow-md hover:shadow-lg leading-tight md:leading-normal shrink-0"
              >
                Log<br className="md:hidden"/><span className="hidden md:inline"> </span>in
              </button>
              
              <div className="h-10 w-[1.5px] bg-[#E5E7EB] rounded-full hidden lg:block"></div> {/* Divider */}

              <img 
                src="https://www.zuariindustries.in/assets/web/img/logo/adventz.png" 
                alt="Adventz" 
                className="h-12 object-contain hidden lg:block text-xs"
              />
            </div>
          </div>
          
        </div>
      </header>

      <main className="pt-28">
        {/* HERO SECTION */}
        <section className="max-w-[1280px] mx-auto px-6 lg:px-12 pt-6 md:pt-10 pb-16 md:pb-24 flex flex-col md:flex-row items-center justify-between gap-12 md:gap-[80px]">
          <div className="md:w-[55%] sr w-full">
            <div className="sec-eyebrow" style={{display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--purple-l)', color: 'var(--purple)'}}>
              <span className="w-[5px] h-[5px] rounded-full bg-current opacity-80 animate-pulse" style={{ animationDuration: '2s' }}></span>
              Ignite. Innovate. Implement.
            </div>
            <h1 className="text-[54px] sm:text-[64px] leading-[1.05] font-extrabold tracking-tight text-[#0A0A0A] mb-6 md:mb-6 mt-4" style={{fontFamily: 'var(--fd)'}}>
              Turn every<br className="md:hidden"/> employee<br className="md:hidden"/> idea into<br className="md:hidden"/> <span style={{color: 'var(--purple)'}}>real impact</span>
            </h1>
            <p className="text-[16.5px] md:text-[18px] text-[#4B5563] max-w-lg mb-8 md:mb-10" style={{lineHeight: '1.6'}}>
              Catalyst gives every employee a structured voice — and gives your organisation a complete system to capture, review, and convert great ideas into executed projects.
            </p>
          </div>
          <div className="lg:w-[45%] w-full flex justify-end sr" style={{animationDelay: '100ms'}}>
            <HeroRightMockup />
          </div>
        </section>

        {/* STATS SECTION */}
        <section className="max-w-6xl mx-auto px-6 lg:px-12 py-16 sr border-t border-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100/60 text-center gap-y-12">
            <div>
              <div className="text-[42px] font-extrabold text-brand-black mb-2" style={{fontFamily: 'var(--fd)'}}>62<span style={{color: 'var(--purple)'}}>+</span></div>
              <div className="text-[13px] text-gray-500 mx-auto max-w-[160px] font-medium leading-[1.6]">features across all three roles — employee, CM, and central admin</div>
            </div>
            <div>
              <div className="text-[42px] font-extrabold text-brand-black mb-2" style={{fontFamily: 'var(--fd)'}}>3<span style={{color: 'var(--teal)'}}>x</span></div>
              <div className="text-[13px] text-gray-500 mx-auto max-w-[160px] font-medium leading-[1.6]">faster idea-to-project conversion with Gemini AI assistance</div>
            </div>
            <div>
              <div className="text-[42px] font-extrabold text-brand-black mb-2" style={{fontFamily: 'var(--fd)'}}>7<span style={{color: 'var(--amber)'}}>d</span></div>
              <div className="text-[13px] text-gray-500 mx-auto max-w-[160px] font-medium leading-[1.6]">SLA guarantee — every idea reviewed, no idea left behind</div>
            </div>
            <div>
              <div className="text-[42px] font-extrabold text-brand-black mb-2" style={{fontFamily: 'var(--fd)'}}>100<span style={{color: 'var(--purple)'}}>%</span></div>
              <div className="text-[13px] text-gray-500 mx-auto max-w-[160px] font-medium leading-[1.6]">audit trail on every status change, comment, and decision</div>
            </div>
          </div>
        </section>

        {/* EVERY ACTION EARNS POINTS (TIMELINE) */}
        <section className="bg-[#fafafa] py-20 lg:py-24 px-6 lg:px-12 text-center sr">
          <h2 className="text-[36px] font-extrabold text-brand-black mb-4 tracking-tight" style={{fontFamily: 'var(--fd)'}}>Every action earns points</h2>
          <p className="text-[16px] text-gray-500 mx-auto max-w-xl mb-24 leading-relaxed">
            As employees get their idea approved and turn them into real projects - they climb up leaderboard.
          </p>
          
          <div className="max-w-4xl mx-auto relative px-4">
            <div className="absolute top-[12px] h-[2px] bg-gray-200 hidden md:block" style={{ left: '12.5%', width: '75%', zIndex: 0 }}>
              <div className="timeline-traveler hidden md:block"></div>
            </div>
            
            <div className="flex flex-col md:flex-row justify-between relative z-10 gap-16 md:gap-10">
              
              <div className="flex flex-col items-center flex-1">
                <div className="shrink-0 w-7 h-7 bg-brand-blue border-[6px] border-white rounded-full mb-3 shadow-[0_0_0_1px_rgba(0,53,128,0.15)] relative">
                  <div className="timeline-pulse pulse-1 hidden md:block"></div>
                </div>
                <div className="text-[17px] md:text-[14px] font-extrabold text-brand-black mb-1" style={{fontFamily: 'var(--fd)'}}>10 pts</div>
                <div className="text-[14px] md:text-[12px] text-gray-500 font-medium leading-[1.4]">Submit<br className="md:hidden"/> an idea</div>
              </div>
              


              <div className="flex flex-col items-center flex-1">
                <div className="shrink-0 w-7 h-7 bg-brand-blue border-[6px] border-white rounded-full mb-3 shadow-[0_0_0_1px_rgba(0,53,128,0.15)] relative">
                  <div className="timeline-pulse pulse-2 hidden md:block"></div>
                </div>
                <div className="text-[17px] md:text-[14px] font-extrabold text-brand-black mb-1" style={{fontFamily: 'var(--fd)'}}>5 pts</div>
                <div className="text-[14px] md:text-[12px] text-gray-500 font-medium leading-[1.4]">Per upvote<br className="md:hidden"/> received</div>
              </div>
              
              <div className="flex flex-col items-center flex-1">
                <div className="shrink-0 w-7 h-7 bg-brand-blue border-[6px] border-white rounded-full mb-3 shadow-[0_0_0_1px_rgba(0,53,128,0.15)] relative">
                  <div className="timeline-pulse pulse-3 hidden md:block"></div>
                </div>
                <div className="text-[17px] md:text-[14px] font-extrabold text-brand-black mb-1" style={{fontFamily: 'var(--fd)'}}>50 pts</div>
                <div className="text-[14px] md:text-[12px] text-gray-500 font-medium leading-[1.4]">Converted to<br className="md:hidden"/> project</div>
              </div>
              
              <div className="flex flex-col items-center flex-1 relative">
                <div className="shrink-0 w-7 h-7 bg-brand-blue border-[6px] border-white rounded-full mb-3 shadow-[0_0_0_1px_rgba(0,53,128,0.3)] ring-4 ring-brand-blue/10 relative">
                  <div className="timeline-pulse pulse-4-big hidden md:block"></div>
                </div>
                <div className="text-[17px] md:text-[14px] font-extrabold text-brand-black mb-1" style={{fontFamily: 'var(--fd)'}}>100 pts</div>
                <div className="text-[14px] md:text-[12px] text-gray-500 font-medium leading-[1.4]">Project<br className="md:hidden"/> completed</div>
              </div>
              
            </div>
          </div>
        </section>

        {/* TABS COMPONENTS */}
        <HowItWorksTabs />
        <FeaturesTabs />

        {/* FOR YOUR TEAM CARDS */}
        <section id="for-your-team" className="pt-12 pb-24 lg:pt-16 lg:pb-32 px-6 lg:px-12 bg-[#ffffff] sr">
          <div className="max-w-[1100px] mx-auto mb-16 text-center flex flex-col items-center">
            <div className="sec-eyebrow" style={{ display: 'inline-flex', marginBottom: '20px', background: 'var(--teal-l)', color: 'var(--teal)', fontSize: '11px', fontWeight: '800', letterSpacing: '0.05em' }}>FOR YOUR TEAM</div>
            <h2 className="text-[46px] font-extrabold text-[#0A0A0A] tracking-tight mb-5 leading-[1.1]" style={{fontFamily: 'var(--fd)'}}>Three roles. One system.</h2>
            <p className="text-[17px] text-[#4b5563] leading-relaxed max-w-2xl text-center">
              Every person in your organisation has a distinct experience<br className="hidden sm:block"/>— designed around how they actually work.
            </p>
          </div>

          <div className="max-w-[1100px] mx-auto grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white rounded-[24px] p-10 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-[14px] bg-[#F3F4F6] text-[22px] flex items-center justify-center mb-8 border border-gray-100">
                🙋
              </div>
              <h3 className="text-[22px] font-extrabold text-[#0A0A0A] mb-4 tracking-tight" style={{fontFamily: 'var(--fd)'}}>Employee</h3>
              <p className="text-[14.5px] text-[#4b5563] mb-8 leading-relaxed">Submit ideas, track progress, earn points, and see your thinking become real.</p>
              <ul className="space-y-4 text-[13.5px] text-[#4b5563] font-medium leading-[1.4]">
                <li className="flex gap-3 items-start"><div className="w-4 h-4 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 mt-0.5"><Check className="w-3 h-3" strokeWidth={3} /></div> <span>Submit via templates or describe to Gemini</span></li>
                <li className="flex gap-3 items-start"><div className="w-4 h-4 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 mt-0.5"><Check className="w-3 h-3" strokeWidth={3} /></div> <span>Track every idea through its full lifecycle</span></li>
                <li className="flex gap-3 items-start"><div className="w-4 h-4 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 mt-0.5"><Check className="w-3 h-3" strokeWidth={3} /></div> <span>Upvote colleagues' ideas in the Ideas Hub</span></li>
                <li className="flex gap-3 items-start"><div className="w-4 h-4 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 mt-0.5"><Check className="w-3 h-3" strokeWidth={3} /></div> <span>Earn points and climb the leaderboard</span></li>
                <li className="flex gap-3 items-start"><div className="w-4 h-4 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 mt-0.5"><Check className="w-3 h-3" strokeWidth={3} /></div> <span>Real-time notifications on every update</span></li>
              </ul>
            </div>

            {/* Card 2 */}
            <div className="bg-[#F8F7FF] rounded-[24px] p-10 shadow-[0_20px_40px_-15px_rgba(91,76,245,0.15)] border border-[#5B4CF5] hover:shadow-xl hover:-translate-y-1 transition-all relative z-10 w-full md:scale-105">
              <div className="flex justify-between items-start mb-8">
                <div className="w-12 h-12 rounded-[14px] bg-[#F0EEFF] text-[22px] flex items-center justify-center border border-purple-100">
                  🎯
                </div>
                <div className="bg-[#5B4CF5] text-white text-[11px] font-bold px-3 py-1.5 rounded-[8px] tracking-wide relative">
                  Most Powerful
                </div>
              </div>
              <h3 className="text-[22px] font-extrabold text-[#0A0A0A] mb-4 tracking-tight" style={{fontFamily: 'var(--fd)'}}>Community Manager</h3>
              <p className="text-[14.5px] text-[#4b5563] mb-8 leading-relaxed">Own your entity's idea pipeline. Review, decide, convert, and track execution.</p>
              <ul className="space-y-4 text-[13.5px] text-[#4b5563] font-medium leading-[1.4]">
                <li className="flex gap-3 items-start"><div className="w-4 h-4 rounded-full bg-purple-50 text-[#5B4CF5] flex items-center justify-center shrink-0 mt-0.5"><Check className="w-3 h-3" strokeWidth={3} /></div> <span>Auto-assigned all ideas from your entity</span></li>
                <li className="flex gap-3 items-start"><div className="w-4 h-4 rounded-full bg-purple-50 text-[#5B4CF5] flex items-center justify-center shrink-0 mt-0.5"><Check className="w-3 h-3" strokeWidth={3} /></div> <span>Approve, reject with reason, or request detail</span></li>
                <li className="flex gap-3 items-start"><div className="w-4 h-4 rounded-full bg-purple-50 text-[#5B4CF5] flex items-center justify-center shrink-0 mt-0.5"><Check className="w-3 h-3" strokeWidth={3} /></div> <span>Convert ideas to projects with AI steps</span></li>
                <li className="flex gap-3 items-start"><div className="w-4 h-4 rounded-full bg-purple-50 text-[#5B4CF5] flex items-center justify-center shrink-0 mt-0.5"><Check className="w-3 h-3" strokeWidth={3} /></div> <span>SLA nudges so nothing sits in review too long</span></li>
                <li className="flex gap-3 items-start"><div className="w-4 h-4 rounded-full bg-purple-50 text-[#5B4CF5] flex items-center justify-center shrink-0 mt-0.5"><Check className="w-3 h-3" strokeWidth={3} /></div> <span>Comment, tag, and close projects with outcome</span></li>
              </ul>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-[24px] p-10 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-[14px] bg-[#F3F4F6] text-[22px] flex items-center justify-center mb-8 border border-gray-100">
                🏛️
              </div>
              <h3 className="text-[22px] font-extrabold text-[#0A0A0A] mb-4 tracking-tight" style={{fontFamily: 'var(--fd)'}}>Central Admin</h3>
              <p className="text-[14.5px] text-[#4b5563] mb-8 leading-relaxed">Govern the entire platform across all entities from one command centre.</p>
              <ul className="space-y-4 text-[13.5px] text-[#4b5563] font-medium leading-[1.4]">
                <li className="flex gap-3 items-start"><div className="w-4 h-4 rounded-full bg-green-50 text-green-500 flex items-center justify-center shrink-0 mt-0.5"><Check className="w-3 h-3" strokeWidth={3} /></div> <span>Cross-entity dashboard — all ideas, all projects</span></li>
                <li className="flex gap-3 items-start"><div className="w-4 h-4 rounded-full bg-green-50 text-green-500 flex items-center justify-center shrink-0 mt-0.5"><Check className="w-3 h-3" strokeWidth={3} /></div> <span>Manage users, designate CMs, configure SLAs</span></li>
                <li className="flex gap-3 items-start"><div className="w-4 h-4 rounded-full bg-green-50 text-green-500 flex items-center justify-center shrink-0 mt-0.5"><Check className="w-3 h-3" strokeWidth={3} /></div> <span>Create and map global templates per entity</span></li>
                <li className="flex gap-3 items-start"><div className="w-4 h-4 rounded-full bg-green-50 text-green-500 flex items-center justify-center shrink-0 mt-0.5"><Check className="w-3 h-3" strokeWidth={3} /></div> <span>Escalation nudges when CMs miss SLAs</span></li>
                <li className="flex gap-3 items-start"><div className="w-4 h-4 rounded-full bg-green-50 text-green-500 flex items-center justify-center shrink-0 mt-0.5"><Check className="w-3 h-3" strokeWidth={3} /></div> <span>Full audit log across all ideas and projects</span></li>
              </ul>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="bg-[#0f0e1a] py-24 lg:py-32 px-6 lg:px-12 text-center sr">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gray-700 bg-gray-800/30 text-[11px] font-bold text-gray-300 uppercase tracking-widest mb-10">
              <span className="w-[5px] h-[5px] rounded-full bg-[#10B981] animate-pulse" style={{ animationDuration: '2s' }}></span>
              Ready to start
            </div>
            <h2 className="text-[44px] md:text-[56px] font-extrabold text-white tracking-tight leading-[1.1] mb-8" style={{fontFamily: 'var(--fd)'}}>
              Your ideas deserve more<br/>than an email chain
            </h2>
            <p className="text-[18px] text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Catalyst gives every employee a structured way to submit, track, and see their ideas become real projects — fully managed, fully visible, end to end.
            </p>
            {/* No button in image */}
          </div>
        </section>

        {/* LOGIN MODAL */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-modal-in">
            {/* Backdrop Blur overlay */}
            <div 
              className="absolute inset-0 bg-[#0f0e1a]/60 backdrop-blur-md transition-opacity"
              onClick={() => setIsModalOpen(false)}
            />
            
            {/* Modal Container */}
            <div className="relative z-10 w-full max-w-[440px] overflow-hidden rounded-[24px] bg-white shadow-2xl flex flex-col p-10 border border-gray-100">
              
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="text-center mb-8 pt-2">
                <h2 className="text-[32px] font-extrabold tracking-tight text-[#0f0e1a] mb-3" style={{fontFamily: 'var(--fd)'}}>Welcome back</h2>
                <p className="text-[14px] text-gray-500 font-medium">Log in to Catalyst to manage your ideas.</p>
              </div>
              
              <form onSubmit={handleLogin} className="space-y-5">
                {/* Microsoft Outlook button
                <button 
                  type="button" 
                  onClick={handleOutlookLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-[14px] px-4 py-4 text-[14px] font-bold text-[#0f0e1a] hover:bg-gray-50 hover:border-gray-300 transition-all shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]"
                >
                  <svg viewBox="0 0 23 23" className="w-[18px] h-[18px]">
                    <path fill="#f35325" d="M1 1h10v10H1z" />
                    <path fill="#81bc06" d="M12 1h10v10H12z" />
                    <path fill="#05a6f0" d="M1 12h10v10H1z" />
                    <path fill="#ffba08" d="M12 12h10v10H12z" />
                  </svg>
                  Continue with Microsoft
                </button>

                <div className="flex items-center py-2">
                  <div className="flex-grow border-t border-gray-100"></div>
                  <span className="px-4 text-[11px] uppercase font-bold text-gray-400 tracking-wider">Or</span>
                  <div className="flex-grow border-t border-gray-100"></div>
                </div>
                */}

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-[13px] font-semibold border border-red-100">
                    <AlertCircle className="h-[18px] w-[18px] shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    className="w-full rounded-[14px] border border-gray-200 bg-gray-50/50 px-5 py-4 text-[14px] focus:bg-white focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/10 transition-all placeholder:text-gray-400 font-medium text-[#0f0e1a]"
                    placeholder="name@adventz.com"
                  />

                  <input
                    required
                    type="password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    className="w-full rounded-[14px] border border-gray-200 bg-gray-50/50 px-5 py-4 text-[14px] focus:bg-white focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/10 transition-all placeholder:text-gray-400 font-medium text-[#0f0e1a]"
                    placeholder="Enter your password"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full bg-brand-blue hover:bg-blue-800 text-white rounded-[14px] h-[52px] text-[14px] font-bold flex justify-center items-center px-6 transition-all shadow-[0_8px_16px_-6px_rgba(0,53,128,0.3)] mt-2 disabled:opacity-70 disabled:hover:shadow-none"
                >
                  {loading ? 'Logging in...' : 'Log in safely'}
                </button>
              </form>
              
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-[#0f0e1a] py-3 px-6 lg:px-12 border-t border-gray-800/60 flex items-center justify-center text-[13px] text-gray-500 font-medium">
        <div>&copy; 2026 Catalyst. All rights reserved.</div>
      </footer>

      {/* SCROLL TO TOP BUTTON */}
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-8 right-8 p-3 rounded-full bg-[#1E3A8A] text-white shadow-lg transition-all duration-300 z-40 hover:bg-[#152C70] hover:-translate-y-1 ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}
      >
        <ChevronUp className="w-5 h-5" />
      </button>
    </div>
  );
}
