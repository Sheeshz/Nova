
"use client";
import { ChatInterface } from "@/components/chat/ChatInterface";

async function sendMessageToBackend(message: string) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });
  const data = await response.json();
  return data.reply;
}

export default function HomePage() {
  return (
    <ChatInterface onSendMessage={sendMessageToBackend} />
  );
}
