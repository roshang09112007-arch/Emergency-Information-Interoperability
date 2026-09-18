import crypto from 'crypto';
import { ZkRoleToken } from './types.js';

const MOCK_SIGNING_SECRET = 'pulsekey_zk_breakglass_shared_secret_2025';

/**
 * SIMULATES biometric-to-DID hashing.
 * At point of care, an EMT scans a fingerprint, facial contour, or iris.
 * This is converted to a cancelable biometric template and hashed with SHA-256
 * to produce a Decentralized Identifier (DID).
 *
 * CRITICAL ZERO-TRUST PRINCIPLE:
 * Hospitals index records against this DID hash ONLY, never against the raw
 * biometric or personal identity. The patient's name NEVER leaves the EMT's device.
 */
export function hashBiometricToDid(fullName: string, dob: string): string {
  const normalized = `${fullName.trim().toLowerCase()}|${dob.trim()}`;
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
}

/**
 * SIMULATES a zero-knowledge proof of role without exposing full identity.
 * In production, this would use a real ZK circuit (e.g. zk-SNARK / Groth16 / Semaphore)
 * where the physician proves:
 *   1. They possess a valid medical license credential issued by an accredited authority.
 *   2. The credential is active and not revoked.
 *   3. They are assigned to an active emergency dispatch incident (#EMS-CASE).
 *   4. All of this is proven WITHOUT revealing their full private key or social identity
 *      to third-party hospital databases.
 */
export function createZkRoleToken(
  responderName: string = 'Dr. Jordan Hayes, MD',
  role: string = 'TRAUMA_SURGEON_ATTENDING',
  emergencyCaseId: string = 'EMS-TRAUMA-9912'
): ZkRoleToken {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + 4 * 3600; // 4-hour break-glass emergency window

  const publicSignals = {
    role,
    credentialId: 'MED-LIC-TX-88421',
    emergencyCaseId,
    responderName,
    jurisdiction: 'METRO_EMS_DISTRICT_4',
    issuedAt,
    expiresAt,
  };

  const payloadString = JSON.stringify(publicSignals);
  const proofCommitment = crypto.createHash('sha256').update(payloadString).digest('hex');

  // Simulated ZK circuit proof signature
  const signature = crypto
    .createHmac('sha256', MOCK_SIGNING_SECRET)
    .update(`ZK_CIRCUIT_V2:${proofCommitment}`)
    .digest('hex');

  return {
    tokenType: 'SIMULATED_ZK_ROLE_PROOF',
    publicSignals,
    proofCommitment,
    signature,
    mockCircuitNote:
      'SIMULATES zero-knowledge proof of role & active dispatch. Production uses Groth16/Semaphore circuit to hide responder PII while proving emergency authority.',
  };
}

/**
 * Validates the break-glass ZK role proof at each hospital node.
 * Verifies expiration (must not exceed 4h window) and cryptographic signature.
 */
export function verifyZkRoleToken(token: ZkRoleToken): { valid: boolean; reason?: string } {
  if (!token || token.tokenType !== 'SIMULATED_ZK_ROLE_PROOF') {
    return { valid: false, reason: 'Invalid or missing ZK proof structure' };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (token.publicSignals.expiresAt < nowSec) {
    return { valid: false, reason: 'Break-glass token has expired (>4h window elapsed)' };
  }

  const expectedCommitment = crypto
    .createHash('sha256')
    .update(JSON.stringify(token.publicSignals))
    .digest('hex');

  if (token.proofCommitment !== expectedCommitment) {
    return { valid: false, reason: 'ZK public signal commitment mismatch' };
  }

  const expectedSig = crypto
    .createHmac('sha256', MOCK_SIGNING_SECRET)
    .update(`ZK_CIRCUIT_V2:${expectedCommitment}`)
    .digest('hex');

  if (token.signature !== expectedSig) {
    return { valid: false, reason: 'Cryptographic proof signature verification failed' };
  }

  return { valid: true };
}

/**
 * Compute SHA256 string helper
 */
export function computeSha256(data: string): string {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}
