import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Key,
  Lock,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  UserCheck,
  UserX,
  XCircle,
  Zap,
  Database,
} from 'lucide-react';
import { EmergencyAccessRequest, HospitalUser, MySqlDiagnostics } from '../types.js';

interface HospitalAccessGateProps {
  requests: EmergencyAccessRequest[];
  autoApprovePolicy: boolean;
  onApproveRequest: (id: string) => Promise<void>;
  onDenyRequest: (id: string) => Promise<void>;
  onToggleAutoApprove: () => Promise<void>;
  onRefresh: () => void;
  mySqlStatus?: MySqlDiagnostics | null;
}

export const HospitalAccessGate: React.FC<HospitalAccessGateProps> = ({
  requests,
  autoApprovePolicy,
  onApproveRequest,
  onDenyRequest,
  onToggleAutoApprove,
  onRefresh,
  mySqlStatus,
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  const filteredRequests = requests.filter((r) => {
    if (filter === 'PENDING' && r.status !== 'PENDING') return false;
    if (filter === 'RESOLVED' && r.status === 'PENDING') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.id.toLowerCase().includes(q) ||
        r.requesterName.toLowerCase().includes(q) ||
        r.emergencyCaseId.toLowerCase().includes(q) ||
        r.patientName.toLowerCase().includes(q) ||
        r.patientHash.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await onApproveRequest(id);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeny = async (id: string) => {
    setProcessingId(id);
    try {
      await onDenyRequest(id);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="saas-card p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Hospital Access Gate &amp; Break-Glass Authority
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  CLEARANCE DESK
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Inbound Emergency Access Queue · Regional Hospital Triage &amp; Data Protection Officer
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Pending Alerts Pill */}
          {pendingCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3.5 py-1 text-xs font-bold text-amber-700">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
              {pendingCount} Pending Request{pendingCount > 1 ? 's' : ''}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Queue Clear (0 Pending)
            </span>
          )}

          {/* Auto-Approval Policy Switch */}
          <button
            onClick={onToggleAutoApprove}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
              autoApprovePolicy
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700 shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
            title="When active, automatically approves incoming trauma requests with verified ZK proofs"
          >
            {autoApprovePolicy ? (
              <>
                <ToggleRight className="h-4 w-4 text-emerald-600" />
                <span>Auto-Approve Policy: ON</span>
              </>
            ) : (
              <>
                <ToggleLeft className="h-4 w-4 text-slate-400" />
                <span>Auto-Approve: MANUAL</span>
              </>
            )}
          </button>

          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 p-2 text-xs text-slate-600 shadow-sm transition-colors"
            title="Refresh Inbound Queue"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Hospital Nodes Status Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Metro General
            </span>
            <span className="text-[10px] text-emerald-700 font-bold font-mono px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
              PORT 4001 · 12ms
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
            <span>Protocol: HL7® FHIR® R4</span>
            <span className="text-slate-600 font-semibold">JSON API</span>
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              St. Jude Regional
            </span>
            <span className="text-[10px] text-emerald-700 font-bold font-mono px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
              PORT 4002 · 18ms
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
            <span>Protocol: Pipe-Delimited</span>
            <span className="text-slate-600 font-semibold">CSV EHR</span>
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Pacific Valley Health
            </span>
            <span className="text-[10px] text-emerald-700 font-bold font-mono px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
              PORT 4003 · 15ms
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
            <span>Protocol: Legacy XML Schema</span>
            <span className="text-slate-600 font-semibold">Clinical XML</span>
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200">
          <button
            onClick={() => setFilter('ALL')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              filter === 'ALL'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Requests ({requests.length})
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              filter === 'PENDING'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Action Required ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('RESOLVED')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              filter === 'RESOLVED'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Resolved ({requests.length - pendingCount})
          </button>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search request ID, responder, DID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Requests Stream */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
            <ShieldCheck className="mx-auto h-8 w-8 text-slate-400 mb-2" />
            <p className="font-semibold text-slate-700">No emergency requests in this queue</p>
            <p className="text-[11px] text-slate-500 mt-1">
              When an EMT or emergency team submits a break-glass request from their device, it will appear here in real time.
            </p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isPending = req.status === 'PENDING';
            const isApproved = req.status === 'APPROVED';
            const isDenied = req.status === 'DENIED';

            return (
              <div
                key={req.id}
                className={`rounded-xl border p-5 transition-all ${
                  isPending
                    ? 'border-amber-300 bg-amber-50/40 shadow-sm ring-1 ring-amber-200'
                    : isApproved
                    ? 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
                    : 'border-rose-200 bg-rose-50/20'
                }`}
              >
                {/* Top Request Meta Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                      {req.id}
                    </span>
                    <span className="font-semibold text-xs text-slate-700">
                      Case: <span className="font-mono text-blue-600 font-bold">{req.emergencyCaseId}</span>
                    </span>
                    <span className="rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700 uppercase">
                      {req.urgencyLevel.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(req.createdAt).toLocaleTimeString()}
                    </span>
                    {isPending && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 animate-pulse">
                        <Clock className="h-3 w-3" /> PENDING REVIEW
                      </span>
                    )}
                    {isApproved && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" /> ACCESS GRANTED
                      </span>
                    )}
                    {isDenied && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
                        <XCircle className="h-3 w-3" /> ACCESS DENIED
                      </span>
                    )}
                  </div>
                </div>

                {/* Main Body Details */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-5 text-xs">
                  {/* Left Column: Requester & Patient */}
                  <div className="md:col-span-7 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">{req.requesterName}</span>
                        <span className="text-[11px] text-slate-500 font-medium">Role: {req.role}</span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Patient Target:</span>
                        <span className="font-bold text-slate-900">{req.patientName} (DOB: {req.dob})</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Patient Identifier:</span>
                        <span className="font-mono text-slate-800 font-semibold truncate max-w-[220px]">
                          {req.patientHash}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Authorization Proof:</span>
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Verified Attending Credentials
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 font-bold">Emergency Clinical Indication: </span>
                      {req.reason}
                    </div>
                  </div>

                  {/* Right Column: Actions / Decision Status */}
                  <div className="md:col-span-5 flex flex-col justify-between space-y-3">
                    <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-[11px] space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                        Disclosure Scope (Minimum Necessary)
                      </span>
                      <ul className="list-disc list-inside text-slate-700 space-y-0.5">
                        <li>Blood Group &amp; Rh Factor</li>
                        <li>Severe Anaphylactic Allergies</li>
                        <li>Active Anticoagulants / High-Alert Meds</li>
                        <li>Prosthetics, Implants &amp; DNR Directive</li>
                      </ul>
                      <p className="text-[10px] text-slate-400 italic pt-1">
                        * Non-emergency psychiatric &amp; billing records redacted.
                      </p>
                    </div>

                    {/* Action Buttons for Pending Requests */}
                    {isPending && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          disabled={processingId === req.id}
                          onClick={() => handleApprove(req.id)}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white transition-all shadow-sm active:scale-98 cursor-pointer disabled:opacity-50"
                        >
                          <UserCheck className="h-4 w-4" />
                          <span>{processingId === req.id ? 'Granting...' : 'Grant Emergency Access'}</span>
                        </button>
                        <button
                          disabled={processingId === req.id}
                          onClick={() => handleDeny(req.id)}
                          className="inline-flex items-center justify-center gap-1 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 px-3.5 py-2.5 text-xs font-bold text-rose-700 transition-all cursor-pointer"
                        >
                          <UserX className="h-4 w-4" />
                          <span>Deny</span>
                        </button>
                      </div>
                    )}

                    {/* Resolution Metadata */}
                    {!isPending && (
                      <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200 text-[11px] space-y-0.5">
                        <span className="text-slate-500 block">
                          Adjudicated by: <strong className="text-slate-800">{req.decidedBy}</strong>
                        </span>
                        {req.decidedAt && (
                          <span className="text-[10px] text-slate-500 font-mono block">
                            At: {new Date(req.decidedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
