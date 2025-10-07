import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings } from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { STORAGE_KEYS } from "@/utils/constants";
import { CameraPreview } from "@/components/CameraPreview";
import { toast } from "sonner";

export default function PreJoin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const meetingId = searchParams.get("mid");
  const isHost = searchParams.get("host") === "true";

  const [displayName, setDisplayName] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState("default");
  const [selectedMic, setSelectedMic] = useState("default");
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!meetingId) {
      navigate("/");
    }
  }, [meetingId, navigate]);

  // Debug logging
  useEffect(() => {
    console.log('PreJoin: Component mounted with meetingId:', meetingId);
  }, [meetingId]);

  const handleJoin = async () => {
    if (!displayName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    setIsJoining(true);
    
    try {
      // Store settings in sessionStorage for the meeting room
      sessionStorage.setItem(STORAGE_KEYS.DISPLAY_NAME, displayName);
      sessionStorage.setItem(STORAGE_KEYS.INITIAL_MUTE, String(isMuted));
      sessionStorage.setItem(STORAGE_KEYS.INITIAL_VIDEO_OFF, String(isVideoOff));
      
      console.log('PreJoin: Starting join process...');
      toast.info('Connecting to meeting...');
      
      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('PreJoin: Navigating to meeting room...');
      navigate(`/meeting?mid=${meetingId}&host=${isHost}`);
    } catch (error) {
      console.error("PreJoin error:", error);
      toast.error("Failed to join meeting. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden gradient-dark p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 gradient-mesh opacity-20 animate-pulse" />
      
      <Card className="relative z-10 w-full max-w-4xl glass-strong border-border p-8 animate-scale-in shadow-elevated">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Camera Preview */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Ready to join?</h2>

            <CameraPreview
              isVideoEnabled={!isVideoOff}
              isAudioEnabled={!isMuted}
              onVideoToggle={(enabled) => setIsVideoOff(!enabled)}
              onAudioToggle={(enabled) => setIsMuted(!enabled)}
            />

            {/* Device Selection */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="camera">Camera</Label>
                <Select value={selectedCamera} onValueChange={setSelectedCamera}>
                  <SelectTrigger id="camera" className="glass-strong transition-smooth hover:glow">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-strong border-border shadow-elevated">
                    <SelectItem value="default">Default Camera</SelectItem>
                    <SelectItem value="hd-webcam">HD Webcam</SelectItem>
                    <SelectItem value="laptop">Laptop Camera</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="microphone">Microphone</Label>
                <Select value={selectedMic} onValueChange={setSelectedMic}>
                  <SelectTrigger id="microphone" className="glass-strong transition-smooth hover:glow">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-strong border-border shadow-elevated">
                    <SelectItem value="default">Default Microphone</SelectItem>
                    <SelectItem value="headset">Headset Mic</SelectItem>
                    <SelectItem value="external">External Mic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Join Form */}
          <div className="flex flex-col justify-center space-y-6">
            <div>
              <h3 className="mb-2 text-xl font-semibold">Meeting Details</h3>
              <p className="text-sm text-muted-foreground">
                Meeting ID: <span className="font-mono text-foreground">{meetingId}</span>
              </p>
              {isHost && (
                <p className="mt-1 text-sm text-accent">You're joining as the host</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleJoin()}
                  className="glass-strong transition-smooth focus:glow"
                  autoFocus
                />
              </div>

              <Button
                onClick={handleJoin}
                variant="hero"
                size="lg"
                className="w-full hover-lift"
                disabled={isJoining}
              >
                {isJoining ? (
                  <>
                    <Loading size="sm" />
                    <span className="ml-2">Joining...</span>
                  </>
                ) : (
                  "Join Meeting"
                )}
              </Button>

              <Button
                onClick={() => navigate("/")}
                variant="ghost"
                size="lg"
                className="w-full"
              >
                Cancel
              </Button>
            </div>

            <div className="rounded-lg border border-border bg-secondary/50 p-4 transition-smooth hover:bg-secondary/70">
              <div className="flex items-start gap-3">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Before you join:</p>
                  <ul className="mt-2 space-y-1">
                    <li>• Test your camera and microphone above</li>
                    <li>• Check your internet connection</li>
                    <li>• Find a quiet space</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}