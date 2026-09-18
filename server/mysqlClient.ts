import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { EmergencyAccessRequest } from '../src/types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'pulsekey-emergency-jwt-secret-2026';

export interface HospitalRecord {
  id: string;
  hospital_id: string;
  hospital_name: string;
  email: string;
  password_hash: string;
  license_id?: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  admin_name?: string;
  officer_name?: string;
  officer_role?: string;
  npi_number?: string;
  network_node_code?: string;
  state_jurisdiction?: string;
  approval_status?: 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED';
  created_at: string;
}

export interface UserRecord {
  id: string;
  hospital_id: string;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: string;
}

export interface PatientRecord {
  id: string;
  patient_did: string;
  demo_name: string;
  dob: string;
  created_at: string;
}

export interface HospitalEhrRecord {
  id: string;
  hospital_id: string;
  patient_did: string;
  record_format: 'FHIR_JSON' | 'PIPE_CSV' | 'CUSTOM_XML';
  raw_record: string;
  updated_at: string;
}

export interface AccessRequestRecord {
  id: string;
  requester_id: string;
  patient_did: string;
  emergency_case_id: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  created_at: string;
  approved_at?: string | null;
  expires_at?: string | null;
}

export interface AuditLogRecord {
  id?: number;
  timestamp: string;
  actor_id: string;
  hospital_id?: string | null;
  patient_did: string;
  case_id: string;
  action: string;
  result: string;
  prev_hash: string;
  entry_hash: string;
}

export interface CacheRecord {
  id: string;
  patient_did: string;
  summary_json: string;
  source_timestamp: string;
  synced_at: string;
}

export interface MySqlStatus {
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
    users: number;
    patients: number;
    hospital_records: number;
    access_requests: number;
    audit_logs: number;
    cache_records: number;
  };
}

let pool: Pool | null = null;
let isMySqlConfigured = false;
let lastKnownStatus: MySqlStatus = {
  connected: false,
  configured: false,
};

const DATA_DIR = path.join(process.cwd(), 'data');
const HOSPITALS_AUTH_FILE = path.join(DATA_DIR, 'hospitals_auth.json');
const USERS_AUTH_FILE = path.join(DATA_DIR, 'users_auth.json');
const PATIENTS_FILE = path.join(DATA_DIR, 'patients_db.json');
const HOSPITAL_RECORDS_FILE = path.join(DATA_DIR, 'hospital_records_db.json');
const ACCESS_REQUESTS_FILE = path.join(DATA_DIR, 'access_requests_db.json');
const AUDIT_LOGS_FILE = path.join(DATA_DIR, 'audit_logs_db.json');
const CACHE_RECORDS_FILE = path.join(DATA_DIR, 'cache_records_db.json');

// Ensure storage dir exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {}
}

function loadJson<T>(filePath: string, defaultVal: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.log(`[LocalDB] Read note for ${filePath}:`, e);
  }
  return defaultVal;
}

function saveJson<T>(filePath: string, data: T) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.log(`[LocalDB] Write note for ${filePath}:`, e);
  }
}

// Default initial hospital seed accounts
const INITIAL_HOSPITALS: HospitalRecord[] = [
  {
    id: 'HOSP-METRO-01',
    hospital_id: 'HOSP-METRO-01',
    hospital_name: 'Metro General Hospital',
    email: 'triage@metrogeneral.org',
    password_hash: bcrypt.hashSync('PulseKey#2026', 10),
    license_id: 'CMS-CA-948102',
    status: 'ACTIVE',
    admin_name: 'Dr. Nikesh Nath, MD',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'HOSP-STJUDE-02',
    hospital_id: 'HOSP-STJUDE-02',
    hospital_name: 'St. Jude Regional Medical Center',
    email: 'trauma@stjude-health.org',
    password_hash: bcrypt.hashSync('PulseKey#2026', 10),
    license_id: 'CMS-TN-810492',
    status: 'ACTIVE',
    admin_name: 'Nithish, RN BSN',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'HOSP-PACIFIC-03',
    hospital_id: 'HOSP-PACIFIC-03',
    hospital_name: 'Pacific Valley Health System',
    email: 'er-access@pacificvalley.med',
    password_hash: bcrypt.hashSync('PulseKey#2026', 10),
    license_id: 'CMS-WA-109284',
    status: 'ACTIVE',
    admin_name: 'Dr. Roshan, MD',
    created_at: '2026-01-01T00:00:00Z',
  },
];

