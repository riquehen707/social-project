"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  FaceIcon,
  ImageIcon,
  Link2Icon,
  QuoteIcon,
  VideoIcon,
} from "@radix-ui/react-icons";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createThread } from "@/actions/thread";

const schema = z.object({
  text: z.string().min(1, "Escreva algo").max(1000),
});

type FormData = z.infer<typeof schema>;

type Props = {
  userImage?: string | null;
  username?: string | null;
  parentId?: string;
  placeholder?: string;
  compact?: boolean;
  showTools?: boolean;
  className?: string;
  onSubmitted?: () => void;
  withAnchor?: boolean;
};

export default function ThreadComposer({
  userImage,
  username,
  parentId,
  placeholder = "Compartilhe algo com sua rede...",
  compact = false,
  showTools = false,
  className,
  onSubmitted,
  withAnchor = true,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit((data) => {
    startTransition(async () => {
      try {
        setError(null);
        await createThread({ text: data.text, parentId });
        reset();
        onSubmitted?.();
        router.refresh();
      } catch (err) {
        setError("Não foi possível publicar agora.");
        console.error(err);
      }
    });
  });

  return (
    <section
      id={!parentId && withAnchor ? "composer" : undefined}
      className={`composer ${compact ? "panel-card" : ""} ${className ?? ""}`}
    >
      <div>
        <div className="avatar">
          <Image
            src={userImage || `https://avatar.vercel.sh/${username || "user"}`}
            alt="avatar"
            width={48}
            height={48}
          />
        </div>
      </div>
      <div>
        <form onSubmit={onSubmit}>
          <textarea
            placeholder={placeholder}
            {...register("text")}
            disabled={pending}
          />
          {showTools && (
            <div className="composer-tools">
              <button type="button" className="tool-btn" title="Imagem">
                <ImageIcon />
              </button>
              <button type="button" className="tool-btn" title="Vídeo">
                <VideoIcon />
              </button>
              <button type="button" className="tool-btn" title="Emoji">
                <FaceIcon />
              </button>
              <button type="button" className="tool-btn" title="Citar">
                <QuoteIcon />
              </button>
              <button type="button" className="tool-btn" title="Link">
                <Link2Icon />
              </button>
            </div>
          )}
          <div className="composer-actions">
            <span className="pill">
              {errors.text ? errors.text.message : "Até 1000 caracteres"}
            </span>
            <button className="btn btn-primary" disabled={pending} type="submit">
              {pending ? "Publicando..." : parentId ? "Responder" : "Publicar"}
            </button>
          </div>
          {error && (
            <div className="error" style={{ marginTop: ".35rem" }}>
              {error}
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
