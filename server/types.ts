export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface TraumaSummaryField {
  value: string;
  confidence: ConfidenceLevel;
  reason: string;
  sources: string[];
}

export interface GoldenSummary {
  patientHash: string;
  reconciledAt: string;
  dataSourceCount: number;
  mode: 'ONLINE_FEDERATED' | 'OFFLINE_CACHE';
  cacheTimestamp?: string;
  bloodType: TraumaSummaryField;
  allergies: TraumaSummaryField;
  anticoagulants: TraumaSummaryField;
  majorConditions: TraumaSummaryField;
  implants: TraumaSummaryField;
  dnrStatus: TraumaSummaryField;
  clinicalAdvisory?: string;
}

export interface ExtractedHospitalRecord {
  hospitalId: string;
  hospitalName: string;
  format: 'FHIR_JSON' | 'PIPE_CSV' | 'CUSTOM_XML';
  rawRecord: string;
  extractedAt: string;
  fields: {
    bloodType: string;
    allergies: string[];
    medicationsAnticoagulants: string[];
    majorConditions: string[];
    implants: string[];
    dnrStatus: string;
    recordDate?: string;
  };
}

export interface ZkRoleToken {
  tokenType: 'SIMULATED_ZK_ROLE_PROOF';
  publicSignals: {
    role: string;
    credentialId: string;
    emergencyCaseId: string;
    responderName: string;
    jurisdiction: string;
    issuedAt: number;
    expiresAt: number;
  };
  proofCommitment: string;
  signature: string;
  mockCircuitNote: string;
}

export interface HospitalQueryRequest {
  patient_hash: string;
  requester_token: ZkRoleToken;
}

export interface HospitalQueryResponse {
  hospitalId: string;
  hospitalName: string;
  port: number;
  format: 'FHIR_JSON' | 'PIPE_CSV' | 'CUSTOM_XML';
  match: boolean;
  raw_record?: string;
  latencyMs: number;
  error?: string;
}

export interface AuditLogEntry {
  index: number;
  timestamp: string;
  requesterSubject: string;
  emergencyCaseId: string;
  patientHash: string;
  hospitalsQueried: string[];
  matchedHospitals: string[];
  queryMode: 'ONLINE_FEDERATED' | 'OFFLINE_CACHE';
  summarySnapshot: {
    bloodType: string;
    allergies: string;
    anticoagulants: string;
  };
  prevHash: string;
  entryHash: string;
}