const INITIAL_USERS: UserRecord[] = [
  {
    id: 'user_metro_admin_01',
    hospital_id: 'HOSP-METRO-01',
    name: 'Dr. Nikesh Nath, MD',
    email: 'triage@metrogeneral.org',
    password_hash: bcrypt.hashSync('PulseKey#2026', 10),
    role: 'CHIEF_TRIAGE_OFFICER',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'user_stjude_admin_02',
    hospital_id: 'HOSP-STJUDE-02',
    name: 'Nithish, RN BSN',
    email: 'trauma@stjude-health.org',
    password_hash: bcrypt.hashSync('PulseKey#2026', 10),
    role: 'ER_CHARGE_NURSE',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'user_pacific_admin_03',
    hospital_id: 'HOSP-PACIFIC-03',
    name: 'Dr. Roshan, MD',
    email: 'er-access@pacificvalley.med',
    password_hash: bcrypt.hashSync('PulseKey#2026', 10),
    role: 'EMERGENCY_DIRECTOR',
    created_at: '2026-01-01T00:00:00Z',
  },
];

/**
 * Initializes the MySQL database connection pool and ensures all 7 required schema tables exist.
 * Automatically mirrors with a resilient transactional local storage layer if remote MySQL is offline.
 */
export async function initializeMySql(): Promise<MySqlStatus> {
  const host = process.env.MYSQL_HOST || '';
  const port = Number(process.env.MYSQL_PORT) || 3306;
  const user = process.env.MYSQL_USER || '';
  const password = process.env.MYSQL_PASSWORD || '';
  const database = process.env.MYSQL_DATABASE || 'pulsekey';
  const url = process.env.MYSQL_URL || '';

  // Initialize local disk cache files
  if (!fs.existsSync(HOSPITALS_AUTH_FILE)) saveJson(HOSPITALS_AUTH_FILE, INITIAL_HOSPITALS);
  if (!fs.existsSync(USERS_AUTH_FILE)) saveJson(USERS_AUTH_FILE, INITIAL_USERS);
  if (!fs.existsSync(PATIENTS_FILE)) saveJson(PATIENTS_FILE, []);
  if (!fs.existsSync(HOSPITAL_RECORDS_FILE)) saveJson(HOSPITAL_RECORDS_FILE, []);
  if (!fs.existsSync(ACCESS_REQUESTS_FILE)) saveJson(ACCESS_REQUESTS_FILE, []);
  if (!fs.existsSync(AUDIT_LOGS_FILE)) saveJson(AUDIT_LOGS_FILE, []);
  if (!fs.existsSync(CACHE_RECORDS_FILE)) saveJson(CACHE_RECORDS_FILE, []);

  if (!host && !url) {
    isMySqlConfigured = false;
    lastKnownStatus = {
      connected: false,
      configured: false,
      database,
      tables: getLocalTableCounts(),
    };
    return lastKnownStatus;
  }

  // Reuse existing pool in warm serverless containers if healthy
  if (pool && lastKnownStatus.connected) {
    return lastKnownStatus;
  }

  isMySqlConfigured = true;

  try {
    const startTime = Date.now();
    const useSsl =
      process.env.MYSQL_SSL === 'true' ||
      (host && !['localhost', '127.0.0.1'].includes(host.toLowerCase())) ||
      (url && (url.includes('ssl') || !url.includes('localhost')));

    const sslConfig = useSsl ? { rejectUnauthorized: false } : undefined;

    if (url) {
      pool = mysql.createPool({
        uri: url,
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0,
        ssl: sslConfig,
        connectTimeout: 5000,
      });
    } else {
      pool = mysql.createPool({
        host,
        port,
        user,
        password,
        database,
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0,
        ssl: sslConfig,
        connectTimeout: 5000,
      });
    }

    const conn = await pool.getConnection();
    const latencyMs = Date.now() - startTime;

    // Run table schema creations & initial seed
    await runMigrations(conn);
    conn.release();

    const counts = await getTableCounts();

    lastKnownStatus = {
      connected: true,
      configured: true,
      host: host || 'URL',
      port,
      user,
      database,
      latencyMs,
      tables: counts,
    };
    console.log(`[MySQL] Connected successfully to ${database} (${latencyMs}ms)`);
    return lastKnownStatus;
  } catch (err: any) {
    if (pool) {
      try {
        await pool.end();
      } catch {}
      pool = null;
    }
    console.log(`[PulseKey Storage Engine] External MySQL unavailable (${err.message}). Local storage active.`);
    lastKnownStatus = {
      connected: false,
      configured: true,
      host,
      port,
      user,
      database,
      error: `External MySQL (${host}:${port}) is currently offline: ${err.message}. Local persistent storage active.`,
      tables: getLocalTableCounts(),
    };
    return lastKnownStatus;
  }
}

