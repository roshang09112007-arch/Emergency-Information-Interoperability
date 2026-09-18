import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Award,
  CheckCircle2,
  Cpu,
  ExternalLink,
  Eye,
  FileText,
  Fingerprint,
  HeartPulse,
  Lock,
  Pill,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  User,
  UserCheck,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { DemoPatient, GoldenSummary } from '../types.js';
import { BiometricScanner } from './BiometricScanner.js';
import { GoldenSummaryCard } from './GoldenSummaryCard.js';

interface PatientIdentificationProps {
  patients: DemoPatient[];
  onSelectPatient: (p: DemoPatient) => void;
  selectedPatient: DemoPatient | null;
  onRegisterCustomPatient: (data: any) => Promise<void>;
  onScanQuery: () => void;
  isLoading: boolean;
  loadingStep: string;
  isOffline: boolean;
  currentSummary: GoldenSummary | null;
  onRequestClearance: () => void;
}

export const PatientIdentification: React.FC<PatientIdentificationProps> = ({
  patients,
  onSelectPatient,
  selectedPatient,
  onRegisterCustomPatient,
  onScanQuery,
  isLoading,
  loadingStep,
  isOffline,
  currentSummary,
  onRequestClearance,
}) => {
  // Default to intake view so point-of-care emergency intake is immediately actionable
  const [activeSubTab, setActiveSubTab] = useState<'intake' | 'search'>('intake');
  const [searchDid, setSearchDid] = useState('');
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [activeSummaryPatient, setActiveSummaryPatient] = useState<any>(null);

  // Default patient records matching clinical directory
  const defaultRecords = [
    {
      did: 'PULSE-DID-7A91',
      name: 'Sarah Connor',
      lastEncounter: '12 Aug 2026',
      availableRecords: '3 hospitals (Metro Gen, St. Jude, Pacific Valley)',
      bloodType: 'O Positive (Rh+)',
      allergy: 'Penicillin G (Severe Anaphylaxis)',
      anticoagulant: 'Warfarin Sodium 5mg Daily',
      condition: 'Trauma Hemorrhage & Atrial Fibrillation',
      implant: 'Dual-Chamber Cardiac Pacemaker',
      dnr: 'Full Code',
    },
    {
      did: 'PULSE-DID-3F22',
      name: 'David Sterling',
      lastEncounter: '03 Jul 2026',
      availableRecords: '2 hospitals (Metro Gen, Pacific Valley)',
      bloodType: 'AB Negative (Rh-)',
      allergy: 'Latex & Sulfa Antibiotics (Angioedema)',
      anticoagulant: 'Eliquis (Apixaban) 5mg BID',
      condition: 'Acute Deep Vein Thrombosis',
      implant: 'Titanium Hip Arthroplasty',
      dnr: 'Full Code',
    },
    {
      did: 'PULSE-DID-9K11',
      name: 'Unknown Trauma Victim #99',
      lastEncounter: '21 Jun 2026',
      availableRecords: '3 hospitals (Metro Gen, St. Jude, Pacific Valley)',
      bloodType: 'O Negative (Rh- Universal Donor)',
      allergy: 'Morphine Sulfate (Respiratory Arrest)',
      anticoagulant: 'None on File',
      condition: 'Severe Traumatic Brain Injury',
      implant: 'None Documented',
      dnr: 'DO NOT RESUSCITATE (DNR Registered)',
    },
  ];

  const filteredRecords = defaultRecords.filter(
    (r) =>
      r.did.toLowerCase().includes(searchDid.toLowerCase()) ||
      r.name.toLowerCase().includes(searchDid.toLowerCase())
  );

  const handleOpenSummary = (record: any) => {
    setActiveSummaryPatient(record);
    const match = patients.find((p) => p.name === record.name);
    if (match) {
      onSelectPatient(match);
    }
    setSummaryModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-Tab Switch */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Patient Identification &amp; Emergency Intake
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Identify trauma patient, derive point-of-care identity, and initiate regional record retrieval
          </p>
        </div>

        {/* Sub-Tab Navigation */}
        <div className="flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200">
          <button
            onClick={() => setActiveSubTab('intake')}
            className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeSubTab === 'intake'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Fingerprint className="h-3.5 w-3.5 text-blue-600" />
            <span>Point-of-Care Intake</span>
          </button>
          <button
            onClick={() => setActiveSubTab('search')}
            className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeSubTab === 'search'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="h-3.5 w-3.5 text-slate-500" />
            <span>Patient Directory</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: POINT-OF-CARE INTAKE BAY */}
      {activeSubTab === 'intake' && (
        <BiometricScanner
          patients={patients}
          selectedPatient={selectedPatient}
          onSelectPatient={onSelectPatient}
          onRegisterCustomPatient={onRegisterCustomPatient}
          onScanQuery={onScanQuery}
          isLoading={isLoading}
          loadingStep={loadingStep}
          isOffline={isOffline}
        />
      )}

      {/* VIEW 2: PATIENT DIRECTORY & SEARCH */}
      {activeSubTab === 'search' && (
        <div className="space-y-6">
          {/* Search Bar Card */}
          <div className="saas-card p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
            <div className="md:col-span-8 space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Search Regional Patient Directory by Name or ID
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Search className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={searchDid}
                    onChange={(e) => setSearchDid(e.target.value)}
                    placeholder="Enter patient name or ID (e.g. Sarah Connor, PULSE-DID-7A91)..."
                    className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <button
                  type="button"
                  className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-2xs"
                >
                  Search
                </button>
              </div>
            </div>

            <div className="md:col-span-4 flex flex-col justify-end">
              <span className="text-[11px] text-slate-400 mb-1.5">New trauma intake?</span>
              <button
                type="button"
                onClick={() => setActiveSubTab('intake')}
                className="w-full rounded-lg border border-blue-200 bg-blue-50/70 hover:bg-blue-100/80 px-4 py-2 text-xs font-bold text-blue-700 transition-colors flex items-center justify-center gap-2 shadow-2xs"
              >
                <Plus className="h-4 w-4" />
                <span>Open Intake Bay</span>
              </button>
            </div>
          </div>

          {/* Directory Table Card */}
          <div className="saas-card overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Registered Patient Records</h2>
              <span className="text-xs text-slate-400 font-medium">
                {filteredRecords.length} profile{filteredRecords.length === 1 ? '' : 's'} available
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Patient Name &amp; ID</th>
                    <th className="px-6 py-3.5">Last Encounter</th>
                    <th className="px-6 py-3.5">Available Node Records</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {filteredRecords.map((row) => (
                    <tr key={row.did} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{row.name}</div>
                        <div className="font-mono text-[11px] text-slate-400 mt-0.5">{row.did}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{row.lastEncounter}</td>
                      <td className="px-6 py-4 text-slate-600">{row.availableRecords}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenSummary(row)}
                          className="rounded-lg border border-blue-200 bg-blue-50/50 hover:bg-blue-600 hover:text-white px-3 py-1.5 text-xs font-semibold text-blue-600 transition-all shadow-2xs"
                        >
                          View Summary
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Summary Modal for Patient Directory View */}
      {summaryModalOpen && activeSummaryPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{activeSummaryPatient.name}</h3>
                  <p className="text-xs font-mono text-slate-400">{activeSummaryPatient.did}</p>
                </div>
              </div>
              <button
                onClick={() => setSummaryModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Blood Group</span>
                <span className="text-sm font-bold text-slate-900">{activeSummaryPatient.bloodType}</span>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                <span className="text-[10px] font-bold uppercase text-rose-600 block mb-1">Critical Allergy</span>
                <span className="text-xs font-bold text-rose-900">{activeSummaryPatient.allergy}</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-[10px] font-bold uppercase text-amber-600 block mb-1">Active Anticoagulant</span>
                <span className="text-xs font-bold text-amber-900">{activeSummaryPatient.anticoagulant}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Resuscitation Status</span>
                <span className="text-xs font-bold text-slate-900">{activeSummaryPatient.dnr}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSummaryModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSummaryModalOpen(false);
                  setActiveSubTab('intake');
                  onRequestClearance();
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs"
              >
                Request Emergency Clearance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
