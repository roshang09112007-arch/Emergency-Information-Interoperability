/**
 * PulseKey Real-Time Cross-Device Synchronization Relay
 * 
 * Combines:
 * 1. BroadcastChannel (for instant inter-tab/inter-window sync on same machine)
 * 2. Cloud Serverless Relay via SSE (for instant cross-laptop / cross-network real-time sync)
 */

export interface SyncMessage {
  type: 'REQUEST_CREATED' | 'REQUEST_APPROVED' | 'REQUEST_DENIED' | 'POLICY_TOGGLED';
  payload: any;
  timestamp: number;
  senderId: string;
}

type SyncCallback = (msg: SyncMessage) => void;

class CloudSyncManager {
  private localChannel: BroadcastChannel | null = null;
  private sseSource: EventSource | null = null;
  private listeners: Set<SyncCallback> = new Set();
  private senderId = 'client_' + Math.random().toString(36).substring(2, 9);
  private cloudTopic = 'pulsekey_emergency_sync_2026';

  constructor() {
    this.initLocalChannel();
    this.initCloudSse();
  }

  private initLocalChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.localChannel = new BroadcastChannel('pulsekey_sync_channel');
        this.localChannel.onmessage = (event) => {
          if (event.data && event.data.senderId !== this.senderId) {
            this.notifyListeners(event.data);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel notice:', e);
      }
    }
  }

  private initCloudSse() {
    if (typeof window === 'undefined' || !('EventSource' in window)) return;

    try {
      // Connect to free public SSE real-time stream for instant cross-laptop synchronization
      const sseUrl = `https://ntfy.sh/${this.cloudTopic}/sse`;
      this.sseSource = new EventSource(sseUrl);

      this.sseSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.message) {
            const parsedMsg: SyncMessage = JSON.parse(data.message);
            if (parsedMsg.senderId !== this.senderId) {
              this.notifyListeners(parsedMsg);
            }
          }
        } catch {}
      };

      this.sseSource.onerror = () => {
        // SSE auto reconnects gracefully
      };
    } catch (e) {
      console.warn('Cloud SSE notice:', e);
    }
  }

  public subscribe(callback: SyncCallback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(msg: SyncMessage) {
    this.listeners.forEach((listener) => {
      try {
        listener(msg);
      } catch (e) {
        console.error('Error in sync listener:', e);
      }
    });
  }

  public async broadcast(type: SyncMessage['type'], payload: any) {
    const msg: SyncMessage = {
      type,
      payload,
      timestamp: Date.now(),
      senderId: this.senderId,
    };

    // 1. Broadcast locally (cross-tab)
    try {
      this.localChannel?.postMessage(msg);
    } catch {}

    // 2. Broadcast to Cloud SSE Relay (cross-laptop)
    try {
      fetch(`https://ntfy.sh/${this.cloudTopic}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(msg),
      }).catch(() => {});
    } catch {}
  }
}

export const cloudSync = new CloudSyncManager();
