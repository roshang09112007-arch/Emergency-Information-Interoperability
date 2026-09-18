import fs from 'fs';
import path from 'path';
import express from 'express';
import { computeSha256, hashBiometricToDid, verifyZkRoleToken } from './cryptoUtils.js';
import { HospitalQueryRequest, HospitalQueryResponse } from './types.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const HOSPITALS_DIR = path.join(DATA_DIR, 'hospitals');
const PATIENTS_FILE = path.join(DATA_DIR, 'patients.json');
const HOSPITAL_RECORDS_FILE = path.join(DATA_DIR, 'hospital_records.json');

// Ensure directories exist on disk
try {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(HOSPITALS_DIR)) fs.mkdirSync(HOSPITALS_DIR, { recursive: true });
} catch (e) {}

// Pre-computed patient hashes
export interface DemoPatientItem {
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

export const DEMO_PATIENTS: DemoPatientItem[] = [
  {
    id: 'alex-mercer',
    name: 'Dhanu',
    dob: '1988-04-12',
    notes: 'Mass-casualty prime demo — conflicting penicillin allergy & active anticoagulant record',
    hash: hashBiometricToDid('Alex Mercer', '1988-04-12'),
    triageLevel: 'CRITICAL RESUSCITATION',
    clinicalProfile: {
      bloodType: 'O Positive (Rh+)',
      allergy: 'Penicillin G / Beta-Lactams (Severe Anaphylaxis)',
      anticoagulant: 'Warfarin Sodium 5mg Daily',
      condition: 'Chronic Nonvalvular Atrial Fibrillation',
      implant: 'St. Jude Accent Dual-Chamber Pacemaker',
      dnrStatus: 'FULL_CODE',
    },
  },
  {
    id: 'elena-rostova',
    name: 'Santhosh',
    dob: '1995-08-23',
    notes: 'Trauma profile — rare AB- blood, severe latex/sulfa allergy, DNR registered',
    hash: hashBiometricToDid('Elena Rostova', '1995-08-23'),
    triageLevel: 'EMERGENCY TRAUMA BAY 1',
    clinicalProfile: {
      bloodType: 'AB Negative (Rh-)',
      allergy: 'Latex & Sulfonamide Antibiotics (Angioedema)',
      anticoagulant: 'Enoxaparin (Lovenox) 40mg SC Daily',
      condition: 'Acute Deep Vein Thrombosis',
      implant: 'None documented',
      dnrStatus: 'DNR_DO_NOT_RESUSCITATE',
    },
  },
  {
    id: 'marcus-vance',
    name: 'Samual',
    dob: '1972-11-30',
    notes: 'Senior diabetic emergency — Eliquis blood thinner, CAD, pacemaker & titanium hip implant',
    hash: hashBiometricToDid('Marcus Vance', '1972-11-30'),
    triageLevel: 'CODE RED PRIORITY',
    clinicalProfile: {
      bloodType: 'A Positive (Rh+)',
      allergy: 'Morphine Sulfate (Severe Respiratory Depression)',
      anticoagulant: 'Eliquis (Apixaban) 5mg BID',
      condition: 'Coronary Artery Disease & Type 2 Diabetes',
      implant: 'Total Left Hip Titanium Arthroplasty',
      dnrStatus: 'FULL_CODE',
    },
  },
];

const ALEX_HASH = DEMO_PATIENTS[0].hash;
const ELENA_HASH = DEMO_PATIENTS[1].hash;
const MARCUS_HASH = DEMO_PATIENTS[2].hash;

// -------------------------------------------------------------
// Hospital A: Metro General Hospital (Port 4001) - FHIR-like JSON
// -------------------------------------------------------------
const HOSPITAL_A_RECORDS: Record<string, string> = {
  [ALEX_HASH]: JSON.stringify(
    {
      resourceType: 'Bundle',
      id: 'metro-gen-fhir-09941',
      meta: { lastUpdated: '2024-02-15T14:32:00Z', hospital: 'Metro General Hospital Trauma Center' },
      entry: [
        {
          resource: {
            resourceType: 'Patient',
            identifier: [{ system: 'urn:pulsekey:did', value: ALEX_HASH }],
            active: true,
          },
        },
        {
          resource: {
            resourceType: 'AllergyIntolerance',
            clinicalStatus: 'active',
            verificationStatus: 'confirmed',
            criticality: 'high',
            code: { text: 'Penicillin G / Beta-Lactams' },
            reaction: [
              {
                severity: 'severe',
                manifestation: [{ text: 'Anaphylactic shock with airway edema, ICU admission' }],
              },
            ],
            recordedDate: '2024-02-15',
          },
        },
        {
          resource: {
            resourceType: 'Observation',
            category: 'laboratory',
            code: { text: 'ABO and Rh Group Typing' },
            valueCodeableConcept: { text: 'O Positive (Rh+)' },
            effectiveDateTime: '2024-02-15',
            status: 'final',
          },
        },
        {
          resource: {
            resourceType: 'MedicationStatement',
            status: 'active',
            medicationCodeableConcept: {
              text: 'Warfarin Sodium 5 MG Oral Tablet (High Alert Anticoagulant)',
            },
            dosage: [{ text: '5mg once daily at bedtime' }],
            effectivePeriod: { start: '2023-09-01' },
            note: 'Target INR 2.0 - 3.0 for Atrial Fibrillation. High hemorrhage risk in trauma.',
          },
        },
        {
          resource: {
            resourceType: 'Condition',
            clinicalStatus: 'active',
            code: { text: 'Chronic Nonvalvular Atrial Fibrillation' },
            recordedDate: '2022-04-18',
          },
        },
        {
          resource: {
            resourceType: 'Device',
            type: { text: 'St. Jude Medical Accent Dual-Chamber Pacemaker' },
            status: 'active',
            manufactureDate: '2021-06-20',
            safety: ['MRI Unsafe', 'Requires cautery precaution'],
          },
        },
        {
          resource: {
            resourceType: 'Consent',
            provision: { type: 'permit', action: [{ text: 'Full Resuscitation / Code Status: Full Code' }] },
            dateTime: '2024-01-10',
          },
        },
      ],
    },
    null,
    2
  ),

  [ELENA_HASH]: JSON.stringify(
    {
      resourceType: 'Bundle',
      id: 'metro-gen-fhir-08812',
      meta: { lastUpdated: '2024-10-04T09:15:00Z', hospital: 'Metro General Hospital Trauma Center' },
      entry: [
        {
          resource: {
            resourceType: 'Patient',
            identifier: [{ system: 'urn:pulsekey:did', value: ELENA_HASH }],
          },
        },
        {
          resource: {
            resourceType: 'AllergyIntolerance',
            clinicalStatus: 'active',
            verificationStatus: 'confirmed',
            code: { text: 'Latex & Sulfonamide Antibiotics' },
            reaction: [{ severity: 'severe', manifestation: [{ text: 'Urticaria and Angioedema' }] }],
            recordedDate: '2024-10-04',
          },
        },
        {
          resource: {
            resourceType: 'Observation',
            code: { text: 'Blood Group' },
            valueCodeableConcept: { text: 'AB Negative (Rh-)' },
            effectiveDateTime: '2024-10-04',
          },
        },
        {
          resource: {
            resourceType: 'MedicationStatement',
            status: 'active',
            medicationCodeableConcept: { text: 'Enoxaparin (Lovenox) 40mg Subcutaneous daily' },
            effectivePeriod: { start: '2024-09-15' },
          },
        },
        {
          resource: {
            resourceType: 'Consent',
            provision: { type: 'deny', action: [{ text: 'DO NOT RESUSCITATE (DNR order registered)' }] },
            dateTime: '2024-10-04',
          },
        },
      ],
    },
    null,
    2
  ),
};

// -------------------------------------------------------------
// Hospital B: St. Jude Regional Center (Port 4002) - Pipe-delimited CSV
// -------------------------------------------------------------
const HOSPITAL_B_RECORDS: Record<string, string> = {
  [ALEX_HASH]: [
    'RECORD_TYPE|ID_HASH|DATA_KEY|VALUE|REC_DATE|STATUS|NOTES',
    `PATIENT|${ALEX_HASH}|IDENTITY|PROTECTED_DID|2022-11-05|ACTIVE|Trauma Unit Admission`,
    `BLOOD|${ALEX_HASH}|TYPE|O+|2022-11-05|CONFIRMED|Lab verification complete`,
    `ALLERGIES|${ALEX_HASH}|ALLERGENS|NKDA (No Known Drug Allergies Reported)|2022-11-05|SELF_REPORTED|Patient intake stated no known allergies`,
    `MEDS|${ALEX_HASH}|RX|Aspirin 81mg PO Daily|2022-11-05|ACTIVE|Antiplatelet therapy`,
    `CONDITIONS|${ALEX_HASH}|DX|Primary Essential Hypertension|2022-11-05|CHRONIC|Stage 1 controlled`,
    `IMPLANTS|${ALEX_HASH}|DEVICE|Cardiac telemetry marker noted (details unconfirmed)|2022-11-05|DETECTED|Chest X-ray visible device`,
    `ADV_DIRECTIVE|${ALEX_HASH}|DNR_STATUS|NOT_ON_FILE|2022-11-05|UNKNOWN|Default standard code resuscitation`,
  ].join('\n'),

  [ELENA_HASH]: [
    'RECORD_TYPE|ID_HASH|DATA_KEY|VALUE|REC_DATE|STATUS|NOTES',
    `PATIENT|${ELENA_HASH}|IDENTITY|PROTECTED_DID|2024-08-11|ACTIVE|Inpatient`,
    `BLOOD|${ELENA_HASH}|TYPE|AB-|2024-08-11|VERIFIED|AB Negative confirmed`,
    `ALLERGIES|${ELENA_HASH}|ALLERGENS|Latex severe anaphylaxis; Sulfa drugs rash|2024-08-11|CONFIRMED|Use non-latex gloves`,
    `MEDS|${ELENA_HASH}|RX|Lovenox (Enoxaparin) 40mg SC daily|2024-08-11|ACTIVE|Anticoagulation for DVT prevention`,
    `CONDITIONS|${ELENA_HASH}|DX|Deep Vein Thrombosis left leg|2024-08-11|ACTIVE|Acute`,
    `ADV_DIRECTIVE|${ELENA_HASH}|DNR_STATUS|DNR ORDER SIGNED|2024-08-11|ACTIVE|Do not attempt resuscitation`,
  ].join('\n'),

  [MARCUS_HASH]: [
    'RECORD_TYPE|ID_HASH|DATA_KEY|VALUE|REC_DATE|STATUS|NOTES',
    `PATIENT|${MARCUS_HASH}|IDENTITY|PROTECTED_DID|2023-05-19|ACTIVE|ED Admission`,
    `BLOOD|${MARCUS_HASH}|TYPE|A+|2023-05-19|CONFIRMED|A Positive`,
    `ALLERGIES|${MARCUS_HASH}|ALLERGENS|Morphine sulfate (severe respiratory depression)|2023-05-19|CONFIRMED|Avoid opioid agonist`,
    `MEDS|${MARCUS_HASH}|RX|Metformin 1000mg BID; Apixaban (Eliquis) 5mg BID|2023-05-19|ACTIVE|Oral anticoagulant active`,
    `CONDITIONS|${MARCUS_HASH}|DX|Type 2 Diabetes Mellitus; Coronary Artery Disease|2023-05-19|CHRONIC|DKA risk`,
    `IMPLANTS|${MARCUS_HASH}|DEVICE|Left Total Hip Replacement (Titanium prosthesis)|2020-03-12|VERIFIED|Surgical implant`,
    `ADV_DIRECTIVE|${MARCUS_HASH}|DNR_STATUS|FULL CODE|2023-05-19|CONFIRMED|Full resuscitation`,
  ].join('\n'),
};

// -------------------------------------------------------------
// Hospital C: Pacific Valley Health (Port 4003) - Custom XML
// -------------------------------------------------------------
const HOSPITAL_C_RECORDS: Record<string, string> = {
  [ALEX_HASH]: `<?xml version="1.0" encoding="UTF-8"?>
<EHRArchive xmlns="http://pacificvalleyhealth.org/ehr/v3" version="3.2">
  <Header>
    <FacilityName>Pacific Valley Health System</FacilityName>
    <SubjectDID>${ALEX_HASH}</SubjectDID>
    <ExtractionDate>2019-11-03T18:00:00Z</ExtractionDate>
    <ArchiveStatus>HISTORICAL_RECORD</ArchiveStatus>
  </Header>
  <TraumaProfile>
    <BloodTyping verification="lab-matched">
      <Group>O</Group>
      <Rh>Positive</Rh>
      <AssayedYear>2019</AssayedYear>
    </BloodTyping>
    <ImmunologyAllergies>
      <AllergyEntry status="unconfirmed_historical" risk="moderate">
        <Agent>Penicillin</Agent>
        <ReactionType>Mild cutaneous rash during pediatric treatment (childhood history)</ReactionType>
        <LastReview>2019-11-03</LastReview>
        <ClinicalAssessment>Historical mention only; no formal skin test or acute confirmation on record.</ClinicalAssessment>
      </AllergyEntry>
    </ImmunologyAllergies>
    <CurrentPharmacotherapy>
      <ActiveItem category="cardiovascular">
        <DrugName>Metoprolol Tartrate 25mg</DrugName>
        <Indication>Rate control</Indication>
      </ActiveItem>
      <AnticoagulantFlag value="false" notes="Patient was not taking blood thinners during 2019 stay."/>
    </CurrentPharmacotherapy>
    <Diagnoses>
      <Diagnosis code="I48.91" status="active">Cardiac Dysrhythmia / Paroxysmal Tachycardia</Diagnosis>
    </Diagnoses>
    <ProstheticsAndImplants>
      <ImplantEntry type="electronic">Implantable Pulse Generator / Pacemaker (Right Pectoral)</ImplantEntry>
    </ProstheticsAndImplants>
    <DirectiveStatus code="DNR_NEGATIVE">
      <ResuscitationCode>Full Code (Resuscitate without restriction)</ResuscitationCode>
    </DirectiveStatus>
  </TraumaProfile>
</EHRArchive>`,

  [MARCUS_HASH]: `<?xml version="1.0" encoding="UTF-8"?>
<EHRArchive xmlns="http://pacificvalleyhealth.org/ehr/v3" version="3.2">
  <Header>
    <FacilityName>Pacific Valley Health System</FacilityName>
    <SubjectDID>${MARCUS_HASH}</SubjectDID>
    <ExtractionDate>2023-01-20T11:22:00Z</ExtractionDate>
  </Header>
  <TraumaProfile>
    <BloodTyping verification="lab-matched">
      <Group>A</Group>
      <Rh>Positive</Rh>
      <AssayedYear>2023</AssayedYear>
    </BloodTyping>
    <ImmunologyAllergies>
      <AllergyEntry status="confirmed" risk="high">
        <Agent>Morphine / Opiates</Agent>
        <ReactionType>Severe hypoventilation, respiratory depression</ReactionType>
      </AllergyEntry>
    </ImmunologyAllergies>
    <CurrentPharmacotherapy>
      <ActiveItem category="anticoagulant">
        <DrugName>Eliquis (Apixaban) 5mg</DrugName>
        <Indication>Stroke prophylaxis in CAD</Indication>
      </ActiveItem>
      <ActiveItem category="endocrine">
        <DrugName>Metformin 1000mg</DrugName>
      </ActiveItem>
    </CurrentPharmacotherapy>
    <Diagnoses>
      <Diagnosis code="E11.9" status="active">Type 2 Diabetes Mellitus with hyperglycemia tendency</Diagnosis>
      <Diagnosis code="I25.1" status="active">Atherosclerotic Heart Disease</Diagnosis>
    </Diagnoses>
    <ProstheticsAndImplants>
      <ImplantEntry type="orthopedic">Total Left Hip Arthroplasty (Titanium alloy)</ImplantEntry>
    </ProstheticsAndImplants>
    <DirectiveStatus code="FULL_CODE">
      <ResuscitationCode>Full Code (Resuscitate)</ResuscitationCode>
    </DirectiveStatus>
  </TraumaProfile>
</EHRArchive>`,
};

export interface HospitalNodeConfig {
  id: string;
  name: string;
  port: number;
  format: 'FHIR_JSON' | 'PIPE_CSV' | 'CUSTOM_XML';
  records: Record<string, string>;
}

export const HOSPITAL_CONFIGS: HospitalNodeConfig[] = [
  {
    id: 'hospital-a',
    name: 'Metro General Hospital Trauma Network',
    port: 4001,
    format: 'FHIR_JSON',
    records: HOSPITAL_A_RECORDS,
  },
  {
    id: 'hospital-b',
    name: 'St. Jude Regional Medical Center',
    port: 4002,
    format: 'PIPE_CSV',
    records: HOSPITAL_B_RECORDS,
  },
  {
    id: 'hospital-c',
    name: 'Pacific Valley Health System',
    port: 4003,
    format: 'CUSTOM_XML',
    records: HOSPITAL_C_RECORDS,
  },
];

export interface CustomPatientInput {
  name: string;
  dob: string;
  notes?: string;
  triageLevel?: string;
  bloodType?: string;
  allergy?: string;
  anticoagulant?: string;
  condition?: string;
  implant?: string;
  dnrStatus?: 'FULL_CODE' | 'DNR_DO_NOT_RESUSCITATE' | 'UNKNOWN';
}

export function registerCustomPatient(input: CustomPatientInput): DemoPatientItem {
  const hash = hashBiometricToDid(input.name, input.dob);
  const bloodType = input.bloodType || 'O Positive (Rh+)';
  const allergy = input.allergy || 'Penicillin G (Severe Anaphylaxis)';
  const anticoagulant = input.anticoagulant || 'Warfarin Sodium 5mg Oral Daily';
  const condition = input.condition || 'Severe Hemorrhagic Trauma & Atrial Fibrillation';
  const implant = input.implant || 'Dual-Chamber Cardiac Pacemaker';
  const dnr = input.dnrStatus || 'FULL_CODE';
  const triage = input.triageLevel || 'CODE RED PRIORITY';
  const notes = input.notes || `Manual field intake · ${bloodType} · Alert: ${allergy}`;

  const patientObj: DemoPatientItem = {
    id: `custom-${Date.now()}`,
    name: input.name,
    dob: input.dob,
    notes,
    hash,
    triageLevel: triage,
    clinicalProfile: {
      bloodType,
      allergy,
      anticoagulant,
      condition,
      implant,
      dnrStatus: dnr,
    },
  };

  const existingIdx = DEMO_PATIENTS.findIndex(
    (p) => p.hash === hash || p.name.toLowerCase() === input.name.toLowerCase()
  );
  if (existingIdx >= 0) {
    DEMO_PATIENTS[existingIdx] = patientObj;
  } else {
    DEMO_PATIENTS.unshift(patientObj);
  }

  // Hospital A: Metro General (FHIR JSON)
  HOSPITAL_A_RECORDS[hash] = JSON.stringify(
    {
      resourceType: 'Bundle',
      id: `metro-gen-fhir-${Math.floor(10000 + Math.random() * 89999)}`,
      meta: { lastUpdated: new Date().toISOString(), hospital: 'Metro General Hospital Trauma Center' },
      entry: [
        {
          resource: {
            resourceType: 'Patient',
            identifier: [{ system: 'urn:pulsekey:did', value: hash }],
            active: true,
          },
        },
        {
          resource: {
            resourceType: 'Observation',
            category: 'laboratory',
            code: { text: 'ABO and Rh Group Typing' },
            valueCodeableConcept: { text: bloodType },
            status: 'final',
            effectiveDateTime: new Date().toISOString().slice(0, 10),
          },
        },
        {
          resource: {
            resourceType: 'AllergyIntolerance',
            clinicalStatus: 'active',
            verificationStatus: 'confirmed',
            criticality: 'high',
            code: { text: allergy },
            reaction: [{ severity: 'severe', manifestation: [{ text: 'Severe acute anaphylaxis, bronchospasm' }] }],
          },
        },
        {
          resource: {
            resourceType: 'MedicationStatement',
            status: 'active',
            medicationCodeableConcept: { text: anticoagulant },
            dosage: [{ text: 'Active therapeutic dose' }],
            note: 'High alert anticoagulant. Hemorrhage precaution in major trauma.',
          },
        },
        {
          resource: {
            resourceType: 'Condition',
            clinicalStatus: 'active',
            code: { text: condition },
          },
        },
        {
          resource: {
            resourceType: 'Device',
            type: { text: implant },
            status: 'active',
          },
        },
        {
          resource: {
            resourceType: 'Consent',
            provision: {
              type: dnr === 'DNR_DO_NOT_RESUSCITATE' ? 'deny' : 'permit',
              action: [{ text: dnr === 'DNR_DO_NOT_RESUSCITATE' ? 'DO NOT RESUSCITATE (DNR)' : 'Full Resuscitation (Full Code)' }],
            },
          },
        },
      ],
    },
    null,
    2
  );

  // Hospital B: St. Jude Regional (Pipe-delimited CSV)
  const today = new Date().toISOString().slice(0, 10);
  HOSPITAL_B_RECORDS[hash] = [
    'RECORD_TYPE|ID_HASH|DATA_KEY|VALUE|REC_DATE|STATUS|NOTES',
    `PATIENT|${hash}|IDENTITY|PROTECTED_DID|${today}|ACTIVE|Regional Emergency Trauma Intake`,
    `BLOOD|${hash}|TYPE|${bloodType.replace(' (Rh+)', '+').replace(' (Rh-)', '-')}|${today}|CONFIRMED|Lab certified`,
    `ALLERGIES|${hash}|ALLERGENS|${allergy}|${today}|CONFIRMED|Acute reaction history verified`,
    `MEDS|${hash}|RX|${anticoagulant}|${today}|ACTIVE|Active prescribed anticoagulant`,
    `CONDITIONS|${hash}|DX|${condition}|${today}|ACTIVE|Emergency chart documented`,
    `IMPLANTS|${hash}|DEVICE|${implant}|${today}|CONFIRMED|Verified surgical history`,
    `ADV_DIRECTIVE|${hash}|DNR_STATUS|${dnr === 'DNR_DO_NOT_RESUSCITATE' ? 'DNR ORDER SIGNED' : 'FULL CODE'}|${today}|ACTIVE|Verified order`,
  ].join('\n');

  // Hospital C: Pacific Valley (Custom XML)
  HOSPITAL_C_RECORDS[hash] = `<?xml version="1.0" encoding="UTF-8"?>
<EHRArchive xmlns="http://pacificvalleyhealth.org/ehr/v3" version="3.2">
  <Header>
    <FacilityName>Pacific Valley Health System</FacilityName>
    <SubjectDID>${hash}</SubjectDID>
    <ExtractionDate>${new Date().toISOString()}</ExtractionDate>
    <ArchiveStatus>EMERGENCY_RECORDS</ArchiveStatus>
  </Header>
  <TraumaProfile>
    <BloodTyping verification="lab-matched">
      <Group>${bloodType.split(' ')[0]}</Group>
      <Rh>${bloodType.includes('-') ? 'Negative' : 'Positive'}</Rh>
      <AssayedYear>${new Date().getFullYear()}</AssayedYear>
    </BloodTyping>
    <ImmunologyAllergies>
      <AllergyEntry status="confirmed" risk="high">
        <Agent>${allergy}</Agent>
        <ReactionType>Severe systemic sensitivity</ReactionType>
      </AllergyEntry>
    </ImmunologyAllergies>
    <CurrentPharmacotherapy>
      <ActiveItem category="anticoagulant">
        <DrugName>${anticoagulant}</DrugName>
        <Indication>Trauma caution: anticoagulant monitoring required</Indication>
      </ActiveItem>
    </CurrentPharmacotherapy>
    <Diagnoses>
      <Diagnosis code="TRAUMA.99" status="active">${condition}</Diagnosis>
    </Diagnoses>
    <ProstheticsAndImplants>
      <ImplantEntry type="medical_device">${implant}</ImplantEntry>
    </ProstheticsAndImplants>
    <DirectiveStatus code="${dnr === 'DNR_DO_NOT_RESUSCITATE' ? 'DNR_AFFIRMATIVE' : 'FULL_CODE'}">
      <ResuscitationCode>${dnr === 'DNR_DO_NOT_RESUSCITATE' ? 'DO NOT RESUSCITATE (DNR)' : 'Full Code'}</ResuscitationCode>
    </DirectiveStatus>
  </TraumaProfile>
</EHRArchive>`;

  syncHospitalStateToDisk();

  return patientObj;
}

export function syncHospitalStateToDisk(): void {
  try {
    fs.writeFileSync(PATIENTS_FILE, JSON.stringify(DEMO_PATIENTS, null, 2), 'utf-8');
    fs.writeFileSync(
      path.join(HOSPITALS_DIR, 'metro_general_fhir.json'),
      JSON.stringify(HOSPITAL_A_RECORDS, null, 2),
      'utf-8'
    );
    fs.writeFileSync(
      path.join(HOSPITALS_DIR, 'st_jude_records.json'),
      JSON.stringify(HOSPITAL_B_RECORDS, null, 2),
      'utf-8'
    );
    fs.writeFileSync(
      path.join(HOSPITALS_DIR, 'pacific_valley_xml.json'),
      JSON.stringify(HOSPITAL_C_RECORDS, null, 2),
      'utf-8'
    );

    const manifest = {
      timestamp: new Date().toISOString(),
      patientCount: DEMO_PATIENTS.length,
      metroGenRecords: Object.keys(HOSPITAL_A_RECORDS).length,
      stJudeRecords: Object.keys(HOSPITAL_B_RECORDS).length,
      pacificValleyRecords: Object.keys(HOSPITAL_C_RECORDS).length,
      storageEngine: 'REAL_LOCAL_DISK_FILESYSTEM',
    };
    fs.writeFileSync(
      path.join(DATA_DIR, 'database_manifest.json'),
      JSON.stringify(manifest, null, 2),
      'utf-8'
    );
  } catch (e) {
    console.warn('Sync to disk warning:', e);
  }
}

// Initialize and load saved state from disk on boot
export function loadDiskState(): void {
  try {
    if (fs.existsSync(PATIENTS_FILE)) {
      const savedPatients = JSON.parse(fs.readFileSync(PATIENTS_FILE, 'utf-8'));
      if (Array.isArray(savedPatients)) {
        savedPatients.forEach((sp: DemoPatientItem) => {
          const idx = DEMO_PATIENTS.findIndex((p) => p.hash === sp.hash);
          if (idx >= 0) {
            DEMO_PATIENTS[idx] = sp;
          } else {
            DEMO_PATIENTS.push(sp);
          }
        });
      }
    }

    const metroFile = path.join(HOSPITALS_DIR, 'metro_general_fhir.json');
    if (fs.existsSync(metroFile)) {
      const records = JSON.parse(fs.readFileSync(metroFile, 'utf-8'));
      Object.assign(HOSPITAL_A_RECORDS, records);
    }

    const stJudeFile = path.join(HOSPITALS_DIR, 'st_jude_records.json');
    if (fs.existsSync(stJudeFile)) {
      const records = JSON.parse(fs.readFileSync(stJudeFile, 'utf-8'));
      Object.assign(HOSPITAL_B_RECORDS, records);
    }

    const pacificFile = path.join(HOSPITALS_DIR, 'pacific_valley_xml.json');
    if (fs.existsSync(pacificFile)) {
      const records = JSON.parse(fs.readFileSync(pacificFile, 'utf-8'));
      Object.assign(HOSPITAL_C_RECORDS, records);
    }
  } catch (e) {
    console.warn('Load disk state notice:', e);
  }

  // Ensure disk has current snapshot
  syncHospitalStateToDisk();
}

loadDiskState();

export interface DiskFileInfo {
  fileName: string;
  relativePath: string;
  sizeBytes: number;
  lastModified: string;
  sha256: string;
  lineCount?: number;
  previewSnippet: string;
}

export function getDiskDatabaseStats(): {
  storageEngine: string;
  totalSizeBytes: number;
  directoryPath: string;
  files: DiskFileInfo[];
} {
  const files: DiskFileInfo[] = [];
  let totalSizeBytes = 0;

  const checkFiles = [
    { name: 'patients.json', rel: 'data/patients.json' },
    { name: 'access_requests.json', rel: 'data/access_requests.json' },
    { name: 'audit_log.jsonl', rel: 'data/audit_log.jsonl' },
    { name: 'offline_cache.json', rel: 'data/offline_cache.json' },
    { name: 'database_manifest.json', rel: 'data/database_manifest.json' },
    { name: 'metro_general_fhir.json', rel: 'data/hospitals/metro_general_fhir.json' },
    { name: 'st_jude_records.json', rel: 'data/hospitals/st_jude_records.json' },
    { name: 'pacific_valley_xml.json', rel: 'data/hospitals/pacific_valley_xml.json' },
  ];

  for (const item of checkFiles) {
    const fullPath = path.join(process.cwd(), item.rel);
    try {
      if (fs.existsSync(fullPath)) {
        const stat = fs.statSync(fullPath);
        const content = fs.readFileSync(fullPath, 'utf-8');
        const hash = computeSha256(content);
        const lines = content.split('\n').length;
        totalSizeBytes += stat.size;

        files.push({
          fileName: item.name,
          relativePath: item.rel,
          sizeBytes: stat.size,
          lastModified: stat.mtime.toISOString(),
          sha256: hash,
          lineCount: lines,
          previewSnippet: content.slice(0, 300),
        });
      }
    } catch (e) {}
  }

  return {
    storageEngine: 'REAL_NODE_DISK_FS (Local Persistent Data Ledger)',
    totalSizeBytes,
    directoryPath: DATA_DIR,
    files,
  };
}

export function ensurePatientRecordsExist(hash: string): void {
  if (!HOSPITAL_A_RECORDS[hash]) {
    registerCustomPatient({
      name: 'Unidentified Emergency Trauma Patient',
      dob: '1990-01-01',
      notes: 'Dynamically synthesized multi-hospital record for biometric DID',
      bloodType: 'O Positive (Rh+)',
      allergy: 'Penicillin (Severe Anaphylaxis confirmed in 2024)',
      anticoagulant: 'Apixaban (Eliquis) 5mg BID',
      condition: 'Multiple Trauma & Suspected Hemorrhage',
      implant: 'Titanium Orthopedic Plate',
      dnrStatus: 'FULL_CODE',
    });
  }
}

/**
 * Executes a query against a hospital node.
 * Validates ZK role-proof before returning patient record data.
 */
export function queryHospitalDirect(
  config: HospitalNodeConfig,
  reqBody: HospitalQueryRequest
): HospitalQueryResponse {
  const startTime = Date.now();

  // Validate ZK role proof
  const verification = verifyZkRoleToken(reqBody.requester_token);
  if (!verification.valid) {
    return {
      hospitalId: config.id,
      hospitalName: config.name,
      port: config.port,
      format: config.format,
      match: false,
      latencyMs: Date.now() - startTime,
      error: `Access Denied: ${verification.reason || 'Invalid ZK role proof'}`,
    };
  }

  // Ensure record exists or auto-synthesize
  ensurePatientRecordsExist(reqBody.patient_hash);

  const rawRecord = config.records[reqBody.patient_hash];
  const match = !!rawRecord;

  return {
    hospitalId: config.id,
    hospitalName: config.name,
    port: config.port,
    format: config.format,
    match,
    raw_record: match ? rawRecord : undefined,
    latencyMs: Date.now() - startTime,
  };
}

/**
 * Starts real Express HTTP microservices for the 3 mock hospitals on ports 4001, 4002, 4003.
 * Catches port collision gracefully to prevent crash.
 */
export function startHospitalNodes(): void {
  for (const config of HOSPITAL_CONFIGS) {
    const app = express();
    app.use(express.json());

    // SIMULATES hospital node query endpoint
    app.post('/query', (req, res) => {
      const result = queryHospitalDirect(config, req.body as HospitalQueryRequest);
      if (result.error) {
        return res.status(403).json(result);
      }
      res.json(result);
    });

    app.get('/health', (_req, res) => {
      res.json({
        hospitalId: config.id,
        name: config.name,
        port: config.port,
        format: config.format,
        status: 'ONLINE',
        recordCount: Object.keys(config.records).length,
      });
    });

    try {
      const server = app.listen(config.port, '0.0.0.0', () => {
        console.log(`[PulseKey Node] ${config.name} listening on port ${config.port} (${config.format})`);
      });
      server.on('error', (err: any) => {
        console.log(
          `[PulseKey Node] Port ${config.port} notice (${err.code}). In-memory broker routing is active.`
        );
      });
    } catch (err) {
      console.log(`[PulseKey Node] Port ${config.port} binding note:`, err);
    }
  }
}
