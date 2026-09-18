import React from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Radio,
  Send,
  Server,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { EmergencyAccessRequest } from '../types.js';

interface OverviewDashboardProps {
  accessRequests: EmergencyAccessRequest[];
  onNavigateTab: (tab: 'overview' | 'send-request' | 'emergency-requests' | 'patients' | 'hospital-network') => void;
  onSelectRequest?: (req: EmergencyAccessRequest) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  accessRequests,
  onNavigateTab,
  onSelectRequest,
}) => {
  const pendingCount = accessRequests.filter((r) => r.status === 'PENDING').length;
  const activeCount = accessRequests.length;

  // Preset default demo requests if list is small
  const displayRequests = [
    {
      id: 'CASE-2026-001',
      patientId: 'PULSE-DID-7A91',
      reason: 'Trauma - Unconscious',
      status: 'Approved',
      time: '14:32',
      statusColor: 'badge-status-approved',
    },
    {
      id: 'CASE-2026-002',
      patientId: 'PULSE-DID-3F22',
      reason: 'Road Traffic Accident',
      status: 'Pending',
      time: '14:18',
      statusColor: 'badge-status-pending',
    },
    {
      id: 'CASE-2026-003',
      patientId: 'PULSE-DID-9K11',
      reason: 'Cardiac Emergency',
      status: 'Completed',
      time: '12:45',
      statusColor: 'badge-status-completed',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Title with Give Request CTA */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Emergency Operations</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time overview of emergency data exchange across regional hospitals
          </p>
        </div>
        <button
          onClick={() => onNavigateTab('send-request')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm hover:shadow transition-all"
        >
          <Send className="h-3.5 w-3.5" />
          <span>New Emergency Request</span>
        </button>
      </div>

      {/* 4 Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Requests */}
        <div className="saas-card p-5">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <Flame className="h-4 w-4 text-rose-500" />
            <span>Active Requests</span>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
            {activeCount > 0 ? activeCount : 2}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            +1 today
          </div>
        </div>

        {/* Card 2: Pending Authorization */}
        <div
          onClick={() => onNavigateTab('emergency-requests')}
          className="saas-card p-5 cursor-pointer hover:border-amber-300 transition-colors"
        >
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span>Pending Authorization</span>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
            {pendingCount > 0 ? pendingCount : 1}
          </div>
          <div className="mt-1 text-[11px] text-amber-600 font-medium">
            Requires review
          </div>
        </div>

        {/* Card 3: Hospital Nodes */}
        <div
          onClick={() => onNavigateTab('hospital-network')}
          className="saas-card p-5 cursor-pointer hover:border-emerald-300 transition-colors"
        >
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <Server className="h-4 w-4 text-emerald-500" />
            <span>Hospital Nodes</span>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
            3 / 3
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 font-medium">
            All online
          </div>
        </div>

        {/* Card 4: Network Status */}
        <div className="saas-card p-5">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Network Status</span>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
            Operational
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            No issues
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Requests (Left) and Hospital Network (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Emergency Requests & Activity */}
        <div className="lg:col-span-8 space-y-6">
          {/* Table Card */}
          <div className="saas-card overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Recent Emergency Requests</h2>
              <button
                onClick={() => onNavigateTab('emergency-requests')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                View All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Case ID</th>
                    <th className="px-5 py-3">Patient ID</th>
                    <th className="px-5 py-3">Reason</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {displayRequests.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-slate-900 font-bold">{row.id}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-600">{row.patientId}</td>
                      <td className="px-5 py-3.5 text-slate-800">{row.reason}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${row.statusColor}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {row.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-slate-500">{row.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="saas-card p-5">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">Recent Activity</h2>
              <span className="text-xs text-slate-400 font-medium">Telemetry Log</span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between text-slate-700">
                <div className="flex items-center gap-3">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-mono text-slate-500 font-medium">14:32</span>
                  <span>Access granted for CASE-2026-001</span>
                </div>
                <span className="text-[11px] font-semibold text-blue-600">Dr. Arun Kumar</span>
              </div>

              <div className="flex items-center justify-between text-slate-700">
                <div className="flex items-center gap-3">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-mono text-slate-500 font-medium">14:18</span>
                  <span>Emergency access clearance requested for PULSE-DID-3F22</span>
                </div>
                <span className="text-[11px] font-semibold text-amber-600">Pending Review</span>
              </div>

              <div className="flex items-center justify-between text-slate-700">
                <div className="flex items-center gap-3">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-mono text-slate-500 font-medium">12:45</span>
                  <span>Multi-hospital federated query synthesized for CASE-2026-003</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600">Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Hospital Network & System Info */}
        <div className="lg:col-span-4 space-y-6">
          {/* Hospital Network Card */}
          <div className="saas-card p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-sm font-bold text-slate-900">Hospital Network</h2>
              <button
                onClick={() => onNavigateTab('hospital-network')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                View Details
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-800">Metro General Hospital</span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-800">St. Jude Regional Medical Center</span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-800">Pacific Valley Health System</span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              </div>
            </div>
          </div>

          {/* System Information Card */}
          <div className="saas-card p-5">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
              System Information
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Version</span>
                <span className="font-mono font-semibold text-slate-800">v2.4.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Environment</span>
                <span className="font-semibold text-slate-800">Production</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Last Updated</span>
                <span className="font-mono text-slate-800">18 Sep 2026, 23:11</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
