import React, { useState } from 'react';
import { ChevronDown, Globe, LogOut, ShieldCheck, User } from 'lucide-react';
import { HospitalUser } from '../types';

interface TopBarProps {
  currentUser?: HospitalUser | null;
  onSignOut: () => void;
  networkOnline?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentUser,
  onSignOut,
  networkOnline = true,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const officerName = currentUser?.officer_name || 'Dr. Arun Kumar';
  const hospitalName = currentUser?.hospital_name || 'Metro General Hospital';
  const roleLabel = currentUser?.officer_role
    ? currentUser.officer_role.replace(/_/g, ' ')
    : 'Trauma Physician';

  const initials = officerName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'DA';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Left empty spacer or breadcrumbs */}
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span className="font-semibold text-slate-800">PulseKey Hospital Portal</span>
        <span>/</span>
        <span>Emergency Exchange Node</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-6">
        {/* Network Operational Status */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Hospital Network Operational</span>
        </div>

        {/* User Profile Badge */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 hover:opacity-90 transition-opacity focus:outline-none"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300">
              {initials}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {officerName}
              </div>
              <div className="text-[10px] text-slate-500 leading-tight">
                {roleLabel} · {hospitalName}
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {/* User Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-xl py-1 text-xs text-slate-700 z-50 animate-in fade-in zoom-in-95">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="font-bold text-slate-900">{officerName}</p>
                <p className="text-[10px] text-slate-500">{currentUser?.email || 'arun.kumar@metrogeneral.org'}</p>
              </div>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onSignOut();
                }}
                className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 font-semibold flex items-center gap-2"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
