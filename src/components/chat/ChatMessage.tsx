
"use client";

import type { MessageType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: MessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.sender === "user";

  return (
    <div
      className={cn(
        "flex mb-3 animate-in fade-in-50 slide-in-from-bottom-2 duration-300 ease-out",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[70%] rounded-lg px-4 py-2 shadow-md break-words",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-none"
            : "bg-card text-card-foreground dark:bg-muted dark:text-muted-foreground rounded-bl-none"
        )}
      >
        <p className="text-sm">{message.text}</p>
      </div>
    </div>
  );
}
