import SimplePeer from 'simple-peer';
import { socketService } from './socketService';

export interface Participant {
  id: string;
  name: string;
  isLocal: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  stream?: MediaStream;
  peer?: SimplePeer.Instance;
}

class WebRTCService {
  private localStream: MediaStream | null = null;
  private peers: Map<string, SimplePeer.Instance> = new Map();
  private participants: Map<string, Participant> = new Map();
  public localParticipantId: string | null = null;

  private iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  async initializeMedia(constraints: MediaStreamConstraints = { video: true, audio: true }) {
    try {
      console.log('Requesting media access with constraints:', constraints);
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Media access granted successfully');
      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      
      // Provide more specific error messages
      if (error.name === 'NotAllowedError') {
        throw new Error('Camera/microphone access denied. Please allow permissions in your browser.');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No camera or microphone found. Please connect a device and try again.');
      } else if (error.name === 'NotReadableError') {
        throw new Error('Camera or microphone is already in use by another application.');
      } else {
        throw new Error(`Media access failed: ${error.message}`);
      }
    }
  }

  async createPeer(participantId: string, initiator: boolean): Promise<SimplePeer.Instance> {
    // Check if peer already exists
    const existingPeer = this.peers.get(participantId);
    if (existingPeer && !existingPeer.destroyed) {
      console.log('Peer already exists for participant:', participantId);
      return existingPeer;
    }

    console.log('Creating peer for participant:', participantId, 'initiator:', initiator, 'localStream:', !!this.localStream);
    const peer = new SimplePeer({
      initiator,
      trickle: true,
      stream: this.localStream || undefined,
      config: {
        iceServers: this.iceServers
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    peer.on('signal', (data: any) => {
      if (data.type === 'offer') {
        socketService.emit('webrtc:offer', {
          from: this.localParticipantId!,
          to: participantId,
          offer: data
        });
      } else if (data.type === 'answer') {
        socketService.emit('webrtc:answer', {
          from: this.localParticipantId!,
          to: participantId,
          answer: data
        });
      } else if (data.candidate) {
        socketService.emit('webrtc:ice-candidate', {
          from: this.localParticipantId!,
          to: participantId,
          candidate: data
        });
      }
    });

    peer.on('stream', (stream) => {
      console.log('Received stream from:', participantId, 'tracks:', stream.getTracks().map(t => `${t.kind}: ${t.readyState}`));
      const participant = this.participants.get(participantId);
      if (participant) {
        participant.stream = stream;
        this.participants.set(participantId, participant);
        this.onParticipantStreamUpdate?.(participantId, stream);
      } else {
        console.warn('Received stream for unknown participant:', participantId);
      }
    });

    peer.on('connect', () => {
      console.log('Peer connected:', participantId);
    });

    peer.on('error', (error) => {
      console.error('Peer connection error for participant', participantId, ':', error);
      // Don't throw here as it would break the entire connection
    });

    peer.on('close', () => {
      console.log('Peer closed:', participantId);
      this.peers.delete(participantId);
    });

    this.peers.set(participantId, peer);
    return peer;
  }

  async handleOffer(from: string, offer: RTCSessionDescriptionInit) {
    let peer = this.peers.get(from);
    if (!peer || peer.destroyed) {
      console.log('Creating peer for incoming offer from:', from);
      peer = await this.createPeer(from, false);
    } else {
      console.log('Using existing peer for offer from:', from);
    }
    try {
      peer.signal(offer);
    } catch (error) {
      console.error('Error signaling offer from', from, ':', error);
    }
  }

  handleAnswer(from: string, answer: RTCSessionDescriptionInit) {
    const peer = this.peers.get(from);
    if (peer) {
      peer.signal(answer);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleIceCandidate(from: string, candidate: any) {
    const peer = this.peers.get(from);
    if (peer && !peer.destroyed) {
      peer.signal(candidate);
    }
  }

  addParticipant(participant: Participant) {
    this.participants.set(participant.id, participant);
    if (participant.isLocal) {
      this.localParticipantId = participant.id;
    }
  }

  removeParticipant(participantId: string) {
    const peer = this.peers.get(participantId);
    if (peer) {
      peer.destroy();
      this.peers.delete(participantId);
    }
    this.participants.delete(participantId);
  }

  getParticipants(): Participant[] {
    return Array.from(this.participants.values());
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  toggleAudio(muted: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }

  toggleVideo(videoOff: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = !videoOff;
      });
    }
  }

  cleanup() {
    this.peers.forEach(peer => peer.destroy());
    this.peers.clear();
    this.participants.clear();
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  onParticipantStreamUpdate?: (participantId: string, stream: MediaStream) => void;
}

export const webrtcService = new WebRTCService();