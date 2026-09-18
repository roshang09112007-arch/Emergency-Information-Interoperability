import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  Eye,
  FileText,
  Flame,
  Globe,
  HeartPulse,
  Lock,
  Radio,
  RefreshCw,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  UserCheck,
  Zap,
} from 'lucide-react';
import { DemoPatient, EmergencyAccessRequest, GoldenSummary, ZkRoleToken } from '../types.js';
import { DEFAULT_PATIENTS } from '../utils/defaultData.js';
import { GoldenSummaryCard } from './GoldenSummaryCard.js';

interface SendEmergencyRequestProps {
  patients: DemoPatient[];
  selectedPatient: DemoPatient | null;
  onSelectPatient: (p: DemoPatient) => void;
  activeRequest: EmergencyAccessRequest | null;
  currentSummary: GoldenSummary | null;
  currentZkToken: ZkRoleToken | null;
  isBroadcasting: boolean;
  isLoading: boolean;
  loadingStep: string;
  isOffline: boolean;
  onSendRequest: (customParams?: {
    patient: DemoPatient;
    requesterName: string;
    role: string;
    emergencyCaseId: string;
    urgencyLevel: 'CRITICAL_TRAUMA' | 'URGENT' | 'STANDARD';
    reason: string;
    targetHospitals: string[];
  }) => Promise<void>;
  onDirectBypass: () => Promise<void>;
  onResetRequest: () => void;
  onInspectRaw: () => void;
}

