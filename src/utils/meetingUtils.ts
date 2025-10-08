// Meeting utility functions
export function generateParticipantId(): string {
  return `participant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function sanitizeParticipant(participant: any) {
  return {
    id: participant?.id || generateParticipantId(),
    name: participant?.name || 'Anonymous',
    role: participant?.role || 'participant',
    isMuted: participant?.isMuted || false,
    isVideoOff: participant?.isVideoOff || false,
    joinedAt: participant?.joinedAt || new Date().toISOString(),
    isLocal: participant?.isLocal || false
  };
}

export function sanitizeMeetingData(data: any) {
  return {
    participantId: data?.participantId || generateParticipantId(),
    participants: (data?.participants || []).map(sanitizeParticipant),
    currentDateTime: data?.currentDateTime || new Date().toISOString(),
    datetimeVersion: data?.datetimeVersion || 0,
    chatMessages: data?.chatMessages || []
  };
}