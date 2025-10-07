import { useState, useEffect } from "react";
import { Calendar, Clock, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

interface LiveDateTimeProps {
  currentDateTime: Date;
  onUpdate: (newDateTime: Date) => void;
  isHost: boolean;
}

export function LiveDateTime({ currentDateTime, onUpdate, isHost }: LiveDateTimeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [dateValue, setDateValue] = useState(format(currentDateTime, "yyyy-MM-dd"));
  const [timeValue, setTimeValue] = useState(format(new Date(), "HH:mm:ss"));
  const [isAnimating, setIsAnimating] = useState(false);
  const [liveTime, setLiveTime] = useState(new Date());

  // Update live time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSave = () => {
    try {
      const newDateTime = new Date(`${dateValue}T${timeValue}`);
      if (!isNaN(newDateTime.getTime())) {
        onUpdate(newDateTime);
        setIsEditing(false);

        // Trigger animation
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 600);
      } else {
        console.error("Invalid date/time format");
      }
    } catch (error) {
      console.error("Error parsing date/time:", error);
    }
  };

  const handleCancel = () => {
    setDateValue(format(currentDateTime, "yyyy-MM-dd"));
    setTimeValue(format(liveTime, "HH:mm:ss"));
    setIsEditing(false);
  };

  const DisplayContent = () => (
    <div className={`flex items-center gap-3 rounded-xl px-4 py-2 glass-strong shadow-card transition-all ${
      isAnimating ? "animate-highlight glow-strong" : ""
    }`}>
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-accent" />
        <span className="font-mono text-sm font-medium">
          {format(currentDateTime, "dd-MM-yyyy")}
        </span>
      </div>
      <div className="h-4 w-px bg-border" />
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-accent" />
        <span className="font-mono text-sm font-medium">
          {format(liveTime, "HH:mm:ss")}
        </span>
      </div>
      {isHost && (
        <>
          <div className="h-4 w-px bg-border" />
          <Edit2 className="h-3 w-3 text-muted-foreground" />
        </>
      )}
    </div>
  );

  if (!isHost) {
    return <DisplayContent />;
  }

  return (
    <Popover open={isEditing} onOpenChange={setIsEditing}>
      <PopoverTrigger asChild>
        <button className="transition-smooth hover:scale-105">
          <DisplayContent />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 glass-strong shadow-elevated animate-scale-in" align="center">
        <div className="space-y-4">
          <div>
            <h4 className="mb-3 font-semibold">Edit Meeting Date & Time</h4>
            <p className="text-xs text-muted-foreground">
              Changes will be visible to all participants in real-time
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Date
              </label>
              <Input
                type="date"
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
                className="font-mono glass-strong transition-smooth focus:glow"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Time
              </label>
              <Input
                type="time"
                step="1"
                value={timeValue}
                onChange={(e) => setTimeValue(e.target.value)}
                className="font-mono glass-strong transition-smooth focus:glow"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              variant="default"
              size="sm"
              className="flex-1 transition-spring hover:scale-105"
            >
              <Check className="mr-2 h-4 w-4" />
              Save
            </Button>
            <Button
              onClick={handleCancel}
              variant="ghost"
              size="sm"
              className="flex-1 transition-spring hover:scale-105"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