/**
 * Migration runner: creates all 7 tables required by specification
 */
export async function runMigrations(conn: PoolConnection) {
  // 1. hospitals
  await conn.query(`
    CREATE TABLE IF NOT EXISTS hospitals (
      id VARCHAR(64) PRIMARY KEY,
      hospital_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      license_id VARCHAR(64),
      status VARCHAR(32) DEFAULT 'ACTIVE',
      admin_name VARCHAR(128),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 2. users
  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      hospital_id VARCHAR(64) NOT NULL,
      name VARCHAR(128) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(64) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_users_hospital (hospital_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 3. patients
  await conn.query(`
    CREATE TABLE IF NOT EXISTS patients (
      id VARCHAR(64) PRIMARY KEY,
      patient_did VARCHAR(128) UNIQUE NOT NULL,
      demo_name VARCHAR(128) NOT NULL,
      dob VARCHAR(32) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_patient_did (patient_did)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 4. hospital_records
  await conn.query(`
    CREATE TABLE IF NOT EXISTS hospital_records (
      id VARCHAR(64) PRIMARY KEY,
      hospital_id VARCHAR(64) NOT NULL,
      patient_did VARCHAR(128) NOT NULL,
      record_format VARCHAR(32) NOT NULL,
      raw_record MEDIUMTEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_rec_patient (patient_did),
      INDEX idx_rec_hospital (hospital_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 5. access_requests
  await conn.query(`
    CREATE TABLE IF NOT EXISTS access_requests (
      id VARCHAR(64) PRIMARY KEY,
      requester_id VARCHAR(128) NOT NULL,
      patient_did VARCHAR(128) NOT NULL,
      emergency_case_id VARCHAR(64) NOT NULL,
      reason TEXT NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
      created_at VARCHAR(64) NOT NULL,
      approved_at VARCHAR(64) NULL,
      expires_at VARCHAR(64) NULL,
      patient_name VARCHAR(128) DEFAULT '',
      dob VARCHAR(32) DEFAULT '',
      requester_name VARCHAR(128) DEFAULT '',
      role VARCHAR(64) DEFAULT 'EMERGENCY_PHYSICIAN',
      urgency_level VARCHAR(32) DEFAULT 'CRITICAL_TRAUMA',
      decided_at VARCHAR(64) NULL,
      decided_by VARCHAR(128) NULL,
      notes TEXT NULL,
      zk_token MEDIUMTEXT NULL,
      INDEX idx_req_patient (patient_did),
      INDEX idx_req_case (emergency_case_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  const extraCols = [
    { name: 'patient_name', type: "VARCHAR(128) DEFAULT ''" },
    { name: 'dob', type: "VARCHAR(32) DEFAULT ''" },
    { name: 'requester_name', type: "VARCHAR(128) DEFAULT ''" },
    { name: 'role', type: "VARCHAR(64) DEFAULT 'EMERGENCY_PHYSICIAN'" },
    { name: 'urgency_level', type: "VARCHAR(32) DEFAULT 'CRITICAL_TRAUMA'" },
    { name: 'decided_at', type: 'VARCHAR(64) NULL' },
    { name: 'decided_by', type: 'VARCHAR(128) NULL' },
    { name: 'notes', type: 'TEXT NULL' },
    { name: 'zk_token', type: 'MEDIUMTEXT NULL' },
  ];

  for (const col of extraCols) {
    try {
      await conn.query(`ALTER TABLE access_requests ADD COLUMN ${col.name} ${col.type}`);
    } catch {}
  }

  const colModifications = [
    'ALTER TABLE access_requests MODIFY COLUMN created_at VARCHAR(64) NOT NULL',
    'ALTER TABLE access_requests MODIFY COLUMN approved_at VARCHAR(64) NULL',
    'ALTER TABLE access_requests MODIFY COLUMN expires_at VARCHAR(64) NULL',
  ];
  for (const mod of colModifications) {
    try {
      await conn.query(mod);
    } catch {}
  }

  // 6. audit_logs
  await conn.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      timestamp VARCHAR(64) NOT NULL,
      actor_id VARCHAR(128) NOT NULL,
      hospital_id VARCHAR(64),
      patient_did VARCHAR(128) NOT NULL,
      case_id VARCHAR(64) NOT NULL,
      action VARCHAR(64) NOT NULL,
      result VARCHAR(64) NOT NULL,
      prev_hash VARCHAR(128) NOT NULL,
      entry_hash VARCHAR(128) NOT NULL,
      INDEX idx_audit_patient (patient_did),
      INDEX idx_audit_case (case_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 7. cache_records
  await conn.query(`
    CREATE TABLE IF NOT EXISTS cache_records (
      id VARCHAR(64) PRIMARY KEY,
      patient_did VARCHAR(128) UNIQUE NOT NULL,
      summary_json MEDIUMTEXT NOT NULL,
      source_timestamp VARCHAR(64) NOT NULL,
      synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_cache_patient (patient_did)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Seed default hospitals if empty
  const [hCount]: any = await conn.query('SELECT COUNT(*) as cnt FROM hospitals');
  if (hCount[0]?.cnt === 0) {
    for (const h of INITIAL_HOSPITALS) {
      await conn.query(
        `INSERT INTO hospitals (id, hospital_name, email, password_hash, license_id, status, admin_name)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE hospital_name = VALUES(hospital_name)`,
        [h.id, h.hospital_name, h.email, h.password_hash, h.license_id, h.status, h.admin_name]
      );
    }
  }

  // Seed default users if empty
  const [uCount]: any = await conn.query('SELECT COUNT(*) as cnt FROM users');
  if (uCount[0]?.cnt === 0) {
    for (const u of INITIAL_USERS) {
      await conn.query(
        `INSERT INTO users (id, hospital_id, name, email, password_hash, role)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [u.id, u.hospital_id, u.name, u.email, u.password_hash, u.role]
      );
    }
  }
}

function getLocalTableCounts() {
  return {
    hospitals: loadJson<any[]>(HOSPITALS_AUTH_FILE, []).length,
    users: loadJson<any[]>(USERS_AUTH_FILE, []).length,
    patients: loadJson<any[]>(PATIENTS_FILE, []).length,
    hospital_records: loadJson<any[]>(HOSPITAL_RECORDS_FILE, []).length,
    access_requests: loadJson<any[]>(ACCESS_REQUESTS_FILE, []).length,
    audit_logs: loadJson<any[]>(AUDIT_LOGS_FILE, []).length,
    cache_records: loadJson<any[]>(CACHE_RECORDS_FILE, []).length,
  };
}

export async function getTableCounts() {
  if (!pool) return getLocalTableCounts();
  try {
    const [h]: any = await pool.query('SELECT COUNT(*) as cnt FROM hospitals');
    const [u]: any = await pool.query('SELECT COUNT(*) as cnt FROM users');
    const [p]: any = await pool.query('SELECT COUNT(*) as cnt FROM patients');
    const [hr]: any = await pool.query('SELECT COUNT(*) as cnt FROM hospital_records');
    const [ar]: any = await pool.query('SELECT COUNT(*) as cnt FROM access_requests');
    const [al]: any = await pool.query('SELECT COUNT(*) as cnt FROM audit_logs');
    const [cr]: any = await pool.query('SELECT COUNT(*) as cnt FROM cache_records');
    return {
      hospitals: Number(h[0]?.cnt || 0),
      users: Number(u[0]?.cnt || 0),
      patients: Number(p[0]?.cnt || 0),
      hospital_records: Number(hr[0]?.cnt || 0),
      access_requests: Number(ar[0]?.cnt || 0),
      audit_logs: Number(al[0]?.cnt || 0),
      cache_records: Number(cr[0]?.cnt || 0),
    };
  } catch {
    return getLocalTableCounts();
  }
}

export async function getMySqlStatus(): Promise<MySqlStatus> {
  if (!pool) {
    return {
      ...lastKnownStatus,
      tables: getLocalTableCounts(),
    };
  }
  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    const latency = Date.now() - start;
    const tables = await getTableCounts();
    return {
      ...lastKnownStatus,
      connected: true,
      latencyMs: latency,
      tables,
    };
  } catch (err: any) {
    return {
      ...lastKnownStatus,
      connected: false,
      error: err.message,
      tables: getLocalTableCounts(),
    };
  }
}

// -------------------------------------------------------------
// HOSPITAL REGISTRATION, AUTHENTICATION & JWT (PART D & E)
// -------------------------------------------------------------

export async function registerHospitalNode(data: {
  hospital_name: string;
  email: string;
  license_id: string;
  admin_name: string;
  password: string;
}): Promise<{ hospital: Omit<HospitalRecord, 'password_hash'>; token: string }> {
  const normalizedEmail = data.email.trim().toLowerCase();

  // Validate duplicate email
  const localHospitals = loadJson<HospitalRecord[]>(HOSPITALS_AUTH_FILE, INITIAL_HOSPITALS);
  if (localHospitals.some((h) => h.email.toLowerCase() === normalizedEmail)) {
    throw new Error('A hospital is already registered with this email address.');
  }

  if (pool) {
    try {
      const [rows]: any = await pool.query('SELECT id FROM hospitals WHERE email = ?', [normalizedEmail]);
      if (rows && rows.length > 0) {
        throw new Error('A hospital is already registered with this email address in MySQL.');
      }
    } catch (e: any) {
      if (e.message.includes('already registered')) throw e;
    }
  }

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(data.password, salt);
  const hospitalId = `HOSP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const hospital: HospitalRecord = {
    id: hospitalId,
    hospital_id: hospitalId,
    hospital_name: data.hospital_name.trim(),
    email: normalizedEmail,
    password_hash,
    license_id: data.license_id.trim(),
    status: 'ACTIVE',
    admin_name: data.admin_name.trim(),
    created_at: new Date().toISOString(),
  };

  // Local sync
  localHospitals.push(hospital);
  saveJson(HOSPITALS_AUTH_FILE, localHospitals);

  // MySQL sync
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO hospitals (id, hospital_name, email, password_hash, license_id, status, admin_name)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [hospital.id, hospital.hospital_name, hospital.email, hospital.password_hash, hospital.license_id, hospital.status, hospital.admin_name]
      );
    } catch (e: any) {
      console.log('[MySQL Save Notice]:', e.message);
    }
  }

  // Create JWT Token
  const token = jwt.sign(
    {
      userId: hospital.id,
      hospitalId: hospital.id,
      role: 'HOSPITAL_ADMINISTRATOR',
      email: hospital.email,
      name: hospital.admin_name,
      hospitalName: hospital.hospital_name,
    },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  const { password_hash: _, ...safeHospital } = hospital;
  return { hospital: safeHospital, token };
}

export async function authenticateHospitalUser(
  email: string,
  plainPassword: string
): Promise<{ hospital: Omit<HospitalRecord, 'password_hash'>; token: string; user: any } | null> {
  const normalizedEmail = email.trim().toLowerCase();
  let hospitalRecord: HospitalRecord | null = null;

  // Try MySQL
  if (pool) {
    try {
      const [rows]: any = await pool.query('SELECT * FROM hospitals WHERE email = ?', [normalizedEmail]);
      if (rows && rows.length > 0) {
        hospitalRecord = rows[0] as HospitalRecord;
      }
    } catch {}
  }

  // Fallback to local file
  if (!hospitalRecord) {
    const locals = loadJson<HospitalRecord[]>(HOSPITALS_AUTH_FILE, INITIAL_HOSPITALS);
    hospitalRecord = locals.find((h) => h.email.toLowerCase() === normalizedEmail) || null;
  }

  if (!hospitalRecord) return null;

  const validPassword = await bcrypt.compare(plainPassword, hospitalRecord.password_hash);
  if (!validPassword) return null;

  const token = jwt.sign(
    {
      userId: hospitalRecord.id,
      hospitalId: hospitalRecord.id,
      role: 'HOSPITAL_ADMINISTRATOR',
      email: hospitalRecord.email,
      name: hospitalRecord.admin_name || 'Hospital Administrator',
      hospitalName: hospitalRecord.hospital_name,
    },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  const { password_hash: _, ...safeHospital } = hospitalRecord;
  return {
    hospital: safeHospital,
    token,
    user: {
      id: hospitalRecord.id,
      name: hospitalRecord.admin_name || 'Hospital Administrator',
      role: 'HOSPITAL_ADMINISTRATOR',
      hospital_name: hospitalRecord.hospital_name,
      email: hospitalRecord.email,
    },
  };
}

export function verifyJwtToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// -------------------------------------------------------------
// PATIENTS PERSISTENCE (PART H & PART W)
// -------------------------------------------------------------

export async function upsertPatient(patient: {
  patient_did: string;
  demo_name: string;
  dob: string;
}): Promise<PatientRecord> {
  const local = loadJson<PatientRecord[]>(PATIENTS_FILE, []);
  let found = local.find((p) => p.patient_did === patient.patient_did);
  if (!found) {
    found = {
      id: `pat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      patient_did: patient.patient_did,
      demo_name: patient.demo_name,
      dob: patient.dob,
      created_at: new Date().toISOString(),
    };
    local.push(found);
    saveJson(PATIENTS_FILE, local);
  }

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO patients (id, patient_did, demo_name, dob)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE demo_name = VALUES(demo_name), dob = VALUES(dob)`,
        [found.id, found.patient_did, found.demo_name, found.dob]
      );
    } catch {}
  }
  return found;
}

export async function getPatientByDid(did: string): Promise<PatientRecord | null> {
  if (pool) {
    try {
      const [rows]: any = await pool.query('SELECT * FROM patients WHERE patient_did = ?', [did]);
      if (rows && rows.length > 0) return rows[0];
    } catch {}
  }
  const local = loadJson<PatientRecord[]>(PATIENTS_FILE, []);
  return local.find((p) => p.patient_did === did) || null;
}

// -------------------------------------------------------------
// HOSPITAL RECORDS PERSISTENCE (PART I)
// -------------------------------------------------------------

export async function upsertHospitalRecord(record: {
  hospital_id: string;
  patient_did: string;
  record_format: 'FHIR_JSON' | 'PIPE_CSV' | 'CUSTOM_XML';
  raw_record: string;
}): Promise<HospitalEhrRecord> {
  const id = `${record.hospital_id}_${record.patient_did}`;
  const item: HospitalEhrRecord = {
    id,
    hospital_id: record.hospital_id,
    patient_did: record.patient_did,
    record_format: record.record_format,
    raw_record: record.raw_record,
    updated_at: new Date().toISOString(),
  };

  const local = loadJson<HospitalEhrRecord[]>(HOSPITAL_RECORDS_FILE, []);
  const idx = local.findIndex((r) => r.id === id);
  if (idx >= 0) local[idx] = item;
  else local.push(item);
  saveJson(HOSPITAL_RECORDS_FILE, local);

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO hospital_records (id, hospital_id, patient_did, record_format, raw_record)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE raw_record = VALUES(raw_record), record_format = VALUES(record_format)`,
        [item.id, item.hospital_id, item.patient_did, item.record_format, item.raw_record]
      );
    } catch {}
  }
  return item;
}

