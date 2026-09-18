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

export interface BrokerQueryResult {
  patientHash: string;
  mode: 'ONLINE_FEDERATED' | 'OFFLINE_CACHE';
  cacheTimestamp?: string;
  goldenSummary: GoldenSummary;
  hospitalResponses: HospitalQueryResponse[];
  extractedRecords: ExtractedHospitalRecord[];
  zkVerification: {
    valid: boolean;
    reason?: string;
    requesterSubject: string;
    caseId: string;
  };
  auditLogEntryHash: string;
  executionTimeMs: number;
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

export interface DemoPatient {
  id: string;
  name: string;
  dob: string;
  notes: string;
  hash: string;
  triageLevel?: string;
  clinicalProfile?: {
    bloodType: string;
    allergy: string;
    anticoagulant: string;
    condition: string;
    implant: string;
    dnrStatus: 'FULL_CODE' | 'DNR_DO_NOT_RESUSCITATE' | 'UNKNOWN';
  };
}

export type AccessRequestStatus = 'PENDING' | 'APPROVED' | 'DENIED';

export interface EmergencyAccessRequest {
  id: string;
  patientHash: string;
  patientName: string;
  dob: string;
  requesterName: string;
  role: string;
  emergencyCaseId: string;
  urgencyLevel: 'CRITICAL_TRAUMA' | 'URGENT' | 'STANDARD';
  reason: string;
  status: AccessRequestStatus;
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
  notes?: string;
  zkToken?: ZkRoleToken;
}

export interface HospitalUser {
  id: string;
  hospital_id: string;
  hospital_name: string;
  email: string;
  license_id?: string;
  npi_number?: string;
  network_node_code?: string;
  state_jurisdiction?: string;
  officer_name: string;
  officer_role: string;
  approval_status: 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED';
  created_at: string;
}

export interface MySqlDiagnostics {
  connected: boolean;
  configured: boolean;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  error?: string;
  latencyMs?: number;
  tables?: {
    hospitals: number;
    users?: number;
    patients?: number;
    hospital_records?: number;
    access_requests: number;
    audit_chain?: number;
    audit_logs?: number;
    cache_records?: number;
  };
}

