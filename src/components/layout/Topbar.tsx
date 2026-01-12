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
      <div className="topbar-actions">
        {username && (
          <Link className="btn btn-ghost topbar-user" href={`/profile/${username}`}>
            @{username}
          </Link>
        )}
        <Link className="btn btn-ghost topbar-icon" href="/chat" aria-label="Chat">
          <ChatBubbleIcon />
        </Link>
        <Link
          className="btn btn-ghost topbar-icon"
          href="/messages"
          aria-label="Mensagens"
        >
          <EnvelopeClosedIcon />
        </Link>
        <Link
          className="btn btn-ghost topbar-icon"
          href="/notifications"
          aria-label="Notificações"
        >
          <BellIcon />
        </Link>
        <button
          className="btn btn-ghost topbar-compose"
          onClick={openComposer}
          type="button"
        >
          <Pencil2Icon />
          <span className="topbar-label">Postar</span>
        </button>
        <button className="btn topbar-signout" onClick={() => signOut({ callbackUrl: "/auth" })}>
          Sair
        </button>
      </div>
    </div>
  );
}
