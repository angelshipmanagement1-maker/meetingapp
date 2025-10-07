import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, VideoOff, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Participant } from "@/services/webrtcService";

interface VideoTileProps {
  participant: Participant;
  isHost: boolean;
  isSpotlight?: boolean;
}

export function VideoTile({ participant, isHost, isSpotlight = false }: VideoTileProps) {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Set video stream when available
  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream]);

  // Generate unique gradient for each participant
  const gradients = [
    "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
    "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
    "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
    "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
  ];
  
  const gradientIndex = Math.abs(participant.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % gradients.length;

  const handleKick = () => {
    toast.error(`${participant.name} has been removed from the meeting`);
  };

  const handleMute = () => {
    toast.success(`${participant.name} has been muted`);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-border bg-card transition-smooth shadow-card hover:shadow-elevated ${
        isSpotlight ? "min-h-[400px]" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Video/Avatar Background */}
      <div className="absolute inset-0">
        {participant.isVideoOff || !participant.stream ? (
          <div 
            className="flex h-full items-center justify-center animate-fade-in"
            style={{ background: gradients[gradientIndex] }}
          >
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm animate-scale-in">
              <span className="text-4xl font-bold text-white">
                {participant.name.charAt(0)}
              </span>
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={participant.isLocal}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {/* Participant Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 glass-strong rounded-lg px-3 py-2 shadow-card">
            <span className="text-sm font-medium text-white">
              {participant.name}
            </span>
            <div className="flex items-center gap-1">
              {participant.isMuted ? (
                <MicOff className="h-3 w-3 text-destructive" />
              ) : (
                <Mic className="h-3 w-3 text-success" />
              )}
              {participant.isVideoOff && (
                <VideoOff className="h-3 w-3 text-destructive" />
              )}
            </div>
          </div>

          {/* Host Controls */}
          {isHost && !participant.isLocal && isHovered && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="glass"
                  size="icon"
                  className="h-8 w-8 rounded-lg transition-spring hover:scale-110"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-strong border-border shadow-elevated">
                <DropdownMenuItem onClick={handleMute}>
                  <MicOff className="mr-2 h-4 w-4" />
                  Mute Participant
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleKick} className="text-destructive">
                  Remove from Meeting
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Local Participant Indicator */}
      {participant.isLocal && (
        <div className="absolute left-4 top-4 animate-bounce-in">
          <div className="glass-strong rounded-lg px-2 py-1 shadow-card">
            <span className="text-xs font-medium text-accent">You</span>
          </div>
        </div>
      )}
    </div>
  );
}