export async function getHospitalRecordsByPatientDid(
  patientDid: string,
  hospitalId?: string
): Promise<HospitalEhrRecord[]> {
  if (pool) {
    try {
      const query = hospitalId
        ? 'SELECT * FROM hospital_records WHERE patient_did = ? AND hospital_id = ?'
        : 'SELECT * FROM hospital_records WHERE patient_did = ?';
      const params = hospitalId ? [patientDid, hospitalId] : [patientDid];
      const [rows]: any = await pool.query(query, params);
      if (rows && rows.length > 0) return rows;
    } catch {}
  }

  const local = loadJson<HospitalEhrRecord[]>(HOSPITAL_RECORDS_FILE, []);
  return local.filter((r) => r.patient_did === patientDid && (!hospitalId || r.hospital_id === hospitalId));
}

// -------------------------------------------------------------
// ACCESS REQUESTS PERSISTENCE (PART J & K)
// -------------------------------------------------------------

export async function createAccessRequestDb(data: {
  patientHash: string;
  patientName?: string;
  dob?: string;
  requesterName: string;
  role?: string;
  emergencyCaseId: string;
  urgencyLevel?: 'CRITICAL_TRAUMA' | 'URGENT' | 'STANDARD';
  reason: string;
  status?: 'PENDING' | 'APPROVED' | 'DENIED';
  zkToken?: any;
}): Promise<EmergencyAccessRequest> {
  if (!pool && isMySqlConfigured) {
    await initializeMySql();
  }

  const id = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();
  const zkTokenStr = data.zkToken ? JSON.stringify(data.zkToken) : null;

  const request: EmergencyAccessRequest = {
    id,
    patientHash: data.patientHash,
    patientName: data.patientName || 'Unidentified Patient',
    dob: data.dob || 'Unknown',
    requesterName: data.requesterName,
    role: data.role || 'EMERGENCY_PHYSICIAN',
    emergencyCaseId: data.emergencyCaseId,
    urgencyLevel: data.urgencyLevel || 'CRITICAL_TRAUMA',
    reason: data.reason,
    status: data.status || 'PENDING',
    createdAt: now,
    zkToken: data.zkToken,
  };

  console.log(`[ACCESS_REQUEST] create started for case ${request.emergencyCaseId}`);

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO access_requests 
         (id, requester_id, patient_did, patient_name, dob, requester_name, role, emergency_case_id, urgency_level, reason, status, created_at, zk_token)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          request.id,
          request.requesterName,
          request.patientHash,
          request.patientName,
          request.dob,
          request.requesterName,
          request.role,
          request.emergencyCaseId,
          request.urgencyLevel,
          request.reason,
          request.status,
          request.createdAt,
          zkTokenStr,
        ]
      );
      console.log(`[ACCESS_REQUEST] MySQL insert successful - request ID: ${request.id}`);
    } catch (err: any) {
      console.error(`[ACCESS_REQUEST] MySQL insert error for request ID ${request.id}:`, err.message);
      throw err;
    }
  } else {
    console.warn(`[ACCESS_REQUEST] MySQL pool unavailable, saving to fallback storage. Request ID: ${request.id}`);
  }

  // Backup in disk cache
  const local = loadJson<EmergencyAccessRequest[]>(ACCESS_REQUESTS_FILE, []);
  local.unshift(request);
  saveJson(ACCESS_REQUESTS_FILE, local);

  return request;
}

