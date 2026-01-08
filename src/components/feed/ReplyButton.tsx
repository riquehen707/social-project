"use client";

import { ChatBubbleIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import ThreadComposer from "../shared/ThreadComposer";

type Props = {
  threadId: string;
  viewerUsername?: string | null;
  viewerImage?: string | null;
};

export default function ReplyButton({
  threadId,
  viewerUsername,
  viewerImage,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ width: "100%" }}>
      <button className="action" onClick={() => setOpen((v) => !v)}>
        <ChatBubbleIcon />
        {open ? "Fechar" : "Responder"}
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
