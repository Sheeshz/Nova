
"use client";

import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !disabled) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 border-t p-4 bg-background shrink-0"
    >
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Type your message..."
        disabled={disabled}
        className="flex-grow"
        aria-label="Chat message input"
      />
      <Button
        type="submit"
        variant="default"
        size="icon"
        disabled={disabled || !inputValue.trim()}
        aria-label="Send message"
        className={cn(
          "transition-colors",
          (disabled || !inputValue.trim()) ? "" : "hover:bg-primary/90 dark:hover:bg-accent/90"
        )}
      >
        <Send className="h-5 w-5" />
      </Button>
    </form>
  );
}
