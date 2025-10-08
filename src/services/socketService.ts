import { io, Socket } from 'socket.io-client';
import { pollingService } from './pollingService';

export interface SocketEvents {
  'meeting:join': (data: { meetingId: string; displayName: string; isHost: boolean; participantId: string }) => void;
  'meeting:joined': (data: { participantId: string; participants: Record<string, unknown>[]; currentDateTime: string; datetimeVersion: number; chatMessages: Record<string, unknown>[] }) => void;
  'meeting:participant-joined': (participant: Record<string, unknown>) => void;
  'meeting:participant-left': (data: { participantId: string; reason: string }) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  'meeting:participants-updated': (data: { participants: any[] }) => void;
  'meeting:reaction': (data: { emoji: string }) => void;
  'meeting:hand-raise': (data: { isRaised: boolean }) => void;
  'meeting:datetime:update': (data: { newDateTime: string; version: number }) => void;
  'meeting:datetime:changed': (data: { newDateTime: string; version: number; changedBy: string; changedAt: string }) => void;
  'chat:message': (data: { text: string }) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  'chat:new-message': (message: any) => void;
  'participant:update': (data: { isMuted?: boolean; isVideoOff?: boolean }) => void;
  'participant:updated': (data: { participantId: string; isMuted: boolean; isVideoOff: boolean }) => void;
  'webrtc:offer': (data: { from: string; to: string; offer: RTCSessionDescriptionInit }) => void;
  'webrtc:answer': (data: { from: string; to: string; answer: RTCSessionDescriptionInit }) => void;
  'webrtc:ice-candidate': (data: { from: string; to: string; candidate: RTCIceCandidateInit }) => void;
  'meeting:kicked': (data: { message: string }) => void;
  'meeting:terminated': (data: { message: string }) => void;
  'meeting:leave': () => void;
  'error': (data: { message: string }) => void;
}

class SocketService {
  private socket: Socket | null = null;
  private serverUrl = this.getServerUrl();
  private connectionAttempts = 0;
  private maxRetries = 5;
  private usePolling = false;
  private eventHandlers: Map<string, Function[]> = new Map();

  private getServerUrl(): string {
    const envUrl = import.meta.env.VITE_SERVER_URL;
    if (envUrl) {
      return envUrl;
    }
    
    return 'https://www.meetingapp.org';
  }

  get socketInstance() {
    return this.socket;
  }

  connect(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        console.log('Socket already connected');
        resolve(this.socket);
        return;
      }

      console.log('Connecting to server:', this.serverUrl);
      this.socket = io(this.serverUrl, {
        path: '/socket.io/',
        transports: ['polling', 'websocket'],
        timeout: 60000,
        forceNew: true,
        upgrade: true,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 5000,
        withCredentials: true
      });

      this.socket.on('connect', () => {
        console.log('Connected to server successfully');
        this.connectionAttempts = 0; // Reset on successful connection
        resolve(this.socket!);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        this.connectionAttempts++;
        
        if (this.connectionAttempts >= this.maxRetries) {
          console.log('Socket.IO failed, switching to polling mode');
          this.usePolling = true;
          this.socket = this.createMockSocket();
          resolve(this.socket); // Return mock socket for polling mode
        } else {
          console.log(`Retrying connection (${this.connectionAttempts}/${this.maxRetries})...`);
          setTimeout(() => {
            this.socket?.connect();
          }, Math.min(1000 * (2 ** this.connectionAttempts), 10000));
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Disconnected from server:', reason);
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log('Reconnected to server after', attemptNumber, 'attempts');
      });

      this.socket.on('reconnect_error', (error) => {
        console.error('Reconnection error:', error);
      });
    });
  }

  emit<K extends keyof SocketEvents>(event: K, data: Parameters<SocketEvents[K]>[0]) {
    if (this.usePolling) {
      this.handlePollingEmit(event, data);
      return;
    }
    
    if (this.socket?.connected) {
      console.log('Emitting socket event:', event, data);
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit:', event);
      throw new Error('Socket not connected. Please try reconnecting.');
    }
  }

  private createMockSocket(): any {
    return {
      connected: true,
      emit: () => {},
      on: () => {},
      off: () => {},
      disconnect: () => {}
    };
  }

  private async handlePollingEmit(event: string, data: any) {
    try {
      switch (event) {
        case 'meeting:join':
          const result = await pollingService.joinMeeting(data);
          // Simulate the joined event
          setTimeout(() => {
            const handlers = this.eventHandlers.get('meeting:joined') || [];
            handlers.forEach(handler => handler(result));
          }, 100);
          break;
        case 'chat:message':
          await pollingService.sendChatMessage(data.text);
          break;
        case 'webrtc:offer':
          await pollingService.sendOffer(data.to, data.offer);
          break;
        case 'webrtc:answer':
          await pollingService.sendAnswer(data.to, data.answer);
          break;
        case 'webrtc:ice-candidate':
          await pollingService.sendIceCandidate(data.to, data.candidate);
          break;
        case 'meeting:reaction':
          await pollingService.sendReaction(data.emoji);
          break;
        case 'meeting:hand-raise':
          await pollingService.sendHandRaise(data.isRaised);
          break;
        case 'participant:update':
          await pollingService.updateParticipant(data);
          break;
        default:
          console.log('Polling emit:', event, data);
      }
    } catch (error) {
      console.error('Polling emit error:', error);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emitWithCallback<K extends keyof SocketEvents>(event: K, data: Parameters<SocketEvents[K]>[0], callback?: (response: any) => void) {
    if (this.socket?.connected) {
      this.socket.emit(event, data, callback);
    } else {
      console.warn('Socket not connected, cannot emit:', event);
    }
  }

  on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]) {
    if (this.usePolling) {
      // Store handlers for polling mode
      if (!this.eventHandlers.has(event as string)) {
        this.eventHandlers.set(event as string, []);
      }
      this.eventHandlers.get(event as string)!.push(callback);
      pollingService.on(event as string, callback);
    } else if (this.socket) {
      this.socket.on(event as string, callback);
    }
  }

  off<K extends keyof SocketEvents>(event: K, callback?: SocketEvents[K]) {
    if (this.socket) {
      this.socket.off(event as string, callback);
    }
  }

  disconnect() {
    if (this.usePolling) {
      pollingService.disconnect();
    } else if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  get connected() {
    return this.usePolling ? pollingService.connected : (this.socket?.connected || false);
  }

  reset() {
    this.connectionAttempts = 0;
    this.usePolling = false;
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    pollingService.disconnect();
  }

  endMeeting() {
    if (this.socket?.connected) {
      this.emit('meeting:leave', undefined);
    }
    this.disconnect();
    this.reset();
  }
}

export const socketService = new SocketService();