import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SmilePlus, ThumbsUp, Heart, Laugh, PartyPopper, Lightbulb } from "lucide-react";
import { toast } from "sonner";

const reactions = [
  { emoji: "👍", icon: ThumbsUp, label: "Like" },
  { emoji: "❤️", icon: Heart, label: "Love" },
  { emoji: "😂", icon: Laugh, label: "Laugh" },
  { emoji: "🎉", icon: PartyPopper, label: "Celebrate" },
  { emoji: "💡", icon: Lightbulb, label: "Idea" },
  { emoji: "👏", icon: SmilePlus, label: "Applause" },
];

interface ReactionsBarProps {
  onReaction: (emoji: string) => void;
}

export function ReactionsBar({ onReaction }: ReactionsBarProps) {
  const [open, setOpen] = useState(false);

  const handleReaction = (reaction: typeof reactions[0]) => {
    onReaction(reaction.emoji);
    toast.success(`You reacted with ${reaction.emoji}`, {
      description: "Everyone can see your reaction",
    });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="glass" size="icon" className="h-12 w-12 rounded-full">
          <SmilePlus className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="glass w-auto border-border p-2" align="center" side="top">
        <div className="flex gap-2">
          {reactions.map((reaction) => (
            <Button
              key={reaction.label}
              variant="ghost"
              size="icon"
              onClick={() => handleReaction(reaction)}
              className="h-12 w-12 text-2xl hover:scale-110 transition-bounce"
            >
              {reaction.emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
