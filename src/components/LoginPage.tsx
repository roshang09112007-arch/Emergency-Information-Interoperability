import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound, Lock, Mail, Plus } from 'lucide-react';
import { HospitalUser } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: HospitalUser) => void;
  onNavigateRegister: () => void;
  onNavigateHome: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onNavigateRegister,
  onNavigateHome,
}) => {
  const [email, setEmail] = useState('triage@metrogeneral.org');
  const [password, setPassword] = useState('PulseKey#2026');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/hospital/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLoginSuccess(data.hospital);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasskeySignIn = () => {
    // Demo quick passkey sign-in for Dr. Arun Kumar
    onLoginSuccess({
      id: 'usr_arun_kumar',
      hospital_id: 'HOSP-METRO-01',
      hospital_name: 'Metro General Hospital',
      officer_name: 'Dr. Arun Kumar',
      officer_role: 'TRAUMA_SURGEON_ATTENDING',
      email: 'arun.kumar@metrogeneral.org',
      state_jurisdiction: 'CA',
      npi_number: 'NPI-19920192',
      approval_status: 'ACTIVE',
      created_at: new Date().toISOString(),
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12 selection:bg-blue-500 selection:text-white">
      {/* Back to Home Link */}
      <div className="w-full max-w-md mb-6 flex justify-start">
        <button
          onClick={onNavigateHome}
          className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          ← Back to PulseKey
        </button>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-8 sm:p-10">
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="flex items-center justify-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <Plus className="h-6 w-6 stroke-[3]" />
            </div>
            <div className="text-left">
              <span className="text-lg font-black tracking-tight text-blue-950 block leading-none">
                PULSEKEY
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
                Emergency Health Exchange
              </span>
            </div>
          </div>

          <div className="pt-4">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sign in to PulseKey</h2>
            <p className="text-xs text-slate-500 mt-1">Authorized healthcare personnel only</p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
            {errorMessage}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@hospital.com"
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Remember me</span>
            </label>
            <a href="#forgot" className="text-blue-600 font-semibold hover:underline">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-[11px] text-slate-400 uppercase">
            <span className="bg-white px-2">or</span>
          </div>
        </div>

        {/* Passkey Authentication Button */}
        <button
          type="button"
          onClick={handlePasskeySignIn}
          className="w-full rounded-lg border border-slate-300 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
        >
          <KeyRound className="h-4 w-4 text-slate-600" />
          <span>Sign in with Passkey</span>
        </button>

        {/* Register Footer Link */}
        <div className="mt-8 text-center text-xs text-slate-600">
          Don&apos;t have an account?{' '}
          <button
            onClick={onNavigateRegister}
            className="text-blue-600 font-semibold hover:underline"
          >
            Register your hospital
          </button>
        </div>
      </div>
    </div>
  );
};
