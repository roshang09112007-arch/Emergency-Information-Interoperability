import React from 'react';
import {
  Activity,
  ArrowRight,
  Brain,
  CheckCircle2,
  FileText,
  Lock,
  Network,
  Plus,
  Shield,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogIn: () => void;
  onSignUp: () => void;
  onLearnMore?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onLogIn,
  onSignUp,
  onLearnMore,
}) => {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between selection:bg-blue-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-100 bg-white/95 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={onGetStarted}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <Plus className="h-6 w-6 stroke-[3]" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-lg font-black tracking-tight text-blue-950 font-sans">
                  PULSEKEY
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
                Emergency Health Exchange
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <button onClick={onGetStarted} className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
              Home
            </button>
            <a href="#about" className="hover:text-blue-600 transition-colors">
              About
            </a>
            <a href="#for-hospitals" className="hover:text-blue-600 transition-colors">
              For Hospitals
            </a>
            <a href="#contact" className="hover:text-blue-600 transition-colors">
              Contact
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onLogIn}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-all"
            >
              Log in
            </button>
            <button
              onClick={onSignUp}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all"
            >
              Sign up
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative flex-1 flex items-center">
        {/* Background Image Container with Soft Gradient Overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="/ambulance_hero_bg.jpg"
            alt="Hospital Emergency Care"
            className="w-full h-full object-cover object-center scale-105 opacity-90 filter blur-[1px]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-white/40" />
        </div>

        {/* Hero Content Grid */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
          {/* Left Column: Core Value Proposition */}
          <div className="lg:col-span-7 space-y-6 max-w-2xl">
            <div className="inline-block">
              <span className="text-xs font-black uppercase tracking-widest text-blue-600">
                FASTER ACCESS. SAFER CARE.
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.15]">
              Critical medical information when it matters most.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              PulseKey securely connects hospitals and emergency responders to share life-critical information during emergencies — across different systems, in real time.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onGetStarted}
                className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-all active:scale-98 flex items-center gap-2"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={onLearnMore || onGetStarted}
                className="px-6 py-3 rounded-lg bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 font-semibold text-sm border border-slate-300 shadow-sm backdrop-blur-sm transition-all"
              >
                Learn More
              </button>
            </div>
          </div>

          {/* Right Column: Floating Glass Feature Card */}
          <div className="lg:col-span-5 flex justify-end">
            <div className="glass-hero-card w-full max-w-sm rounded-2xl p-6 border border-white/80 shadow-2xl space-y-4">
              <div className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-white/60 transition-colors">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Secure Access</h3>
                  <p className="text-xs text-slate-500">Zero-knowledge client encryption</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-white/60 transition-colors">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <Network className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Multi-Hospital Integration</h3>
                  <p className="text-xs text-slate-500">Cross-network EHR interoperability</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-white/60 transition-colors">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <Brain className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">AI-Assisted Reconciliation</h3>
                  <p className="text-xs text-slate-500">Conflict-free Golden Record</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-white/60 transition-colors">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Audit &amp; Compliance</h3>
                  <p className="text-xs text-slate-500">Immutable HIPAA ledger</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Metrics Bar */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl lg:text-4xl font-black text-blue-950 font-sans tracking-tight">
              3+
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
              Hospital Networks
            </div>
          </div>

          <div>
            <div className="text-3xl lg:text-4xl font-black text-blue-950 font-sans tracking-tight">
              Seconds
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
              to Access Critical Data
            </div>
          </div>

          <div>
            <div className="text-3xl lg:text-4xl font-black text-blue-950 font-sans tracking-tight">
              Secure
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
              &amp; Compliant
            </div>
          </div>

          <div>
            <div className="text-3xl lg:text-4xl font-black text-blue-950 font-sans tracking-tight">
              Better Outcomes
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
              for Every Patient
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
