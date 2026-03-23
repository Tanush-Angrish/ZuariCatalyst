import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../lib/msalConfig';
import { ArrowRight, AlertCircle, X, Check, Activity, Shield, Lightbulb, ChevronUp } from 'lucide-react';

import './LandingPage.css';
import HeroRightMockup from '../components/landing/HeroRightMockup';
import HowItWorksTabs from '../components/landing/HowItWorksTabs';
import FeaturesTabs from '../components/landing/FeaturesTabs';

const ALLOWED_DOMAIN = '@adventz.com';

export default function LandingPage() {
  const { login, msLogin } = useAuth();
  const { instance } = useMsal();
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

  const handleOutlookLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await instance.loginPopup(loginRequest);
      if (response && response.idToken) {
        await msLogin(response.idToken);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Microsoft authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white" style={{fontFamily: 'var(--fb)'}}>
      {/* NAVBAR */}
      <header className="fixed top-0 w-full z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 transition-all">
        <div className="max-w-[1400px] mx-auto flex h-[84px] items-center justify-between px-6 lg:px-12">
          
          {/* Left Side: Zuari Logo + Catalyst Brand */}
          <div className="flex items-center gap-6">
            <img 
              src="https://www.zuariindustries.in/assets/web/img/logo/zuari_logo.png" 
              alt="Zuari Industries" 
              className="h-10 object-contain"
            />
            
            <div className="h-10 w-[1.5px] bg-[#E5E7EB] rounded-full"></div> {/* Divider */}
            
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-[10px] bg-[#1d3368] flex items-center justify-center shadow-sm">
                <Lightbulb className="text-white w-[22px] h-[22px]" strokeWidth={2.5} />
              </div>
              <span className="text-[22px] font-extrabold text-[#1d3368] tracking-tight" style={{fontFamily: 'var(--fd)'}}>
                Catalyst
              </span>
            </div>
          </div>

          {/* Center/Right Nav Links */}
          <nav className="hidden md:flex gap-10 text-[14.5px] font-bold text-[#4B5563] ml-auto mr-12">
            <button onClick={() => scrollToSection('features')} className="hover:text-[#1d3368] transition-colors">Features</button>
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-[#1d3368] transition-colors">How it Works</button>
            <button className="hover:text-[#1d3368] transition-colors">FAQ</button>
          </nav>

          {/* Far Right: Sign In + Adventz Logo */}
          <div className="flex gap-6 items-center">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-[#1d3368] hover:bg-[#162750] text-white rounded-full px-8 py-2.5 text-[14.5px] font-bold transition-all shadow-md hover:shadow-lg"
            >
              Sign In
            </button>
            
            <div className="h-10 w-[1.5px] bg-[#E5E7EB] rounded-full hidden md:block"></div> {/* Divider */}

            <img 
              src="https://www.zuariindustries.in/assets/web/img/logo/adventz.png" 
              alt="Adventz" 
              className="h-12 object-contain hidden md:block"
            />
          </div>
          
        </div>
      </header>

      <main className="pt-28">
        {/* HERO SECTION */}
        <section className="max-w-[1280px] mx-auto px-6 lg:px-12 pt-10 pb-24 flex flex-col lg:flex-row items-center justify-between gap-[80px]">
          <div className="lg:w-[55%] sr">
            <div className="sec-eyebrow" style={{background: 'var(--purple-l)', color: 'var(--purple)'}}>Idea Lifecycle Platform</div>
            <h1 className="text-[64px] leading-[1.08] font-extrabold tracking-tight text-[#0A0A0A] mb-6" style={{fontFamily: 'var(--fd)'}}>
              Turn every employee idea into <span style={{color: 'var(--purple)'}}>real impact</span>
            </h1>
            <p className="text-[18px] text-gray-500 max-w-lg mb-10" style={{lineHeight: '1.6'}}>
              Catalyst is an AI-powered structured process that gives your organisation a defined system to capture, review, and successfully turn ideas into real projects.
            </p>
            <div className="flex gap-4">
              <button onClick={() => setIsModalOpen(true)} className="bg-white border border-gray-200 text-brand-black hover:border-gray-300 rounded-xl px-8 py-4 text-[15px] font-semibold transition-all flex items-center shadow-sm">
                Start a project <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
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
              <div className="text-[13px] text-gray-500 mx-auto max-w-[160px] font-medium leading-[1.6]">Ideas average per day in an org of 500</div>
            </div>
            <div>
              <div className="text-[42px] font-extrabold text-brand-black mb-2" style={{fontFamily: 'var(--fd)'}}>3<span style={{color: 'var(--teal)'}}>x</span></div>
              <div className="text-[13px] text-gray-500 mx-auto max-w-[160px] font-medium leading-[1.6]">Faster conversion to project with AI</div>
            </div>
            <div>
              <div className="text-[42px] font-extrabold text-brand-black mb-2" style={{fontFamily: 'var(--fd)'}}>7<span style={{color: 'var(--amber)'}}>d</span></div>
              <div className="text-[13px] text-gray-500 mx-auto max-w-[160px] font-medium leading-[1.6]">Max SLA ensure no idea goes unreviewed</div>
            </div>
            <div>
              <div className="text-[42px] font-extrabold text-brand-black mb-2" style={{fontFamily: 'var(--fd)'}}>100<span style={{color: 'var(--purple)'}}>%</span></div>
              <div className="text-[13px] text-gray-500 mx-auto max-w-[160px] font-medium leading-[1.6]">Visibility on status changes and audit log</div>
            </div>
          </div>
        </section>

        {/* EVERY ACTION EARNS POINTS (TIMELINE) */}
        <section className="bg-[#fafafa] py-32 px-6 lg:px-12 text-center sr">
          <h2 className="text-[36px] font-extrabold text-brand-black mb-4 tracking-tight" style={{fontFamily: 'var(--fd)'}}>Every action earns points</h2>
          <p className="text-[16px] text-gray-500 mx-auto max-w-xl mb-24 leading-relaxed">
            As employees get their ideas approved and turn into actual projects, they rack up points on the leaderboard.
          </p>
          
          <div className="max-w-4xl mx-auto relative px-4">
            <div className="absolute top-[12px] left-[10%] w-[80%] h-[2px] bg-gray-200 hidden md:block" style={{ zIndex: 0 }}></div>
            
            <div className="flex flex-col md:flex-row justify-between relative z-10 gap-10">
              
              <div className="flex flex-col items-center flex-1">
                <div className="w-6 h-6 bg-brand-blue border-[5px] border-white rounded-full mb-4 shadow-[0_0_0_1px_rgba(0,53,128,0.15)]"></div>
                <div className="text-[14px] font-bold text-brand-black mb-1">10 pts</div>
                <div className="text-[12px] text-gray-500 font-medium leading-[1.4]">Submit<br/>an idea</div>
              </div>
              
              <div className="flex flex-col items-center flex-1">
                <div className="w-6 h-6 bg-brand-blue border-[5px] border-white rounded-full mb-4 shadow-[0_0_0_1px_rgba(0,53,128,0.15)]"></div>
                <div className="text-[14px] font-bold text-brand-black mb-1">25 pts</div>
                <div className="text-[12px] text-gray-500 font-medium leading-[1.4]">Get<br/>approved</div>
              </div>
              
              <div className="flex flex-col items-center flex-1">
                <div className="w-6 h-6 bg-brand-blue border-[5px] border-white rounded-full mb-4 shadow-[0_0_0_1px_rgba(0,53,128,0.15)]"></div>
                <div className="text-[14px] font-bold text-brand-black mb-1">5 pts</div>
                <div className="text-[12px] text-gray-500 font-medium leading-[1.4]">Receive<br/>an upvote</div>
              </div>
              
              <div className="flex flex-col items-center flex-1">
                <div className="w-6 h-6 bg-brand-blue border-[5px] border-white rounded-full mb-4 shadow-[0_0_0_1px_rgba(0,53,128,0.15)]"></div>
                <div className="text-[14px] font-bold text-brand-black mb-1">50 pts</div>
                <div className="text-[12px] text-gray-500 font-medium leading-[1.4]">Converted<br/>to project</div>
              </div>

              <div className="flex flex-col items-center flex-1 relative">
                <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-blue-50 text-brand-blue text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap hidden md:block border border-blue-100">CEO prize</div>
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-[1px] h-4 bg-brand-blue/30 hidden md:block"></div>
                
                <div className="w-6 h-6 bg-brand-blue border-[5px] border-white rounded-full mb-4 shadow-[0_0_0_1px_rgba(0,53,128,0.3)] ring-4 ring-brand-blue/10"></div>
                <div className="text-[14px] font-bold text-brand-black mb-1">100 pts</div>
                <div className="text-[12px] text-gray-500 font-medium leading-[1.4]">Project<br/>completed</div>
              </div>
              
            </div>
          </div>
        </section>

        {/* TABS COMPONENTS */}
        <HowItWorksTabs />
        <FeaturesTabs />

        {/* THREE ROLES CARDS */}
        <section className="py-32 px-6 lg:px-12 bg-[#ffffff] sr">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-[40px] font-extrabold text-[#0A0A0A] tracking-tight mb-5 leading-tight" style={{fontFamily: 'var(--fd)'}}>Three roles. One system.</h2>
            <p className="text-[17px] text-gray-500 leading-relaxed">Each persona gets exactly what they need for a seamless experience. Configured for enterprise out of the box.</p>
          </div>

          <div className="max-w-[1100px] mx-auto grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white rounded-[24px] p-10 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-8 border border-orange-100">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <h3 className="text-[20px] font-extrabold text-[#0A0A0A] mb-5 tracking-tight">Employee</h3>
              <ul className="space-y-4 text-[14px] text-gray-600 font-medium">
                <li className="flex gap-3 items-start"><Check className="w-[18px] h-[18px] text-orange-500 shrink-0 mt-0.5" /> <span>Submit ideas easily via templates or describing to AI</span></li>
                <li className="flex gap-3 items-start"><Check className="w-[18px] h-[18px] text-orange-500 shrink-0 mt-0.5" /> <span>See what your peers are building and upvote</span></li>
                <li className="flex gap-3 items-start"><Check className="w-[18px] h-[18px] text-orange-500 shrink-0 mt-0.5" /> <span>Track idea progress transparently</span></li>
                <li className="flex gap-3 items-start"><Check className="w-[18px] h-[18px] text-orange-500 shrink-0 mt-0.5" /> <span>Earn points and climb the leaderboard</span></li>
              </ul>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-[24px] p-10 shadow-[0_20px_40px_-15px_rgba(91,76,245,0.15)] border border-purple-100 hover:shadow-xl hover:shadow-[0_25px_50px_-15px_rgba(91,76,245,0.2)] transition-all scale-105 relative z-10">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-t-[24px]"></div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-8 border border-purple-100">
                <Activity className="w-[22px] h-[22px]" strokeWidth={2.5} />
              </div>
              <h3 className="text-[20px] font-extrabold text-[#0A0A0A] mb-5 tracking-tight">Community Manager</h3>
              <ul className="space-y-4 text-[14px] text-gray-600 font-medium">
                <li className="flex gap-3 items-start"><Check className="w-[18px] h-[18px] text-purple-500 shrink-0 mt-0.5" /> <span>Assigned to specific template queues (e.g. HR)</span></li>
                <li className="flex gap-3 items-start"><Check className="w-[18px] h-[18px] text-purple-500 shrink-0 mt-0.5" /> <span>Approve, reject, or request more info</span></li>
                <li className="flex gap-3 items-start"><Check className="w-[18px] h-[18px] text-purple-500 shrink-0 mt-0.5" /> <span>Built-in SLA warnings to keep ideas moving</span></li>
                <li className="flex gap-3 items-start"><Check className="w-[18px] h-[18px] text-purple-500 shrink-0 mt-0.5" /> <span>Convert verified ideas into projects instantly</span></li>
              </ul>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-[24px] p-10 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-8 border border-teal-100">
                <Shield className="w-[22px] h-[22px]" strokeWidth={2.5} />
              </div>
              <h3 className="text-[20px] font-extrabold text-[#0A0A0A] mb-5 tracking-tight">Central Admin</h3>
              <ul className="space-y-4 text-[14px] text-gray-600 font-medium">
                <li className="flex gap-3 items-start"><Check className="w-[18px] h-[18px] text-teal-500 shrink-0 mt-0.5" /> <span>Oversee all queues, users, and templates</span></li>
                <li className="flex gap-3 items-start"><Check className="w-[18px] h-[18px] text-teal-500 shrink-0 mt-0.5" /> <span>Global configuration of dropdowns and setup</span></li>
                <li className="flex gap-3 items-start"><Check className="w-[18px] h-[18px] text-teal-500 shrink-0 mt-0.5" /> <span>Escalation point for breached SLAs</span></li>
                <li className="flex gap-3 items-start"><Check className="w-[18px] h-[18px] text-teal-500 shrink-0 mt-0.5" /> <span>Full audit logs of all actions and projects</span></li>
              </ul>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="bg-[#0f0e1a] py-32 px-6 lg:px-12 text-center sr">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-gray-700 bg-gray-800/30 text-[11px] font-bold text-gray-300 uppercase tracking-widest mb-10">
              Ready to start
            </div>
            <h2 className="text-[44px] md:text-[56px] font-extrabold text-white tracking-tight leading-[1.1] mb-8" style={{fontFamily: 'var(--fd)'}}>
              Your ideas deserve more<br/>than an email chain
            </h2>
            <p className="text-[18px] text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Give your team the platform they need to seamlessly ideate, validate, and execute. Fully managed, fully visible, fully compliant.
            </p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-white text-[#0f0e1a] hover:bg-gray-100 rounded-xl px-10 py-4 text-[15px] font-bold transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:scale-105"
            >
              Get started with Catalyst
            </button>
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
                {/* Microsoft Outlook button */}
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
      <footer className="bg-[#0f0e1a] py-8 px-6 lg:px-12 border-t border-gray-800/60 flex flex-col md:flex-row items-center justify-between text-[13px] text-gray-500 font-medium">
        <div><span className="font-extrabold text-white" style={{fontFamily: 'var(--fd)', fontSize: '15px'}}>Catalyst</span> &nbsp;&copy; 2026 Adventz. All rights reserved.</div>
        <div className="flex gap-8 mt-6 md:mt-0">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">Security</a>
        </div>
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
