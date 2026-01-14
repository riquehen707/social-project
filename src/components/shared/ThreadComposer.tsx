"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  FaceIcon,
  ImageIcon,
  Link2Icon,
  QuoteIcon,
} from "@radix-ui/react-icons";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createThread } from "@/actions/thread";

const schema = z.object({
  text: z.string().max(1000, "Maximo 1000 caracteres"),
});

type FormData = z.infer<typeof schema>;
type ToolType = "emoji" | "link";

const toolPlaceholders: Record<Exclude<ToolType, "emoji">, string> = {
  link: "URL do link",
};

const emojiOptions = [":)", ":D", "<3", ":P", ";)", "XD"];
const allowedMediaTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

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
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "gif" | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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

  useEffect(() => {
    return () => {
      if (mediaPreview) {
        URL.revokeObjectURL(mediaPreview);
      }
    };
  }, [mediaPreview]);

  const closeTools = () => {
    setActiveTool(null);
    setToolValue("");
  };

  const clearMedia = () => {
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openFilePicker = (accept: string) => {
    if (!fileInputRef.current) return;
    fileInputRef.current.accept = accept;
    fileInputRef.current.value = "";
    setError(null);
    closeTools();
    fileInputRef.current.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!allowedMediaTypes.has(file.type)) {
      setError("Tipo de arquivo invalido");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Arquivo muito grande (max 10MB)");
      return;
    }

    setError(null);
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }

    const preview = URL.createObjectURL(file);
    setMediaFile(file);
    setMediaPreview(preview);
    setMediaType(file.type === "image/gif" ? "gif" : "image");
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
    const snippet = selection ? `${selection} (${trimmed})` : trimmed;
    insertAtCursor(snippet);
    closeTools();
  };

  const uploadMedia = async () => {
    if (!mediaFile) return null;
    const formData = new FormData();
    formData.append("file", mediaFile);

    const response = await fetch("/api/uploads", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error || "Falha ao enviar a midia");
    }

    return response.json() as Promise<{ url: string; type: "image" | "gif" }>;
  };

  const onSubmit = handleSubmit((data) => {
    startTransition(async () => {
      try {
        setError(null);
        const trimmed = data.text.trim();
        if (!trimmed && !mediaFile) {
          setError("Escreva algo ou adicione uma midia");
          return;
        }

        const uploadResult = mediaFile ? await uploadMedia() : null;

        await createThread({
          text: data.text,
          parentId,
          mediaUrl: uploadResult?.url ?? null,
          mediaType: uploadResult?.type ?? mediaType ?? null,
        });
        reset();
        clearMedia();
        closeTools();
        onSubmitted?.();
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Nao foi possivel publicar agora.",
        );
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
          <input
            ref={fileInputRef}
            type="file"
            className="composer-file-input"
            accept="image/*"
            onChange={handleFileChange}
            disabled={pending}
          />
          {mediaPreview && (
            <div className="composer-media">
              <div className="composer-media__preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaPreview} alt="Preview da midia" />
                {mediaType === "gif" && (
                  <span className="composer-media__badge">GIF</span>
                )}
              </div>
              <div className="composer-media__actions">
                <span className="muted">
                  {mediaFile?.name ?? "midia selecionada"}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={clearMedia}
                  disabled={pending}
                >
                  Remover
                </button>
              </div>
            </div>
          )}
          {showTools && (
            <>
              <div className="composer-tools">
                <button
                  type="button"
                  className="tool-btn"
                  title="Imagem"
                  aria-label="Imagem"
                  onClick={() => openFilePicker("image/*")}
                  disabled={pending}
                >
                  <ImageIcon />
                </button>
                <button
                  type="button"
                  className="tool-btn tool-btn-text"
                  title="GIF"
                  aria-label="GIF"
                  onClick={() => openFilePicker("image/gif")}
                  disabled={pending}
                >
                  GIF
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
              {errors.text ? errors.text.message : "Ate 1000 caracteres"}
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
