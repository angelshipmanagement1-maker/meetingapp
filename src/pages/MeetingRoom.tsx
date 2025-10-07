import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  MessageSquare,
  Users,
  Settings,
  Copy,
  Check,
  MonitorUp,
  Circle,
  Maximize,
  Minimize
} from "lucide-react";
import { VideoGrid } from "@/components/meeting/VideoGrid";
import { ChatSidebar } from "@/components/meeting/ChatSidebar";
import { ParticipantsList } from "@/components/meeting/ParticipantsList";
import { LiveDateTime } from "@/components/meeting/LiveDateTime";
import { SettingsModal } from "@/components/meeting/SettingsModal";
import { ConnectionStatus } from "@/components/meeting/ConnectionStatus";
import { ReactionsBar } from "@/components/meeting/ReactionsBar";
import { LayoutSwitcher, LayoutMode } from "@/components/meeting/LayoutSwitcher";
import { HandRaiseButton } from "@/components/meeting/HandRaiseButton";
import { useMeeting } from "@/hooks/useMeeting";
import { STORAGE_KEYS } from "@/utils/constants";
import { toast } from "sonner";

export default function MeetingRoom() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const meetingId = searchParams.get("mid");
  const isHost = searchParams.get("host") === "true";
  
  const { meetingState, joinMeeting, leaveMeeting, updateDateTime, toggleAudio, toggleVideo, sendChatMessage, sendReaction, toggleHandRaise } = useMeeting();
  
  // Get current participant's audio/video state from meeting state
  const currentParticipant = meetingState.participants.find(p => p.isLocal);
  const isMuted = currentParticipant?.isMuted || false;
  const isVideoOff = currentParticipant?.isVideoOff || false;
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected" | "poor">("connected");
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("grid");
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Simulate connection status changes
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly simulate connection quality changes (for demo)
      const statuses: typeof connectionStatus[] = ["connected", "connected", "connected", "poor"];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      setConnectionStatus(randomStatus);
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Join meeting on component mount
  useEffect(() => {
    if (!meetingId) {
      console.error('MeetingRoom: No meeting ID provided');
      toast.error('No meeting ID provided');
      navigate("/");
      return;
    }

    const displayName = sessionStorage.getItem(STORAGE_KEYS.DISPLAY_NAME) || 'Anonymous';
    console.log('MeetingRoom: Starting join process', { meetingId, displayName, isHost });
    
    // Show loading toast
    toast.info('Joining meeting...');
    
    // Always join with meetingId - let the backend handle creation
    joinMeeting(meetingId, displayName)
      .then(() => {
        console.log('MeetingRoom: Successfully joined meeting');
      })
      .catch((error) => {
        console.error('MeetingRoom: Failed to join meeting:', error);
        toast.error(`Failed to join meeting: ${error.message}`);
        // Don't navigate away immediately, let user try again
        setTimeout(() => {
          navigate('/');
        }, 3000);
      });

    return () => {
      console.log('MeetingRoom: Leaving meeting on unmount');
      leaveMeeting();
    };
  }, [meetingId, isHost, navigate, joinMeeting, leaveMeeting]);

  const handleLeaveMeeting = () => {
    console.log('MeetingRoom: User manually leaving meeting');
    leaveMeeting();
    toast.success("You left the meeting");
    navigate("/");
  };

  const handleCopyLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    toast.success("Meeting link copied!");
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleDateTimeUpdate = (newDateTime: Date) => {
    console.log('Updating meeting date/time:', newDateTime);
    updateDateTime(newDateTime);
    toast.success("Meeting time updated", {
      description: newDateTime.toLocaleString(),
    });
  };

  const handleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
    toast.success(isScreenSharing ? "Screen sharing stopped" : "Screen sharing started");
  };

  const handleRecording = () => {
    setIsRecording(!isRecording);
    toast.success(
      isRecording ? "Recording stopped" : "Recording started",
      {
        description: isRecording ? "Recording saved" : "This meeting is now being recorded",
      }
    );
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullScreenChange);
  }, []);

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-6 py-4 glass-strong shadow-card animate-slide-down">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold gradient-primary bg-clip-text text-transparent hover:scale-105 transition-spring">
            MeetTime
          </h1>
          <div className="h-6 w-px bg-border" />
          <span className="text-sm text-muted-foreground">
            Meeting ID: {meetingId}
          </span>
          {isRecording && (
            <div className="flex items-center gap-2 rounded-full bg-destructive/20 px-3 py-1.5 animate-pulse shadow-card">
              <Circle className="h-2 w-2 fill-destructive text-destructive animate-pulse" />
              <span className="text-xs font-medium text-destructive">Recording</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <ConnectionStatus status={connectionStatus} />
          
          <LiveDateTime 
            currentDateTime={meetingState.currentDateTime}
            onUpdate={handleDateTimeUpdate}
            isHost={meetingState.isHost}
          />
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyLink}
          className="gap-2 transition-spring hover:scale-105"
        >
          {linkCopied ? (
            <>
              <Check className="h-4 w-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy Link
            </>
          )}
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 p-4">
          <VideoGrid participants={meetingState.participants} isHost={meetingState.isHost} layoutMode={layoutMode} />
        </div>

        {/* Sidebar */}
        {showChat && (
          <ChatSidebar 
            messages={meetingState.chatMessages}
            onSendMessage={sendChatMessage}
            onClose={() => setShowChat(false)} 
          />
        )}
        {showParticipants && (
          <ParticipantsList 
            participants={meetingState.participants}
            isHost={meetingState.isHost} 
            onClose={() => setShowParticipants(false)} 
          />
        )}
      </div>

      {/* Control Bar */}
      <div className="border-t border-border px-6 py-4 glass-strong shadow-elevated animate-slide-up">
        <div className="flex items-center justify-center gap-3">
          <Button
            variant={isMuted ? "destructive" : "glass"}
            size="icon"
            onClick={() => toggleAudio(!isMuted)}
            className="h-12 w-12 rounded-full transition-spring hover:scale-110 shadow-card"
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>

          <Button
            variant={isVideoOff ? "destructive" : "glass"}
            size="icon"
            onClick={() => toggleVideo(!isVideoOff)}
            className="h-12 w-12 rounded-full transition-spring hover:scale-110 shadow-card"
          >
            {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
          </Button>

          <Button
            variant="destructive"
            size="icon"
            onClick={handleLeaveMeeting}
            className="h-12 w-12 rounded-full transition-spring hover:scale-110 shadow-card glow"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>

          <div className="mx-4 h-8 w-px bg-border" />

          <ReactionsBar onReaction={sendReaction} />

          <HandRaiseButton 
            isRaised={isHandRaised} 
            onToggle={(raised) => {
              setIsHandRaised(raised);
              toggleHandRaise(raised);
            }} 
          />

          <LayoutSwitcher 
            currentLayout={layoutMode}
            onLayoutChange={setLayoutMode}
          />

          <Button
            variant={showChat ? "default" : "glass"}
            size="icon"
            onClick={() => {
              setShowChat(!showChat);
              setShowParticipants(false);
            }}
            className="h-12 w-12 rounded-full transition-spring hover:scale-110 shadow-card"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>

          <Button
            variant={showParticipants ? "default" : "glass"}
            size="icon"
            onClick={() => {
              setShowParticipants(!showParticipants);
              setShowChat(false);
            }}
            className="h-12 w-12 rounded-full transition-spring hover:scale-110 shadow-card"
          >
            <Users className="h-5 w-5" />
          </Button>

          <Button
            variant={isScreenSharing ? "default" : "glass"}
            size="icon"
            onClick={handleScreenShare}
            className="h-12 w-12 rounded-full transition-spring hover:scale-110 shadow-card"
          >
            <MonitorUp className="h-5 w-5" />
          </Button>

          <Button
            variant="glass"
            size="icon"
            onClick={toggleFullScreen}
            className="h-12 w-12 rounded-full transition-spring hover:scale-110 shadow-card"
          >
            {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </Button>

          <Button
            variant="glass"
            size="icon"
            onClick={() => setShowSettings(true)}
            className="h-12 w-12 rounded-full transition-spring hover:scale-110 shadow-card"
          >
            <Settings className="h-5 w-5" />
          </Button>

          {isHost && (
            <Button
              variant={isRecording ? "destructive" : "glass"}
              size="icon"
              onClick={handleRecording}
              className="h-12 w-12 rounded-full transition-spring hover:scale-110 shadow-card"
            >
              <Circle className={isRecording ? "h-4 w-4 fill-current" : "h-5 w-5"} />
            </Button>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal open={showSettings} onOpenChange={setShowSettings} />
    </div>
  );
}