export async function updateAccessRequestStatusDb(
  id: string,
  status: 'APPROVED' | 'DENIED',
  decidedBy = 'Hospital Security & Triage Officer',
  notes = ''
): Promise<EmergencyAccessRequest | null> {
  if (!pool && isMySqlConfigured) {
    await initializeMySql();
  }

  const now = new Date().toISOString();
  console.log(`[ACCESS_REQUEST] status update started for request ID: ${id}, status: ${status}`);

  if (pool) {
    try {
      await pool.query(
        `UPDATE access_requests SET status = ?, approved_at = ?, decided_at = ?, decided_by = ?, notes = ? WHERE id = ?`,
        [status, now, now, decidedBy, notes, id]
      );
      console.log(`[ACCESS_REQUEST] MySQL update successful for request ID: ${id}`);
    } catch (err: any) {
      console.error(`[ACCESS_REQUEST] MySQL update error for request ID ${id}:`, err.message);
      throw err;
    }
  }

  // Also update local cache
  const local = loadJson<EmergencyAccessRequest[]>(ACCESS_REQUESTS_FILE, []);
  const req = local.find((r) => r.id === id);
  if (req) {
    req.status = status;
    req.decidedAt = now;
    req.decidedBy = decidedBy;
    if (notes) req.notes = notes;
    saveJson(ACCESS_REQUESTS_FILE, local);
  }

  return getAccessRequestByIdDb(id);
}

