import fs from 'fs';
import path from 'path';
import { EmergencyAccessRequest } from '../src/types.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const REQUESTS_FILE = path.join(DATA_DIR, 'access_requests.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {}
}

const defaultRequests: EmergencyAccessRequest[] = [
  {
    id: 'REQ-901',
    patientHash: '3a7b98d2f14c8e561a09d3b4e72a8c1f90e5b2a3c7d6e4f1890b2c3d4e5f6a7b',
    patientName: 'Elena Rostova',
    dob: '1979-11-23',
    requesterName: 'Dr. Jordan Hayes, MD',
    role: 'TRAUMA_SURGEON_ATTENDING',
    emergencyCaseId: 'EMS-TRAUMA-9912',
    urgencyLevel: 'CRITICAL_TRAUMA',
    reason: 'Unconscious polytrauma victim, vehicular crash, Glasgow Coma Scale 6',
    status: 'APPROVED',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    decidedAt: new Date(Date.now() - 3580000).toISOString(),
    decidedBy: 'Hospital Security & Triage Officer (Metro General)',
    notes: 'Emergency Break-Glass approved. Valid ZK credential verified.',
  },
];

let accessRequests: EmergencyAccessRequest[] = [];

// Load from real disk file
try {
  if (fs.existsSync(REQUESTS_FILE)) {
    const raw = fs.readFileSync(REQUESTS_FILE, 'utf-8');
    accessRequests = JSON.parse(raw);
  }
} catch (e) {
  console.warn('Failed to read access requests from disk, fallback to defaults');
}

if (!accessRequests || accessRequests.length === 0) {
  accessRequests = [...defaultRequests];
  saveRequestsToDisk();
}

function saveRequestsToDisk() {
  try {
    fs.writeFileSync(REQUESTS_FILE, JSON.stringify(accessRequests, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed to write access requests to disk', e);
  }
}

let autoApprovePolicy = false;

export function getAccessRequests(): EmergencyAccessRequest[] {
  return [...accessRequests].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getAccessRequestById(id: string): EmergencyAccessRequest | undefined {
  return accessRequests.find((r) => r.id === id);
}

export function createAccessRequest(
  data: Omit<EmergencyAccessRequest, 'id' | 'createdAt' | 'status'>
): EmergencyAccessRequest {
  const id = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  const isAuto = autoApprovePolicy;

  const newRequest: EmergencyAccessRequest = {
    ...data,
    id,
    createdAt: now,
    status: isAuto ? 'APPROVED' : 'PENDING',
    decidedAt: isAuto ? now : undefined,
    decidedBy: isAuto ? 'Auto-Approval Engine (Rule: Trauma Level 1 + Valid ZK Proof)' : undefined,
  };

  accessRequests.unshift(newRequest);
  saveRequestsToDisk();
  return newRequest;
}

export function updateAccessRequestStatus(
  id: string,
  status: 'APPROVED' | 'DENIED',
  decidedBy = 'Hospital Data Protection Officer'
): EmergencyAccessRequest | null {
  const request = accessRequests.find((r) => r.id === id);
  if (!request) return null;

  request.status = status;
  request.decidedAt = new Date().toISOString();
  request.decidedBy = decidedBy;

  saveRequestsToDisk();
  return request;
}

export function getAutoApprovePolicy(): boolean {
  return autoApprovePolicy;
}

export function setAutoApprovePolicy(enabled: boolean): boolean {
  autoApprovePolicy = enabled;
  return autoApprovePolicy;
}
