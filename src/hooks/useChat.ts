import { useState, useEffect, useCallback } from 'react';
import { socketService } from '@/services/socketService';

export interface ChatMessage {
  id: string;
  senderId: string;
  sender: string;
  text: string;
  timestamp: string;
  isOwn: boolean;
}

interface IncomingChatMessage {
  id: string;
  senderId: string;
  sender: string;
  text: string;
  timestamp: string;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;

    socketService.emit('chat:message', { text: text.trim() });
  }, []);

  const loadInitialMessages = useCallback((initialMessages: ChatMessage[]) => {
    setMessages(initialMessages);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  useEffect(() => {
    if (!socketService.connected) return;

    const handleNewMessage = (message: IncomingChatMessage) => {
      const chatMessage: ChatMessage = {
        ...message,
        isOwn: message.senderId === socketService.socketInstance?.id,
      };
      
      setMessages(prev => [...prev, chatMessage]);
    };

    socketService.on('chat:new-message', handleNewMessage);

    return () => {
      socketService.off('chat:new-message', handleNewMessage);
    };
  }, []);

  return {
    messages,
    sendMessage,
    loadInitialMessages,
    clearMessages,
  };
}