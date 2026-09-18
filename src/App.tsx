import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ExternalLink,
  Flame,
  Globe,
  HardDrive,
  Layers,
  LayoutDashboard,
  LogOut,
  Plus,
  Radio,
  Send,
  ShieldAlert,
  ShieldCheck,
  User,
  Users,
  Zap,
} from 'lucide-react';
import { AuditLogViewer } from './components/AuditLogViewer.js';
import { BiometricScanner } from './components/BiometricScanner.js';
import { DatabaseInspector } from './components/DatabaseInspector.js';
import { EmergencyRequestPanel } from './components/EmergencyRequestPanel.js';
import { GoldenSummaryCard } from './components/GoldenSummaryCard.js';
import { HospitalAccessGate } from './components/HospitalAccessGate.js';
import { HospitalRawViewer } from './components/HospitalRawViewer.js';
import { HospitalAuthModal } from './components/HospitalAuthModal.js';
import { LandingPage } from './components/LandingPage.js';
import { LoginPage } from './components/LoginPage.js';
import { RegisterPage } from './components/RegisterPage.js';
import { Sidebar, PortalTab } from './components/Sidebar.js';
import { TopBar } from './components/TopBar.js';
import { OverviewDashboard } from './components/OverviewDashboard.js';
import { SendEmergencyRequest } from './components/SendEmergencyRequest.js';
import { PatientIdentification } from './components/PatientIdentification.js';
import { MeshSyncPanel } from './components/MeshSyncPanel.js';
import { ZkProofInspector } from './components/ZkProofInspector.js';
import { soundFx } from './utils/audioFeedback.js';
import {
  AuditLogEntry,
  BrokerQueryResult,
  DemoPatient,
  EmergencyAccessRequest,
  ExtractedHospitalRecord,
  GoldenSummary,
  HospitalQueryResponse,
  HospitalUser,
  MySqlDiagnostics,
  ZkRoleToken,
} from './types.js';

export type AppPage = 'landing' | 'login' | 'signup' | 'portal';

