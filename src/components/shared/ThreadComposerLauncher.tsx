"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import ThreadComposer from "@/components/shared/ThreadComposer";

type Props = {
  userImage?: string | null;
  username?: string | null;
};

export default function ThreadComposerLauncher({ userImage, username }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-compose", handler);
    return () => window.removeEventListener("open-compose", handler);
  }, []);

  return (
    <>
      <section className="composer-launcher" id="composer">
        <div className="avatar">
          <Image
            src={userImage || `https://avatar.vercel.sh/${username || "user"}`}
            alt="avatar"
            width={48}
            height={48}
          />
        </div>
        <button
          type="button"
          className="composer-launcher__input"
          onClick={() => setOpen(true)}
        >
          O que ha de novo?
        </button>
        <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
          Postar
        </button>
      </section>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <button className="btn btn-ghost" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <div className="modal-title">Nova thread</div>
              <div className="modal-spacer" />
            </div>
            <ThreadComposer
              userImage={userImage}
              username={username}
              placeholder="Compartilhe algo..."
              showTools
              onSubmitted={() => setOpen(false)}
              withAnchor={false}
              className="composer-modal"
            />
          </div>
        </div>
      )}
    </>
  );
}
