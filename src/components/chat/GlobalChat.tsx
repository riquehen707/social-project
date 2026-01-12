"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { relativeTime } from "@/lib/dates";

type Message = {
  id: string;
  text: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    name: string;
    image?: string | null;
  };
};

type Props = {
  currentUserId?: string;
};

export default function GlobalChat({ currentUserId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const fetchMessages = async () => {
    const res = await fetch("/api/chat/global", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as Message[];
    setMessages(data);
  };

  useEffect(() => {
    fetchMessages();
    const timer = setInterval(fetchMessages, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    await fetch("/api/chat/global", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    setText("");
    setSending(false);
    fetchMessages();
  };

  return (
    <div className="panel-card chat-panel">
      <div className="panel-title">Chat global</div>
      <div className="chat-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-message ${msg.user.id === currentUserId ? "mine" : ""}`}
          >
            <div className="chat-avatar">
              <Image
                src={msg.user.image || `https://avatar.vercel.sh/${msg.user.username}`}
                alt={msg.user.username}
                width={32}
                height={32}
              />
            </div>
            <div className="chat-bubble">
              <div className="chat-meta">
                <span className="thread-name">{msg.user.name}</span>
                <span className="muted">@{msg.user.username}</span>
                <span className="muted">- {relativeTime(msg.createdAt)}</span>
              </div>
              <div>{msg.text}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="chat-input">
        <input
          className="builder-input"
          placeholder="Escreva no chat..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              send();
            }
          }}
        />
        <button className="btn btn-primary" onClick={send} disabled={sending}>
          Enviar
        </button>
      </div>
    </div>
  );
}
