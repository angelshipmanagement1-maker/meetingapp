import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Camera, Mic } from "lucide-react";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [selectedCamera, setSelectedCamera] = useState("default");
  const [selectedMic, setSelectedMic] = useState("default");
  const [selectedSpeaker, setSelectedSpeaker] = useState("default");
  const [noiseCancellation, setNoiseCancellation] = useState(true);
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [autoGainControl, setAutoGainControl] = useState(true);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Video Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Camera className="h-5 w-5 text-primary" />
              <h3>Video</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="camera">Camera</Label>
              <Select value={selectedCamera} onValueChange={setSelectedCamera}>
                <SelectTrigger id="camera">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default Camera</SelectItem>
                  <SelectItem value="hd-webcam">HD Webcam</SelectItem>
                  <SelectItem value="laptop-camera">Laptop Camera</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-secondary">
              <div className="flex h-full items-center justify-center gradient-primary">
                <span className="text-sm text-primary-foreground">Camera Preview</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Audio Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Mic className="h-5 w-5 text-primary" />
              <h3>Audio</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="microphone">Microphone</Label>
              <Select value={selectedMic} onValueChange={setSelectedMic}>
                <SelectTrigger id="microphone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default Microphone</SelectItem>
                  <SelectItem value="headset">Headset Mic</SelectItem>
                  <SelectItem value="external">External Mic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="speaker">Speaker</Label>
              <Select value={selectedSpeaker} onValueChange={setSelectedSpeaker}>
                <SelectTrigger id="speaker">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default Speaker</SelectItem>
                  <SelectItem value="headphones">Headphones</SelectItem>
                  <SelectItem value="external">External Speaker</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 rounded-lg bg-secondary/50 p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Noise Cancellation</Label>
                  <p className="text-xs text-muted-foreground">
                    Reduce background noise
                  </p>
                </div>
                <Switch
                  checked={noiseCancellation}
                  onCheckedChange={setNoiseCancellation}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Echo Cancellation</Label>
                  <p className="text-xs text-muted-foreground">
                    Remove audio echo
                  </p>
                </div>
                <Switch
                  checked={echoCancellation}
                  onCheckedChange={setEchoCancellation}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Gain Control</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically adjust volume
                  </p>
                </div>
                <Switch
                  checked={autoGainControl}
                  onCheckedChange={setAutoGainControl}
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
