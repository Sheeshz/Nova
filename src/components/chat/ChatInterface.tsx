"use client";

import { useState, useEffect, useRef } from "react";
import type { MessageType } from "@/lib/types";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface ChatInterfaceProps {
  onSendMessage: (message: string) => Promise<string>;
}

export function ChatInterface({ onSendMessage }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    // Generate conversation ID on client mount
    // This runs only on the client after hydration
    setConversationId(self.crypto.randomUUID());

    // Initial welcome message from Nova
    // Check if messages is empty to avoid adding on re-renders if component remounts for other reasons
    // This check is important if we were to, for example, fetch initial messages.
    // For a static welcome message, it's fine to always set it if messages array is empty.
    if (messages.length === 0) {
      setMessages([
        {
          id: self.crypto.randomUUID(),
          text: "Hello! I'm Nova. How can I help you today?",
          sender: "bot",
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs once on mount on the client

  const handleSendMessage = async (message: string) => {
    setIsTyping(true);
    try {
      const reply = await onSendMessage(message);
      setMessages((prev) => [
        ...prev,
        { id: self.crypto.randomUUID(), text: message, sender: "user" },
        { id: self.crypto.randomUUID(), text: reply, sender: "bot" },
      ]);
    } catch (error) {
      toast({ title: "Error", description: "Failed to send message." });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between p-4 border-b shrink-0">
        <h1 className="text-2xl font-bold text-primary">Nova</h1>
        <DarkModeToggle />
      </header>

      <ScrollArea className="flex-grow p-4 space-y-2">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {isTyping && <TypingIndicator />}

      <ChatInput onSendMessage={handleSendMessage} disabled={isTyping || !conversationId} />
    </div>
  );
}
