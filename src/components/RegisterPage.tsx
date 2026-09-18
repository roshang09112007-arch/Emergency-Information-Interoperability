import React, { useState } from 'react';
import { Building2, Eye, EyeOff, Lock, Mail, Plus, ShieldCheck, User } from 'lucide-react';
import { HospitalUser } from '../types';

interface RegisterPageProps {
  onRegisterSuccess: (user: HospitalUser) => void;
  onNavigateLogin: () => void;
  onNavigateHome: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onRegisterSuccess,
  onNavigateLogin,
  onNavigateHome,
}) => {
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalEmail, setHospitalEmail] = useState('');
  const [licenseId, setLicenseId] = useState('');
  const [adminName, setAdminName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/hospital/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospital_name: hospitalName,
          hospital_id: licenseId || `HOSP-${Date.now().toString().slice(-4)}`,
          email: hospitalEmail,
          password: password,
          officer_name: adminName,
          officer_role: 'CHIEF_TRAUMA_OFFICER',
          npi_number: licenseId,
          state: 'CA',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      onRegisterSuccess(data.hospital);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to register hospital');
    } finally {
      setIsLoading(false);
    }
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
        <div className="text-center space-y-1 mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Register Hospital</h2>
          <p className="text-xs text-slate-500">Create your hospital account to join PulseKey</p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Hospital Name</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Building2 className="h-4 w-4" />
              </div>
              <input
                type="text"
                required
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                placeholder="Enter hospital name"
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Hospital Email</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                required
                value={hospitalEmail}
                onChange={(e) => setHospitalEmail(e.target.value)}
                placeholder="name@hospital.com"
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              License / Registration ID
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <input
                type="text"
                required
                value={licenseId}
                onChange={(e) => setLicenseId(e.target.value)}
                placeholder="e.g., MH12345"
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Administrator Name
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <User className="h-4 w-4" />
              </div>
              <input
                type="text"
                required
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Enter your name"
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
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
                placeholder="Create a secure password"
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-10 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50 mt-2"
          >
            {isLoading ? 'Registering...' : 'Register Hospital'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-600">
          Already have an account?{' '}
          <button onClick={onNavigateLogin} className="text-blue-600 font-semibold hover:underline">
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
};
