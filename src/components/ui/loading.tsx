import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  text?: string;
}

export function Loading({ className, size = "md", text }: LoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  };

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

export function LoadingScreen({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center gradient-dark">
      <div className="text-center animate-slide-up">
        <Loading size="lg" />
        <p className="mt-4 text-lg text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}