export default function App() {
  // Navigation: 'landing' | 'login' | 'signup' | 'portal'
  const [currentPage, setCurrentPage] = useState<AppPage>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const p = params.get('page');
      if (p === 'landing' || p === 'login' || p === 'signup' || p === 'portal') {
        return p as AppPage;
      }
      // If user came with ?view= (legacy paramedic/approver links), route to portal
      if (params.get('view')) return 'portal';
    }
    return 'landing';
  });

  // Portal Tab: 'overview' | 'emergency-requests' | 'patients' | 'audit-log' | 'hospital-network' | 'settings'
  const [portalTab, setPortalTab] = useState<PortalTab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (
        tab === 'overview' ||
        tab === 'send-request' ||
        tab === 'emergency-requests' ||
        tab === 'patients' ||
        tab === 'audit-log' ||
        tab === 'hospital-network' ||
        tab === 'settings'
      ) {
        return tab as PortalTab;
      }
      if (params.get('view') === 'approver') return 'emergency-requests';
      if (params.get('view') === 'requester') return 'send-request';
    }
    return 'overview';
  });

  const [patients, setPatients] = useState<DemoPatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<DemoPatient | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('Initializing federated query...');
  const [currentSummary, setCurrentSummary] = useState<GoldenSummary | null>(null);
  const [hospitalResponses, setHospitalResponses] = useState<HospitalQueryResponse[]>([]);
  const [extractedRecords, setExtractedRecords] = useState<ExtractedHospitalRecord[]>([]);
  const [currentZkToken, setCurrentZkToken] = useState<ZkRoleToken | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditVerification, setAuditVerification] = useState({ isValid: true, totalBlocks: 1 });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Hospital Institutional Authentication & MySQL State
  const [currentHospitalUser, setCurrentHospitalUser] = useState<HospitalUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [mySqlStatus, setMySqlStatus] = useState<MySqlDiagnostics | null>(null);

  // Access Request & Hospital Gate State
  const [accessRequests, setAccessRequests] = useState<EmergencyAccessRequest[]>([]);
  const [activeRequest, setActiveRequest] = useState<EmergencyAccessRequest | null>(null);
  const [autoApprovePolicy, setAutoApprovePolicy] = useState<boolean>(false);
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);

  // BroadcastChannel for instant inter-tab/inter-window synchronization
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Sync URL when page changes
  const updatePage = (page: AppPage) => {
    setCurrentPage(page);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('page', page);
      window.history.pushState({}, '', url.toString());
    }
  };

  // Sync URL when portal tab changes
  const updatePortalTab = (tab: PortalTab) => {
    setPortalTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.pushState({}, '', url.toString());
    }
  };

  // Listen for browser forward/backward
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const p = params.get('page');
      if (p === 'landing' || p === 'login' || p === 'signup' || p === 'portal') {
        setCurrentPage(p as AppPage);
      }
      const tab = params.get('tab');
      if (tab && ['overview', 'send-request', 'emergency-requests', 'patients', 'audit-log', 'hospital-network', 'settings'].includes(tab)) {
        setPortalTab(tab as PortalTab);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Initialize BroadcastChannel and Polling for Access Requests
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('pulsekey_sync_channel');
      broadcastChannelRef.current = channel;

      channel.onmessage = (event) => {
        const msg = event.data;
        if (msg.type === 'REQUEST_APPROVED') {
          fetchAccessRequests();
          if (activeRequest && activeRequest.id === msg.id) {
            setActiveRequest((prev) => (prev ? { ...prev, status: 'APPROVED' } : null));
            handleExecuteQuery();
          }
        } else if (msg.type === 'REQUEST_CREATED' || msg.type === 'REQUEST_DENIED' || msg.type === 'POLICY_TOGGLED') {
          fetchAccessRequests();
        }
      };

      return () => {
        channel.close();
      };
    }
  }, [activeRequest?.id]);

  // Periodic polling for access requests and MySQL status
  useEffect(() => {
    fetchInitialData();
    fetchAccessRequests();
    fetchMySqlStatus();

    // Check stored hospital authentication
    const storedUser = localStorage.getItem('pulsekey_hospital_user');
    const storedToken = localStorage.getItem('pulsekey_hospital_token');
    if (storedUser && storedToken) {
      try {
        setCurrentHospitalUser(JSON.parse(storedUser));
        fetch('/api/hospital/me', {
          headers: { Authorization: `Bearer ${storedToken}` },
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.user) setCurrentHospitalUser(data.user);
          })
          .catch(() => {});
      } catch (e) {
        // Ignored
      }
    }

    const interval = setInterval(() => {
      fetchAccessRequests();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const fetchMySqlStatus = async () => {
    try {
      const res = await fetch('/api/mysql/status');
      if (res.ok) {
        const data = await res.json();
        setMySqlStatus(data);
      }
    } catch (e) {
      // Ignored
    }
  };

  const handleAuthSuccess = (user: HospitalUser, token?: string) => {
    setCurrentHospitalUser(user);
    localStorage.setItem('pulsekey_hospital_user', JSON.stringify(user));
    if (token) {
      localStorage.setItem('pulsekey_hospital_token', token);
    }
    fetchMySqlStatus();
    soundFx.playApprovalTone();
    updatePage('portal');
  };

  const handleSignOut = () => {
    setCurrentHospitalUser(null);
    localStorage.removeItem('pulsekey_hospital_user');
    localStorage.removeItem('pulsekey_hospital_token');
    soundFx.playAlertTone();
    updatePage('landing');
  };

  // Monitor activeRequest status changes to trigger automatic query on approval
  useEffect(() => {
    if (activeRequest && activeRequest.status === 'APPROVED' && !currentSummary && !isLoading) {
      handleExecuteQuery();
    }
  }, [activeRequest?.status]);

  const fetchInitialData = async () => {
    try {
      // 1. Fetch demo patients
      const patRes = await fetch('/api/patients');
      if (patRes.ok) {
        const data = await patRes.json();
        setPatients(data.patients || []);
        if (data.patients && data.patients.length > 0 && !selectedPatient) {
          setSelectedPatient(data.patients[0]); // Alex Mercer
        }
      }

      // 2. Fetch network status
      const netRes = await fetch('/api/network-status');
      if (netRes.ok) {
        const netData = await netRes.json();
        setIsOffline(Boolean(netData.isOffline));
      }

      // 3. Mint default break-glass ZK role token
      const zkRes = await fetch('/api/mint-zk-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responderName: 'Dr. Jordan Hayes, MD',
          role: 'TRAUMA_SURGEON_ATTENDING',
          caseId: 'EMS-TRAUMA-9912',
        }),
      });
      if (zkRes.ok) {
        const zkData = await zkRes.json();
        setCurrentZkToken(zkData.token);
      }

      // 4. Fetch audit logs
      fetchAuditLogs();
    } catch (e) {
      console.warn('Initial data load notice:', e);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/audit-log');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
        setAuditVerification(data.verification || { isValid: true, totalBlocks: 1 });
      }
    } catch (e) {
      // Ignored
    }
  };

  const fetchAccessRequests = async () => {
    try {
      const res = await fetch('/api/access-requests');
      if (res.ok) {
        const data = await res.json();
        setAccessRequests(data.requests || []);
        setAutoApprovePolicy(Boolean(data.autoApprovePolicy));

        if (activeRequest) {
          const updated = (data.requests || []).find(
            (r: EmergencyAccessRequest) => r.id === activeRequest.id
          );
          if (updated && updated.status !== activeRequest.status) {
            setActiveRequest(updated);
            if (updated.status === 'APPROVED') {
              handleExecuteQuery();
            }
          }
        }
      }
    } catch (e) {
      // Ignored
    }
  };

  const handleToggleOffline = async () => {
    const nextState = !isOffline;
    setIsOffline(nextState);
    try {
      await fetch('/api/network-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offline: nextState }),
      });
    } catch (e) {
      console.warn('Network toggle notice:', e);
    }
  };

  const handleRefreshZkToken = async (responder: string, role: string, caseId: string) => {
    try {
      const zkRes = await fetch('/api/mint-zk-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responderName: responder,
          role,
          caseId,
        }),
      });
      if (zkRes.ok) {
        const zkData = await zkRes.json();
        setCurrentZkToken(zkData.token);
      }
    } catch (e) {
      console.warn('ZK refresh notice:', e);
    }
  };

  // EMT / Doctor Submits Emergency Access Request to Hospital Gate
  const handleBroadcastAccessRequest = async (customParams?: {
    patient?: DemoPatient;
    requesterName?: string;
    role?: string;
    emergencyCaseId?: string;
    urgencyLevel?: 'CRITICAL_TRAUMA' | 'URGENT' | 'STANDARD';
    reason?: string;
    targetHospitals?: string[];
  }) => {
    const targetPatient = customParams?.patient || selectedPatient;
    if (!targetPatient) return;
    if (customParams?.patient && customParams.patient.id !== selectedPatient?.id) {
      setSelectedPatient(customParams.patient);
    }

    setIsBroadcasting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/access-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientHash: targetPatient.hash,
          patientName: targetPatient.name,
          dob: targetPatient.dob,
          requesterName:
            customParams?.requesterName ||
            currentZkToken?.publicSignals.responderName ||
            'Dr. Jordan Hayes, MD',
          role:
            customParams?.role ||
            currentZkToken?.publicSignals.role ||
            'TRAUMA_SURGEON_ATTENDING',
          emergencyCaseId:
            customParams?.emergencyCaseId ||
            currentZkToken?.publicSignals.emergencyCaseId ||
            'EMS-TRAUMA-9912',
          urgencyLevel: customParams?.urgencyLevel || 'CRITICAL_TRAUMA',
          reason:
            customParams?.reason ||
            `Unconscious patient ${targetPatient.name}, trauma bay intake, vitals critical`,
          zkToken: currentZkToken,
        }),
      });

      if (res.ok) {
        const newReq: EmergencyAccessRequest = await res.json();
        setActiveRequest(newReq);
        fetchAccessRequests();

        broadcastChannelRef.current?.postMessage({
          type: 'REQUEST_CREATED',
          request: newReq,
        });

        soundFx.playScanTone();

        if (newReq.status === 'APPROVED') {
          handleExecuteQuery();
        }
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Failed to dispatch access request');
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Hospital Gate Authorizer Grants Access
  const handleApproveRequest = async (id: string) => {
    try {
      const decidedBy = currentHospitalUser
        ? `${currentHospitalUser.officer_name} (${currentHospitalUser.hospital_name})`
        : 'Dr. Arun Kumar (Metro General Hospital)';

      const res = await fetch(`/api/access-requests/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decidedBy }),
      });

      if (res.ok) {
        const updated: EmergencyAccessRequest = await res.json();
        fetchAccessRequests();

        broadcastChannelRef.current?.postMessage({
          type: 'REQUEST_APPROVED',
          id,
        });

        if (activeRequest && activeRequest.id === id) {
          setActiveRequest(updated);
          handleExecuteQuery();
        }
      }
    } catch (e: any) {
      console.warn('Approval error:', e);
    }
  };

  // Hospital Gate Authorizer Denies Access
  const handleDenyRequest = async (id: string) => {
    try {
      const decidedBy = currentHospitalUser
        ? `${currentHospitalUser.officer_name} (${currentHospitalUser.hospital_name})`
        : 'Hospital Security & Compliance Gate';

      const res = await fetch(`/api/access-requests/${id}/deny`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decidedBy }),
      });

      if (res.ok) {
        const updated: EmergencyAccessRequest = await res.json();
        fetchAccessRequests();

        broadcastChannelRef.current?.postMessage({
          type: 'REQUEST_DENIED',
          id,
        });

        if (activeRequest && activeRequest.id === id) {
          setActiveRequest(updated);
        }
      }
    } catch (e: any) {
      console.warn('Denial error:', e);
    }
  };

  // Toggle Hospital Auto-Approve Break-Glass Policy
  const handleToggleAutoApprove = async () => {
    try {
      const nextPolicy = !autoApprovePolicy;
      const res = await fetch('/api/access-policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoApprove: nextPolicy }),
      });

      if (res.ok) {
        const data = await res.json();
        setAutoApprovePolicy(Boolean(data.autoApprovePolicy));
        broadcastChannelRef.current?.postMessage({
          type: 'POLICY_TOGGLED',
          autoApprove: data.autoApprovePolicy,
        });
      }
    } catch (e) {
      console.warn('Policy toggle error:', e);
    }
  };

  // Execute federated query across hospital nodes with AI conflict reconciliation
  const handleExecuteQuery = async () => {
    if (!selectedPatient) return;

    setErrorMessage(null);
    setIsLoading(true);

    try {
      setLoadingStep('Step 1/5: Biometric template hashed to DID (SHA-256)...');
      await new Promise((r) => setTimeout(r, 200));

      setLoadingStep('Step 2/5: Validating 4-hour ZK Break-Glass Role Proof...');
      await new Promise((r) => setTimeout(r, 200));

      setLoadingStep(
        isOffline
          ? 'Step 3/5: Network Outage simulated. Pulling from local disaster cache...'
          : 'Step 3/5: Parallel fan-out to Metro Gen (:4001), St. Jude (:4002), Pacific Valley (:4003)...'
      );

      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_hash: selectedPatient.hash,
          requester_token: currentZkToken,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Federated query failed');
      }

      setLoadingStep('Step 4/5: AI semantic translation of FHIR JSON, Pipe CSV, and Custom XML...');
      await new Promise((r) => setTimeout(r, 200));

      setLoadingStep('Step 5/5: Multi-Agent AI reconciling clinical conflicts with confidence scoring...');
      const result: BrokerQueryResult = await response.json();

      setCurrentSummary(result.goldenSummary);
      setHospitalResponses(result.hospitalResponses || []);
      setExtractedRecords(result.extractedRecords || []);

      fetchAuditLogs();
      soundFx.playApprovalTone();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error querying hospital network');
      soundFx.playAlertTone();
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterCustomPatient = async (patientData: any) => {
    try {
      const res = await fetch('/api/patients/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData),
      });
      if (res.ok) {
        const data = await res.json();
        setPatients(data.allPatients || []);
        setSelectedPatient(data.patient);
        setCurrentSummary(null);
        setActiveRequest(null);
        setErrorMessage(null);
        soundFx.playScanTone();
      }
    } catch (e: any) {
      console.warn('Register custom patient notice:', e);
    }
  };

  const pendingRequestCount = accessRequests.filter((r) => r.status === 'PENDING').length;

  // --------------------------------------------------------------------------
  // PAGE 1: LANDING PAGE (Exact match to Mockup #1)
  // --------------------------------------------------------------------------
  if (currentPage === 'landing') {
    return (
      <LandingPage
        onGetStarted={() => updatePage('portal')}
        onLogIn={() => updatePage('login')}
        onSignUp={() => updatePage('signup')}
        onLearnMore={() => updatePage('portal')}
      />
    );
  }

  // --------------------------------------------------------------------------
  // PAGE 2: SIGN IN (Exact match to Mockup #2)
  // --------------------------------------------------------------------------
  if (currentPage === 'login') {
    return (
      <LoginPage
        onLoginSuccess={(user) => handleAuthSuccess(user)}
        onNavigateRegister={() => updatePage('signup')}
        onNavigateHome={() => updatePage('landing')}
      />
    );
  }

  // --------------------------------------------------------------------------
  // PAGE 3: REGISTER HOSPITAL (Exact match to Mockup #3)
  // --------------------------------------------------------------------------
  if (currentPage === 'signup') {
    return (
      <RegisterPage
        onRegisterSuccess={(user) => handleAuthSuccess(user)}
        onNavigateLogin={() => updatePage('login')}
        onNavigateHome={() => updatePage('landing')}
      />
    );
  }

  // --------------------------------------------------------------------------
  // PAGE 4 & 5: HOSPITAL PORTAL & DASHBOARD (Mockups #4 & #5)
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Persistent Left Sidebar */}
      <Sidebar
        activeTab={portalTab}
        setActiveTab={updatePortalTab}
        pendingRequestCount={pendingRequestCount}
        onSignOut={handleSignOut}
        onNavigateHome={() => updatePage('landing')}
      />

      {/* Main Content Area with TopBar */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          currentUser={currentHospitalUser}
          onSignOut={handleSignOut}
          networkOnline={!isOffline}
        />

        {/* Global Error Banner if any */}
        {errorMessage && (
          <div className="mx-8 mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 shadow-sm animate-in fade-in">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold uppercase tracking-wider block text-[11px]">System Notification</span>
              <p className="mt-0.5 font-medium">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Dynamic Tab Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {/* TAB 1: OVERVIEW (Mockup #4) */}
          {portalTab === 'overview' && (
            <OverviewDashboard
              accessRequests={accessRequests}
              onNavigateTab={(tab) => updatePortalTab(tab as PortalTab)}
              onSelectRequest={(req) => {
                setActiveRequest(req);
                updatePortalTab('emergency-requests');
              }}
            />
          )}

          {/* TAB 2: GIVE REQUEST / SEND EMERGENCY ACCESS REQUEST */}
          {portalTab === 'send-request' && (
            <SendEmergencyRequest
              patients={patients}
              selectedPatient={selectedPatient}
              onSelectPatient={(p) => {
                setSelectedPatient(p);
                setCurrentSummary(null);
                setActiveRequest(null);
                setErrorMessage(null);
              }}
              activeRequest={activeRequest}
              currentSummary={currentSummary}
              currentZkToken={currentZkToken}
              isBroadcasting={isBroadcasting}
              isLoading={isLoading}
              loadingStep={loadingStep}
              isOffline={isOffline}
              onSendRequest={handleBroadcastAccessRequest}
              onDirectBypass={handleExecuteQuery}
              onResetRequest={() => {
                setActiveRequest(null);
                setCurrentSummary(null);
              }}
              onInspectRaw={() => updatePortalTab('hospital-network')}
            />
          )}

          {/* TAB 3: PATIENTS / IDENTIFICATION (Field Paramedic Terminal) */}
          {portalTab === 'patients' && (
            <div className="space-y-6">
              <PatientIdentification
                patients={patients}
                selectedPatient={selectedPatient}
                onSelectPatient={(p) => {
                  setSelectedPatient(p);
                  setCurrentSummary(null);
                  setActiveRequest(null);
                  setErrorMessage(null);
                }}
                onRegisterCustomPatient={handleRegisterCustomPatient}
                onScanQuery={handleBroadcastAccessRequest}
                isLoading={isLoading || isBroadcasting}
                loadingStep={isBroadcasting ? 'Broadcasting Emergency Access Request...' : loadingStep}
                isOffline={isOffline}
                currentSummary={currentSummary}
                onRequestClearance={handleBroadcastAccessRequest}
              />

              {/* Live Clearance Protocol & Golden Record */}
              {(activeRequest || currentSummary) && (
                <div className="space-y-6 pt-2">
                  <EmergencyRequestPanel
                    selectedPatient={selectedPatient}
                    currentZkToken={currentZkToken}
                    activeRequest={activeRequest}
                    isBroadcasting={isBroadcasting}
                    onRequestAccess={handleBroadcastAccessRequest}
                    onDirectBypass={handleExecuteQuery}
                    isOffline={isOffline}
                  />
                  {currentSummary && (
                    <GoldenSummaryCard
                      summary={currentSummary}
                      patientName={selectedPatient?.name || 'Trauma Patient'}
                      onInspectRaw={() => updatePortalTab('hospital-network')}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EMERGENCY REQUESTS (Hospital Clearance Gate) */}
          {portalTab === 'emergency-requests' && (
            <div className="space-y-6">
              <HospitalAccessGate
                requests={accessRequests}
                autoApprovePolicy={autoApprovePolicy}
                onApproveRequest={handleApproveRequest}
                onDenyRequest={handleDenyRequest}
                onToggleAutoApprove={handleToggleAutoApprove}
                onRefresh={fetchAccessRequests}
                mySqlStatus={mySqlStatus}
              />
            </div>
          )}

          {/* TAB 4: AUDIT LOG */}
          {portalTab === 'audit-log' && (
            <div className="space-y-6">
              <AuditLogViewer
                logs={auditLogs}
                verification={auditVerification}
                onRefresh={fetchAuditLogs}
              />
            </div>
          )}

          {/* TAB 5: HOSPITAL NETWORK */}
          {portalTab === 'hospital-network' && (
            <div className="space-y-6">
              <HospitalRawViewer
                hospitalResponses={hospitalResponses}
                extractedRecords={extractedRecords}
              />
            </div>
          )}

          {/* TAB 6: SETTINGS & SYSTEM */}
          {portalTab === 'settings' && (
            <div className="space-y-8">
              {/* Network Toggle and Break-Glass Policy Control */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-base font-bold text-slate-900">Hospital Node Configuration</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure break-glass authorization policy, peer mesh replication, and disaster failover
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Break Glass Policy */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-bold text-slate-900">
                          Auto-Approve Break-Glass Policy
                        </span>
                      </div>
                      <button
                        onClick={handleToggleAutoApprove}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                          autoApprovePolicy
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {autoApprovePolicy ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      When enabled, emergency clearance requests from certified paramedics with verified ZK tokens are automatically pre-authorized without manual officer intervention.
                    </p>
                  </div>

                  {/* Network Disaster Toggle */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Radio className="h-5 w-5 text-purple-600" />
                        <span className="text-sm font-bold text-slate-900">
                          Disaster Simulation Mode
                        </span>
                      </div>
                      <button
                        onClick={handleToggleOffline}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                          isOffline ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isOffline ? 'OFFLINE MESH' : 'ONLINE FEDERATION'}
                      </button>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Simulate network partition during mass-casualty events. Operates entirely over local mesh nodes using cached records.
                    </p>
                  </div>
                </div>
              </div>

              {/* ZK Proof Inspector */}
              <ZkProofInspector
                currentZkToken={currentZkToken}
                onRefreshZkToken={handleRefreshZkToken}
              />

              {/* Mesh Sync Panel */}
              <MeshSyncPanel
                currentSummary={currentSummary}
                patientName={selectedPatient?.name || 'Trauma Patient'}
                isOffline={isOffline}
              />

              {/* Database & MySQL Inspector */}
              <DatabaseInspector />
            </div>
          )}
        </main>
      </div>

      {/* Hospital Authentication Modal */}
      <HospitalAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        currentUser={currentHospitalUser}
      />
    </div>
  );
}
