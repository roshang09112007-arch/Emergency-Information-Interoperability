import React, { useState } from 'react';
import {
  CheckCircle,
  CheckCircle2,
  Copy,
  Database,
  ExternalLink,
  GitCommit,
  Hash,
  Layers,
  Link,
  Lock,
  RefreshCw,
  ScrollText,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { AuditLogEntry } from '../types.js';

interface AuditLogViewerProps {
  logs: AuditLogEntry[];
  verification: {
    isValid: boolean;
    totalBlocks: number;
    brokenAtIndex?: number;
  };
  onRefresh: () => void;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  logs,
  verification,
  onRefresh,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const filteredLogs = logs.filter(
    (l) =>
      l.requesterSubject.toLowerCase().includes(filterQuery.toLowerCase()) ||
      l.patientHash.toLowerCase().includes(filterQuery.toLowerCase()) ||
      l.emergencyCaseId.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="saas-card p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <ScrollText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Append-Only Hash-Chained Audit Ledger
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  IMMUTABLE MERKLE CHAIN
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Cryptographically linked tamper-evident ledger proving HIPAA/GDPR emergency break-glass compliance
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {verification.isValid ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Chain Integrity: 100% Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3.5 py-1 text-xs font-bold text-rose-700">
              Chain Compromised at block #{verification.brokenAtIndex}
            </span>
          )}

          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            <span>Verify &amp; Refresh</span>
          </button>
        </div>
      </div>

      {/* Compliance Principles Callout Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Minimum Necessary Principle
          </span>
          <p className="text-slate-700 leading-relaxed text-[11px]">
            Hospitals only disclose trauma-critical fields. Full longitudinal history is never retrieved.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Zero-Identity Ingress
          </span>
          <p className="text-slate-700 leading-relaxed text-[11px]">
            Logged subjects identify the DID hash only — patient personal PII is absent from all hospital records.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Hash-Chained Tamper Proofing
          </span>
          <p className="text-slate-700 leading-relaxed text-[11px]">
            Each entry includes <code className="font-mono text-blue-700 bg-blue-50 px-1 py-0.5 rounded text-[10px]">prev_hash = SHA256(prev_line)</code>, preventing retroactive deletion.
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          placeholder="Filter audit ledger by case ID, patient DID hash, or responder..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
        />
      </div>

      {/* Hash-Chained List */}
      <div className="space-y-3.5">
        {filteredLogs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
            No audit log entries matching &ldquo;{filterQuery}&rdquo;
          </div>
        ) : (
          filteredLogs.map((entry) => {
            const isGenesis = entry.index === 0;

            return (
              <div
                key={entry.entryHash}
                className={`rounded-xl border p-4 transition-all ${
                  isGenesis
                    ? 'border-slate-300 bg-slate-50/60'
                    : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
                }`}
              >
                {/* Entry Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-100 font-mono text-[10px] font-bold text-slate-700">
                      #{entry.index}
                    </span>
                    <span className="font-bold text-xs text-slate-900">
                      {isGenesis ? 'GENESIS BLOCK' : entry.requesterSubject}
                    </span>
                    {!isGenesis && (
                      <span className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-700">
                        {entry.emergencyCaseId}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        entry.queryMode === 'OFFLINE_CACHE'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {entry.queryMode}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Entry Body */}
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Left: Query Context */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Patient DID Hash:</span>
                      <span className="font-mono text-[11px] text-slate-800 font-semibold truncate">{entry.patientHash}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Nodes Queried:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {entry.hospitalsQueried.map((h, i) => (
                          <span key={i} className="rounded-md bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700 border border-slate-200">
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Snapshot of Trauma Fields Disclosed */}
                  <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-[11px] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Disclosed Emergency Summary Snapshot:
                    </span>
                    <div className="text-slate-800">
                      <span className="text-slate-500 font-medium">Blood:</span> {entry.summarySnapshot?.bloodType || 'N/A'}
                    </div>
                    <div className="text-slate-800 truncate">
                      <span className="text-slate-500 font-medium">Allergies:</span> {entry.summarySnapshot?.allergies || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Cryptographic Linkage Footer */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-2.5 text-[10px] font-mono text-slate-500">
                  <div
                    className="flex items-center gap-1.5 cursor-pointer hover:text-slate-800 transition-colors"
                    onClick={() => handleCopy(entry.prevHash)}
                    title="Click to copy prev_hash"
                  >
                    <Link className="h-3 w-3 text-slate-400" />
                    <span>prev_hash:</span>
                    <span className="text-slate-700 truncate max-w-[160px] sm:max-w-[220px]">{entry.prevHash}</span>
                  </div>
                  <div
                    className="flex items-center gap-1.5 cursor-pointer hover:text-blue-700 transition-colors"
                    onClick={() => handleCopy(entry.entryHash)}
                    title="Click to copy entry_hash"
                  >
                    <Hash className="h-3 w-3 text-blue-500" />
                    <span className="text-blue-600 font-semibold">entry_hash:</span>
                    <span className="text-blue-700 font-semibold truncate max-w-[160px] sm:max-w-[240px]">{entry.entryHash}</span>
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
