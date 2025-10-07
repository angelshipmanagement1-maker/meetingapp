import { useEffect, useState } from "react";

interface FloatingReactionProps {
  emoji: string;
  onComplete: () => void;
}

export function FloatingReaction({ emoji, onComplete }: FloatingReactionProps) {
  const [position] = useState({
    x: Math.random() * 80 + 10, // Random position between 10% and 90%
    delay: Math.random() * 0.5,
  });

  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className="pointer-events-none fixed bottom-20 animate-float text-6xl"
      style={{
        left: `${position.x}%`,
        animationDelay: `${position.delay}s`,
      }}
    >
      {emoji}
    </div>
  );
}
