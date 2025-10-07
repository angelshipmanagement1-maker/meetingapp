import { X, Mic, MicOff, Video, VideoOff, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Participant } from "@/services/webrtcService";

interface ParticipantsListProps {
  participants: Participant[];
  onClose: () => void;
}

export function ParticipantsList({ participants, onClose }: ParticipantsListProps) {
  console.log('ParticipantsList rendered with:', participants.length, 'participants');
  
  return (
    <div className="flex h-full w-80 flex-col border-l border-border glass-strong shadow-elevated animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div>
          <h3 className="font-semibold text-foreground">Participants</h3>
          <p className="text-xs text-muted-foreground">
            {participants.length} in meeting
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="transition-spring hover:scale-110">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Participants List */}
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {participants.map((participant) => (
            <div
              key={participant.id}
              className="flex items-center justify-between rounded-lg p-3 transition-smooth hover:bg-secondary/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-sm font-semibold text-white">
                  {participant.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{participant.name}</p>
                    {participant.isLocal && (
                      <Crown className="h-3 w-3 text-accent" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {participant.isMuted ? (
                      <MicOff className="h-3 w-3 text-destructive" />
                    ) : (
                      <Mic className="h-3 w-3 text-success" />
                    )}
                    {participant.isVideoOff ? (
                      <VideoOff className="h-3 w-3 text-destructive" />
                    ) : (
                      <Video className="h-3 w-3 text-success" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