export async function getAccessRequestByIdDb(id: string): Promise<EmergencyAccessRequest | null> {
  if (!pool && isMySqlConfigured) {
    await initializeMySql();
  }

  if (pool) {
    try {
      const [rows]: any = await pool.query('SELECT * FROM access_requests WHERE id = ?', [id]);
      if (rows && rows.length > 0) {
        const r = rows[0];
        return {
          id: r.id,
          patientHash: r.patient_did || r.patient_hash || '',
          patientName: r.patient_name || 'Unidentified Patient',
          dob: r.dob || '',
          requesterName: r.requester_name || r.requester_id || '',
          role: r.role || 'EMERGENCY_PHYSICIAN',
          emergencyCaseId: r.emergency_case_id || '',
          urgencyLevel: (r.urgency_level as any) || 'CRITICAL_TRAUMA',
          reason: r.reason || '',
          status: r.status || 'PENDING',
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
          decidedAt: r.decided_at || r.approved_at || undefined,
          decidedBy: r.decided_by || undefined,
          notes: r.notes || undefined,
          zkToken: r.zk_token ? (typeof r.zk_token === 'string' ? JSON.parse(r.zk_token) : r.zk_token) : undefined,
        };
      }
    } catch (err: any) {
      console.error(`[ACCESS_REQUEST] MySQL query by ID error for ${id}:`, err.message);
    }
  }

  const local = loadJson<EmergencyAccessRequest[]>(ACCESS_REQUESTS_FILE, []);
  return local.find((r) => r.id === id) || null;
}

