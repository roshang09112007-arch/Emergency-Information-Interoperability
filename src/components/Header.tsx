import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Columns,
  Database,
  ExternalLink,
  FileCode2,
  HardDrive,
  Radio,
  ScrollText,
  Send,
  Shield,
  ShieldCheck,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  LogIn,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { soundFx } from '../utils/audioFeedback.js';
import { HospitalUser, MySqlDiagnostics } from '../types.js';

export type AppViewMode = 'requester' | 'approver' | 'split';

interface HeaderProps {
  appView: AppViewMode;
  setAppView: (view: AppViewMode) => void;
  activeTab: 'tablet' | 'hospitals' | 'zk' | 'audit' | 'mesh' | 'database';
  setActiveTab: (tab: 'tablet' | 'hospitals' | 'zk' | 'audit' | 'mesh' | 'database') => void;
  isOffline: boolean;
  onToggleOffline: () => void;
  responderName: string;
  emergencyCaseId: string;
  pendingRequestCount: number;
  onOpenNewWindow: () => void;
  currentUser?: HospitalUser | null;
  onOpenAuthModal?: () => void;
  onSignOut?: () => void;
  mySqlStatus?: MySqlDiagnostics | null;
}

export const Header: React.FC<HeaderProps> = ({
  appView,
  setAppView,
  activeTab,
  setActiveTab,
  isOffline,
  onToggleOffline,
  responderName,
  emergencyCaseId,
  pendingRequestCount,
  onOpenNewWindow,
  currentUser,
  onOpenAuthModal,
  onSignOut,
  mySqlStatus,
}) => {
  const [isAudioMuted, setIsAudioMuted] = useState(!soundFx.enabled);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleAudio = () => {
    soundFx.enabled = !soundFx.enabled;
    setIsAudioMuted(!soundFx.enabled);
    if (soundFx.enabled) {
      soundFx.playScanTone();
    }
  };

  return (
    <header className="border-b border-slate-800/90 bg-[#070c16]/95 backdrop-blur-md text-slate-100 shadow-xl select-none sticky top-0 z-50">
      {/* Top Clinical Systems Telemetry Status Strip */}
      <div className="border-b border-slate-800/80 bg-[#0a101d] px-4 py-1.5 text-[11px] text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 font-semibold text-slate-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="tracking-wide">NEHX NETWORK FEDERATION</span>
            </span>
            <span className="hidden sm:inline text-slate-700">|</span>
            <span className="hidden md:inline-flex items-center gap-1.5 text-slate-400 font-mono text-[10px]">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              <span>HL7® FHIR® R4 Validated · Zero-Knowledge Enclave</span>
            </span>
            <span className="hidden lg:inline-flex items-center gap-1.5 text-slate-500 text-[10px]">
              <span>AES-256-GCM Hardware Sealed</span>
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            {currentTime && (
              <span className="text-emerald-400 font-bold tracking-wider px-2 py-0.5 rounded bg-slate-900 border border-slate-800 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {currentTime} UTC
              </span>
            )}
            <span className="hidden sm:inline text-slate-700">|</span>
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <span className="text-slate-500">CASE:</span>
              <span className="text-slate-200 font-bold bg-slate-800/60 px-1.5 py-0.2 rounded border border-slate-700/60">{emergencyCaseId}</span>
            </span>
            <span className="hidden sm:inline text-slate-700">|</span>
            <span className="truncate max-w-[180px] text-slate-300 font-medium text-[11px]">
              {responderName}
            </span>
            <span className="text-slate-700">|</span>
            <button
              onClick={toggleAudio}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                isAudioMuted
                  ? 'text-slate-500 border-slate-800 hover:text-slate-300 bg-slate-900/50'
                  : 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40 hover:bg-emerald-900/40'
              }`}
              title={isAudioMuted ? 'Telemetry Audio Muted - Click to Unmute' : 'Telemetry Audio Active - Click to Mute'}
            >
              {isAudioMuted ? <VolumeX className="h-3 w-3 text-slate-500" /> : <Volume2 className="h-3 w-3 text-emerald-400 animate-pulse" />}
              <span>{isAudioMuted ? 'Audio Off' : 'Audio Live'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Disaster Mode Alert Banner when network outage is simulated */}
      {isOffline && (
        <div
          id="offline-banner"
          className="flex items-center justify-between border-b border-amber-500/40 bg-amber-950/80 px-4 py-2 text-xs font-medium text-amber-200 backdrop-blur-sm sm:px-6"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            <span>
              <strong>OFFLINE DISASTER ENCLAVE:</strong> Backhaul uplink disconnected. System operating autonomously on local cryptographic peer cache &amp; mesh ledger.
            </span>
          </div>
          <button
            onClick={onToggleOffline}
            className="ml-4 rounded bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition-colors"
          >
            Reconnect Backhaul Uplink
          </button>
        </div>
      )}

      {/* Main Operational Console Navigation Bar */}
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Left: Brand & Operational Title */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/5 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <Activity className="h-6 w-6 text-emerald-400 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-white font-mono flex items-center">
                PulseKey<span className="text-emerald-400">.</span>
                <span className="text-[10px] text-slate-400 font-sans font-normal ml-1 border border-slate-700/80 bg-slate-800/80 px-1.5 py-0.2 rounded">v2.4-PRO</span>
              </h1>
              <span className="badge-clinical bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[9px] py-0.5 px-2">
                CRITICAL CARE EHR
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Zero-Knowledge Federated Interoperability &amp; Break-Glass Trauma Clearance
            </p>
          </div>
        </div>

        {/* Center: Console Role Selector (Segmented Hardware Control Style) */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-800/90 bg-slate-950/80 p-1.5 shadow-inner backdrop-blur-md">
          <button
            id="view-requester-btn"
            onClick={() => setAppView('requester')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
              appView === 'requester'
                ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)] border border-blue-400/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
            }`}
            title="Field Intake Console: Point-of-care trauma intake and emergency query"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Field Intake Console</span>
          </button>

          <button
            id="view-approver-btn"
            onClick={() => setAppView('approver')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
              appView === 'approver'
                ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(5,150,105,0.4)] border border-emerald-400/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
            }`}
            title="Hospital Authorization Gate: Institutional clearance and audit control"
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Hospital Authorization Gate</span>
            {pendingRequestCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-black text-slate-950 animate-pulse shadow-sm">
                {pendingRequestCount}
              </span>
            )}
          </button>

          <button
            id="view-split-btn"
            onClick={() => setAppView('split')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
              appView === 'split'
                ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(147,51,234,0.4)] border border-purple-400/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
            }`}
            title="Dual Operations Center: Monitor field intake and hospital clearance concurrently"
          >
            <Columns className="h-3.5 w-3.5" />
            <span>Dual Operations</span>
          </button>
        </div>

        {/* Right: Auxiliary Actions */}
        <div className="flex items-center gap-2">
          {/* Hospital Sign In / Account Status */}
          {currentUser ? (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/40 transition-all shadow-sm"
              title={`${currentUser.hospital_name} (${currentUser.officer_name}) - Click to manage or switch`}
            >
              <UserCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="max-w-[130px] truncate text-white">{currentUser.hospital_name}</span>
            </button>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-950/40 px-3 py-1.5 text-xs font-semibold text-blue-300 hover:bg-blue-900/50 hover:border-blue-400 hover:text-white transition-all shadow-sm"
              title="Sign in or register your hospital node with MySQL storage"
            >
              <LogIn className="h-3.5 w-3.5 text-blue-400" />
              <span className="hidden sm:inline">Hospital Sign In / SSO</span>
              <span className="sm:hidden">Hospital Sign In</span>
            </button>
          )}

          {/* Pop-Out Secondary Window */}
          <button
            onClick={onOpenNewWindow}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-600 hover:text-white transition-all shadow-sm"
            title="Launch counterpart console on secondary monitor for multi-screen operations"
          >
            <ExternalLink className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">
              {appView === 'approver' ? 'Pop-out Field' : 'Pop-out Gate'}
            </span>
            <span className="sm:hidden">Pop-out</span>
          </button>

          {/* Network Uplink Switch */}
          <button
            id="network-toggle-button"
            onClick={onToggleOffline}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
              isOffline
                ? 'border-amber-500/50 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 shadow-sm'
                : 'border-slate-800 bg-slate-900/90 text-slate-300 hover:border-slate-600 hover:text-white shadow-sm'
            }`}
            title={isOffline ? 'Switch to Online Uplink' : 'Test Offline Enclave Protocol'}
          >
            {isOffline ? (
              <>
                <WifiOff className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                <span className="hidden md:inline">Enclave Mesh</span>
              </>
            ) : (
              <>
                <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden md:inline">Uplink Live</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Clinical Subsystems Tab Bar */}
      {appView !== 'approver' && (
        <div className="border-t border-slate-800/80 bg-[#080d19]/90 px-4 sm:px-6">
          <div className="mx-auto flex max-w-7xl space-x-1 overflow-x-auto py-1.5">
            <button
              id="tab-tablet"
              onClick={() => setActiveTab('tablet')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === 'tablet'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
              }`}
            >
              <HardDrive className="h-3.5 w-3.5" />
              <span>Trauma Intake Terminal</span>
            </button>

            <button
              id="tab-hospitals"
              onClick={() => setActiveTab('hospitals')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === 'hospitals'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
              }`}
            >
              <FileCode2 className="h-3.5 w-3.5" />
              <span>Hospital EHR Nodes (FHIR / CSV / XML)</span>
            </button>

            <button
              id="tab-zk"
              onClick={() => setActiveTab('zk')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === 'zk'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Zero-Knowledge Identity Vault</span>
            </button>

            <button
              id="tab-audit"
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === 'audit'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
              }`}
            >
              <ScrollText className="h-3.5 w-3.5" />
              <span>Cryptographic Audit Ledger</span>
            </button>

            <button
              id="tab-mesh"
              onClick={() => setActiveTab('mesh')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === 'mesh'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
              }`}
            >
              <Radio className="h-3.5 w-3.5" />
              <span>P2P Disaster Mesh</span>
            </button>

            <button
              id="tab-database"
              onClick={() => setActiveTab('database')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === 'database'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
              }`}
            >
              <Database className="h-3.5 w-3.5" />
              <span>Physical Storage Engine (/data)</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
