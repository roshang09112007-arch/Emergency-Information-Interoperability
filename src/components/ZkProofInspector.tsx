import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Code2,
  Key,
  Lock,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { ZkRoleToken } from '../types.js';

interface ZkProofInspectorProps {
  currentZkToken: ZkRoleToken | null;
  onRefreshZkToken: (responder: string, role: string, caseId: string) => void;
}

export const ZkProofInspector: React.FC<ZkProofInspectorProps> = ({
  currentZkToken,
  onRefreshZkToken,
}) => {
  const [responderName, setResponderName] = useState('Dr. Jordan Hayes, MD');
  const [role, setRole] = useState('TRAUMA_SURGEON_ATTENDING');
  const [caseId, setCaseId] = useState('EMS-TRAUMA-9912');
  const [isSimulatingExpired, setIsSimulatingExpired] = useState(false);

  const handleUpdate = () => {
    onRefreshZkToken(responderName, role, caseId);
  };

  const isExpired =
    isSimulatingExpired ||
    (currentZkToken ? currentZkToken.publicSignals.expiresAt < Math.floor(Date.now() / 1000) : false);

  return (
    <div className="saas-card p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Zero-Knowledge Break-Glass Consent Protocol
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  ZK ROLE CIRCUIT
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Cryptographic proof of authority and urgency satisfying HIPAA/GDPR emergency-access exceptions without revealing responder private PII
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Role Proof Generation & Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Key className="h-4 w-4 text-blue-600" />
              Configure Responder Authority
            </h4>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Responder Full Identity</label>
                <input
                  type="text"
                  value={responderName}
                  onChange={(e) => setResponderName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Medical Role Credential</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-900 focus:border-blue-600 focus:outline-none"
                >
                  <option value="TRAUMA_SURGEON_ATTENDING">Trauma Surgeon Attending (Full Access)</option>
                  <option value="PARAMEDIC_UNIT_LEAD">Paramedic Unit Lead (Emergency Break-Glass)</option>
                  <option value="DISASTER_MEDIC_SPECIALIST">Disaster Response Specialist</option>
                  <option value="UNAUTHORIZED_INTERN">Unauthorized Bystander (Will Be Rejected)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dispatch Emergency Incident ID</label>
                <input
                  type="text"
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-900 focus:border-blue-600 focus:outline-none font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={handleUpdate}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-2 font-bold text-white transition-all shadow-sm"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Mint New Break-Glass ZK Token</span>
                </button>
              </div>
            </div>
          </div>

          {/* Architecture Note */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-xs text-blue-950">
            <div className="flex items-center gap-1.5 font-bold text-blue-800 mb-1">
              <Shield className="h-4 w-4" />
              <span>Production Architecture Note</span>
            </div>
            <p className="text-[11px] leading-relaxed text-blue-900">
              In production, PulseKey executes a zero-knowledge circuit (e.g. zk-SNARK / Semaphore). The physician proves they possess a non-revoked license and active dispatch assignment without transmitting their national physician identifier or personal data to remote hospital servers.
            </p>
          </div>
        </div>

        {/* Right: Simulated Proof Payload Inspection */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Simulated ZK Token &amp; Public Signals
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold">
                  <Clock className="h-3 w-3 text-emerald-600" /> 4h Auto-Expiry Window
                </span>
              </div>
            </div>

            {currentZkToken ? (
              <div className="space-y-3">
                {/* Signals breakdown */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Public Role Signal</span>
                    <p className="font-mono text-blue-700 font-bold mt-0.5">{currentZkToken.publicSignals.role}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Incident Context</span>
                    <p className="font-mono text-slate-800 font-bold mt-0.5">{currentZkToken.publicSignals.emergencyCaseId}</p>
                  </div>
                </div>

                {/* Cryptographic Commitment */}
                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                    Proof Commitment (Hashed Witness)
                  </span>
                  <p className="font-mono text-[11px] text-slate-800 break-all bg-white p-2 rounded-lg border border-slate-200">
                    {currentZkToken.proofCommitment}
                  </p>
                </div>

                {/* Proof Signature */}
                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                    Simulated Circuit Proof Signature
                  </span>
                  <p className="font-mono text-[11px] text-slate-800 break-all bg-white p-2 rounded-lg border border-slate-200">
                    {currentZkToken.signature}
                  </p>
                </div>

                {/* Verification Status */}
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Node Verification Status:</strong> 100% Cryptographically Valid across all 3 mock hospitals.
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-500">
                Generating ZK role token...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
