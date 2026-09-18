# PulseKey: Consent-less Emergency Records via Zero-Knowledge Federated Query

> **Problem Statement 04 — Emergency Information Interoperability**  
> *"Every other team will show you data retrieval. We show you data you can trust — even when hospitals disagree, connectivity fails, and there is no time to ask permission."*

---

## Dual-Webpage Demo Architecture

For judging and live presentations, PulseKey supports two distinct roles across separate webpages or tabs:

1. **Webpage 1 — Field Requester (`/?view=requester`):**
   - **Role:** EMT / Paramedic / Emergency Trauma Physician
   - **Action:** Scans an unconscious patient's biometric template to derive a Zero-PII SHA-256 DID, attests a 4-hour ZK role credential (`EMS-TRAUMA-9912`), and **submits an emergency data access request**.
   - **State:** Enters real-time clearance tracking. Once the hospital grants access, it automatically queries the 3 hospital nodes, resolves conflicts via AI, and displays the **Golden Summary**.

2. **Webpage 2 — Hospital Access Authority (`/?view=approver`):**
   - **Role:** Regional Hospital Triage & Data Protection Officer
   - **Action:** Monitors the real-time inbound emergency queue. Inspects the ZK role proof, verifies the trauma indication and minimum-necessary scope, and clicks **"Grant Emergency Access"** (or toggles auto-approval).

3. **Bonus — Split View Mode (`/?view=split`):**
   - Presents both the Requester Terminal and Hospital Gate side-by-side in one window for single-monitor judging.

---

## Quick Start (Single Command)

All services (Query Broker, 3 Hospital Nodes, AI Reconciliation Engine, and Web Application) run on:

```bash
npm run dev
```

- **EMT Requester Webpage**: `http://localhost:3000/?view=requester`
- **Hospital Access Gate Webpage**: `http://localhost:3000/?view=approver`
- **Side-by-Side Split View**: `http://localhost:3000/?view=split`
- **Hospital A (Metro General · FHIR JSON)**: `http://localhost:4001`
- **Hospital B (St. Jude Regional · Pipe CSV)**: `http://localhost:4002`
- **Hospital C (Pacific Valley · Custom XML)**: `http://localhost:4003`

---

## 60-Second Live Demo Script for Judges

1. **Step 1: Open Both Webpages**
   - Open Tab 1: `http://localhost:3000/?view=requester` (EMT Terminal).
   - Open Tab 2: `http://localhost:3000/?view=approver` (Hospital Gate), or click **"Open Gate in Tab"** in the top navigation bar.
2. **Step 2: Ask for Data (EMT Requester)**
   - In Tab 1, select **Alex Mercer** (unconscious mass-casualty victim).
   - Click **"Submit Emergency Data Request"**.
   - Notice that Tab 1 enters `AWAITING CLEARANCE` mode with a live timer. The patient's real name never leaves the tablet — only the hashed DID is broadcast.
3. **Step 3: Give Access (Hospital Gate)**
   - Switch to Tab 2. An emergency alert badge appears in real time: `1 Pending Emergency Access Request`.
   - The security officer reviews the verified ZK credential and clicks **"Grant Emergency Access"**.
4. **Step 4: Real-Time Golden Summary & AI Reconciliation**
   - Switch back to Tab 1 (or observe via Split View).
   - The EMT terminal instantly updates to `ACCESS GRANTED`, retrieves records from Metro General, St. Jude, and Pacific Valley, and renders the **PulseKey Golden Emergency Summary**:
     - Resolves the Penicillin anaphylaxis vs. NKDA contradiction.
     - Flags Warfarin anticoagulation with High Confidence.
5. **Step 5: Mid-Demo Network Outage Fallback**
   - Click **"Network Online (Toggle Outage)"** in the header.
   - The tablet instantly switches to **OFFLINE DISASTER MODE**.
   - Queries pull seamlessly from the local cryptographic cache without failing.
6. **Step 6: Cryptographic Audit Ledger**
   - Switch to the **Hash-Chained Audit Log** tab. Show judges the immutable SHA-256 mini-chain verifying every emergency break-glass transaction.

---

## Architecture & Intentional Prototype Boundaries

| Layer | PulseKey Implementation | Production Equivalent |
|---|---|---|
| **Layer 1: Biometric-to-DID** | `hashBiometricToDid(name, dob)` producing SHA-256 DID. | Cancelable biometric template hashes from point-of-care fingerprint/iris sensors. |
| **Layer 2: Hospital Access Gate** | Real-time REST endpoints + `BroadcastChannel` inter-window sync. | Regional Health Information Exchange (HIE) break-glass authorization gateway. |
| **Layer 3: ZK Role Proof** | Cryptographic proof commitment and public signal verification. | Groth16 / Semaphore SNARK circuit proving active trauma surgeon registry membership. |
| **Layer 4: AI Conflict Engine** | Gemini 2.5 Flash (`@google/genai`) dual-stage extraction and clinical reconciliation. | Multi-model consensus pipeline with localized clinical LLMs running on field edge compute nodes. |
| **Layer 5: Disaster Mode** | Local disk/memory cache store + browser peer mesh sync. | Tactical LoRa (915 MHz) / Bluetooth 5.2 mesh radio transceivers integrated into ruggedized EMS tablets. |
