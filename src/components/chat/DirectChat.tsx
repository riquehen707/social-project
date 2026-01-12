"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { relativeTime } from "@/lib/dates";

type Message = {
  id: string;
  text: string;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    name: string;
    image?: string | null;
  };
};

type Props = {
  recipientId: string;
  recipientName: string;
  currentUserId: string;
};

export default function DirectChat({
  recipientId,
  recipientName,
  currentUserId,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const fetchMessages = async () => {
    const res = await fetch(`/api/chat/direct?userId=${recipientId}`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    const data = (await res.json()) as Message[];
    setMessages(data);
  };

  useEffect(() => {
    fetchMessages();
    const timer = setInterval(fetchMessages, 4000);
    return () => clearInterval(timer);
  }, [recipientId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    await fetch("/api/chat/direct", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId, text }),
    });
    setText("");
    setSending(false);
    fetchMessages();
  };

  return (
    <div className="dm-surface">
      <div className="dm-head">
        <div>
          <div className="section-kicker">Mensagem direta</div>
          <h2 className="section-title">Conversando com {recipientName}</h2>
        </div>
      </div>
      <div className="chat-messages dm-messages">
        {messages.map((msg) => {
          const mine = msg.sender.id === currentUserId;
          return (
            <div key={msg.id} className={`chat-message ${mine ? "mine" : ""}`}>
              <div className="chat-avatar">
                <Image
                  src={msg.sender.image || `https://avatar.vercel.sh/${msg.sender.username}`}
                  alt={msg.sender.username}
                  width={32}
                  height={32}
                />
              </div>
              <div className="chat-bubble">
                <div className="chat-meta">
                  <span className="thread-name">{msg.sender.name}</span>
                  <span className="muted">@{msg.sender.username}</span>
                  <span className="muted">• {relativeTime(msg.createdAt)}</span>
                </div>
                <div>{msg.text}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="chat-input">
        <input
          className="builder-input"
          placeholder="Escreva uma mensagem..."
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
