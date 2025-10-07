import { useState, useEffect, useCallback } from 'react';
import { socketService } from '@/services/socketService';
import { webrtcService, Participant } from '@/services/webrtcService';
import { apiService } from '@/services/apiService';
import { toast } from 'sonner';

export interface ChatMessage {
  id: string;
  senderId: string;
  sender: string;
  text: string;
  timestamp: string;
  isOwn: boolean;
}

interface SocketParticipant {
  id: string;
  name: string;
  isMuted?: boolean;
  isVideoOff?: boolean;
}

interface SocketChatMessage {
  id: string;
  senderId: string;
  sender: string;
  text: string;
  timestamp: string;
}

export interface MeetingState {
  meetingId: string | null;
  participantId: string | null;
  participants: Participant[];
  isConnected: boolean;
  isHost: boolean;
  currentDateTime: Date;
  datetimeVersion: number;
  hostToken?: string;
  joinToken?: string;
  chatMessages: ChatMessage[];
}

export function useMeeting() {
  const [meetingState, setMeetingState] = useState<MeetingState>({
    meetingId: null,
    participantId: null,
    participants: [],
    isConnected: false,
    isHost: false,
    currentDateTime: new Date(),
    datetimeVersion: 0,
    chatMessages: [],
  });

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const createMeeting = useCallback(async (hostName: string, maxParticipants?: number) => {
    try {
      const response = await apiService.createMeeting({ hostName, maxParticipants });

      await socketService.connect();
      const stream = await webrtcService.initializeMedia();
      setLocalStream(stream);

      const participantId = socketService.socketInstance!.id;
      const localParticipant: Participant = {
        id: participantId,
        name: hostName,
        isLocal: true,
        isMuted: false,
        isVideoOff: false,
        stream,
      };

      webrtcService.addParticipant(localParticipant);
      webrtcService.localParticipantId = participantId;

      socketService.emit('meeting:join', {
        meetingId: response.meetingId,
        displayName: hostName,
        isHost: true,
        participantId
      });

      setMeetingState(prev => ({
        ...prev,
        meetingId: response.meetingId,
        participantId,
        isHost: true,
        isConnected: true,
        participants: [localParticipant],
        hostToken: response.hostToken,
        joinToken: response.joinToken,
      }));

      console.log('Meeting created, local participant added:', localParticipant);

      return response;
    } catch (error) {
      console.error('Failed to create meeting:', error);
      toast.error('Failed to create meeting');
      throw error;
    }
  }, []);

  const joinMeeting = useCallback(async (meetingId: string, displayName: string) => {
    try {
      console.log('Starting meeting join process...');
      
      // Step 1: Connect to socket server
      console.log('Connecting to socket server...');
      await socketService.connect();
      console.log('Socket connected successfully');
      
      // Step 2: Initialize media with fallback options
      console.log('Initializing media...');
      let stream: MediaStream;
      try {
        // Try with both video and audio first
        stream = await webrtcService.initializeMedia({ video: true, audio: true });
      } catch (mediaError) {
        console.warn('Failed to get video/audio, trying audio only:', mediaError);
        try {
          // Fallback to audio only
          stream = await webrtcService.initializeMedia({ video: false, audio: true });
        } catch (audioError) {
          console.warn('Failed to get audio, proceeding without media:', audioError);
          // Create a dummy stream if media access fails completely
          stream = new MediaStream();
          toast.error('Camera/microphone access denied. You can still join but won\'t be able to share media.');
        }
      }
      setLocalStream(stream);
      console.log('Media initialized successfully');

      const participantId = socketService.socketInstance!.id;
      const localParticipant: Participant = {
        id: participantId,
        name: displayName,
        isLocal: true,
        isMuted: false,
        isVideoOff: stream.getVideoTracks().length === 0,
        stream,
      };

      webrtcService.addParticipant(localParticipant);
      webrtcService.localParticipantId = participantId;

      const urlParams = new URLSearchParams(window.location.search);
      const isHost = urlParams.get('host') === 'true';

      console.log('Emitting meeting join event...');
      socketService.emit('meeting:join', { 
        meetingId, 
        displayName, 
        isHost,
        participantId 
      });

      setMeetingState(prev => ({
        ...prev,
        meetingId,
        participantId,
        isHost,
        isConnected: true,
        participants: [localParticipant],
      }));

      console.log('Meeting joined successfully, local participant added:', localParticipant);
      return { meetingId, participantId };
    } catch (error) {
      console.error('Failed to join meeting:', error);
      
      // Provide more specific error messages
      if (error.message.includes('connect')) {
        toast.error('Cannot connect to server. Please check if the server is running.');
      } else if (error.message.includes('media') || error.message.includes('getUserMedia')) {
        toast.error('Camera/microphone access failed. Please allow permissions and try again.');
      } else {
        toast.error(`Failed to join meeting: ${error.message}`);
      }
      throw error;
    }
  }, []);

  const leaveMeeting = useCallback(() => {
    webrtcService.cleanup();
    socketService.disconnect();
    setLocalStream(null);
    setMeetingState({
      meetingId: null,
      participantId: null,
      participants: [],
      isConnected: false,
      isHost: false,
      currentDateTime: new Date(),
      datetimeVersion: 0,
      chatMessages: [],
    });
  }, []);

  const updateDateTime = useCallback((newDateTime: Date) => {
    console.log('updateDateTime called:', { 
      isHost: meetingState.isHost, 
      meetingId: meetingState.meetingId, 
      newDateTime 
    });
    
    if (!meetingState.isHost || !meetingState.meetingId) {
      console.log('Cannot update: not host or no meeting ID');
      return;
    }

    const newVersion = meetingState.datetimeVersion + 1;
    console.log('Emitting datetime update:', {
      newDateTime: newDateTime.toISOString(),
      version: newVersion,
    });
    
    socketService.emit('meeting:datetime:update', {
      newDateTime: newDateTime.toISOString(),
      version: newVersion,
    });
  }, [meetingState.isHost, meetingState.meetingId, meetingState.datetimeVersion]);

  const toggleAudio = useCallback((muted: boolean) => {
    console.log('Toggling audio, muted:', muted);
    webrtcService.toggleAudio(muted);
    socketService.emit('participant:update', { isMuted: muted });
    
    // Update local participant state
    setMeetingState(prev => ({
      ...prev,
      participants: prev.participants.map(p => 
        p.isLocal ? { ...p, isMuted: muted } : p
      ),
    }));
  }, []);

  const toggleVideo = useCallback((videoOff: boolean) => {
    console.log('Toggling video, videoOff:', videoOff);
    webrtcService.toggleVideo(videoOff);
    socketService.emit('participant:update', { isVideoOff: videoOff });
    
    // Update local participant state
    setMeetingState(prev => ({
      ...prev,
      participants: prev.participants.map(p => 
        p.isLocal ? { ...p, isVideoOff: videoOff } : p
      ),
    }));
  }, []);

  const sendChatMessage = useCallback((text: string) => {
    if (!text.trim() || !meetingState.participantId) return;
    
    socketService.emit('chat:message', { text: text.trim() });
  }, [meetingState.participantId]);

  const sendReaction = useCallback((emoji: string) => {
    if (!meetingState.participantId) return;
    
    socketService.emit('meeting:reaction', { emoji });
  }, [meetingState.participantId]);

  const toggleHandRaise = useCallback((isRaised: boolean) => {
    if (!meetingState.participantId) return;
    
    socketService.emit('meeting:hand-raise', { isRaised });
  }, [meetingState.participantId]);

  // Socket event handlers
  useEffect(() => {
    if (!socketService.connected) return;

    const handleMeetingJoined = async (data: { participantId: string; participants: Record<string, unknown>[]; currentDateTime: string; datetimeVersion: number; chatMessages: Record<string, unknown>[] }) => {
      console.log('Meeting joined via socket:', data);

      // Cast participants to proper type
      const participants = data.participants as unknown as SocketParticipant[];

      // Always update meeting state when we receive the joined event
      const serverParticipants = (participants || []).map(p => ({
        id: p.id,
        name: p.name,
        isLocal: p.id === data.participantId,
        isMuted: p.isMuted || false,
        isVideoOff: p.isVideoOff || false,
        stream: p.id === data.participantId ? localStream : undefined
      }));

      // Add participants to WebRTC service and create peers for existing participants
      for (const p of serverParticipants) {
        if (!p.isLocal) {
          webrtcService.addParticipant(p);
          try {
            // Only initiate if our ID is lexicographically smaller to avoid both sides initiating
            const shouldInitiate = data.participantId < p.id;
            await webrtcService.createPeer(p.id, shouldInitiate);
          } catch (error) {
            console.error('Failed to create peer for existing participant:', p.id, error);
          }
        }
      }

      // Load initial chat messages
      const chatMessages = data.chatMessages as unknown as SocketChatMessage[];
      const initialMessages = (chatMessages || []).map(msg => ({
        ...msg,
        isOwn: msg.senderId === data.participantId
      }));

      setMeetingState(prev => ({
        ...prev,
        participants: serverParticipants.length > 0 ? serverParticipants : prev.participants,
        currentDateTime: new Date(data.currentDateTime),
        datetimeVersion: data.datetimeVersion,
        chatMessages: initialMessages,
      }));

      toast.success('Successfully joined the meeting!');
    };

    const handleSocketError = (error: { message: string }) => {
      console.error('Socket error:', error);
      toast.error(`Connection error: ${error.message}`);
    };

    const handleParticipantJoined = async (participant: Record<string, unknown>) => {
      console.log('Participant joined:', participant);
      const p = participant as unknown as SocketParticipant;
      const newParticipant: Participant = {
        id: p.id,
        name: p.name,
        isLocal: false,
        isMuted: p.isMuted || false,
        isVideoOff: p.isVideoOff || false,
      };

      webrtcService.addParticipant(newParticipant);
      try {
        // Only initiate if our ID is lexicographically smaller to avoid both sides initiating
        const shouldInitiate = meetingState.participantId! < p.id;
        await webrtcService.createPeer(p.id, shouldInitiate);
      } catch (error) {
        console.error('Failed to create peer:', error);
      }

      setMeetingState(prev => ({
        ...prev,
        participants: [...prev.participants.filter(p => p.id !== newParticipant.id), newParticipant],
      }));
    };

    const handleParticipantsUpdated = (data: { participants: SocketParticipant[] }) => {
      console.log('Participants updated:', data);

      const updatedParticipants = data.participants.map(p => {
        const existing = meetingState.participants.find(ep => ep.id === p.id);
        return {
          id: p.id,
          name: p.name,
          isLocal: p.id === meetingState.participantId,
          isMuted: p.isMuted || false,
          isVideoOff: p.id === meetingState.participantId ? (existing?.isVideoOff ?? false) : (p.isVideoOff || false),
          stream: existing?.stream
        };
      });

      setMeetingState(prev => ({
        ...prev,
        participants: updatedParticipants,
      }));
    };

    const handleParticipantLeft = (data: { participantId: string; reason: string }) => {
      console.log('Participant left:', data);
      webrtcService.removeParticipant(data.participantId);
      setMeetingState(prev => ({
        ...prev,
        participants: prev.participants.filter(p => p.id !== data.participantId),
      }));
    };

    const handleDateTimeChanged = (data: { newDateTime: string; version: number; changedBy: string; changedAt: string }) => {
      setMeetingState(prev => ({
        ...prev,
        currentDateTime: new Date(data.newDateTime),
        datetimeVersion: data.version,
      }));
      
      toast.success('Meeting time updated', {
        description: `Updated by ${data.changedBy}`,
      });
    };

    const handleWebRTCOffer = async (data: { from: string; to: string; offer: RTCSessionDescriptionInit }) => {
      if (data.to === meetingState.participantId) {
        await webrtcService.handleOffer(data.from, data.offer);
      }
    };

    const handleWebRTCAnswer = (data: { from: string; to: string; answer: RTCSessionDescriptionInit }) => {
      if (data.to === meetingState.participantId) {
        webrtcService.handleAnswer(data.from, data.answer);
      }
    };

    const handleWebRTCIceCandidate = (data: { from: string; to: string; candidate: unknown }) => {
      if (data.to === meetingState.participantId) {
        webrtcService.handleIceCandidate(data.from, data.candidate);
      }
    };

    const handleNewChatMessage = (message: SocketChatMessage) => {
      const chatMessage: ChatMessage = {
        ...message,
        isOwn: message.senderId === meetingState.participantId,
      };
      
      setMeetingState(prev => ({
        ...prev,
        chatMessages: [...prev.chatMessages, chatMessage],
      }));
    };

    const handleParticipantUpdated = (data: { participantId: string; isMuted: boolean; isVideoOff: boolean }) => {
      console.log('Participant updated:', data);
      setMeetingState(prev => ({
        ...prev,
        participants: prev.participants.map(p => 
          p.id === data.participantId 
            ? { ...p, isMuted: data.isMuted, isVideoOff: data.isVideoOff }
            : p
        ),
      }));
    };

    // Register event listeners
    socketService.on('meeting:joined', handleMeetingJoined);
    socketService.on('meeting:participant-joined', handleParticipantJoined);
    socketService.on('meeting:participant-left', handleParticipantLeft);
    socketService.on('meeting:participants-updated', handleParticipantsUpdated);
    socketService.on('participant:updated', handleParticipantUpdated);
    socketService.on('meeting:datetime:changed', handleDateTimeChanged);
    socketService.on('chat:new-message', handleNewChatMessage);
    socketService.on('webrtc:offer', handleWebRTCOffer);
    socketService.on('webrtc:answer', handleWebRTCAnswer);
    socketService.on('webrtc:ice-candidate', handleWebRTCIceCandidate);
    socketService.on('error', handleSocketError);

    return () => {
      socketService.off('meeting:joined', handleMeetingJoined);
      socketService.off('meeting:participant-joined', handleParticipantJoined);
      socketService.off('meeting:participant-left', handleParticipantLeft);
      socketService.off('meeting:participants-updated', handleParticipantsUpdated);
      socketService.off('participant:updated', handleParticipantUpdated);
      socketService.off('meeting:datetime:changed', handleDateTimeChanged);
      socketService.off('chat:new-message', handleNewChatMessage);
      socketService.off('webrtc:offer', handleWebRTCOffer);
      socketService.off('webrtc:answer', handleWebRTCAnswer);
      socketService.off('webrtc:ice-candidate', handleWebRTCIceCandidate);
      socketService.off('error', handleSocketError);
    };
  }, [meetingState.participantId, localStream, meetingState.participants]);

  // WebRTC stream update handler
  useEffect(() => {
    webrtcService.onParticipantStreamUpdate = (participantId: string, stream: MediaStream) => {
      setMeetingState(prev => ({
        ...prev,
        participants: prev.participants.map(p =>
          p.id === participantId ? { ...p, stream } : p
        ),
      }));
    };

    return () => {
      webrtcService.onParticipantStreamUpdate = undefined;
    };
  }, []);

  return {
    meetingState,
    localStream,
    createMeeting,
    joinMeeting,
    leaveMeeting,
    updateDateTime,
    toggleAudio,
    toggleVideo,
    sendChatMessage,
    sendReaction,
    toggleHandRaise,
  };
}