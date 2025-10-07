import { useState } from "react";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/hooks/useMeeting";

interface ChatSidebarProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onClose: () => void;
}

export function ChatSidebar({ messages, onSendMessage, onClose }: ChatSidebarProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim()) return;
    
    onSendMessage(message);
    setMessage("");
  };

  if (messages.length === 0) {
    return (
      <div className="flex h-full w-80 flex-col border-l border-border glass-strong shadow-elevated animate-slide-in-right">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="font-semibold text-foreground">Chat</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="transition-spring hover:scale-110">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          <p className="text-sm animate-fade-in">No messages yet. Start the conversation!</p>
        </div>
        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              size="icon"
              disabled={!message.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full w-80 flex-col border-l border-border glass-strong shadow-elevated animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <h3 className="font-semibold text-foreground">Chat</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="transition-spring hover:scale-110">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`animate-slide-up ${
                msg.isOwn ? "ml-auto" : "mr-auto"
              } max-w-[85%]`}
            >
              <div
                className={`rounded-lg p-3 ${
                  msg.isOwn
                    ? "gradient-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {!msg.isOwn && (
                  <p className="mb-1 text-xs font-semibold opacity-90">
                    {msg.sender}
                  </p>
                )}
                <p className="text-sm">{msg.text}</p>
                <p className="mt-1 text-xs opacity-70">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            size="icon"
            disabled={!message.trim()}
            className="transition-spring hover:scale-110"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
