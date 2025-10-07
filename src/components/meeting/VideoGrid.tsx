import { VideoTile } from "./VideoTile";
import { LayoutMode } from "./LayoutSwitcher";
import { Participant } from "@/services/webrtcService";

interface VideoGridProps {
  participants: Participant[];
  isHost: boolean;
  layoutMode: LayoutMode;
}

export function VideoGrid({ participants, isHost, layoutMode }: VideoGridProps) {
  if (participants.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>Waiting for participants to join...</p>
      </div>
    );
  }

  const getGridStyle = () => {
    if (layoutMode === "spotlight") {
      return {
        display: "grid",
        gridTemplateColumns: "1fr",
        gridTemplateRows: "1fr auto",
        gap: "1rem",
      };
    }

    if (layoutMode === "sidebar") {
      return {
        display: "grid",
        gridTemplateColumns: "1fr 240px",
        gap: "1rem",
      };
    }

    // Grid layout - improved for more participants
    const cols = participants.length === 1 ? 1 : 
                participants.length === 2 ? 2 :
                participants.length <= 4 ? 2 :
                participants.length <= 6 ? 3 :
                participants.length <= 9 ? 3 : 4;
    
    const rows = participants.length <= 2 ? 1 :
                participants.length <= 4 ? 2 :
                participants.length <= 6 ? 2 :
                participants.length <= 9 ? 3 : 
                Math.ceil(participants.length / 4);
    
    return {
      display: "grid",
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gridTemplateRows: `repeat(${rows}, 1fr)`,
      gap: "0.75rem",
    };
  };

  if (layoutMode === "spotlight") {
    const [mainParticipant, ...others] = participants;
    return (
      <div className="h-full w-full" style={getGridStyle()}>
        <VideoTile participant={mainParticipant} isHost={isHost} isSpotlight />
        <div className="grid grid-cols-4 gap-2">
          {others.map((participant) => (
            <VideoTile key={participant.id} participant={participant} isHost={isHost} />
          ))}
        </div>
      </div>
    );
  }

  if (layoutMode === "sidebar") {
    const [mainParticipant, ...others] = participants;
    return (
      <div className="h-full w-full" style={getGridStyle()}>
        <VideoTile participant={mainParticipant} isHost={isHost} />
        <div className="space-y-2">
          {others.map((participant) => (
            <VideoTile key={participant.id} participant={participant} isHost={isHost} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-2">
      <div className="grid h-full" style={getGridStyle()}>
        {participants.map((participant) => (
          <VideoTile key={participant.id} participant={participant} isHost={isHost} />
        ))}
      </div>
    </div>
  );
}
