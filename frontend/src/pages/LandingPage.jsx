import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Lightbulb, Users, CheckCircle, ArrowRight, LogIn, AlertCircle } from 'lucide-react';

const ALLOWED_DOMAIN = '@adventz.com';

export default function LandingPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar Simple */}
      <header className="flex h-16 items-center justify-between px-6 lg:px-12 border-b">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blue text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <span className="text-xl font-bold text-brand-blue">Zuari Hive</span>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => document.getElementById('login-section').scrollIntoView({ behavior: 'smooth' })}>
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
          <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-brand-black sm:text-7xl">
            The next-generation <br/> 
            <span className="text-brand-blue">Idea Ticketing Platform</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-500">
            Zuari Hive empowers your organization to seamlessly crowdsource, review, and execute innovative ideas from your team. A modern internal hackathon and innovation hub.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg" className="rounded-full px-8" onClick={() => document.getElementById('login-section').scrollIntoView({ behavior: 'smooth' })}>
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
              <Card className="border-none shadow-md hover:-translate-y-1 transition-transform">
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
              
              <Card className="border-none shadow-md hover:-translate-y-1 transition-transform">
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

              <Card className="border-none shadow-md hover:-translate-y-1 transition-transform">
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

        {/* Login Section */}
        <section id="login-section" className="bg-brand-blue px-6 py-24 text-center lg:px-12 rounded-t-[3rem]">
          <h2 className="text-3xl font-bold tracking-tight text-white mb-4">Login to Zuari Hive</h2>
          <p className="text-blue-100 mb-10 max-w-xl mx-auto">
            Sign in with your company email to access your dashboard.
          </p>
          
          <div className="max-w-md mx-auto">
            <Card className="border-none shadow-2xl">
              <CardHeader className="text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue/10">
                  <LogIn className="h-6 w-6 text-brand-blue" />
                </div>
                <CardTitle>Sign In</CardTitle>
                <CardDescription>Use your @adventz.com email and password</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="text-left">
                    <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(''); }}
                      className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-colors"
                      placeholder="you@adventz.com"
                    />
                  </div>

                  <div className="text-left">
                    <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
                    <input
                      required
                      type="password"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(''); }}
                      className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-colors"
                      placeholder="Enter your password"
                    />
                  </div>

                  <Button type="submit" disabled={loading} size="lg" className="w-full mt-2">
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>

                  <p className="text-xs text-gray-400 mt-3">
                    Only @adventz.com email addresses are authorized. Default password: <code className="bg-gray-100 px-1 rounded">password</code>
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="bg-brand-blue py-8 text-center text-sm text-blue-200 border-t border-blue-800">
        <p>© 2026 Zuari Hive. All rights reserved.</p>
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
