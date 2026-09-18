import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  Flame,
  Radio,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { DemoPatient, EmergencyAccessRequest, ZkRoleToken } from '../types.js';

interface EmergencyRequestPanelProps {
  selectedPatient: DemoPatient | null;
  currentZkToken: ZkRoleToken | null;
  activeRequest: EmergencyAccessRequest | null;
  isBroadcasting: boolean;
  onRequestAccess: () => Promise<void>;
  onDirectBypass: () => void;
  isOffline: boolean;
}

export const EmergencyRequestPanel: React.FC<EmergencyRequestPanelProps> = ({
  selectedPatient,
  currentZkToken,
  activeRequest,
  isBroadcasting,
  onRequestAccess,
  onDirectBypass,
  isOffline,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let timer: any;
    if (activeRequest && activeRequest.status === 'PENDING') {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(timer);
  }, [activeRequest?.status, activeRequest?.id]);

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const isPending = activeRequest?.status === 'PENDING';
  const isApproved = activeRequest?.status === 'APPROVED';
  const isDenied = activeRequest?.status === 'DENIED';

  return (
    <div className="saas-card p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Radio className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Federated Clearance Protocol
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  BREAK-GLASS AUTHORITY
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Transmits cryptographic emergency clearance requests to regional hospital nodes under HIPAA emergency exception
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Request Control Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left 7 cols: Request Context details */}
        <div className="lg:col-span-7 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Verified Responder</span>
              <span className="text-slate-900 font-bold block mt-1 text-sm">
                {currentZkToken?.publicSignals.responderName || 'Dr. Nikesh Nath, MD'}
              </span>
              <span className="text-[11px] text-blue-600 font-semibold mt-0.5 inline-block">
                {currentZkToken?.publicSignals.role || 'TRAUMA_SURGEON_ATTENDING'}
              </span>
            </div>

            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Incident ID &amp; Target</span>
              <span className="text-slate-900 font-mono font-bold block mt-1 text-sm">
                {currentZkToken?.publicSignals.emergencyCaseId || 'EMS-TRAUMA-9912'}
              </span>
              <span className="text-[11px] text-slate-600 truncate block mt-0.5 font-medium">
                Target: {selectedPatient?.name || 'Sarah Connor'}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Target Hospital Nodes:</span>
              <span className="text-slate-800 font-semibold">Metro General · St. Jude · Pacific Valley</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Authorization Protocol:</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Verified Attending Credentials
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Trauma Minimum Necessary:</span>
              <span className="text-slate-700 font-medium">Blood group, severe allergies, anticoagulants, DNR directive</span>
            </div>
          </div>
        </div>

        {/* Right 5 cols: Request Action & Live Status */}
        <div className="lg:col-span-5 space-y-3">
          {!activeRequest ? (
            <div className="space-y-3">
              <button
                disabled={isBroadcasting}
                onClick={onRequestAccess}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all active:scale-98 disabled:opacity-50"
              >
                {isBroadcasting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-200" />
                    <span>Broadcasting Clearance Request...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 text-blue-200" />
                    <span>Submit Emergency Clearance Request</span>
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  onClick={onDirectBypass}
                  className="text-xs text-slate-500 hover:text-blue-600 transition-colors underline font-medium"
                >
                  Or execute direct break-glass override
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`rounded-xl border p-4 space-y-3 transition-all shadow-sm ${
                isPending
                  ? 'border-amber-300 bg-amber-50/50'
                  : isApproved
                  ? 'border-emerald-200 bg-emerald-50/50'
                  : 'border-rose-200 bg-rose-50/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2.5 py-0.5 rounded border border-slate-200">
                  {activeRequest.id}
                </span>

                {isPending && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 animate-pulse">
                    <Clock className="h-3.5 w-3.5" />
                    AWAITING CLEARANCE ({formatElapsed(elapsedSeconds)})
                  </span>
                )}
                {isApproved && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    ACCESS GRANTED
                  </span>
                )}
                {isDenied && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 border border-rose-300 px-2.5 py-0.5 text-[11px] font-bold text-rose-800">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    ACCESS DENIED
                  </span>
                )}
              </div>

              {isPending && (
                <div className="space-y-2 pt-1">
                  <p className="text-xs text-amber-900 leading-relaxed">
                    Request transmitted to regional hospital security gates. Listening on live channel for authorization grant...
                  </p>
                  <div className="flex items-center justify-end pt-1">
                    <button
                      onClick={onDirectBypass}
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"
                      title="Direct override"
                    >
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                      <span>Direct Bypass Override</span>
                    </button>
                  </div>
                </div>
              )}

              {isApproved && (
                <div className="text-xs text-emerald-900 space-y-1 pt-1">
                  <p className="font-bold">Authorization token received from hospital gate!</p>
                  <p className="text-[11px] text-slate-600">
                    Decided by: {activeRequest.decidedBy || 'Regional Hospital Triage Officer'}
                  </p>
                </div>
              )}

              {isDenied && (
                <div className="text-xs text-rose-900 space-y-1 pt-1">
                  <p className="font-bold">Access was refused by the hospital security gate.</p>
                  <button
                    onClick={onRequestAccess}
                    className="mt-1 rounded-lg bg-rose-600 hover:bg-rose-700 px-3 py-1.5 text-xs font-bold text-white"
                  >
                    Resubmit Request
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
