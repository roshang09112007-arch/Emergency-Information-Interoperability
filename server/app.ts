import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { getAuditLogs, verifyAuditChain } from './auditLogger.js';
import { executeBrokerQuery } from './broker.js';
import { isNetworkOutage, setNetworkOutage } from './cacheStore.js';
import { computeSha256, createZkRoleToken, hashBiometricToDid } from './cryptoUtils.js';
import {
  DEMO_PATIENTS,
  HOSPITAL_CONFIGS,
  getDiskDatabaseStats,
  queryHospitalDirect,
  registerCustomPatient,
} from './mockHospitals.js';
import {
  createAccessRequest,
  getAccessRequestById,
  getAccessRequests,
  getAutoApprovePolicy,
  setAutoApprovePolicy,
  updateAccessRequestStatus,
} from './accessStore.js';
import {
  initializeMySql,
  getMySqlStatus,
  registerHospital,
  authenticateHospital,
  getLocalHospitals,
} from './mysqlClient.js';
import { HospitalQueryRequest } from './types.js';

export function createExpressApp() {
  const app = express();

  // Basic CORS & Security headers for Vercel and cross-origin environments
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json({ limit: '10mb' }));

  // Initialize MySQL database (async, with in-memory/disk failover)
  initializeMySql().catch((err) => {
    console.warn('[Storage Engine] MySQL initialization note:', err.message);
  });

  // --------------------------------------------------------------
  // 1. Core Health & System Telemetry
  // --------------------------------------------------------------
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'PulseKey Emergency Broker',
      environment: process.env.VERCEL ? 'vercel-serverless' : process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      networkOutageSimulated: isNetworkOutage(),
    });
  });

  // --------------------------------------------------------------
  // 2. Patient Directory & Identification
  // --------------------------------------------------------------
  app.get('/api/patients', (_req: Request, res: Response) => {
    res.json({
      patients: DEMO_PATIENTS,
    });
  });

  app.post('/api/patients/custom', (req: Request, res: Response) => {
    try {
      const { name, dob, notes, triageLevel, bloodType, allergy, anticoagulant, condition, implant, dnrStatus } =
        req.body || {};
      if (!name || !dob) {
        return res.status(400).json({ error: 'name and dob are required' });
      }
      const patient = registerCustomPatient({
        name,
        dob,
        notes,
        triageLevel,
        bloodType,
        allergy,
        anticoagulant,
        condition,
        implant,
        dnrStatus,
      });
      res.json({ patient, allPatients: DEMO_PATIENTS });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to register custom patient' });
    }
  });

  app.post('/api/biometric-hash', (req: Request, res: Response) => {
    const { fullName, dob } = req.body || {};
    if (!fullName || !dob) {
      return res.status(400).json({ error: 'fullName and dob are required' });
    }
    const hash = hashBiometricToDid(fullName, dob);
    res.json({ hash });
  });

  // --------------------------------------------------------------
  // 3. Hardware Biometric (WebAuthn / Passkey) Endpoints
  // --------------------------------------------------------------
  app.post('/api/biometric/webauthn-challenge', (req: Request, res: Response) => {
    const { userId, userName } = req.body || {};
    const challenge = Buffer.from(Array.from({ length: 32 }, () => Math.floor(Math.random() * 256))).toString(
      'base64url'
    );
    const id = Buffer.from(userId || 'user_' + Date.now()).toString('base64url');
    const hostHeader = (req.headers.host || '').split(':')[0] || 'localhost';

    res.json({
      challenge,
      rp: {
        name: 'PulseKey Emergency Biometric Broker',
        id: hostHeader,
      },
      user: {
        id,
        name: userName || 'trauma-responder',
        displayName: userName || 'Emergency Medical Responder',
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      timeout: 60000,
      attestation: 'none',
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        requireResidentKey: false,
      },
    });
  });

  app.post('/api/biometric/verify-webauthn', (req: Request, res: Response) => {
    try {
      const { credentialId, rawId } = req.body || {};
      if (!credentialId && !rawId) {
        return res.status(400).json({ error: 'Credential ID or rawId required' });
      }

      const hardwareHash = computeSha256(`WEBAUTHN_ENCLAVE_ROOT:${rawId || credentialId}`);

      res.json({
        success: true,
        method: 'WEBAUTHN_HARDWARE_PLATFORM_ENCLAVE',
        credentialId,
        hardwareHash,
        timestamp: new Date().toISOString(),
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'WebAuthn verification failed' });
    }
  });

  // --------------------------------------------------------------
  // 4. ZK Role Proofs & Network Outage Simulation
  // --------------------------------------------------------------
  app.post('/api/mint-zk-token', (req: Request, res: Response) => {
    const { responderName, role, caseId } = req.body || {};
    const token = createZkRoleToken(responderName, role, caseId);
    res.json({ token });
  });

  app.get('/api/network-status', (_req: Request, res: Response) => {
    res.json({ isOffline: isNetworkOutage() });
  });

  app.post('/api/network-toggle', (req: Request, res: Response) => {
    const { offline } = req.body || {};
    const current = setNetworkOutage(Boolean(offline));
    res.json({ isOffline: current });
  });

  // --------------------------------------------------------------
  // 5. Hospital Registry & Node Endpoints (Preserving FHIR, CSV, XML)
  // --------------------------------------------------------------
  app.get('/api/hospitals', (_req: Request, res: Response) => {
    res.json({
      hospitals: HOSPITAL_CONFIGS.map((h) => ({
        id: h.id,
        name: h.name,
        port: h.port,
        format: h.format,
        endpoint: `/api/nodes/${h.id}/query`,
        recordCount: Object.keys(h.records).length,
      })),
    });
  });

  // Dedicated routes for Hospital A (Metro General · FHIR JSON)
  app.post('/api/nodes/hospital-a/query', (req: Request, res: Response) => {
    const config = HOSPITAL_CONFIGS.find((h) => h.id === 'metro-gen') || HOSPITAL_CONFIGS[0];
    const result = queryHospitalDirect(config, req.body as HospitalQueryRequest);
    if (result.error) return res.status(403).json(result);
    res.json(result);
  });
  app.get('/api/nodes/hospital-a/health', (_req: Request, res: Response) => {
    const config = HOSPITAL_CONFIGS[0];
    res.json({ hospitalId: config.id, name: config.name, format: config.format, status: 'ONLINE' });
  });

  // Dedicated routes for Hospital B (St. Jude Regional · Pipe CSV)
  app.post('/api/nodes/hospital-b/query', (req: Request, res: Response) => {
    const config = HOSPITAL_CONFIGS.find((h) => h.id === 'st-jude') || HOSPITAL_CONFIGS[1];
    const result = queryHospitalDirect(config, req.body as HospitalQueryRequest);
    if (result.error) return res.status(403).json(result);
    res.json(result);
  });
  app.get('/api/nodes/hospital-b/health', (_req: Request, res: Response) => {
    const config = HOSPITAL_CONFIGS[1];
    res.json({ hospitalId: config.id, name: config.name, format: config.format, status: 'ONLINE' });
  });

  // Dedicated routes for Hospital C (Pacific Valley · Custom XML)
  app.post('/api/nodes/hospital-c/query', (req: Request, res: Response) => {
    const config = HOSPITAL_CONFIGS.find((h) => h.id === 'pacific-valley') || HOSPITAL_CONFIGS[2];
    const result = queryHospitalDirect(config, req.body as HospitalQueryRequest);
    if (result.error) return res.status(403).json(result);
    res.json(result);
  });
  app.get('/api/nodes/hospital-c/health', (_req: Request, res: Response) => {
    const config = HOSPITAL_CONFIGS[2];
    res.json({ hospitalId: config.id, name: config.name, format: config.format, status: 'ONLINE' });
  });

  // Generic dynamic node query endpoint
  app.post('/api/nodes/:nodeId/query', (req: Request, res: Response) => {
    const nodeId = req.params.nodeId.toLowerCase();
    const config = HOSPITAL_CONFIGS.find(
      (h) => h.id.toLowerCase() === nodeId || h.name.toLowerCase().includes(nodeId)
    );
    if (!config) {
      return res.status(404).json({ error: `Hospital node '${nodeId}' not found in registry.` });
    }
    const result = queryHospitalDirect(config, req.body as HospitalQueryRequest);
    if (result.error) return res.status(403).json(result);
    res.json(result);
  });

  app.get('/api/nodes/:nodeId/health', (req: Request, res: Response) => {
    const nodeId = req.params.nodeId.toLowerCase();
    const config = HOSPITAL_CONFIGS.find(
      (h) => h.id.toLowerCase() === nodeId || h.name.toLowerCase().includes(nodeId)
    );
    if (!config) {
      return res.status(404).json({ error: `Hospital node '${nodeId}' not found.` });
    }
    res.json({
      hospitalId: config.id,
      name: config.name,
      format: config.format,
      status: 'ONLINE',
      recordCount: Object.keys(config.records).length,
    });
  });

  // --------------------------------------------------------------
  // 6. Hospital Institutional Authentication & Directory (MySQL)
  // --------------------------------------------------------------
  app.post('/api/hospital/signup', async (req: Request, res: Response) => {
    try {
      const {
        hospital_id,
        hospital_name,
        email,
        password,
        npi_number,
        network_node_code,
        state_jurisdiction,
        officer_name,
        officer_role,
      } = req.body || {};

      if (!hospital_name || !email || !password || !officer_name) {
        return res.status(400).json({
          error: 'Missing required registration parameters: hospital_name, email, password, and officer_name are required.',
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          error: 'Password must be at least 6 characters in length.',
        });
      }

      const created = await registerHospital({
        hospital_id,
        hospital_name,
        email,
        password,
        npi_number,
        network_node_code,
        state_jurisdiction,
        officer_name,
        officer_role: officer_role || 'CHIEF_TRIAGE_OFFICER',
      });

      const sessionToken = Buffer.from(
        JSON.stringify({
          hospitalId: created.hospital_id,
          email: created.email,
          officer: created.officer_name,
          issuedAt: Date.now(),
        })
      ).toString('base64url');

      const { password_hash, ...safeHospital } = created;

      res.status(201).json({
        success: true,
        message: 'Hospital institutional node registered and activated.',
        hospital: safeHospital,
        token: sessionToken,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to register hospital node.' });
    }
  });

  app.post('/api/hospital/signin', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const authenticated = await authenticateHospital(email, password);
      if (!authenticated) {
        return res.status(401).json({ error: 'Invalid hospital credentials or unverified node.' });
      }

      const sessionToken = Buffer.from(
        JSON.stringify({
          hospitalId: authenticated.hospital_id,
          email: authenticated.email,
          officer: authenticated.officer_name,
          issuedAt: Date.now(),
        })
      ).toString('base64url');

      const { password_hash, ...safeHospital } = authenticated;

      res.json({
        success: true,
        message: 'Institutional clearance authenticated.',
        hospital: safeHospital,
        token: sessionToken,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Authentication error occurred.' });
    }
  });

  app.get('/api/hospital/me', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No active institutional session provided.' });
    }

    try {
      const token = authHeader.split(' ')[1];
      const payload = JSON.parse(Buffer.from(token, 'base64url').toString('utf-8'));
      const locals = getLocalHospitals();
      const hosp = locals.find((h) => h.email.toLowerCase() === payload.email?.toLowerCase());
      if (!hosp) {
        return res.status(404).json({ error: 'Hospital node record not found.' });
      }
      const { password_hash, ...safeHospital } = hosp;
      res.json({ hospital: safeHospital });
    } catch (err: any) {
      res.status(401).json({ error: 'Invalid or expired session token.' });
    }
  });

  app.get('/api/hospital/directory', (_req: Request, res: Response) => {
    const locals = getLocalHospitals();
    const directory = locals.map(({ password_hash, ...safe }) => safe);
    res.json({ hospitals: directory });
  });

  // --------------------------------------------------------------
  // 7. MySQL Database Status & Dynamic Connect
  // --------------------------------------------------------------
  app.get('/api/mysql/status', async (_req: Request, res: Response) => {
    try {
      const status = await getMySqlStatus();
      res.json(status);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/mysql/connect', async (req: Request, res: Response) => {
    try {
      const { host, port, user, password, database, url } = req.body || {};
      if (url) {
        process.env.MYSQL_URL = url;
      } else {
        if (host) process.env.MYSQL_HOST = host;
        if (port) process.env.MYSQL_PORT = String(port);
        if (user) process.env.MYSQL_USER = user;
        if (password) process.env.MYSQL_PASSWORD = password;
        if (database) process.env.MYSQL_DATABASE = database;
      }
      const newStatus = await initializeMySql();
      res.json(newStatus);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --------------------------------------------------------------
  // 8. Emergency Access Requests & Clearance Gate
  // --------------------------------------------------------------
  app.get('/api/access-requests', (_req: Request, res: Response) => {
    res.json({
      requests: getAccessRequests(),
      autoApprovePolicy: getAutoApprovePolicy(),
    });
  });

  app.post('/api/access-requests', (req: Request, res: Response) => {
    const {
      patientHash,
      patientName,
      dob,
      requesterName,
      role,
      emergencyCaseId,
      urgencyLevel,
      reason,
      zkToken,
    } = req.body || {};

    if (!patientHash || !requesterName) {
      return res.status(400).json({ error: 'patientHash and requesterName are required' });
    }

    const created = createAccessRequest({
      patientHash,
      patientName: patientName || 'Unidentified Patient',
      dob: dob || 'Unknown',
      requesterName,
      role: role || 'EMERGENCY_PHYSICIAN',
      emergencyCaseId: emergencyCaseId || 'EMS-EMERGENCY',
      urgencyLevel: urgencyLevel || 'CRITICAL_TRAUMA',
      reason: reason || 'Point-of-care emergency break-glass triage',
      zkToken: zkToken || createZkRoleToken(requesterName, role, emergencyCaseId),
    });

    res.status(201).json(created);
  });

  app.get('/api/access-requests/:id', (req: Request, res: Response) => {
    const request = getAccessRequestById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    res.json(request);
  });

  app.post('/api/access-requests/:id/approve', (req: Request, res: Response) => {
    const { decidedBy } = req.body || {};
    const updated = updateAccessRequestStatus(
      req.params.id,
      'APPROVED',
      decidedBy || 'Hospital Security & Triage Officer'
    );
    if (!updated) {
      return res.status(404).json({ error: 'Request not found' });
    }
    res.json(updated);
  });

  app.post('/api/access-requests/:id/deny', (req: Request, res: Response) => {
    const { decidedBy } = req.body || {};
    const updated = updateAccessRequestStatus(
      req.params.id,
      'DENIED',
      decidedBy || 'Hospital Security & Triage Officer'
    );
    if (!updated) {
      return res.status(404).json({ error: 'Request not found' });
    }
    res.json(updated);
  });

  app.post('/api/access-policy', (req: Request, res: Response) => {
    const { autoApprove } = req.body || {};
    const updated = setAutoApprovePolicy(Boolean(autoApprove));
    res.json({ autoApprovePolicy: updated });
  });

  // --------------------------------------------------------------
  // 9. Federated / Offline Query Endpoint (Broker & AI Reconciliation)
  // --------------------------------------------------------------
  app.post('/api/query', async (req: Request, res: Response) => {
    try {
      const { patient_hash, requester_token } = req.body || {};

      if (!patient_hash) {
        return res.status(400).json({ error: 'patient_hash is required' });
      }

      const token = requester_token || createZkRoleToken();
      const result = await executeBrokerQuery(patient_hash, token);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({
        error: err.message || 'Federated query failed',
        isOfflineMode: isNetworkOutage(),
      });
    }
  });

  // --------------------------------------------------------------
  // 10. Audit Log & Database Inspector
  // --------------------------------------------------------------
  app.get('/api/audit-log', (_req: Request, res: Response) => {
    const logs = getAuditLogs();
    const verification = verifyAuditChain();
    res.json({
      logs,
      verification,
    });
  });

  app.get('/api/database/inspect', (_req: Request, res: Response) => {
    try {
      const stats = getDiskDatabaseStats();
      const auditLogs = getAuditLogs();
      const auditIntegrity = verifyAuditChain();

      res.json({
        success: true,
        ...stats,
        totalAuditBlocks: auditLogs.length,
        auditChainIntegrity: auditIntegrity,
        lastSynced: new Date().toISOString(),
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Database inspect failed' });
    }
  });

  app.get('/api/database/raw', (req: Request, res: Response) => {
    const requestedFile = String(req.query.file || '');
    const allowed = [
      'patients.json',
      'access_requests.json',
      'audit_log.jsonl',
      'offline_cache.json',
      'database_manifest.json',
      'metro_general_fhir.json',
      'st_jude_records.json',
      'pacific_valley_xml.json',
    ];

    if (!allowed.includes(requestedFile)) {
      return res.status(403).json({ error: 'Access denied: unapproved data file' });
    }

    try {
      let fullPath = path.join(process.cwd(), 'data', requestedFile);
      if (
        requestedFile.includes('metro_general') ||
        requestedFile.includes('st_jude') ||
        requestedFile.includes('pacific_valley')
      ) {
        fullPath = path.join(process.cwd(), 'data', 'hospitals', requestedFile);
      }

      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ error: 'File not found on disk' });
      }

      const content = fs.readFileSync(fullPath, 'utf-8');
      const stat = fs.statSync(fullPath);
      res.json({
        fileName: requestedFile,
        sizeBytes: stat.size,
        lastModified: stat.mtime.toISOString(),
        sha256: computeSha256(content),
        content,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  return app;
}

export const app = createExpressApp();
export default app;
