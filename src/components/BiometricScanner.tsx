import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Eye,
  FileText,
  Fingerprint,
  HeartPulse,
  Lock,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
  UserCheck,
  Zap,
} from 'lucide-react';
import { DemoPatient } from '../types.js';
import { soundFx } from '../utils/audioFeedback.js';
import { RealBiometricHardware } from './RealBiometricHardware.js';

interface BiometricScannerProps {
  patients: DemoPatient[];
  selectedPatient: DemoPatient | null;
  onSelectPatient: (patient: DemoPatient) => void;
  onRegisterCustomPatient: (patientData: {
    name: string;
    dob: string;
    notes?: string;
    triageLevel?: string;
    bloodType?: string;
    allergy?: string;
    anticoagulant?: string;
    condition?: string;
    implant?: string;
    dnrStatus?: 'FULL_CODE' | 'DNR_DO_NOT_RESUSCITATE' | 'UNKNOWN';
  }) => Promise<void>;
  onScanQuery: () => void;
  isLoading: boolean;
  loadingStep: string;
  isOffline: boolean;
}

export const BiometricScanner: React.FC<BiometricScannerProps> = ({
  patients,
  selectedPatient,
  onSelectPatient,
  onRegisterCustomPatient,
  onScanQuery,
  isLoading,
  loadingStep,
  isOffline,
}) => {
  // Manual Entry Form State
  const [patientName, setPatientName] = useState('Sarah Connor');
  const [patientDob, setPatientDob] = useState('1985-06-14');
  const [triageLevel, setTriageLevel] = useState('Level 1 - Resuscitation (Critical)');
  const [triageNotes, setTriageNotes] = useState(
    'High-speed motor vehicle trauma with suspected acute hemorrhage. Unconscious, GCS 6.'
  );

  // Clinical profile parameters
  const [bloodType, setBloodType] = useState('O Positive (Rh+)');
  const [allergy, setAllergy] = useState('Penicillin G (Severe Anaphylaxis)');
  const [anticoagulant, setAnticoagulant] = useState('Warfarin Sodium 5mg Daily');
  const [condition, setCondition] = useState('Chronic Atrial Fibrillation');
  const [implant, setImplant] = useState('Dual-Chamber Cardiac Pacemaker');
  const [dnrStatus, setDnrStatus] = useState<'FULL_CODE' | 'DNR_DO_NOT_RESUSCITATE'>('FULL_CODE');

  const [showDemoScenarios, setShowDemoScenarios] = useState(false);
  const [showSystemDetails, setShowSystemDetails] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);

  const [computedDid, setComputedDid] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isSavingCustom, setIsSavingCustom] = useState(false);
  const [isIdentified, setIsIdentified] = useState(true);

  // Calculate live patient identity hash whenever name or DOB changes
  useEffect(() => {
    let isMounted = true;
    if (!patientName || !patientDob) return;

    fetch('/api/biometric-hash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: patientName, dob: patientDob }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.hash) {
          setComputedDid(data.hash);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [patientName, patientDob]);

  // Handle Quick Fill Scenario Selection
  const handleSelectScenario = (
    name: string,
    dob: string,
    triage: string,
    blood: string,
    allg: string,
    anticoag: string,
    cond: string,
    imp: string,
    dnr: 'FULL_CODE' | 'DNR_DO_NOT_RESUSCITATE',
    notes: string
  ) => {
    setPatientName(name);
    setPatientDob(dob);
    setTriageLevel(triage);
    setBloodType(blood);
    setAllergy(allg);
    setAnticoagulant(anticoag);
    setCondition(cond);
    setImplant(imp);
    setDnrStatus(dnr);
    setTriageNotes(notes);
    setIsIdentified(true);
    soundFx.playScanTone();

    // Match known demo patient if exists
    const match = patients.find((p) => p.name.toLowerCase().includes(name.toLowerCase()));
    if (match) {
      onSelectPatient(match);
    }
  };

  // Primary Action 1: Identify Patient
  const handleIdentifyPatient = async () => {
    setIsSavingCustom(true);
    soundFx.playScanTone();
    try {
      await onRegisterCustomPatient({
        name: patientName,
        dob: patientDob,
        triageLevel,
        notes: triageNotes,
        bloodType,
        allergy,
        anticoagulant,
        condition,
        implant,
        dnrStatus,
      });
      setIsIdentified(true);
      soundFx.playApprovalTone();
    } catch (e) {
      console.warn('Patient identification notice:', e);
    } finally {
      setIsSavingCustom(false);
    }
  };

  // Primary Action 2: Request Emergency Access
  const handleRequestAccess = async () => {
    setIsSavingCustom(true);
    try {
      await onRegisterCustomPatient({
        name: patientName,
        dob: patientDob,
        triageLevel,
        notes: triageNotes,
        bloodType,
        allergy,
        anticoagulant,
        condition,
        implant,
        dnrStatus,
      });
      setIsIdentified(true);
      soundFx.playApprovalTone();
      onScanQuery();
    } catch (e) {
      console.warn('Request access notice:', e);
      onScanQuery();
    } finally {
      setIsSavingCustom(false);
    }
  };

  const handleCopyDid = () => {
    if (computedDid) {
      navigator.clipboard.writeText(computedDid);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* 5-STEP CLINICAL WORKFLOW STEPPER */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
          {/* Step 1 */}
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-blue-50/80 border border-blue-200 font-bold text-blue-900">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[10px]">
              1
            </span>
            <span className="truncate">1. Patient Identification</span>
          </div>

          {/* Step 2 */}
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100 font-semibold text-slate-700">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-300 text-slate-700 text-[10px]">
              2
            </span>
            <span className="truncate">2. Emergency Request</span>
          </div>

          {/* Step 3 */}
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100 font-semibold text-slate-700">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-300 text-slate-700 text-[10px]">
              3
            </span>
            <span className="truncate">3. Hospital Clearance</span>
          </div>

          {/* Step 4 */}
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100 font-semibold text-slate-700">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-300 text-slate-700 text-[10px]">
              4
            </span>
            <span className="truncate">4. Record Retrieval</span>
          </div>

          {/* Step 5 */}
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100 font-semibold text-slate-700">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-300 text-slate-700 text-[10px]">
              5
            </span>
            <span className="truncate">5. Golden Summary</span>
          </div>
        </div>
      </div>

      {/* COLLAPSIBLE DEMO SCENARIOS ACCORDION */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setShowDemoScenarios(!showDemoScenarios)}
          className="w-full px-5 py-3 flex items-center justify-between bg-slate-50/70 hover:bg-slate-100/70 transition-colors text-xs font-bold text-slate-700"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span>Demo Scenarios (Quick Fill for Evaluation)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 font-normal">
            <span>{showDemoScenarios ? 'Hide Scenarios' : 'Show Scenarios'}</span>
            {showDemoScenarios ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </button>

        {showDemoScenarios && (
          <div className="p-4 border-t border-slate-100 bg-white">
            <p className="text-xs text-slate-500 mb-3">
              Select a clinical scenario below to instantly populate patient parameters and trauma presentation:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Scenario 1 */}
              <button
                type="button"
                onClick={() =>
                  handleSelectScenario(
                    'Sarah Connor',
                    '1985-06-14',
                    'Level 1 - Resuscitation (Critical)',
                    'O Positive (Rh+)',
                    'Penicillin G (Severe Anaphylaxis)',
                    'Warfarin Sodium 5mg Daily',
                    'Chronic Atrial Fibrillation',
                    'Dual-Chamber Cardiac Pacemaker',
                    'FULL_CODE',
                    'High-speed motor vehicle collision with acute pelvic trauma and intra-abdominal hemorrhage. GCS 6.'
                  )
                }
                className="p-3.5 rounded-lg border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/40 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-slate-900 group-hover:text-blue-700">
                    Sarah Connor (41 yrs)
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                    Anaphylaxis
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  Severe Penicillin allergy + Active Warfarin anticoagulant + Pacemaker.
                </p>
              </button>

              {/* Scenario 2 */}
              <button
                type="button"
                onClick={() =>
                  handleSelectScenario(
                    'David Sterling',
                    '1978-11-23',
                    'Level 1 - Resuscitation (Critical)',
                    'AB Negative (Rh-)',
                    'Latex & Sulfa Antibiotics (Angioedema)',
                    'Eliquis (Apixaban) 5mg BID',
                    'Acute Deep Vein Thrombosis',
                    'Titanium Hip Arthroplasty',
                    'FULL_CODE',
                    'Industrial fall from scaffolding with blunt chest trauma and suspected rib fractures. Hypotensive.'
                  )
                }
                className="p-3.5 rounded-lg border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/40 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-slate-900 group-hover:text-blue-700">
                    David Sterling (48 yrs)
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                    Rare AB-
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  Rare AB Negative blood group + Eliquis anticoagulant + Latex allergy.
                </p>
              </button>

              {/* Scenario 3 */}
              <button
                type="button"
                onClick={() =>
                  handleSelectScenario(
                    'Unknown Trauma Victim #99',
                    '1980-01-01',
                    'Level 1 - Resuscitation (Critical)',
                    'O Negative (Rh- Universal)',
                    'Morphine Sulfate (Respiratory Arrest)',
                    'None on File',
                    'Severe Traumatic Brain Injury',
                    'None Documented',
                    'DNR_DO_NOT_RESUSCITATE',
                    'Unconscious trauma victim found at highway transit collision. No physical ID present.'
                  )
                }
                className="p-3.5 rounded-lg border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/40 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-slate-900 group-hover:text-blue-700">
                    Unknown Victim #99
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                    DNR Order
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  Do-Not-Resuscitate (DNR) legal directive + Universal O- donor.
                </p>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MAIN PATIENT INTAKE FORM */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Point-of-Care Patient Intake
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter patient details or scan emergency wristband to request decentralized records
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCameraScanner(!showCameraScanner)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
          >
            <Camera className="h-3.5 w-3.5 text-blue-600" />
            <span>{showCameraScanner ? 'Hide Camera' : 'Camera / Barcode Scanner'}</span>
          </button>
        </div>

        {/* OPTIONAL CAMERA SCANNER (If toggled) */}
        {showCameraScanner && (
          <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Camera className="h-4 w-4 text-blue-600" />
                Optical Wristband &amp; Identity Sensor
              </span>
              <span className="text-[11px] text-slate-500">Optical Camera Stream</span>
            </div>
            <RealBiometricHardware
              activeDid={computedDid}
              onBiometricCaptured={(hash, modality) => {
                setComputedDid(hash);
                soundFx.playApprovalTone();
              }}
            />
          </div>
        )}

        {/* PATIENT BASIC INFORMATION */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Patient Full Name / Trauma Identifier
            </label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => {
                setPatientName(e.target.value);
                setIsIdentified(false);
              }}
              placeholder="e.g. Sarah Connor"
              className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Date of Birth
            </label>
            <input
              type="date"
              value={patientDob}
              onChange={(e) => {
                setPatientDob(e.target.value);
                setIsIdentified(false);
              }}
              className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Triage Urgency Level
            </label>
            <select
              value={triageLevel}
              onChange={(e) => setTriageLevel(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
            >
              <option value="Level 1 - Resuscitation (Critical)">Level 1 - Resuscitation (Critical)</option>
              <option value="Level 2 - Emergent">Level 2 - Emergent</option>
              <option value="Level 3 - Urgent">Level 3 - Urgent</option>
            </select>
          </div>
        </div>

        {/* TRAUMA BAY PRESENTATION NOTES */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Field Triage Notes &amp; Trauma Presentation
          </label>
          <textarea
            rows={2}
            value={triageNotes}
            onChange={(e) => setTriageNotes(e.target.value)}
            className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* CROSS-HOSPITAL RECORD PARAMETERS (Clinical baseline) */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <HeartPulse className="h-4 w-4 text-rose-500" />
              Clinical Baseline for Query Simulation
            </span>
            <span className="text-[11px] text-slate-400">
              Metro Gen (FHIR) · St. Jude (CSV) · Pacific Valley (XML)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Blood Group
              </label>
              <input
                type="text"
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 bg-white text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Critical Allergies
              </label>
              <input
                type="text"
                value={allergy}
                onChange={(e) => setAllergy(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 bg-white text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Active Anticoagulants
              </label>
              <input
                type="text"
                value={anticoagulant}
                onChange={(e) => setAnticoagulant(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 bg-white text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Primary Medical Condition
              </label>
              <input
                type="text"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 bg-white text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Implant / Pacemaker
              </label>
              <input
                type="text"
                value={implant}
                onChange={(e) => setImplant(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 bg-white text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Resuscitation Status
              </label>
              <select
                value={dnrStatus}
                onChange={(e) => setDnrStatus(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 bg-white text-slate-800 font-semibold"
              >
                <option value="FULL_CODE">Full Code (Resuscitate)</option>
                <option value="DNR_DO_NOT_RESUSCITATE">Do Not Resuscitate (DNR)</option>
              </select>
            </div>
          </div>
        </div>

        {/* PRIMARY ACTIONS BAR */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>
              Target: <strong className="text-slate-800">{patientName}</strong> (DOB: {patientDob})
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Action 1: Identify Patient */}
            <button
              type="button"
              onClick={handleIdentifyPatient}
              disabled={isSavingCustom || isLoading}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <UserCheck className="h-4 w-4 text-slate-600" />
              <span>Identify Patient</span>
            </button>

            {/* Action 2: Request Emergency Access (Primary High-Contrast Button) */}
            <button
              type="button"
              onClick={handleRequestAccess}
              disabled={isSavingCustom || isLoading}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm hover:shadow transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>{loadingStep}</span>
                </>
              ) : (
                <>
                  <span>Request Emergency Access</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* COLLAPSIBLE SYSTEM & SECURITY DETAILS */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setShowSystemDetails(!showSystemDetails)}
          className="w-full px-5 py-3 flex items-center justify-between bg-slate-50/70 hover:bg-slate-100/70 transition-colors text-xs font-bold text-slate-600"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-slate-500" />
            <span>System &amp; Security Details</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 font-normal">
            <span>{showSystemDetails ? 'Hide' : 'Show Details'}</span>
            {showSystemDetails ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </button>

        {showSystemDetails && (
          <div className="p-5 border-t border-slate-100 space-y-3 text-xs bg-slate-50/40">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="block text-[11px] font-bold text-slate-500 mb-1">
                  Cryptographic Patient Identifier (DID)
                </span>
                <div className="flex items-center gap-2 font-mono text-[11px] bg-white p-2 rounded-lg border border-slate-200 text-slate-700">
                  <span className="truncate">{computedDid || '0x4f82...'}</span>
                  <button
                    type="button"
                    onClick={handleCopyDid}
                    className="shrink-0 p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"
                  >
                    {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <span className="block text-[11px] font-bold text-slate-500 mb-1">
                  ZK Role Proof Attestation
                </span>
                <div className="bg-white p-2 rounded-lg border border-slate-200 text-slate-700 font-medium flex items-center justify-between">
                  <span>Role: TRAUMA_SURGEON_ATTENDING</span>
                  <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Attested
                  </span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 pt-1">
              Encrypted federated query routes across Metro General (:4001 FHIR), St. Jude (:4002 CSV), and Pacific Valley (:4003 XML).
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
