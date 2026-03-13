import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Lightbulb, Users, CheckCircle, ArrowRight, LogIn, AlertCircle, X } from 'lucide-react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../lib/msalConfig';

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

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar Simple */}
      <header className="flex h-16 items-center justify-between px-6 lg:px-12 border-b">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blue text-white shadow-sm">
            <Lightbulb size={20} strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold text-brand-blue">Zuari Catalyst</span>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => setIsModalOpen(true)}>
            Login
          </Button>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="px-6 py-24 text-center lg:px-12">
          <Badge variant="secondary" className="mb-6 font-medium text-brand-blue bg-blue-50 hover:bg-blue-100 px-3 py-1">
            v1.0 Now Live
          </Badge>
          <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-brand-black sm:text-7xl animate-fade-in-up">
            The next-generation <br/> 
            <span className="text-brand-blue bg-clip-text text-transparent bg-gradient-to-r from-brand-blue to-blue-500">Idea Ticketing Platform</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-500 animate-fade-in-up delay-100">
            Zuari Catalyst empowers your organization to seamlessly crowdsource, review, and execute innovative ideas from your team. A modern internal hackathon and innovation hub.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4 animate-fade-in-up delay-200">
            <Button size="lg" className="rounded-full px-8 shadow-blue-500/20 shadow-lg hover:shadow-blue-500/40" onClick={() => setIsModalOpen(true)}>
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-gray-50 px-6 py-24 lg:px-12">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-brand-black">Platform Features</h2>
              <p className="mt-4 text-gray-500">Everything you need to manage your organization's idea pipeline.</p>
            </div>
            
            <div className="grid gap-8 md:grid-cols-3">
              <Card className="border-none shadow-md hover:-translate-y-2 hover:shadow-xl transition-all duration-300 animate-fade-in-up delay-100">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-brand-blue">
                    <Lightbulb className="h-6 w-6" />
                  </div>
                  <CardTitle>Idea Submission</CardTitle>
                  <CardDescription>
                    Empower employees to pitch their innovations easily with beautiful forms.
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="border-none shadow-md hover:-translate-y-2 hover:shadow-xl transition-all duration-300 animate-fade-in-up delay-200">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-[#DE0F17]">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <CardTitle>Review Workflow</CardTitle>
                  <CardDescription>
                    Multi-tier approval process from Central Team down to Org Admins.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-none shadow-md hover:-translate-y-2 hover:shadow-xl transition-all duration-300 animate-fade-in-up delay-300">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#99CC33]/20 text-[#7a9d2d]">
                    <Users className="h-6 w-6" />
                  </div>
                  <CardTitle>Projects</CardTitle>
                  <CardDescription>
                    A centralized feed for everyone to view and celebrate approved ideas transitioned into projects.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Workflow Visual Section */}
        <section className="px-6 py-24 lg:px-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-brand-black mb-12">How it works</h2>
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 md:flex-row">
            
            <div className="flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-500 z-10">1</div>
              <p className="mt-4 font-medium">Employee Submits</p>
            </div>
            <div className="hidden h-[2px] w-full bg-gray-200 md:block" />
            
            <div className="flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-blue font-bold text-white z-10">2</div>
              <p className="mt-4 font-medium text-brand-blue">Central Team Assigns</p>
            </div>
            <div className="hidden h-[2px] w-full bg-brand-blue/30 md:block" />
            
            <div className="flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#DE0F17] font-bold text-white z-10">3</div>
              <p className="mt-4 font-medium text-[#DE0F17]">Org Admin Approves</p>
            </div>
            <div className="hidden h-[2px] w-full bg-[#DE0F17]/30 md:block" />
            
            <div className="flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#99CC33] font-bold text-white z-10">4</div>
              <p className="mt-4 font-medium text-[#7a9d2d]">Published to Hub</p>
            </div>

          </div>
        </section>

        {/* Login Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop Blur overlay */}
            <div 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
              onClick={() => setIsModalOpen(false)}
            />
            
            {/* Modal Container */}
            <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-[2rem] bg-[#fdfdfd] shadow-2xl flex flex-col md:flex-row animate-fade-in-up max-h-[95vh] md:max-h-[85vh]">
              
              {/* Left Column: Form */}
              <div className="flex-1 px-8 py-10 md:px-14 md:py-16 overflow-y-auto w-full md:w-1/2">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-6 left-6 md:hidden p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
                
                <div className="mx-auto max-w-sm pt-4 md:pt-0 text-center md:text-left">
                  <h2 className="text-3xl font-extrabold tracking-tight text-brand-black mb-10 text-center">Welcome</h2>
                  
                  <form onSubmit={handleLogin} className="space-y-6">
                    {/* Microsoft Outlook button mimicking Google button UI */}
                    <button 
                      type="button" 
                      onClick={handleOutlookLogin}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-3 bg-[#fdfdfd] border border-gray-400 rounded-none px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 hover:shadow-sm transition-all shadow-sm"
                    >
                      <svg viewBox="0 0 23 23" className="w-5 h-5">
                        <path fill="#f35325" d="M1 1h10v10H1z" />
                        <path fill="#81bc06" d="M12 1h10v10H12z" />
                        <path fill="#05a6f0" d="M1 12h10v10H1z" />
                        <path fill="#ffba08" d="M12 12h10v10H12z" />
                      </svg>
                      Log in With Outlook
                    </button>

                    <div className="flex items-center my-8">
                      <div className="flex-grow border-t border-gray-300"></div>
                      <span className="px-4 text-xs font-medium text-gray-600 tracking-wide">Or Log in with Email</span>
                      <div className="flex-grow border-t border-gray-300"></div>
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <div className="text-left space-y-4 mb-2">
                      <input
                        required
                        type="email"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setError(''); }}
                        className="w-full rounded-none border border-gray-400 bg-transparent p-3.5 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue/50 transition-colors placeholder:text-gray-500 font-medium"
                        placeholder="Your Email"
                      />

                      <input
                        required
                        type="password"
                        value={password}
                        onChange={e => { setPassword(e.target.value); setError(''); }}
                        className="w-full rounded-none border border-gray-400 bg-transparent p-3.5 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue/50 transition-colors placeholder:text-gray-500 font-medium"
                        placeholder="Your Password"
                      />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full bg-[#1e1b4b] hover:bg-[#2d2873] text-white rounded-none h-12 text-base flex justify-between items-center px-6 transition-colors shadow-none mt-4">
                      <span className="mx-auto flex-grow text-center font-normal tracking-wide">{loading ? 'Logging in...' : 'Log in'}</span>
                      {!loading && <ArrowRight className="h-5 w-5 opacity-90 font-light" />}
                    </Button>
                  </form>
                </div>
              </div>
              
              {/* Right Column: Visuals */}
              <div className="hidden md:flex flex-1 w-1/2 bg-[#e0f7fa] bg-opacity-80 p-12 flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#d4f9f4] to-[#cbf4fc]">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-6 right-6 p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-black/5 transition-colors z-20"
                >
                  <X className="h-6 w-6" />
                </button>

                <div className="relative z-10 text-center max-w-sm mt-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight leading-snug">Everything begins<br/>with an idea.</h3>
                  <p className="text-gray-700 text-sm mb-6 leading-relaxed px-4">Shape the future of our organization by sharing your innovative proposals.</p>
                  
                  {/* Decorative Illustration Shape mimicking the UI reference */}
                  <div className="mt-16 relative w-full flex items-center justify-center h-48">
                     <div className="absolute inset-0 bg-[#38bdf8] opacity-20 rounded-[4rem] blur-2xl transform scale-150" />
                     <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-[3rem] transform -rotate-6 blur-lg opacity-30" />
                     <div className="absolute inset-0 bg-[#e0f2fe] rounded-[2rem] transform rotate-3 flex items-center justify-center shadow-inner border border-white/50 backdrop-blur-md">
                        <Users className="w-20 h-20 text-[#0369a1] drop-shadow-md" />
                     </div>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        )}
      </main>

      <footer className="bg-brand-blue py-8 text-center text-sm text-blue-200 border-t border-blue-800">
        <p>© 2026 Zuari Catalyst. All rights reserved.</p>
      </footer>
    </div>
  );
}

// Ensure Badge is available here for now
function Badge({ children, className, variant = "default" }) {
  const base = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2";
  const variants = {
    default: "border-transparent bg-brand-blue text-white",
    secondary: "border-transparent bg-gray-100 text-gray-800",
  };
  return <div className={`${base} ${variants[variant]} ${className}`}>{children}</div>;
}
