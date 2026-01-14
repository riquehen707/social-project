"use client";

import { ChatBubbleIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import ThreadComposer from "../shared/ThreadComposer";

type Props = {
  threadId: string;
  viewerUsername?: string | null;
  viewerImage?: string | null;
  replyCount?: number;
};

export default function ReplyButton({
  threadId,
  viewerUsername,
  viewerImage,
  replyCount = 0,
}: Props) {
  const [open, setOpen] = useState(false);
  const label = open ? "Fechar respostas" : "Responder";

  return (
    <div style={{ width: "100%" }}>
      <button
        className="action"
        onClick={() => setOpen((v) => !v)}
        type="button"
        aria-label={`${label} (${replyCount})`}
        title={label}
        aria-expanded={open}
      >
        <ChatBubbleIcon />
        <span>{replyCount}</span>
      </button>
      {open && (
        <div style={{ marginTop: ".65rem" }}>
          <ThreadComposer
            parentId={threadId}
            userImage={viewerImage ?? undefined}
            username={viewerUsername ?? undefined}
            placeholder="Escreva uma resposta..."
            compact
          />
        </div>
      )}
    </div>
  );
}
