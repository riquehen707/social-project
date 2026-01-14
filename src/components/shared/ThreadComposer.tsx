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
import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createThread } from "@/actions/thread";

const schema = z.object({
  text: z.string().min(1, "Escreva algo").max(1000),
});

type FormData = z.infer<typeof schema>;
type ToolType = "image" | "video" | "emoji" | "link";

const toolPlaceholders: Record<Exclude<ToolType, "emoji">, string> = {
  image: "URL da imagem",
  video: "URL do video",
  link: "URL do link",
};

const emojiOptions = [":)", ":D", "<3", ":P", ";)", "XD"];

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
  const [activeTool, setActiveTool] = useState<ToolType | null>(null);
  const [toolValue, setToolValue] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { ref: textRef, ...textField } = register("text");

  const closeTools = () => {
    setActiveTool(null);
    setToolValue("");
  };

  const getSelection = () => {
    const current = getValues("text") ?? "";
    const el = textAreaRef.current;
    const start = el?.selectionStart ?? current.length;
    const end = el?.selectionEnd ?? current.length;
    return { current, start, end, selection: current.slice(start, end) };
  };

  const updateText = (next: string, cursor: number) => {
    setValue("text", next, { shouldDirty: true, shouldTouch: true });
    requestAnimationFrame(() => {
      const el = textAreaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(cursor, cursor);
    });
  };

  const insertAtCursor = (snippet: string) => {
    const { current, start, end } = getSelection();
    const next = current.slice(0, start) + snippet + current.slice(end);
    updateText(next, start + snippet.length);
  };

  const insertQuote = () => {
    const { current, start, end, selection } = getSelection();
    const quoted = selection
      ? selection
          .split("\n")
          .map((line) => `> ${line}`)
          .join("\n")
      : "> ";
    const next = current.slice(0, start) + quoted + current.slice(end);
    updateText(next, start + quoted.length);
    closeTools();
  };

  const toggleTool = (tool: ToolType) => {
    setToolValue("");
    setActiveTool((current) => (current === tool ? null : tool));
  };

  const applyTool = () => {
    if (!activeTool || activeTool === "emoji") return;
    const trimmed = toolValue.trim();
    if (!trimmed) return;
    const { selection } = getSelection();
    if (activeTool === "link") {
      const snippet = selection ? `${selection} (${trimmed})` : trimmed;
      insertAtCursor(snippet);
    } else if (activeTool === "image") {
      insertAtCursor(`img: ${trimmed}`);
    } else if (activeTool === "video") {
      insertAtCursor(`video: ${trimmed}`);
    }
    closeTools();
  };

  const onSubmit = handleSubmit((data) => {
    startTransition(async () => {
      try {
        setError(null);
        await createThread({ text: data.text, parentId });
        reset();
        closeTools();
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
            {...textField}
            ref={(el) => {
              textRef(el);
              textAreaRef.current = el;
            }}
            disabled={pending}
          />
          {showTools && (
            <>
              <div className="composer-tools">
                <button
                  type="button"
                  className="tool-btn"
                  title="Imagem"
                  onClick={() => toggleTool("image")}
                  disabled={pending}
                >
                  <ImageIcon />
                </button>
                <button
                  type="button"
                  className="tool-btn"
                  title="Video"
                  onClick={() => toggleTool("video")}
                  disabled={pending}
                >
                  <VideoIcon />
                </button>
                <button
                  type="button"
                  className="tool-btn"
                  title="Emoji"
                  onClick={() => toggleTool("emoji")}
                  disabled={pending}
                >
                  <FaceIcon />
                </button>
                <button
                  type="button"
                  className="tool-btn"
                  title="Citar"
                  onClick={insertQuote}
                  disabled={pending}
                >
                  <QuoteIcon />
                </button>
                <button
                  type="button"
                  className="tool-btn"
                  title="Link"
                  onClick={() => toggleTool("link")}
                  disabled={pending}
                >
                  <Link2Icon />
                </button>
              </div>
              {activeTool && activeTool !== "emoji" && (
                <div className="composer-tool-input">
                  <input
                    type="url"
                    placeholder={toolPlaceholders[activeTool]}
                    value={toolValue}
                    onChange={(e) => setToolValue(e.target.value)}
                    disabled={pending}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={applyTool}
                    disabled={pending || !toolValue.trim()}
                  >
                    Adicionar
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={closeTools}
                    disabled={pending}
                  >
                    Cancelar
                  </button>
                </div>
              )}
              {activeTool === "emoji" && (
                <div className="composer-emoji">
                  {emojiOptions.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className="tool-btn"
                      onClick={() => {
                        insertAtCursor(emoji);
                        closeTools();
                      }}
                      disabled={pending}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </>
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
