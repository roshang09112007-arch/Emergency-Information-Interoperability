import React, { useState } from 'react';
import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  ExternalLink,
  HeartPulse,
  HelpCircle,
  Info,
  Layers,
  Pill,
  Shield,
  ShieldCheck,
  Stethoscope,
  Zap,
} from 'lucide-react';
import { GoldenSummary, TraumaSummaryField } from '../types.js';

interface GoldenSummaryCardProps {
  summary: GoldenSummary;
  patientName: string;
  onInspectRaw: () => void;
}

export const GoldenSummaryCard: React.FC<GoldenSummaryCardProps> = ({
  summary,
  patientName,
  onInspectRaw,
}) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const getConfidenceBadge = (confidence: 'HIGH' | 'MEDIUM' | 'LOW') => {
    switch (confidence) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700 font-mono">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            HIGH CONFIDENCE
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700 font-mono">
            <AlertCircle className="h-3 w-3 text-amber-600" />
            RECONCILED
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700 font-mono">
            <AlertOctagon className="h-3 w-3 text-rose-600" />
            DISCORDANT
          </span>
        );
    }
  };

  const renderFieldBlock = (
    id: string,
    label: string,
    field: TraumaSummaryField,
    icon: React.ReactNode,
    isCritical = false
  ) => {
    const isExpanded = activeTooltip === id;

    return (
      <div
        className={`group relative rounded-xl border p-4 transition-all duration-200 ${
          isCritical
            ? 'border-rose-300 bg-rose-50/40 shadow-sm'
            : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                isCritical
                  ? 'bg-rose-100 text-rose-600 border border-rose-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {icon}
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {label}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {getConfidenceBadge(field.confidence)}
            <button
              onClick={() => setActiveTooltip(isExpanded ? null : id)}
              className="rounded p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Toggle Multi-Agent AI reconciliation rationale"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Primary Value */}
        <div className="mt-1">
          <p
            className={`text-base font-bold leading-snug tracking-tight ${
              isCritical ? 'text-rose-950' : 'text-slate-900'
            }`}
          >
            {field.value}
          </p>
        </div>

        {/* Sources citations pills */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sources:</span>
          {field.sources && field.sources.length > 0 ? (
            field.sources.map((src, i) => (
              <span
                key={i}
                className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-mono text-slate-700 font-semibold"
              >
                {src}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-slate-400 italic">Hospital EHR Node</span>
          )}
        </div>

        {/* Expandable AI Rationale Box */}
        <div
          className={`mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 transition-all ${
            isExpanded ? 'block' : 'hidden group-hover:block'
          }`}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-900 mb-1">
            <Zap className="h-3.5 w-3.5 text-blue-600" />
            <span>Reconciliation Rationale:</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-600">{field.reason}</p>
        </div>
      </div>
    );
  };

  const isOffline = summary.mode === 'OFFLINE_CACHE';

  return (
    <div className="saas-card p-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  PulseKey Golden Emergency Summary
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ZERO-KNOWLEDGE SYNTHESIS
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Verified trauma-critical chart synthesized across {summary.dataSourceCount} federated hospital databases
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isOffline ? (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
              <Clock className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
              <span>
                OFFLINE DISASTER MODE — Cached: {summary.cacheTimestamp ? new Date(summary.cacheTimestamp).toLocaleTimeString() : 'Recent'}
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              <Layers className="h-3.5 w-3.5 text-emerald-600" />
              <span>LIVE FEDERATED RECONCILIATION</span>
            </div>
          )}

          <button
            onClick={onInspectRaw}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors shadow-sm"
          >
            <ExternalLink className="h-3.5 w-3.5 text-blue-600" />
            <span>Inspect Raw Records</span>
          </button>
        </div>
      </div>

      {/* Clinical Warning Alert Banner */}
      {summary.clinicalAdvisory && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-xs text-rose-950 shadow-sm">
          <AlertOctagon className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-rose-800 uppercase tracking-wider block text-[11px]">
              Critical Trauma Advisory
            </span>
            <p className="mt-0.5 font-medium leading-relaxed">{summary.clinicalAdvisory}</p>
          </div>
        </div>
      )}

      {/* Grid of Trauma-Critical Fields */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* 1. Blood Type */}
        {renderFieldBlock(
          'blood',
          'Blood Group & Rh Type',
          summary.bloodType,
          <HeartPulse className="h-4 w-4" />
        )}

        {/* 2. Allergies */}
        {renderFieldBlock(
          'allergies',
          'Critical Allergies',
          summary.allergies,
          <AlertTriangle className="h-4 w-4" />,
          summary.allergies.value.toLowerCase().includes('anaphylaxis') ||
            summary.allergies.value.toLowerCase().includes('severe')
        )}

        {/* 3. Anticoagulants / Meds */}
        {renderFieldBlock(
          'anticoagulants',
          'Active Anticoagulants',
          summary.anticoagulants,
          <Pill className="h-4 w-4" />,
          summary.anticoagulants.value.toLowerCase().includes('warfarin') ||
            summary.anticoagulants.value.toLowerCase().includes('eliquis') ||
            summary.anticoagulants.value.toLowerCase().includes('lovenox')
        )}

        {/* 4. Major Conditions */}
        {renderFieldBlock(
          'conditions',
          'Major Chronic Diagnoses',
          summary.majorConditions,
          <Stethoscope className="h-4 w-4" />
        )}

        {/* 5. Implants & Prosthetics */}
        {renderFieldBlock(
          'implants',
          'Prosthetics & Devices',
          summary.implants,
          <Shield className="h-4 w-4" />
        )}

        {/* 6. DNR Status */}
        {renderFieldBlock(
          'dnr',
          'Resuscitation Directive',
          summary.dnrStatus,
          <HelpCircle className="h-4 w-4" />,
          summary.dnrStatus.value.toLowerCase().includes('dnr')
        )}
      </div>

      {/* Footer Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>Decrypted Patient Subject:</span>
          <span className="font-bold text-slate-900">{patientName}</span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span>DID: {summary.patientHash.slice(0, 16)}...</span>
          <span>Reconciled: {new Date(summary.reconciledAt).toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};
