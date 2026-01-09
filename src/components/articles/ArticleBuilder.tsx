"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArticleBlock, ArticleBlockType } from "@/types/post";

type Props = {
  authorName?: string | null;
};

const blockOptions: { label: string; type: ArticleBlockType }[] = [
  { label: "Título de seção", type: "heading" },
  { label: "Parágrafo", type: "paragraph" },
  { label: "Citação", type: "quote" },
  { label: "Imagem", type: "image" },
];

function createId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 9);
}

export default function ArticleBuilder({ authorName }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<ArticleBlock[]>([
    { id: createId(), type: "heading", text: "Título ou chamada" },
    { id: createId(), type: "paragraph", text: "Escreva o corpo do artigo aqui." },
  ]);

  const previewExcerpt = useMemo(() => {
    return blocks
      .filter((b) => b.type !== "image")
      .map((b) => b.text ?? "")
      .join(" ")
      .slice(0, 160);
  }, [blocks]);

  function updateBlock(id: string, data: Partial<ArticleBlock>) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...data } : b)));
  }

  function addBlock(type: ArticleBlockType) {
    const newBlock: ArticleBlock = {
      id: createId(),
      type,
      text: type === "image" ? "" : "",
      width: type === "image" ? 100 : undefined,
    };
    setBlocks((prev) => [...prev, newBlock]);
  }

  function removeBlock(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }

  function moveBlock(targetId: string) {
    if (!draggingId || draggingId === targetId) return;
    setBlocks((prev) => {
      const from = prev.findIndex((b) => b.id === draggingId);
      const to = prev.findIndex((b) => b.id === targetId);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  async function onPublish() {
    try {
      setStatus("saving");
      setError(null);
      const cleanedBlocks = blocks
        .map((b) => {
          const text = b.text?.trim();
          const url = b.url?.trim();
          if (b.type === "image") {
            if (!url) return null;
            return { ...b, url };
          }
          if (!text) return null;
          return { ...b, text };
        })
        .filter(Boolean) as ArticleBlock[];

      if (cleanedBlocks.length === 0) {
        throw new Error("Adicione ao menos um bloco de texto ou imagem.");
      }

      const payload = {
        title:
          title.trim() ||
          cleanedBlocks.find((b) => b.type === "heading")?.text ||
          "Sem titulo",
        seoTitle: seoTitle.trim() || undefined,
        seoDescription: seoDescription.trim() || undefined,
        coverImage: coverImage.trim() || undefined,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        blocks: cleanedBlocks,
      };

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Erro ao salvar");
      }

      const data = await res.json();
      setStatus("saved");
      router.push(`/p/${data.slug}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    }
  }

  return (
    <div className="builder-surface">
      <div className="builder-head">
        <div>
          <div className="section-kicker">Artigo</div>
          <h1 className="section-title" style={{ margin: 0 }}>
            Construa um artigo indexavel
          </h1>
          <p className="section-subtitle">
            Arraste blocos (texto, citação, imagem) e ajuste a ordem.
          </p>
        </div>
        <div className="builder-actions">
          {status === "saving" && <span className="muted">Salvando...</span>}
          {status === "saved" && <span className="success">Salvo</span>}
          {status === "error" && <span className="error">Erro</span>}
          <button className="btn btn-primary" onClick={onPublish} disabled={status === "saving"}>
            Publicar
          </button>
        </div>
      </div>

      <div className="builder-grid">
        <div className="builder-main">
          <div className="panel-card" style={{ display: "grid", gap: "0.75rem" }}>
            <label className="field">
              <span className="muted">Titulo</span>
              <input
                className="builder-input"
                placeholder="Ex: Como desenhar artigos que convertem"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="muted">Titulo SEO (opcional)</span>
              <input
                className="builder-input"
                placeholder="Titulo para Google e compartilhamentos"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="muted">Meta descricao (opcional)</span>
              <textarea
                className="builder-textarea"
                placeholder="Resumo curto para SEO e cards sociais (ate 300 caracteres)"
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                rows={3}
              />
            </label>
            <label className="field">
              <span className="muted">Imagem de capa (URL)</span>
              <input
                className="builder-input"
                placeholder="https://images..."
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="muted">Tags (separe por virgula)</span>
              <input
                className="builder-input"
                placeholder="design, tecnologia, brasil"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </label>
          </div>

          <div className="builder-blocks">
            {blocks.map((block) => (
              <div
                key={block.id}
                className={`block-card ${draggingId === block.id ? "dragging" : ""}`}
                draggable
                onDragStart={() => setDraggingId(block.id)}
                onDragOver={(e) => {
                  e.preventDefault();
                  moveBlock(block.id);
                }}
                onDragEnd={() => setDraggingId(null)}
              >
                <div className="block-toolbar">
                  <select
                    value={block.type}
                    onChange={(e) =>
                      updateBlock(block.id, { type: e.target.value as ArticleBlockType })
                    }
                  >
                    {blockOptions.map((opt) => (
                      <option key={opt.type} value={opt.type}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <span className="muted" style={{ fontSize: "0.9rem" }}>
                    Arraste para reordenar
                  </span>
                  <button className="btn btn-ghost" onClick={() => removeBlock(block.id)}>
                    Remover
                  </button>
                </div>

                {block.type === "image" ? (
                  <div className="field" style={{ gap: "0.5rem" }}>
                    <input
                      className="builder-input"
                      placeholder="URL da imagem"
                      value={block.url ?? ""}
                      onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                    />
                    <input
                      className="builder-input"
                      placeholder="Texto alternativo"
                      value={block.alt ?? ""}
                      onChange={(e) => updateBlock(block.id, { alt: e.target.value })}
                    />
                    <label className="field">
                      <span className="muted">Largura (%)</span>
                      <input
                        type="range"
                        min={30}
                        max={100}
                        value={block.width ?? 100}
                        onChange={(e) =>
                          updateBlock(block.id, { width: Number(e.target.value) })
                        }
                      />
                    </label>
                  </div>
                ) : (
                  <textarea
                    className="builder-textarea"
                    placeholder={
                      block.type === "quote"
                        ? "Uma frase marcante para destacar."
                        : block.type === "heading"
                          ? "Titulo da seção"
                          : "Escreva seu paragrafo..."
                    }
                    value={block.text ?? ""}
                    onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                    rows={block.type === "paragraph" ? 4 : 2}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="block-add">
            <span className="muted">Adicionar bloco</span>
            <div className="block-add-buttons">
              {blockOptions.map((opt) => (
                <button key={opt.type} className="btn" onClick={() => addBlock(opt.type)}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="error">{error}</div>}
        </div>

        <aside className="builder-side panel-card">
          <div className="section-kicker">Prévia</div>
          <div className="thread-name" style={{ fontSize: "1.1rem" }}>
            {seoTitle || title || "Sem titulo"}
          </div>
          <div className="muted" style={{ marginBottom: ".4rem" }}>
            por {authorName || "você"}
          </div>
          {coverImage && (
            <div className="cover-preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverImage} alt="capa" />
            </div>
          )}
          <div className="muted">
            {seoDescription || previewExcerpt || "Digite para ver o resumo"}
          </div>
          <div className="interests-row" style={{ marginTop: ".6rem" }}>
            {tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
              .slice(0, 6)
              .map((tag) => (
                <span key={tag} className="chip chip-soft">
                  #{tag}
                </span>
              ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