export async function getAllAccessRequestsDb(): Promise<EmergencyAccessRequest[]> {
  if (!pool && isMySqlConfigured) {
    await initializeMySql();
  }

  if (pool) {
    try {
      const [rows]: any = await pool.query('SELECT * FROM access_requests ORDER BY created_at DESC');
      if (rows && rows.length > 0) {
        return rows.map((r: any) => ({
          id: r.id,
          patientHash: r.patient_did || r.patient_hash || '',
          patientName: r.patient_name || 'Unidentified Patient',
          dob: r.dob || '',
          requesterName: r.requester_name || r.requester_id || '',
          role: r.role || 'EMERGENCY_PHYSICIAN',
          emergencyCaseId: r.emergency_case_id || '',
          urgencyLevel: (r.urgency_level as any) || 'CRITICAL_TRAUMA',
          reason: r.reason || '',
          status: r.status || 'PENDING',
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
          decidedAt: r.decided_at || r.approved_at || undefined,
          decidedBy: r.decided_by || undefined,
          notes: r.notes || undefined,
          zkToken: r.zk_token ? (typeof r.zk_token === 'string' ? JSON.parse(r.zk_token) : r.zk_token) : undefined,
        }));
      }
    } catch (err: any) {
      console.error('[ACCESS_REQUEST] MySQL query all requests error:', err.message);
    }
  }

  const local = loadJson<EmergencyAccessRequest[]>(ACCESS_REQUESTS_FILE, []);
  return local;
}

