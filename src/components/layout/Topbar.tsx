"use client";

import {
  BellIcon,
  ChatBubbleIcon,
  EnvelopeClosedIcon,
  Pencil2Icon,
} from "@radix-ui/react-icons";
import Link from "next/link";
import { signOut } from "next-auth/react";

export default function Topbar({ username }: { username?: string }) {
  const openComposer = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("open-compose"));
    }
  };

  return (
    <div className="topbar">
      <Link href="/" className="brand" style={{ gap: ".45rem" }}>
        <span className="brand-mark" />
        <span>social</span>
      </Link>
      <div style={{ display: "flex", gap: ".5rem" }}>
        {username && (
          <Link className="btn btn-ghost" href={`/profile/${username}`}>
            @{username}
          </Link>
        )}
        <Link className="btn btn-ghost" href="/chat" aria-label="Chat">
          <ChatBubbleIcon />
        </Link>
        <Link className="btn btn-ghost" href="/messages" aria-label="Mensagens">
          <EnvelopeClosedIcon />
        </Link>
        <Link
          className="btn btn-ghost"
          href="/notifications"
          aria-label="Notificações"
        >
          <BellIcon />
        </Link>
        <button className="btn btn-ghost" onClick={openComposer} type="button">
          <Pencil2Icon />
          Postar
        </button>
        <button className="btn" onClick={() => signOut({ callbackUrl: "/auth" })}>
          Sair
        </button>
      </div>
    </div>
  );
}
