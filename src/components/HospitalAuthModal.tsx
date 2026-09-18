import React, { useState } from 'react';
import {
  Building2,
  Lock,
  User,
  Mail,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  FileBadge,
  Sparkles,
  Database,
  ArrowRight,
  Stethoscope,
} from 'lucide-react';
import { HospitalUser, MySqlDiagnostics } from '../types';
import { soundFx } from '../utils/audioFeedback';

interface HospitalAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: HospitalUser | null;
  onLoginSuccess?: (user: HospitalUser, token: string) => void;
  onAuthSuccess?: (user: HospitalUser, token: string) => void;
  mySqlStatus?: MySqlDiagnostics | null;
}

export const HospitalAuthModal: React.FC<HospitalAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onAuthSuccess,
  mySqlStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const notifySuccess = (user: HospitalUser, token: string) => {
    if (onAuthSuccess) onAuthSuccess(user, token);
    if (onLoginSuccess) onLoginSuccess(user, token);
  };

  // Sign In State
  const [signinEmail, setSigninEmail] = useState('triage@metrogeneral.org');
  const [signinPassword, setSigninPassword] = useState('PulseKey#2026');

  // Sign Up State
  const [signupHospitalName, setSignupHospitalName] = useState('');
  const [signupHospitalId, setSignupHospitalId] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupOfficerName, setSignupOfficerName] = useState('');
  const [signupOfficerRole, setSignupOfficerRole] = useState('CHIEF_TRIAGE_OFFICER');
  const [signupNpi, setSignupNpi] = useState('');
  const [signupState, setSignupState] = useState('CA');

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/hospital/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signinEmail,
          password: signinPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      soundFx.playApprovalTone();
      setSuccessMessage(`Welcome, ${data.hospital.officer_name} (${data.hospital.hospital_name})`);
      localStorage.setItem('pulsekey_hospital_token', data.token);
      localStorage.setItem('pulsekey_hospital_user', JSON.stringify(data.hospital));

      setTimeout(() => {
        notifySuccess(data.hospital, data.token);
        onClose();
      }, 500);
    } catch (err: any) {
      soundFx.playAlertTone();
      setErrorMessage(err.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/hospital/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospital_name: signupHospitalName,
          hospital_id: signupHospitalId || `HOSP-${signupHospitalName.slice(0, 4).toUpperCase()}`,
          email: signupEmail,
          password: signupPassword,
          officer_name: signupOfficerName,
          officer_role: signupOfficerRole,
          npi_number: signupNpi,
          state_jurisdiction: signupState,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      soundFx.playApprovalTone();
      setSuccessMessage(`Hospital registered in MySQL: ${data.hospital.hospital_name}`);
      localStorage.setItem('pulsekey_hospital_token', data.token);
      localStorage.setItem('pulsekey_hospital_user', JSON.stringify(data.hospital));

      setTimeout(() => {
        notifySuccess(data.hospital, data.token);
        onClose();
      }, 700);
    } catch (err: any) {
      soundFx.playAlertTone();
      setErrorMessage(err.message || 'Failed to register hospital');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPreset = (email: string, pass: string) => {
    setSigninEmail(email);
    setSigninPassword(pass);
    soundFx.playScanTone();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Hospital Authorization Portal
              </h3>
              <p className="text-xs text-slate-500">
                Institutional Node Authentication &amp; Break-Glass Clearance SSO
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Database Connectivity Ribbon */}
        <div className="flex items-center justify-between px-6 py-2 bg-slate-100/70 border-b border-slate-200 text-[11px]">
          <div className="flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-blue-600" />
            <span className="text-slate-600 font-medium">Backend Database:</span>
            {mySqlStatus?.connected ? (
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                MySQL Live ({mySqlStatus.database})
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-700 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Local Enclave Storage
              </span>
            )}
          </div>
          <span className="text-slate-500 text-[10px] font-semibold">HIPAA Title II RBAC</span>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 p-1.5 gap-1">
          <button
            onClick={() => {
              setActiveTab('signin');
              setErrorMessage(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'signin'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="h-3.5 w-3.5 text-blue-600" />
            <span>Hospital Sign In</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('signup');
              setErrorMessage(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'signup'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileBadge className="h-3.5 w-3.5 text-blue-600" />
            <span>Register Hospital Node</span>
          </button>
        </div>

        {/* Alert Messages */}
        {errorMessage && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* TAB 1: SIGN IN */}
        {activeTab === 'signin' && (
          <div className="p-6 space-y-4">
            {/* Presets */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-500 block tracking-wider">
                Instant Presets (Pre-seeded in Database)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleQuickPreset('triage@metrogeneral.org', 'PulseKey#2026')}
                  className={`p-3 text-left rounded-xl border text-xs transition-all ${
                    signinEmail === 'triage@metrogeneral.org'
                      ? 'border-blue-600 bg-blue-50/50 text-slate-900 ring-1 ring-blue-600 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <p className="font-bold text-slate-900 truncate">Metro General</p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">Dr. Sarah Lin, MD</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickPreset('trauma@stjude-health.org', 'PulseKey#2026')}
                  className={`p-3 text-left rounded-xl border text-xs transition-all ${
                    signinEmail === 'trauma@stjude-health.org'
                      ? 'border-blue-600 bg-blue-50/50 text-slate-900 ring-1 ring-blue-600 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <p className="font-bold text-slate-900 truncate">St. Jude Center</p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">Marcus Vance, RN</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickPreset('er-access@pacificvalley.med', 'PulseKey#2026')}
                  className={`p-3 text-left rounded-xl border text-xs transition-all ${
                    signinEmail === 'er-access@pacificvalley.med'
                      ? 'border-blue-600 bg-blue-50/50 text-slate-900 ring-1 ring-blue-600 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <p className="font-bold text-slate-900 truncate">Pacific Valley</p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">Dr. Elena Rostova</p>
                </button>
              </div>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span>Institutional Email</span>
                </label>
                <input
                  type="email"
                  required
                  value={signinEmail}
                  onChange={(e) => setSigninEmail(e.target.value)}
                  placeholder="triage-officer@hospital.org"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-slate-400" />
                  <span>Institutional Clearance Password</span>
                </label>
                <input
                  type="password"
                  required
                  value={signinPassword}
                  onChange={(e) => setSigninPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-3 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50 active:scale-98"
              >
                {isLoading ? (
                  <span>Authenticating Credentials...</span>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Authorize Hospital Clearance Desk</span>
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: SIGN UP */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignUp} className="p-6 space-y-3.5 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Hospital Facility Name *</label>
                <input
                  type="text"
                  required
                  value={signupHospitalName}
                  onChange={(e) => setSignupHospitalName(e.target.value)}
                  placeholder="e.g. Stanford Trauma Center"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Hospital Node Code</label>
                <input
                  type="text"
                  value={signupHospitalId}
                  onChange={(e) => setSignupHospitalId(e.target.value)}
                  placeholder="e.g. HOSP-STANFORD-04"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Triage Officer Name *</label>
                <input
                  type="text"
                  required
                  value={signupOfficerName}
                  onChange={(e) => setSignupOfficerName(e.target.value)}
                  placeholder="e.g. Dr. Alex Mercer, MD"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Institutional Role *</label>
                <select
                  value={signupOfficerRole}
                  onChange={(e) => setSignupOfficerRole(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                >
                  <option value="CHIEF_TRIAGE_OFFICER">Chief Triage Officer</option>
                  <option value="ER_CHARGE_NURSE">ER Charge Nurse</option>
                  <option value="CHIEF_MEDICAL_OFFICER">Chief Medical Officer</option>
                  <option value="ATTENDING_PHYSICIAN">Attending Trauma Physician</option>
                  <option value="SECURITY_GATE_OFFICER">Hospital Break-Glass Gate Officer</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Official Institutional Email *</label>
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="officer@stanfordtrauma.org"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Password (min 6 chars) *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">NPI Number (CMS 10-Digit)</label>
                <input
                  type="text"
                  maxLength={10}
                  value={signupNpi}
                  onChange={(e) => setSignupNpi(e.target.value)}
                  placeholder="1938204918"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">State Jurisdiction</label>
                <input
                  type="text"
                  maxLength={2}
                  value={signupState}
                  onChange={(e) => setSignupState(e.target.value.toUpperCase())}
                  placeholder="CA"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none uppercase"
                />
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900 flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                Registering creates a verified institutional profile with secure password hashing for emergency triage clearance.
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-3 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50 active:scale-98"
            >
              {isLoading ? (
                <span>Writing Node Record...</span>
              ) : (
                <>
                  <Building2 className="h-4 w-4" />
                  <span>Register &amp; Activate Hospital Node</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
