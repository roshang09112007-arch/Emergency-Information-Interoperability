import fs from 'fs';
import path from 'path';
import { GoldenSummary, ExtractedHospitalRecord } from './types.js';

export interface CachedPatientData {
  patientHash: string;
  cachedAt: string;
  goldenSummary: GoldenSummary;
  extractedRecords: ExtractedHospitalRecord[];
}

const CACHE_DIR = path.join(process.cwd(), 'data');
const CACHE_FILE = path.join(CACHE_DIR, 'offline_cache.json');

let memoryCache: Record<string, CachedPatientData> = {};
let networkOutageSimulated = false;

// Ensure data dir exists
if (!fs.existsSync(CACHE_DIR)) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  } catch (e) {
    console.warn('Could not create data dir on disk, memory cache will be used.');
  }
}

// Load cache from disk if available
try {
  if (fs.existsSync(CACHE_FILE)) {
    const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
    memoryCache = JSON.parse(raw);
  }
} catch (e) {
  console.warn('Cache file initialize notice:', e);
}

export function setNetworkOutage(simulated: boolean): boolean {
  networkOutageSimulated = simulated;
  return networkOutageSimulated;
}

export function isNetworkOutage(): boolean {
  return networkOutageSimulated;
}

export function saveToCache(
  patientHash: string,
  goldenSummary: GoldenSummary,
  extractedRecords: ExtractedHospitalRecord[]
): void {
  const record: CachedPatientData = {
    patientHash,
    cachedAt: new Date().toISOString(),
    goldenSummary: {
      ...goldenSummary,
      mode: 'ONLINE_FEDERATED',
    },
    extractedRecords,
  };

  memoryCache[patientHash] = record;

  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(memoryCache, null, 2), 'utf-8');
  } catch (e) {
    // Memory cache persists during runtime
  }
}

export function getFromCache(patientHash: string): CachedPatientData | null {
  return memoryCache[patientHash] || null;
}

export function getAllCachedHashes(): string[] {
  return Object.keys(memoryCache);
}
