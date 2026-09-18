import React, { useState } from 'react';
import {
  Building2,
  CheckCircle,
  Clock,
  Code2,
  Copy,
  FileCode,
  FileSpreadsheet,
  FileText,
  Sparkles,
  Zap,
  Server,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { ExtractedHospitalRecord, HospitalQueryResponse } from '../types.js';

interface HospitalRawViewerProps {
  hospitalResponses?: HospitalQueryResponse[];
  extractedRecords?: ExtractedHospitalRecord[];
}

// Built-in sample EHR nodes and formats when no active search has been performed
const DEFAULT_HOSPITAL_DATA: {
  responses: HospitalQueryResponse[];
  extracted: ExtractedHospitalRecord[];
} = {
  responses: [
    {
      hospitalId: 'hospital-a',
      hospitalName: 'Metro General Hospital',
      port: 4001,
      format: 'FHIR_JSON',
      match: true,
      latencyMs: 12,
      raw_record: `{
  "resourceType": "Bundle",
  "type": "searchset",
  "total": 1,
  "entry": [
    {
      "resource": {
        "resourceType": "Patient",
        "id": "MGH-98821",
        "identifier": [{ "system": "urn:did:sha256", "value": "0x7a91b8d2...e81a" }],
        "active": true,
        "gender": "female",
        "birthDate": "1985-06-14",
        "bloodGroup": "O_POSITIVE",
        "extension": [
          { "url": "http://pulsekey.io/dnr", "valueString": "FULL_CODE" }
        ]
      }
    },
    {
      "resource": {
        "resourceType": "AllergyIntolerance",
        "clinicalStatus": { "coding": [{ "code": "active" }] },
        "verificationStatus": { "coding": [{ "code": "confirmed" }] },
        "criticality": "high",
        "code": { "text": "Penicillin G (Severe Anaphylactic Shock)" }
      }
    },
    {
      "resource": {
        "resourceType": "MedicationStatement",
        "status": "active",
        "medicationCodeableConcept": { "text": "Warfarin Sodium 5mg Oral Daily" }
      }
    },
    {
      "resource": {
        "resourceType": "Device",
        "deviceName": [{ "name": "Dual-Chamber Medtronic Pacemaker", "type": "user-friendly-name" }]
      }
    }
  ]
}`,
    },
    {
      hospitalId: 'hospital-b',
      hospitalName: 'St. Jude Regional Medical Center',
      port: 4002,
      format: 'PIPE_CSV',
      match: true,
      latencyMs: 18,
      raw_record: `# ST. JUDE REGIONAL EMERGENCY EHR EXPORT v3.2
# ENCODING: UTF-8 | DELIMITER: PIPE (|)
PATIENT_DID_HASH|BLOOD_RH|ALLERGIES_KNOWN|ACTIVE_ANTICOAGULANTS|CHRONIC_CONDITIONS|IMPLANTS|ADVANCED_DIRECTIVES|LAST_UPDATE
0x7a91b8d2...e81a|O+|Penicillin G (Severe Respiratory Collapse); Sulfa (Mild Rash)|Warfarin Sodium 5mg PO QPM|Atrial Fibrillation; Hypertension|Dual-Chamber Cardiac Pacemaker (2022)|FULL_CODE_ACTIVE|2026-08-12T14:30:00Z`,
    },
    {
      hospitalId: 'hospital-c',
      hospitalName: 'Pacific Valley Health System',
      port: 4003,
      format: 'CUSTOM_XML',
      match: true,
      latencyMs: 15,
      raw_record: `<?xml version="1.0" encoding="UTF-8"?>
<ClinicalDocument xmlns="urn:hl7-org:v3" moodCode="EVN">
  <realmCode code="US"/>
  <typeId root="2.16.840.1.113883.1.3" extension="POCD_HD000040"/>
  <title>Pacific Valley Emergency Summary Document</title>
  <recordTarget>
    <patientRole>
      <id extension="0x7a91b8d2...e81a" root="urn:pulsekey:did"/>
      <patient>
        <administrativeGenderCode code="F" codeSystem="2.16.840.1.113883.5.1"/>
        <birthTime value="19850614"/>
        <bloodType>O Positive (Rh+)</bloodType>
      </patient>
    </patientRole>
  </recordTarget>
  <component>
    <structuredBody>
      <section>
        <code code="48765-2" codeSystem="2.16.840.1.113883.6.1" displayName="Allergies"/>
        <text>Severe allergy to Penicillin class drugs (Anaphylaxis)</text>
      </section>
      <section>
        <code code="10160-0" codeSystem="2.16.840.1.113883.6.1" displayName="Medications"/>
        <text>Coumadin (Warfarin Sodium) 5mg tablet daily</text>
      </section>
      <section>
        <code code="42348-3" codeSystem="2.16.840.1.113883.6.1" displayName="Directives"/>
        <text>Full Resuscitation Code</text>
      </section>
    </structuredBody>
  </component>
</ClinicalDocument>`,
    },
  ],
  extracted: [
    {
      hospitalId: 'hospital-a',
      hospitalName: 'Metro General Hospital',
      format: 'FHIR_JSON',
      rawRecord: '',
      extractedAt: new Date().toISOString(),
      fields: {
        bloodType: 'O Positive (Rh+)',
        allergies: ['Penicillin G (Severe Anaphylactic Shock)'],
        medicationsAnticoagulants: ['Warfarin Sodium 5mg Oral Daily'],
        majorConditions: ['Atrial Fibrillation'],
        implants: ['Dual-Chamber Medtronic Pacemaker'],
        dnrStatus: 'FULL_CODE',
        recordDate: '2026-08-12',
      },
    },
    {
      hospitalId: 'hospital-b',
      hospitalName: 'St. Jude Regional Medical Center',
      format: 'PIPE_CSV',
      rawRecord: '',
      extractedAt: new Date().toISOString(),
      fields: {
        bloodType: 'O Positive (Rh+)',
        allergies: ['Penicillin G (Severe Respiratory Collapse)', 'Sulfa (Mild Rash)'],
        medicationsAnticoagulants: ['Warfarin Sodium 5mg PO QPM'],
        majorConditions: ['Atrial Fibrillation', 'Hypertension'],
        implants: ['Dual-Chamber Cardiac Pacemaker (2022)'],
        dnrStatus: 'FULL_CODE',
        recordDate: '2026-08-12',
      },
    },
    {
      hospitalId: 'hospital-c',
      hospitalName: 'Pacific Valley Health System',
      format: 'CUSTOM_XML',
      rawRecord: '',
      extractedAt: new Date().toISOString(),
      fields: {
        bloodType: 'O Positive (Rh+)',
        allergies: ['Severe allergy to Penicillin class drugs (Anaphylaxis)'],
        medicationsAnticoagulants: ['Coumadin (Warfarin Sodium) 5mg tablet daily'],
        majorConditions: ['Cardiac rhythm disorder'],
        implants: ['Pacemaker verified'],
        dnrStatus: 'FULL_CODE',
        recordDate: '2026-08-12',
      },
    },
  ],
};

export const HospitalRawViewer: React.FC<HospitalRawViewerProps> = ({
  hospitalResponses = [],
  extractedRecords = [],
}) => {
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('hospital-a');
  const [viewMode, setViewMode] = useState<'sideBySide' | 'rawOnly' | 'parsedOnly'>('sideBySide');
  const [copied, setCopied] = useState(false);

  // Use real responses if populated, else fall back to sample federated nodes
  const activeResponses =
    hospitalResponses && hospitalResponses.length > 0
      ? hospitalResponses
      : DEFAULT_HOSPITAL_DATA.responses;

  const activeExtracted =
    extractedRecords && extractedRecords.length > 0
      ? extractedRecords
      : DEFAULT_HOSPITAL_DATA.extracted;

  const selectedResponse =
    activeResponses.find((h) => h.hospitalId === selectedHospitalId) || activeResponses[0];
  const selectedExtracted =
    activeExtracted.find((r) => r.hospitalId === selectedHospitalId) || activeExtracted[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getFormatBadge = (format: string) => {
    switch (format) {
      case 'FHIR_JSON':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
            <FileCode className="h-3 w-3" />
            HL7® FHIR® R4 (:4001)
          </span>
        );
      case 'PIPE_CSV':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            <FileSpreadsheet className="h-3 w-3" />
            Pipe-Delimited CSV (:4002)
          </span>
        );
      case 'CUSTOM_XML':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 border border-purple-200 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
            <FileText className="h-3 w-3" />
            Legacy Clinical XML (:4003)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
            {format}
          </span>
        );
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
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Hospital Node Federation &amp; Semantic Parsing
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-architecture EHR extraction under zero-knowledge DID queries across 3 regional hospital nodes
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200">
          <button
            onClick={() => setViewMode('sideBySide')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              viewMode === 'sideBySide'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Side-by-Side (Raw vs AI)
          </button>
          <button
            onClick={() => setViewMode('rawOnly')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              viewMode === 'rawOnly'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Raw Record Only
          </button>
          <button
            onClick={() => setViewMode('parsedOnly')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              viewMode === 'parsedOnly'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Parsed Trauma JSON
          </button>
        </div>
      </div>

      {/* Hospital Node Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {activeResponses.map((res) => {
          const isSelected = selectedHospitalId === res.hospitalId;
          return (
            <button
              key={res.hospitalId}
              onClick={() => setSelectedHospitalId(res.hospitalId)}
              className={`flex flex-col text-left rounded-xl border p-4 transition-all ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/40 text-slate-900 shadow-sm ring-1 ring-blue-600'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">{res.hospitalName}</span>
                {res.match ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" /> MATCH
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">NO RECORD</span>
                )}
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                {getFormatBadge(res.format)}
                <span className="flex items-center gap-1 text-[11px] text-slate-500 font-mono font-medium">
                  <Clock className="h-3 w-3 text-slate-400" /> {res.latencyMs || 12}ms
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Inspection Area */}
      {selectedResponse && (
        <div className="mt-2">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Left: Raw Hospital Payload */}
            {(viewMode === 'sideBySide' || viewMode === 'rawOnly') && (
              <div
                className={`rounded-xl border border-slate-200 bg-slate-900 overflow-hidden shadow-sm ${
                  viewMode === 'rawOnly' ? 'lg:col-span-2' : ''
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-200">
                    <Code2 className="h-4 w-4 text-blue-400" />
                    <span className="text-xs font-bold font-mono">
                      Raw Incompatible Output ({selectedResponse.format})
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(selectedResponse.raw_record || '')}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition-colors"
                  >
                    <Copy className="h-3 w-3" />
                    <span>{copied ? 'Copied!' : 'Copy Payload'}</span>
                  </button>
                </div>
                <div className="p-4">
                  <pre className="max-h-[420px] overflow-auto rounded-lg bg-black/50 p-3.5 font-mono text-[11px] leading-relaxed text-slate-200 scrollbar-thin">
                    {selectedResponse.raw_record || 'No raw record data returned from this hospital node.'}
                  </pre>
                </div>
              </div>
            )}

            {/* Right: AI-Parsed Structured Trauma Fields */}
            {(viewMode === 'sideBySide' || viewMode === 'parsedOnly') && (
              <div
                className={`rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm ${
                  viewMode === 'parsedOnly' ? 'lg:col-span-2' : ''
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-800">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-bold">
                      Semantic Extraction ({selectedResponse.hospitalName})
                    </span>
                  </div>
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 uppercase">
                    Zero-Loss Translation
                  </span>
                </div>

                <div className="p-5 space-y-4 max-h-[460px] overflow-auto">
                  {selectedExtracted ? (
                    <>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                          <span className="text-[10px] uppercase font-bold text-slate-500">Blood Group &amp; Rh</span>
                          <p className="font-bold text-sm text-slate-900 mt-1">
                            {selectedExtracted.fields.bloodType || 'Unknown'}
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                          <span className="text-[10px] uppercase font-bold text-slate-500">Record Timestamp</span>
                          <p className="font-mono text-xs font-semibold text-slate-800 mt-1">
                            {selectedExtracted.fields.recordDate || 'Recent'}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Extracted Allergies</span>
                        <div className="mt-2 space-y-1.5">
                          {selectedExtracted.fields.allergies.length > 0 ? (
                            selectedExtracted.fields.allergies.map((a, i) => (
                              <div
                                key={i}
                                className={`text-xs font-semibold rounded-lg px-2.5 py-1.5 ${
                                  a.toLowerCase().includes('penicillin') || a.toLowerCase().includes('severe')
                                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                    : 'bg-white text-slate-800 border border-slate-200'
                                }`}
                              >
                                {a}
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-500 italic">None reported on chart</p>
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                        <span className="text-[10px] uppercase font-bold text-slate-500">
                          Active Anticoagulants &amp; High-Alert Meds
                        </span>
                        <div className="mt-2 space-y-1.5">
                          {selectedExtracted.fields.medicationsAnticoagulants.map((m, i) => (
                            <div key={i} className="text-xs font-medium text-slate-900 bg-white p-2 rounded-lg border border-slate-200">
                              {m}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Devices, Directives &amp; Diagnoses</span>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-slate-800 font-medium">
                            Implants: {selectedExtracted.fields.implants.join(', ') || 'None'}
                          </span>
                          <span className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-slate-800 font-medium">
                            Directives: {selectedExtracted.fields.dnrStatus}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-xs text-slate-500">
                      Query a patient to generate real-time AI extractions.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