// -------------------------------------------------------------
// AUDIT LOGS LEDGER (PART R)
// -------------------------------------------------------------

export async function appendAuditLogDb(entry: {
  timestamp: string;
  actor_id: string;
  hospital_id?: string | null;
  patient_did: string;
  case_id: string;
  action: string;
  result: string;
  prev_hash: string;
  entry_hash: string;
}): Promise<AuditLogRecord> {
  const local = loadJson<AuditLogRecord[]>(AUDIT_LOGS_FILE, []);
  const newEntry: AuditLogRecord = {
    id: local.length + 1,
    ...entry,
  };
  local.push(newEntry);
  saveJson(AUDIT_LOGS_FILE, local);

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO audit_logs (timestamp, actor_id, hospital_id, patient_did, case_id, action, result, prev_hash, entry_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          entry.timestamp,
          entry.actor_id,
          entry.hospital_id || null,
          entry.patient_did,
          entry.case_id,
          entry.action,
          entry.result,
          entry.prev_hash,
          entry.entry_hash,
        ]
      );
    } catch {}
  }
  return newEntry;
}

export async function getAuditLogsDb(): Promise<AuditLogRecord[]> {
  if (pool) {
    try {
      const [rows]: any = await pool.query('SELECT * FROM audit_logs ORDER BY id ASC');
      if (rows && rows.length > 0) return rows;
    } catch {}
  }
  return loadJson<AuditLogRecord[]>(AUDIT_LOGS_FILE, []);
}

// -------------------------------------------------------------
// CACHE RECORDS (PART S)
// -------------------------------------------------------------

export async function saveCacheRecordDb(cache: {
  patient_did: string;
  summary_json: string;
  source_timestamp: string;
}): Promise<CacheRecord> {
  const id = `cache_${cache.patient_did}`;
  const rec: CacheRecord = {
    id,
    patient_did: cache.patient_did,
    summary_json: cache.summary_json,
    source_timestamp: cache.source_timestamp,
    synced_at: new Date().toISOString(),
  };

  const local = loadJson<CacheRecord[]>(CACHE_RECORDS_FILE, []);
  const idx = local.findIndex((c) => c.patient_did === cache.patient_did);
  if (idx >= 0) local[idx] = rec;
  else local.push(rec);
  saveJson(CACHE_RECORDS_FILE, local);

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO cache_records (id, patient_did, summary_json, source_timestamp)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE summary_json = VALUES(summary_json), source_timestamp = VALUES(source_timestamp), synced_at = CURRENT_TIMESTAMP`,
        [rec.id, rec.patient_did, rec.summary_json, rec.source_timestamp]
      );
    } catch {}
  }
  return rec;
}

export async function getCacheRecordDb(patientDid: string): Promise<CacheRecord | null> {
  if (pool) {
    try {
      const [rows]: any = await pool.query('SELECT * FROM cache_records WHERE patient_did = ?', [patientDid]);
      if (rows && rows.length > 0) return rows[0];
    } catch {}
  }
  const local = loadJson<CacheRecord[]>(CACHE_RECORDS_FILE, []);
  return local.find((c) => c.patient_did === patientDid) || null;
}

export function getLocalHospitals(): HospitalRecord[] {
  return loadJson<HospitalRecord[]>(HOSPITALS_AUTH_FILE, INITIAL_HOSPITALS);
}

// Backward-compatibility aliases
export async function registerHospital(data: any): Promise<HospitalRecord> {
  const result = await registerHospitalNode({
    hospital_name: data.hospital_name,
    email: data.email,
    license_id: data.license_id || data.npi_number || 'CMS-PENDING',
    admin_name: data.officer_name || data.admin_name || 'Hospital Officer',
    password: data.password,
  });
  return {
    ...result.hospital,
    password_hash: '',
  } as HospitalRecord;
}

export async function authenticateHospital(email: string, password: string): Promise<HospitalRecord | null> {
  const result = await authenticateHospitalUser(email, password);
  if (!result) return null;
  return {
    ...result.hospital,
    password_hash: '',
  } as HospitalRecord;
}