export const SendEmergencyRequest: React.FC<SendEmergencyRequestProps> = ({
  patients,
  selectedPatient,
  onSelectPatient,
  activeRequest,
  currentSummary,
  currentZkToken,
  isBroadcasting,
  isLoading,
  loadingStep,
  isOffline,
  onSendRequest,
  onDirectBypass,
  onResetRequest,
  onInspectRaw,
}) => {
  const displayPatients = patients && patients.length > 0 ? patients : DEFAULT_PATIENTS;
  const activeSelectedPatient = selectedPatient || displayPatients[0];

  const [caseId, setCaseId] = useState('EMS-TRAUMA-9912');
  const [requesterName, setRequesterName] = useState('Dr. Jordan Hayes, MD');
  const [role, setRole] = useState('TRAUMA_SURGEON_ATTENDING');
  const [urgencyLevel, setUrgencyLevel] = useState<'CRITICAL_TRAUMA' | 'URGENT' | 'STANDARD'>('CRITICAL_TRAUMA');
  const [reason, setReason] = useState(
    'Unconscious trauma intake, multi-system trauma. Immediate requirement for blood type, lethal allergies, and active anticoagulants.'
  );

  const [selectedHospitals, setSelectedHospitals] = useState<string[]>([
    'metro-gen',
    'st-jude',
    'pacific-valley',
  ]);

  const [customPatientMode, setCustomPatientMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customDob, setCustomDob] = useState('');

  // Live timer for pending request
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let timer: any = null;
    if (activeRequest && activeRequest.status === 'PENDING') {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeRequest?.status]);

  const toggleHospital = (id: string) => {
    if (selectedHospitals.includes(id)) {
      if (selectedHospitals.length > 1) {
        setSelectedHospitals(selectedHospitals.filter((h) => h !== id));
      }
    } else {
      setSelectedHospitals([...selectedHospitals, id]);
    }
  };

  const handleRegenerateCaseId = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setCaseId(`EMS-TRAUMA-${randomSuffix}`);
  };

  const handleDispatch = async () => {
    let targetPatient = activeSelectedPatient;
    if (customPatientMode && customName) {
      targetPatient = {
        id: `custom-${Date.now()}`,
        name: customName,
        dob: customDob || '1985-01-01',
        notes: 'Ad-hoc emergency trauma intake',
        hash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      };
    }

    if (!targetPatient) {
      targetPatient = displayPatients[0];
      onSelectPatient(displayPatients[0]);
    }

    await onSendRequest({
      patient: targetPatient,
      requesterName,
      role,
      emergencyCaseId: caseId,
      urgencyLevel,
      reason,
      targetHospitals: selectedHospitals,
    });
  };

  // Format seconds mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="saas-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Send className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  New Emergency Request
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Submit point-of-care emergency clearance request to regional hospital network
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              3 Hospital Nodes Ready
            </span>
          </div>
        </div>

        {/* ACTIVE REQUEST BANNER / TRACKER (If a request is currently active) */}
        {activeRequest && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                  {activeRequest.id}
                </span>
                <span className="text-xs font-bold text-slate-700">
                  Case: {activeRequest.emergencyCaseId}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                  {activeRequest.urgencyLevel.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Status Indicator */}
              <div>
                {activeRequest.status === 'PENDING' && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-300 px-3 py-1 text-xs font-bold text-amber-800 animate-pulse">
                      <Clock className="h-3.5 w-3.5 text-amber-600" />
                      PENDING CLEARANCE ({formatTime(elapsedSeconds)})
                    </span>
                  </div>
                )}
                {activeRequest.status === 'APPROVED' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-300 px-3 py-1 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    APPROVED BY HOSPITAL GATE
                  </span>
                )}
                {activeRequest.status === 'DENIED' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-300 px-3 py-1 text-xs font-bold text-red-800">
                    <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                    ACCESS DENIED
                  </span>
                )}
              </div>
            </div>

            {/* Explanatory banner for multi-laptop demo */}
            {activeRequest.status === 'PENDING' && (
              <div className="flex items-start gap-3 rounded-lg bg-amber-500/10 border border-amber-200 p-3.5 text-xs text-amber-900">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="font-bold">
                    Request Dispatched to Hospital Clearance Desk
                  </p>
                  <p className="text-amber-800 leading-relaxed">
                    Open <span className="font-bold text-amber-950">"Emergency Requests"</span> on the other laptop (Hospital Gate) to review and click <span className="font-bold text-amber-950">"Grant Emergency Access"</span>. This screen will automatically detect approval and decrypt the patient's unified record.
                  </p>
                </div>
                <button
                  onClick={onDirectBypass}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  Direct Bypass
                </button>
              </div>
            )}

            {/* Action buttons on active request */}
            <div className="flex items-center justify-between pt-1">
              <div className="text-xs text-slate-500">
                Patient: <span className="font-bold text-slate-800">{activeRequest.patientName}</span> · Requester: <span className="font-semibold text-slate-700">{activeRequest.requesterName}</span>
              </div>
              <button
                onClick={onResetRequest}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Create Another Request</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* IF SUMMARY IS AVAILABLE AFTER APPROVAL, DISPLAY IT PROMINENTLY */}
      {currentSummary && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-rose-500" />
              <span>Decrypted Golden Medical Record</span>
            </h2>
            <button
              onClick={onInspectRaw}
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>Inspect Raw Node Payloads (FHIR/CSV/XML)</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <GoldenSummaryCard
            summary={currentSummary}
            patientName={selectedPatient?.name || activeRequest?.patientName || 'Trauma Patient'}
            onInspectRaw={onInspectRaw}
          />
        </div>
      )}

      {/* DISPATCH FORM (Hidden if summary already loaded, or visible to send new request) */}
      {!currentSummary && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN: PATIENT SELECTION & BIOMETRICS (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* STEP 1: SELECT TRAUMA PATIENT */}
            <div className="saas-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
                    1
                  </span>
                  <h2 className="text-sm font-bold text-slate-900">
                    Select Target Trauma Patient
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCustomPatientMode(false)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                      !customPatientMode
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    Known Patients
                  </button>
                  <button
                    onClick={() => setCustomPatientMode(true)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                      customPatientMode
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    + New Trauma Intake
                  </button>
                </div>
              </div>

              {!customPatientMode ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {displayPatients.map((p) => {
                    const isSelected = activeSelectedPatient.id === p.id || selectedPatient?.id === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => onSelectPatient(p)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200">
                            {p.name.slice(0, 2).toUpperCase()}
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div className="text-xs font-bold text-slate-900 leading-snug">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          DOB: {p.dob}
                        </div>
                        <div className="mt-2 text-[10px] font-mono text-slate-400 truncate">
                          DID: {p.hash.slice(0, 14)}...
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Patient Full Name / Alias
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. John Doe / Trauma Bay 4"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Date of Birth (Approx)
                      </label>
                      <input
                        type="date"
                        value={customDob}
                        onChange={(e) => setCustomDob(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Selected Patient Telemetry Pill */}
              {selectedPatient && !customPatientMode && (
                <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 flex flex-wrap items-center justify-between text-xs text-blue-900 gap-2">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-blue-600" />
                    <span>Target: <strong className="text-blue-950">{selectedPatient.name}</strong> ({selectedPatient.dob})</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-blue-700">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span>DID: {selectedPatient.hash.slice(0, 16)}...</span>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 2: SELECT TARGET HOSPITAL NODES */}
            <div className="saas-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
                    2
                  </span>
                  <h2 className="text-sm font-bold text-slate-900">
                    Target Regional Hospital Nodes
                  </h2>
                </div>
                <span className="text-xs text-slate-500">
                  {selectedHospitals.length} of 3 Nodes Selected
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Node 1: Metro Gen */}
                <div
                  onClick={() => toggleHospital('metro-gen')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedHospitals.includes('metro-gen')
                      ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-300 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      PORT 4001
                    </span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  </div>
                  <div className="text-xs font-bold text-slate-900">Metro General</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                    HL7® FHIR® R4 API
                  </div>
                </div>

                {/* Node 2: St. Jude */}
                <div
                  onClick={() => toggleHospital('st-jude')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedHospitals.includes('st-jude')
                      ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-300 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      PORT 4002
                    </span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  </div>
                  <div className="text-xs font-bold text-slate-900">St. Jude Regional</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                    Pipe-Delimited CSV
                  </div>
                </div>

                {/* Node 3: Pacific Valley */}
                <div
                  onClick={() => toggleHospital('pacific-valley')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedHospitals.includes('pacific-valley')
                      ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-300 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      PORT 4003
                    </span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  </div>
                  <div className="text-xs font-bold text-slate-900">Pacific Valley</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                    Clinical XML Schema
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: DISPATCH PARAMETERS & ACTION (1 Col) */}
          <div className="space-y-6">
            <div className="saas-card p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
                  3
                </span>
                <h2 className="text-sm font-bold text-slate-900">
                  Emergency Parameters
                </h2>
              </div>

              {/* Case ID */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Emergency Case ID
                  </label>
                  <button
                    type="button"
                    onClick={handleRegenerateCaseId}
                    className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="h-2.5 w-2.5" />
                    <span>Regenerate</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Urgency Level */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Triage Urgency Level
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setUrgencyLevel('CRITICAL_TRAUMA')}
                    className={`px-2 py-2 rounded-lg text-[10px] font-extrabold transition-all ${
                      urgencyLevel === 'CRITICAL_TRAUMA'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    CRITICAL
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrgencyLevel('URGENT')}
                    className={`px-2 py-2 rounded-lg text-[10px] font-extrabold transition-all ${
                      urgencyLevel === 'URGENT'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    URGENT
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrgencyLevel('STANDARD')}
                    className={`px-2 py-2 rounded-lg text-[10px] font-extrabold transition-all ${
                      urgencyLevel === 'STANDARD'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    STANDARD
                  </button>
                </div>
              </div>

              {/* Requester Identity */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Attending Requester
                </label>
                <input
                  type="text"
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Clinical Justification */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Break-Glass Justification
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* ZK Role Proof Badge */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-slate-500">ZK Role Proof:</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    Attested
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">
                  Role: {role}
                </div>
              </div>

              {/* MAIN ACTION: BROADCAST REQUEST BUTTON */}
              <button
                type="button"
                onClick={handleDispatch}
                disabled={isBroadcasting || isLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
              >
                {isBroadcasting || isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>{isBroadcasting ? 'Broadcasting Request...' : loadingStep}</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Submit Emergency Request to Hospital Network</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-slate-400 text-center">
                Dispatches request to Hospital Clearance Gate
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
