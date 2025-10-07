import { Hand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface HandRaiseButtonProps {
  isRaised: boolean;
  onToggle: (raised: boolean) => void;
}

export function HandRaiseButton({ isRaised, onToggle }: HandRaiseButtonProps) {
  const handleClick = () => {
    const newState = !isRaised;
    onToggle(newState);
    toast.success(
      newState ? "Hand raised" : "Hand lowered",
      { description: newState ? "Host will be notified" : "You lowered your hand" }
    );
  };

  return (
    <Button
      variant={isRaised ? "default" : "glass"}
      size="icon"
      onClick={handleClick}
      className={`h-12 w-12 rounded-full ${isRaised ? "glow" : ""}`}
    >
      <Hand className={`h-5 w-5 ${isRaised ? "animate-bounce" : ""}`} />
    </Button>
  );
}
