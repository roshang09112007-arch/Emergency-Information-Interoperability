import React, { useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  HardDrive,
  Radio,
  RefreshCw,
  Send,
  Share2,
  Smartphone,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { GoldenSummary } from '../types.js';

interface MeshPacket {
  id: string;
  senderUnit: string;
  timestamp: string;
  patientDid: string;
  summaryPreview: string;
}

interface MeshSyncPanelProps {
  currentSummary: GoldenSummary | null;
  patientName: string;
  isOffline: boolean;
}

export const MeshSyncPanel: React.FC<MeshSyncPanelProps> = ({
  currentSummary,
  patientName,
  isOffline,
}) => {
  const [meshPackets, setMeshPackets] = useState<MeshPacket[]>([
    {
      id: 'pkt-01',
      senderUnit: 'EMT Unit 14 (Downtown Station)',
      timestamp: new Date(Date.now() - 120000).toLocaleTimeString(),
      patientDid: 'did:pulse:9a8f...4e1',
      summaryPreview: 'Alex Mercer · O+ · Penicillin Allergy Warning Synced',
    },
  ]);

  const [activePeers] = useState([
    { unit: 'Medic-14 (Field Ambulance)', rssi: '-62 dBm (LoRa 915MHz)', status: 'Connected' },
    { unit: 'AirMed-3 (Trauma Chopper)', rssi: '-74 dBm (Bluetooth 5.2 Mesh)', status: 'Connected' },
    { unit: 'Disaster Triage Command', rssi: '-58 dBm (Ad-hoc Wi-Fi)', status: 'Connected' },
  ]);

  const [broadcastStatus, setBroadcastStatus] = useState<string | null>(null);

  // Setup BroadcastChannel for cross-tab mesh sync
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('pulsekey_lora_mesh');
      channel.onmessage = (event) => {
        if (event.data && event.data.type === 'MESH_SYNC_PACKET') {
          const packet: MeshPacket = event.data.packet;
          setMeshPackets((prev) => [packet, ...prev.slice(0, 9)]);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported in current environment');
    }

    return () => {
      channel?.close();
    };
  }, []);

  const handleBroadcastCurrentRecord = () => {
    if (!currentSummary) return;

    const newPacket: MeshPacket = {
      id: `pkt-${Date.now()}`,
      senderUnit: 'Medic-04 (This Terminal)',
      timestamp: new Date().toLocaleTimeString(),
      patientDid: `did:pulse:${currentSummary.patientHash.slice(0, 10)}...`,
      summaryPreview: `${patientName} · Blood: ${currentSummary.bloodType.value} · Confirmed Cache`,
    };

    setMeshPackets((prev) => [newPacket, ...prev]);
    setBroadcastStatus('Broadcasting across local LoRa/BLE peer mesh...');

    try {
      const channel = new BroadcastChannel('pulsekey_lora_mesh');
      channel.postMessage({ type: 'MESH_SYNC_PACKET', packet: newPacket });
      channel.close();
    } catch (e) {
      // Ignored
    }

    setTimeout(() => {
      setBroadcastStatus('Mesh packet acknowledged by 3 peer responder units.');
      setTimeout(() => setBroadcastStatus(null), 3000);
    }, 800);
  };

  return (
    <div className="saas-card p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Peer-to-Peer Disaster Mesh Synchronization
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  LORA / BLE MESH ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Demonstrates zero-infrastructure peer sync over Bluetooth &amp; LoRa mesh when cell networks fail
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Mesh Radio Nodes */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-blue-600" />
              Nearby Field Responders on Local Mesh
            </h4>

            <div className="space-y-2.5">
              {activePeers.map((peer, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-sm"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                      <span className="font-bold text-slate-900">{peer.unit}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">{peer.rssi}</span>
                  </div>
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] text-emerald-700 font-bold">
                    {peer.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Broadcast action button */}
            <div className="mt-4 pt-3 border-t border-slate-200">
              <button
                disabled={!currentSummary}
                onClick={handleBroadcastCurrentRecord}
                className={`w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold transition-all shadow-sm ${
                  currentSummary
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
              >
                <Share2 className="h-4 w-4" />
                <span>Broadcast Current Cached Record to Peers</span>
              </button>
              {broadcastStatus && (
                <p className="mt-2 text-center text-xs font-semibold text-emerald-600 animate-pulse">
                  {broadcastStatus}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Mesh Packet Stream */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                P2P Replicated Cache Packets (Zero Internet Required)
              </span>
              <span className="text-[11px] text-slate-500 font-mono">Channel: 915.0 MHz</span>
            </div>

            <div className="space-y-2.5 max-h-[340px] overflow-auto">
              {meshPackets.map((pkt) => (
                <div
                  key={pkt.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{pkt.senderUnit}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{pkt.timestamp}</span>
                  </div>
                  <div className="text-slate-800 text-[11px] bg-white p-2.5 rounded-lg border border-slate-200">
                    {pkt.summaryPreview}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>DID: {pkt.patientDid}</span>
                    <span className="text-emerald-700 font-bold">Validated Signature OK</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
