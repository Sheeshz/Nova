
"use client";

import { useState, useEffect, useRef } from "react";
import type { MessageType } from "@/lib/types";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";


export function ChatInterface() {
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


  const handleSendMessage = async (text: string) => {
    if (!conversationId) {
      toast({
        title: "Initialization Error",
        description: "Conversation ID not yet available. Please wait a moment and try again.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: MessageType = {
      id: self.crypto.randomUUID(),
      text,
      sender: "user",
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setIsTyping(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/chat/", { // Added trailing slash
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: text, conversation_id: conversationId }), // Added conversation_id
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        const errorMessageContent = `Nova: Sorry, I encountered an error (${response.status}). Please try again. ${ response.status === 404 ? 'Endpoint not found.' : ''}`;
        const errorMessage: MessageType = {
          id: self.crypto.randomUUID(),
          text: errorMessageContent,
          sender: "bot",
        };
        setMessages((prevMessages) => [...prevMessages, errorMessage]);
        toast({
          title: "API Error",
          description: `Failed to get response from Nova: ${response.statusText || 'Unknown error'}. Details: ${errorText || 'No additional details.'}`,
          variant: "destructive",
        });
        return;
      }

      const data = await response.json();
      // Backend returns { "response": "chatbot reply", "conversation_id": "..." }
      if (data && typeof data.response === 'string') {
        const botMessage: MessageType = {
          id: self.crypto.randomUUID(),
          text: data.response,
          sender: "bot",
        };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
      } else {
         throw new Error("Invalid response format from server. 'response' field missing or not a string.");
      }

    } catch (error: any) {
      console.error("Failed to send message:", error);
      const errorMessageText = error instanceof Error ? error.message : "An unknown network error occurred.";
      const errorMessage: MessageType = {
        id: self.crypto.randomUUID(),
        text: `Nova: Sorry, I couldn't connect or process your request. Error: ${errorMessageText}`,
        sender: "bot",
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
      toast({
        title: "Request Error",
        description: `Failed to send message or parse response: ${errorMessageText}`,
        variant: "destructive",
      });
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
