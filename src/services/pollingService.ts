// HTTP polling-based real-time service
const API_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

interface PollingMessage {
  id: string;
  type: string;
  data: any;
  timestamp: string;
}

class PollingService {
  private meetingId: string | null = null;
  private participantId: string | null = null;
  private lastMessageId: string | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;
  private eventHandlers: Map<string, Function[]> = new Map();

  async joinMeeting(data: { meetingId: string; displayName: string; isHost: boolean; participantId: string }) {
    try {
      // For now, just simulate a successful join
      this.meetingId = data.meetingId;
      this.participantId = data.participantId;
      
      const result = {
        participantId: data.participantId,
        participants: [{
          id: data.participantId,
          name: data.displayName,
          role: data.isHost ? 'host' : 'participant',
          isMuted: false,
          isVideoOff: false,
          joinedAt: new Date().toISOString()
        }],
        currentDateTime: new Date().toISOString(),
        datetimeVersion: 0,
        chatMessages: []
      };
      
      // Start polling
      this.startPolling();
      
      // Emit joined event
      setTimeout(() => {
        this.emit('meeting:joined', result);
      }, 100);
      
      return result;
    } catch (error) {
      console.error('Join meeting error:', error);
      throw error;
    }
  }

  private startPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    this.pollingInterval = setInterval(async () => {
      if (!this.meetingId) return;

      try {
        const url = new URL(`${API_BASE_URL}/api/realtime/poll/${this.meetingId}`);
        if (this.lastMessageId) {
          url.searchParams.set('lastMessageId', this.lastMessageId);
        }

        const response = await fetch(url.toString());
        if (!response.ok) return;

        const result = await response.json();
        
        if (result.messages && result.messages.length > 0) {
          result.messages.forEach((message: PollingMessage) => {
            this.handleMessage(message);
          });
          this.lastMessageId = result.lastMessageId;
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 1000); // Poll every second
  }

  private handleMessage(message: PollingMessage) {
    switch (message.type) {
      case 'participant-joined':
        this.emit('meeting:participant-joined', message.data);
        break;
      case 'participant-left':
        this.emit('meeting:participant-left', message.data);
        break;
      case 'chat-message':
        this.emit('chat:new-message', message.data);
        break;
      case 'webrtc-offer':
        this.emit('webrtc:offer', message.data);
        break;
      case 'webrtc-answer':
        this.emit('webrtc:answer', message.data);
        break;
      case 'webrtc-ice-candidate':
        this.emit('webrtc:ice-candidate', message.data);
        break;
      case 'reaction':
        this.emit('meeting:reaction-received', message.data);
        break;
      case 'hand-raise':
        this.emit('meeting:hand-raise-updated', message.data);
        break;
      case 'datetime-changed':
        this.emit('meeting:datetime:changed', message.data);
        break;
      case 'participant-updated':
        this.emit('participant:updated', message.data);
        break;
    }
  }

  async sendMessage(type: string, data: any) {
    if (!this.meetingId || !this.participantId) {
      throw new Error('Not connected to meeting');
    }

    // For now, just log the message
    console.log('Polling send message:', type, data);
  }

  async sendChatMessage(text: string) {
    if (!this.meetingId || !this.participantId) {
      throw new Error('Not connected to meeting');
    }

    // For now, just log the chat message
    console.log('Polling send chat:', text);
  }

  // WebRTC signaling
  async sendOffer(to: string, offer: RTCSessionDescriptionInit) {
    await this.sendMessage('webrtc-offer', { to, offer });
  }

  async sendAnswer(to: string, answer: RTCSessionDescriptionInit) {
    await this.sendMessage('webrtc-answer', { to, answer });
  }

  async sendIceCandidate(to: string, candidate: RTCIceCandidateInit) {
    await this.sendMessage('webrtc-ice-candidate', { to, candidate });
  }

  // Other features
  async sendReaction(emoji: string) {
    await this.sendMessage('reaction', { emoji });
  }

  async sendHandRaise(isRaised: boolean) {
    await this.sendMessage('hand-raise', { isRaised });
  }

  async updateParticipant(data: { isMuted?: boolean; isVideoOff?: boolean }) {
    await this.sendMessage('participant-update', data);
  }

  // Event handling
  on(event: string, callback: Function) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(callback);
  }

  off(event: string, callback?: Function) {
    if (!this.eventHandlers.has(event)) return;
    
    if (callback) {
      const handlers = this.eventHandlers.get(event)!;
      const index = handlers.indexOf(callback);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    } else {
      this.eventHandlers.set(event, []);
    }
  }

  private emit(event: string, data: any) {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('Event handler error:', error);
      }
    });
  }

  disconnect() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.meetingId = null;
    this.participantId = null;
    this.lastMessageId = null;
    this.eventHandlers.clear();
  }

  get connected() {
    return this.meetingId !== null && this.participantId !== null;
  }
}

export const pollingService = new PollingService();