export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import prisma from "@/lib/prisma";
import { relativeTime } from "@/lib/dates";

type PageProps = {
  params: Promise<{ slug?: string }>;
};

function renderBlock(block: any) {
  switch (block.type) {
    case "heading":
      return <h2 className="article-h2">{block.text}</h2>;
    case "quote":
      return <blockquote className="article-quote">{block.text}</blockquote>;
    case "image":
      return (
        <div className="article-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.url} alt={block.alt || "Imagem"} />
          {block.alt && <div className="muted" style={{ marginTop: ".25rem" }}>{block.alt}</div>}
        </div>
      );
    default:
      return <p className="article-paragraph">{block.text}</p>;
  }
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  if (!slug) notFound();

  const post = await prisma.post.findUnique({
    where: { slug },
    include: {
      author: { select: { username: true, name: true, image: true } },
    },
  });

  if (!post) notFound();

  const blocks = Array.isArray(post.content) ? post.content : [];
  const displayTitle = post.seoTitle || post.title;
  const displayExcerpt = post.seoDescription || post.excerpt;

  return (
    <>
      <Topbar username={post.author.username} />
      <div className="app-shell">
        <Sidebar username={post.author.username} />
        <main className="feed-surface article-surface">
          <article className="article-body">
            <div className="article-meta">
              <Link className="thread-name" href={`/profile/${post.author.username}`}>
                {post.author.name}
              </Link>
              <div className="muted">
                @{post.author.username} · {relativeTime(post.publishedAt)}
              </div>
              {post.tags && post.tags.length > 0 && (
                <div className="interests-row" style={{ marginTop: ".4rem" }}>
                  {post.tags.map((tag) => (
                    <span key={tag} className="chip chip-soft">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <h1 className="article-title">{displayTitle}</h1>
            {post.coverImage && (
              <div className="article-cover">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.coverImage} alt={post.title} />
              </div>
            )}
            {displayExcerpt && <p className="article-excerpt">{displayExcerpt}</p>}

            <div className="article-content">
              {blocks.map((block: any) => (
                <div
                  key={block.id || block.text}
                  className="article-block"
                  style={block.width ? { maxWidth: `${block.width}%` } : undefined}
                >
                  {renderBlock(block)}
                </div>
              ))}
            </div>
          </article>
        </main>
      </div>
    </>
  );
}
