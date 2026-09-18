import { parseHospitalRecordWithAI, reconcileRecordsWithAI } from './aiEngine.js';
import { recordAuditAccess } from './auditLogger.js';
import { getFromCache, isNetworkOutage, saveToCache } from './cacheStore.js';
import { verifyZkRoleToken } from './cryptoUtils.js';
import {
  HOSPITAL_CONFIGS,
  HospitalNodeConfig,
  queryHospitalDirect,
} from './mockHospitals.js';
import {
  ExtractedHospitalRecord,
  GoldenSummary,
  HospitalQueryRequest,
  HospitalQueryResponse,
  ZkRoleToken,
} from './types.js';

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

/**
 * Fans out the query to a single hospital node.
 * Uses direct in-memory execution in serverless/production environments, and attempts port in local dev.
 */
async function querySingleHospital(
  config: HospitalNodeConfig,
  request: HospitalQueryRequest
): Promise<HospitalQueryResponse> {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  if (isServerless || process.env.NODE_ENV === 'production') {
    return queryHospitalDirect(config, request);
  }

  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);

    const res = await fetch(`http://127.0.0.1:${config.port}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = (await res.json()) as HospitalQueryResponse;
      return {
        ...data,
        latencyMs: Date.now() - startTime,
      };
    }
  } catch (e) {
    // Port fetch timeout or container sandbox restriction: use direct in-memory call
  }

  // Guaranteed direct execution fallback
  return queryHospitalDirect(config, request);
}

/**
 * Central Query Broker / Coordinator:
 * 1. Checks offline / network outage status
 * 2. Fans out query to all hospital nodes in parallel
 * 3. AI parses raw disparate formats
 * 4. AI reconciles clinical conflicts into Golden Summary
 * 5. Caches output for offline resilience
 * 6. Appends to hash-chained audit log
 */
export async function executeBrokerQuery(
  patientHash: string,
  requesterToken: ZkRoleToken
): Promise<BrokerQueryResult> {
  const startTime = Date.now();

  // Validate ZK role proof at broker ingress
  const zkCheck = verifyZkRoleToken(requesterToken);
  const requesterSubject = requesterToken.publicSignals?.responderName || 'Unknown Responder';
  const caseId = requesterToken.publicSignals?.emergencyCaseId || 'EMS-EMERGENCY';

  if (!zkCheck.valid) {
    throw new Error(`ZK Role Proof Rejected: ${zkCheck.reason || 'Invalid credential'}`);
  }

  // 1. Check if Offline / Network Outage is simulated
  if (isNetworkOutage()) {
    const cached = getFromCache(patientHash);
    if (cached) {
      const offlineSummary: GoldenSummary = {
        ...cached.goldenSummary,
        mode: 'OFFLINE_CACHE',
        cacheTimestamp: cached.cachedAt,
      };

      const auditEntry = recordAuditAccess({
        requesterSubject,
        emergencyCaseId: caseId,
        patientHash,
        hospitalsQueried: HOSPITAL_CONFIGS.map((h) => h.name),
        matchedHospitals: cached.extractedRecords.map((r) => r.hospitalName),
        queryMode: 'OFFLINE_CACHE',
        summarySnapshot: {
          bloodType: offlineSummary.bloodType.value,
          allergies: offlineSummary.allergies.value,
          anticoagulants: offlineSummary.anticoagulants.value,
        },
      });

      return {
        patientHash,
        mode: 'OFFLINE_CACHE',
        cacheTimestamp: cached.cachedAt,
        goldenSummary: offlineSummary,
        hospitalResponses: cached.extractedRecords.map((r) => ({
          hospitalId: r.hospitalId,
          hospitalName: r.hospitalName,
          port: 0,
          format: r.format,
          match: true,
          raw_record: r.rawRecord,
          latencyMs: 0,
        })),
        extractedRecords: cached.extractedRecords,
        zkVerification: {
          valid: true,
          requesterSubject,
          caseId,
        },
        auditLogEntryHash: auditEntry.entryHash,
        executionTimeMs: Date.now() - startTime,
      };
    } else {
      // Offline with no cache for this specific hash
      throw new Error(
        'OFFLINE DISASTER MODE: Network unreachable, and no previously synchronized cache exists on this EMT terminal for this biometric DID.'
      );
    }
  }

  // 2. Online Mode: Fan out query to all 3 hospital nodes in parallel
  const hospitalPromises = HOSPITAL_CONFIGS.map((config) =>
    querySingleHospital(config, {
      patient_hash: patientHash,
      requester_token: requesterToken,
    })
  );

  const hospitalResponses = await Promise.all(hospitalPromises);
  const matchedResponses = hospitalResponses.filter((r) => r.match && r.raw_record);

  if (matchedResponses.length === 0) {
    throw new Error('No patient matching this biometric DID was found across participating hospital networks.');
  }

  // 3. AI Semantic Parsing per hospital node (parallel)
  const extractionPromises = matchedResponses.map((res) => parseHospitalRecordWithAI(res));
  const extractedRecords = await Promise.all(extractionPromises);

  // 4. AI Multi-Agent Conflict Reconciliation
  const goldenSummary = await reconcileRecordsWithAI(patientHash, extractedRecords);

  // 5. Update local offline cache
  saveToCache(patientHash, goldenSummary, extractedRecords);

  // 6. Record to hash-chained audit log
  const auditEntry = recordAuditAccess({
    requesterSubject,
    emergencyCaseId: caseId,
    patientHash,
    hospitalsQueried: HOSPITAL_CONFIGS.map((h) => h.name),
    matchedHospitals: extractedRecords.map((r) => r.hospitalName),
    queryMode: 'ONLINE_FEDERATED',
    summarySnapshot: {
      bloodType: goldenSummary.bloodType.value,
      allergies: goldenSummary.allergies.value,
      anticoagulants: goldenSummary.anticoagulants.value,
    },
  });

  return {
    patientHash,
    mode: 'ONLINE_FEDERATED',
    goldenSummary,
    hospitalResponses,
    extractedRecords,
    zkVerification: {
      valid: true,
      requesterSubject,
      caseId,
    },
    auditLogEntryHash: auditEntry.entryHash,
    executionTimeMs: Date.now() - startTime,
  };
}
