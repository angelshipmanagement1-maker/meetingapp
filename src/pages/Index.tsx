import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Clock, Users, Zap } from "lucide-react";
import { toast } from "sonner";
import { EnvironmentChecker } from "@/components/EnvironmentChecker";

const Index = () => {
  const navigate = useNavigate();
  const [meetingId, setMeetingId] = useState("");

  const handleCreateMeeting = () => {
    const newMeetingId = Math.random().toString(36).substring(2, 10);
    toast.success("Meeting created!");
    navigate(`/prejoin?mid=${newMeetingId}&host=true`);
  };

  const handleJoinMeeting = () => {
    if (!meetingId.trim()) {
      toast.error("Please enter a meeting ID");
      return;
    }
    navigate(`/prejoin?mid=${meetingId}`);
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden gradient-dark px-4">
      {/* Animated Background Mesh */}
      <div className="absolute inset-0 gradient-mesh opacity-30 animate-pulse" />
      
      {/* Environment Checker */}
      <div className="fixed top-4 left-4 right-4 z-50">
        <EnvironmentChecker />
      </div>
      
      <div className="relative z-10 w-full max-w-6xl space-y-12 py-12">
        {/* Hero Section */}
        <div className="text-center animate-slide-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full glass px-4 py-2 animate-bounce-in hover-lift">
            <Clock className="h-4 w-4 text-accent animate-pulse" />
            <span className="text-sm font-medium text-accent">Live Time Control</span>
          </div>
          
          <h1 className="mb-4 text-5xl font-bold md:text-7xl animate-scale-in">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent font-extrabold">
              MeetTime
            </span>
          </h1>
          
          <p className="mb-8 text-xl text-foreground/90 md:text-2xl animate-fade-in">
            Real-time video meetings with live editable date & time
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center animate-slide-up stagger-1">
            <Button
              onClick={handleCreateMeeting}
              variant="hero"
              size="lg"
              className="w-full sm:w-auto hover-lift"
            >
              <Video className="mr-2 h-5 w-5" />
              Create Meeting
            </Button>

            <div className="flex w-full gap-2 sm:w-auto">
              <Input
                placeholder="Enter meeting ID"
                value={meetingId}
                onChange={(e) => setMeetingId(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleJoinMeeting()}
                className="w-full sm:w-64 glass-strong transition-smooth focus:glow"
              />
              <Button
                onClick={handleJoinMeeting}
                variant="glass"
                size="lg"
                className="hover-lift"
              >
                Join
              </Button>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="glass border-border transition-smooth hover-lift hover-glow animate-slide-up stagger-1 shadow-card">
            <CardHeader>
              <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg gradient-primary glow transition-spring hover:scale-110">
                <Clock className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-foreground">Live Time Editing</CardTitle>
              <CardDescription className="text-muted-foreground">
                Edit meeting date & time during live calls with real-time sync across all participants
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="glass border-border transition-smooth hover-lift hover-glow animate-slide-up stagger-2 shadow-card">
            <CardHeader>
              <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg gradient-accent glow-accent transition-spring hover:scale-110">
                <Video className="h-6 w-6 text-accent-foreground" />
              </div>
              <CardTitle className="text-foreground">HD Video & Audio</CardTitle>
              <CardDescription className="text-muted-foreground">
                Crystal clear video calls with real-time chat and participant controls
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="glass border-border transition-smooth hover-lift hover-glow animate-slide-up stagger-3 shadow-card">
            <CardHeader>
              <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg gradient-primary glow transition-spring hover:scale-110">
                <Zap className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-foreground">Instant Setup</CardTitle>
              <CardDescription className="text-muted-foreground">
                No downloads or signups. Create or join meetings instantly with a simple link
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Demo Info */}
        <Card className="glass-strong border-accent/30 animate-slide-up stagger-4 shadow-elevated hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Users className="h-5 w-5 text-accent" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p className="transition-smooth hover:text-foreground">
              <strong className="text-foreground">Create:</strong> Click "Create Meeting" to start a new video conference and get a shareable link
            </p>
            <p className="transition-smooth hover:text-foreground">
              <strong className="text-foreground">Join:</strong> Enter a meeting ID or use the shared link to join an ongoing meeting
            </p>
            <p className="transition-smooth hover:text-foreground">
              <strong className="text-foreground">Control Time:</strong> As the host, edit the meeting's date and time — changes appear instantly for everyone
            </p>
            <div className="mt-4 pt-3 border-t border-border/50">
              <p className="text-xs">
                Having connection issues? <a href="/test" className="text-accent hover:underline transition-smooth">Run diagnostics</a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;