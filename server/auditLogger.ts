import fs from 'fs';
import path from 'path';
import { computeSha256 } from './cryptoUtils.js';
import { AuditLogEntry } from './types.js';

const AUDIT_DIR = path.join(process.cwd(), 'data');
const AUDIT_FILE = path.join(AUDIT_DIR, 'audit_log.jsonl');

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

let auditLogs: AuditLogEntry[] = [];

// Initialize data directory
if (!fs.existsSync(AUDIT_DIR)) {
  try {
    fs.mkdirSync(AUDIT_DIR, { recursive: true });
  } catch (e) {
    // Disk fallback to memory
  }
}

// Load existing audit log entries from jsonl
try {
  if (fs.existsSync(AUDIT_FILE)) {
    const content = fs.readFileSync(AUDIT_FILE, 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim().length > 0);
    auditLogs = lines.map((l) => JSON.parse(l));
  }
} catch (e) {
  console.warn('Audit log init warning:', e);
}

// If empty, create an initial genesis entry
if (auditLogs.length === 0) {
  const genesisEntry: AuditLogEntry = {
    index: 0,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    requesterSubject: 'SYSTEM_GENESIS_INITIALIZER',
    emergencyCaseId: 'EMS-SYSTEM-INIT',
    patientHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    hospitalsQueried: ['Metro General Hospital', 'St. Jude Regional', 'Pacific Valley Health'],
    matchedHospitals: [],
    queryMode: 'ONLINE_FEDERATED',
    summarySnapshot: {
      bloodType: 'SYSTEM_ROOT',
      allergies: 'NONE',
      anticoagulants: 'NONE',
    },
    prevHash: GENESIS_HASH,
    entryHash: computeSha256(`${GENESIS_HASH}:SYSTEM_GENESIS_INITIALIZER:0`),
  };
  auditLogs.push(genesisEntry);
  persistEntry(genesisEntry);
}

function persistEntry(entry: AuditLogEntry) {
  try {
    fs.appendFileSync(AUDIT_FILE, JSON.stringify(entry) + '\n', 'utf-8');
  } catch (e) {
    // Memory remains valid
  }
}

/**
 * Appends an entry to the append-only, hash-chained audit log.
 * prevHash = SHA256 of the previous line.
 */
export function recordAuditAccess(params: {
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
}): AuditLogEntry {
  const prevEntry = auditLogs[auditLogs.length - 1];
  const prevHash = prevEntry ? prevEntry.entryHash : GENESIS_HASH;
  const index = auditLogs.length;
  const timestamp = new Date().toISOString();

  const coreData = {
    index,
    timestamp,
    requesterSubject: params.requesterSubject,
    emergencyCaseId: params.emergencyCaseId,
    patientHash: params.patientHash,
    hospitalsQueried: params.hospitalsQueried,
    matchedHospitals: params.matchedHospitals,
    queryMode: params.queryMode,
    summarySnapshot: params.summarySnapshot,
    prevHash,
  };

  const entryHash = computeSha256(prevHash + JSON.stringify(coreData));

  const entry: AuditLogEntry = {
    ...coreData,
    entryHash,
  };

  auditLogs.push(entry);
  persistEntry(entry);

  return entry;
}

export function getAuditLogs(): AuditLogEntry[] {
  return [...auditLogs].reverse(); // newest first
}

/**
 * Verifies the mathematical integrity of the hash chain.
 */
export function verifyAuditChain(): {
  isValid: boolean;
  totalBlocks: number;
  brokenAtIndex?: number;
} {
  for (let i = 1; i < auditLogs.length; i++) {
    const current = auditLogs[i];
    const prev = auditLogs[i - 1];

    if (current.prevHash !== prev.entryHash) {
      return { isValid: false, totalBlocks: auditLogs.length, brokenAtIndex: i };
    }

    const { entryHash, ...coreData } = current;
    const computedHash = computeSha256(current.prevHash + JSON.stringify(coreData));
    if (computedHash !== entryHash) {
      return { isValid: false, totalBlocks: auditLogs.length, brokenAtIndex: i };
    }
  }

  return { isValid: true, totalBlocks: auditLogs.length };
}
