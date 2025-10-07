import { Wifi, WifiOff, AlertTriangle } from "lucide-react";

interface ConnectionStatusProps {
  status: "connected" | "connecting" | "disconnected" | "poor";
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "connected":
        return {
          icon: Wifi,
          text: "Connected",
          className: "bg-success/20 text-success",
        };
      case "connecting":
        return {
          icon: Wifi,
          text: "Connecting...",
          className: "bg-warning/20 text-warning animate-pulse",
        };
      case "poor":
        return {
          icon: AlertTriangle,
          text: "Poor Connection",
          className: "bg-warning/20 text-warning",
        };
      case "disconnected":
        return {
          icon: WifiOff,
          text: "Disconnected",
          className: "bg-destructive/20 text-destructive",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${config.className}`}>
      <Icon className="h-3 w-3" />
      <span>{config.text}</span>
    </div>
  );
}
