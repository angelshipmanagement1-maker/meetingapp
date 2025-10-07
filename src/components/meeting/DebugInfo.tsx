import { Participant } from "@/services/webrtcService";

interface DebugInfoProps {
  participants: Participant[];
  meetingId: string | null;
  participantId: string | null;
}

export function DebugInfo({ participants, meetingId, participantId }: DebugInfoProps) {
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-sm rounded-lg bg-black/80 p-4 text-xs text-white backdrop-blur-sm">
      <h4 className="font-bold text-accent">Debug Info</h4>
      <p>Meeting ID: {meetingId}</p>
      <p>My ID: {participantId}</p>
      <p>Participants ({participants.length}):</p>
      <ul className="ml-2 space-y-1">
        {participants.map(p => (
          <li key={p.id} className={p.isLocal ? "text-accent" : ""}>
            {p.name} ({p.id.slice(0, 8)}...) 
            {p.isLocal && " (me)"}
          </li>
        ))}
      </ul>
    </div>
  );
}