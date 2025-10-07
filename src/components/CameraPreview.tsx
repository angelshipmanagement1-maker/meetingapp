import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, Video, VideoOff, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CameraPreviewProps {
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  onVideoToggle: (enabled: boolean) => void;
  onAudioToggle: (enabled: boolean) => void;
  className?: string;
}

export function CameraPreview({
  isVideoEnabled,
  isAudioEnabled,
  onVideoToggle,
  onAudioToggle,
  className = ""
}: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>();

  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Setup audio level analysis
  const setupAudioAnalysis = useCallback(async (stream: MediaStream) => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      microphone.connect(analyser);

      // Resume audio context if needed (required in some browsers)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateAudioLevel = () => {
        if (analyserRef.current && audioContextRef.current?.state === 'running') {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(Math.min(average / 128, 1)); // Normalize to 0-1, cap at 1
          animationRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };

      updateAudioLevel();
    } catch (err) {
      console.error('Failed to setup audio analysis:', err);
      setAudioLevel(0);
    }
  }, []);

  // Handle video toggle
  const handleVideoToggle = useCallback(() => {
    onVideoToggle(!isVideoEnabled);
  }, [isVideoEnabled, onVideoToggle]);

  // Handle audio toggle
  const handleAudioToggle = useCallback(() => {
    onAudioToggle(!isAudioEnabled);
  }, [isAudioEnabled, onAudioToggle]);

  // Request media access
  const requestMediaAccess = useCallback(async () => {
    console.log('CameraPreview: Requesting media access...');

    try {
      setIsInitializing(true);
      setError(null);

      console.log('Requesting camera and microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true }
      });

      console.log('CameraPreview: Got media stream with tracks:', {
        video: stream.getVideoTracks().length,
        audio: stream.getAudioTracks().length
      });

      setPreviewStream(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true; // Mute for autoplay
        try {
          await videoRef.current.play();
          console.log('Video playing successfully');
          // Unmute after successful play
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.muted = false;
            }
          }, 100);
        } catch (playError) {
          console.error('Video play failed:', playError);
          // Try without muting
          videoRef.current.muted = false;
          try {
            await videoRef.current.play();
          } catch (secondError) {
            console.error('Video play failed again:', secondError);
          }
        }
      }

      // Setup audio analysis for level indicator
      setupAudioAnalysis(stream);
      setIsInitializing(false);
    } catch (err) {
      console.error('CameraPreview: Media access failed:', err);
      let errorMessage = 'Unable to access camera/microphone';
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Permission denied. Please allow camera/microphone access and refresh the page.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No camera or microphone found.';
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
      setIsInitializing(false);
    }
  }, [setupAudioAnalysis]);

  // Initialize preview on mount
  useEffect(() => {
    console.log('CameraPreview: Component mounted');

    // Only request media access if we don't already have a stream
    if (!previewStream) {
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        requestMediaAccess();
      }, 100);

      return () => {
        clearTimeout(timer);
      };
    }

    // Cleanup function
    return () => {
      console.log('CameraPreview: Cleanup on unmount');
      if (previewStream) {
        previewStream.getTracks().forEach(track => {
          console.log('Stopping track:', track.kind);
          track.stop();
        });
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [requestMediaAccess, previewStream]); // Include dependencies

  return (
    <div className={`relative aspect-video overflow-hidden rounded-xl border border-border bg-secondary shadow-card ${className}`}>
      {/* Video Feed */}
      {previewStream && !error && !isInitializing ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="h-full w-full object-cover"
          style={{ background: '#000' }}
          onLoadedData={() => console.log('Video loaded data')}
          onCanPlay={() => console.log('Video can play')}
          onPlay={() => console.log('Video started playing')}
          onError={(e) => console.error('Video element error:', e)}
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gradient-primary animate-fade-in">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm animate-bounce-in mb-4">
            {error ? (
              <Settings className="h-12 w-12 text-destructive" />
            ) : isInitializing ? (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            ) : (
              <VideoOff className="h-12 w-12 text-white" />
            )}
          </div>
          <div className="text-center text-white">
            {error ? (
              <div>
                <p className="text-sm font-medium mb-2">Access Denied</p>
                <p className="text-xs opacity-80 mb-3">Please allow camera/microphone access</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={requestMediaAccess}
                  className="text-xs"
                  disabled={isInitializing}
                >
                  Try Again
                </Button>
              </div>
            ) : isInitializing ? (
              <p className="text-sm font-medium">Requesting Camera Access...</p>
            ) : (
              <p className="text-sm font-medium">Camera Preview</p>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center text-white p-4">
            <Settings className="h-8 w-8 mx-auto mb-2 text-destructive" />
            <p className="text-sm font-medium mb-2">Camera/Microphone Error</p>
            <p className="text-xs opacity-80 mb-3">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={requestMediaAccess}
              className="text-xs"
              disabled={isInitializing}
            >
              {isInitializing ? 'Retrying...' : 'Try Again'}
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isInitializing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}

      {/* Controls Overlay */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 animate-slide-up">
        {/* Audio Control */}
        <div className="relative">
          <Button
            variant={isAudioEnabled ? "glass" : "destructive"}
            size="icon"
            onClick={handleAudioToggle}
            className="h-12 w-12 rounded-full transition-spring hover:scale-110 shadow-card"
            disabled={isInitializing && !previewStream}
          >
            {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>

          {/* Audio Level Indicator */}
          {previewStream?.getAudioTracks().some(track => track.readyState === 'live') && isAudioEnabled && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-12 h-1 bg-black/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-75"
                style={{ width: `${audioLevel * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Video Control */}
        <Button
          variant={isVideoEnabled ? "glass" : "destructive"}
          size="icon"
          onClick={handleVideoToggle}
          className="h-12 w-12 rounded-full transition-spring hover:scale-110 shadow-card"
          disabled={isInitializing && !previewStream}
        >
          {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Button>
      </div>

      {/* Device Status */}
      <div className="absolute top-4 left-4 flex gap-2">
        {previewStream?.getVideoTracks().some(track => track.readyState === 'live') && (
          <div className="flex items-center gap-1 rounded-lg bg-black/50 px-2 py-1 text-xs text-white backdrop-blur-sm">
            <Video className="h-3 w-3 text-green-400" />
            <span>Camera On</span>
          </div>
        )}
        {previewStream?.getAudioTracks().some(track => track.readyState === 'live') && (
          <div className="flex items-center gap-1 rounded-lg bg-black/50 px-2 py-1 text-xs text-white backdrop-blur-sm">
            <Mic className="h-3 w-3 text-green-400" />
            <span>Mic On</span>
          </div>
        )}
      </div>
    </div>
  );
}