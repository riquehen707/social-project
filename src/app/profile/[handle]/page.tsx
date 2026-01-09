export const dynamic = "force-dynamic";
export const revalidate = 0;

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import RightPanel from "@/components/layout/RightPanel";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import ThreadCard from "@/components/feed/ThreadCard";
import FollowButton from "@/components/shared/FollowButton";
import ThreadComposerLauncher from "@/components/shared/ThreadComposerLauncher";
import InterestsEditor from "@/components/profile/InterestsEditor";
import { getProfileWithThreads } from "@/data/profile";
import { relativeTime } from "@/lib/dates";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ handle?: string }>;
  searchParams?: Promise<{ tab?: string }>;
}) {
  const { handle } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const tab = resolvedSearchParams?.tab ?? "posts";
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth");
  }
  const user = session.user!;

  if (!handle) {
    notFound();
  }

  const data = await getProfileWithThreads(handle, user.id);
  if (!data) notFound();

  const { profile, threads } = data;
  const featuredThread = threads[0];
  const interests = profile.interests?.filter(Boolean).slice(0, 8) ?? [];
  const isOwner = profile.id === user.id;
  const latestPosts = await prisma.post.findMany({
    where: { authorId: profile.id, published: true },
    orderBy: { publishedAt: "desc" },
    take: 3,
    select: {
      title: true,
      seoTitle: true,
      seoDescription: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      tags: true,
      publishedAt: true,
    },
  });
  const latestPost = latestPosts[0] ?? null;

  const threadList =
    tab === "replies"
      ? threads.filter((thread) => !!thread.parentId)
      : tab === "posts"
        ? threads.filter((thread) => !thread.parentId)
        : threads;

  return (
    <>
      <Topbar username={user.username} />
      <div className="app-shell">
        <Sidebar username={user.username ?? undefined} />
        <main className="feed-surface profile-surface">
          <div className="profile-hero">
            <div className="profile-hero__bg" />
            <div className="profile-hero__content">
              <div className="profile-hero__header">
                <div className="profile-hero__badge-row">
                  <span className="chip chip-strong">Coluna Brasil</span>
                  {profile.link && (
                    <a
                      href={profile.link}
                      target="_blank"
                      rel="noreferrer"
                      className="profile-link"
                    >
                      {profile.link}
                    </a>
                  )}
                </div>
                <div className="profile-hero__main">
                  <div className="profile-hero__avatar">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={profile.image || `https://avatar.vercel.sh/${profile.username}`}
                      alt={profile.username}
                      width={96}
                      height={96}
                    />
                  </div>
                  <div>
                    <h1 className="profile-title">{profile.name}</h1>
                    <div className="profile-subtitle">
                      <span>@{profile.username}</span>
                      <span>•</span>
                      <span>
                        {profile.followerCount} seguidor
                        {profile.followerCount === 1 ? "" : "es"}
                      </span>
                      <span>•</span>
                      <span>{profile.followingCount} seguindo</span>
                    </div>
                    {profile.bio && <p className="profile-bio">{profile.bio}</p>}
                    <div className="profile-actions">
                      {!isOwner && (
                        <FollowButton
                          targetUserId={profile.id}
                          isFollowing={profile.isFollowedByMe}
                        />
                      )}
                      {isOwner && <span className="pill muted">Seu perfil</span>}
                    </div>
                    {interests.length > 0 && (
                      <div className="profile-interests">
                        <div className="section-kicker" style={{ margin: 0 }}>
                          Interesses
                        </div>
                        <div className="interests-row">
                          {interests.map((item) => (
                            <span key={item} className="chip chip-soft">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-body">
            {isOwner && (
              <section className="profile-section">
                <ThreadComposerLauncher userImage={user.image} username={user.username} />
              </section>
            )}

            {isOwner && (
              <section className="profile-section">
                <div className="section-head">
                  <div>
                    <div className="section-kicker">Interesses</div>
                    <h2 className="section-title">Escolha seus temas</h2>
                    <p className="section-subtitle">
                      Isso ajuda a personalizar o feed para você
                    </p>
                  </div>
                </div>
                <InterestsEditor initial={interests} />
              </section>
            )}

            <div className="profile-tabs">
              <Link
                className={`profile-tab ${tab === "posts" ? "active" : ""}`}
                href={`/profile/${profile.username}?tab=posts`}
              >
                Publicações
              </Link>
              <Link
                className={`profile-tab ${tab === "replies" ? "active" : ""}`}
                href={`/profile/${profile.username}?tab=replies`}
              >
                Respostas
              </Link>
              <Link
                className={`profile-tab ${tab === "media" ? "active" : ""}`}
                href={`/profile/${profile.username}?tab=media`}
              >
                Mídia
              </Link>
              <Link
                className={`profile-tab ${tab === "reposts" ? "active" : ""}`}
                href={`/profile/${profile.username}?tab=reposts`}
              >
                Reposts
              </Link>
            </div>

            <section className="profile-section">
              <div className="section-head">
                <div>
                  <div className="section-kicker">Em destaque</div>
                  <h2 className="section-title">
                    {latestPost ? "Último artigo" : "Última publicação"}
                  </h2>
                  <p className="section-subtitle">
                    Destaque o conteúdo mais recente sem poluir o perfil
                  </p>
                </div>
              </div>
              {latestPost ? (
                <div className="featured-card article-highlight">
                  {latestPost.coverImage && (
                    <div className="article-cover" style={{ margin: 0 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={latestPost.coverImage} alt={latestPost.title} />
                    </div>
                  )}
                  <div className="featured-meta">
                    <span className="pill">{relativeTime(latestPost.publishedAt)}</span>
                    {latestPost.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="pill">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="featured-title">
                    {latestPost.seoTitle || latestPost.title}
                  </div>
                  {(latestPost.seoDescription || latestPost.excerpt) && (
                    <div className="featured-body">
                      {latestPost.seoDescription || latestPost.excerpt}
                    </div>
                  )}
                  <div className="featured-footer">
                    <span className="muted">Artigo</span>
                    <Link className="btn btn-primary" href={`/p/${latestPost.slug}`}>
                      Ler
                    </Link>
                  </div>
                </div>
              ) : featuredThread ? (
                <div className="featured-card">
                  <div className="featured-meta">
                    <span className="pill">{relativeTime(featuredThread.createdAt)}</span>
                    <span className="pill">
                      {featuredThread._count.replies} resposta
                      {featuredThread._count.replies === 1 ? "" : "s"}
                    </span>
                    <span className="pill">
                      {featuredThread._count.likes} like
                      {featuredThread._count.likes === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="featured-title">
                    {featuredThread.text.split("\n")[0]}
                  </div>
                  <div className="featured-body">{featuredThread.text}</div>
                  <div className="featured-footer">
                    <span className="muted">@{profile.username}</span>
                    {!isOwner && (
                      <FollowButton
                        targetUserId={profile.id}
                        isFollowing={profile.isFollowedByMe}
                        compact
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="panel-card" style={{ marginTop: "0.5rem" }}>
                  <div className="muted">Nada por aqui ainda.</div>
                </div>
              )}
            </section>

            <section className="profile-section">
              <div className="section-head">
                <div>
                  <div className="section-kicker">Artigos</div>
                  <h2 className="section-title">Artigos recentes</h2>
                  <p className="section-subtitle">
                    Conteúdo longo e indexável do perfil
                  </p>
                </div>
              </div>
              {latestPosts.length === 0 ? (
                <div className="panel-card" style={{ marginTop: "0.5rem" }}>
                  <div className="muted">Nenhum artigo publicado.</div>
                </div>
              ) : (
                <div className="articles-grid">
                  {latestPosts.map((post) => (
                    <Link key={post.slug} href={`/p/${post.slug}`} className="article-card">
                      {post.coverImage && (
                        <div className="article-card__cover">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={post.coverImage} alt={post.title} />
                        </div>
                      )}
                      <div className="article-card__body">
                        <div className="article-card__title">
                          {post.seoTitle || post.title}
                        </div>
                        {(post.seoDescription || post.excerpt) && (
                          <div className="article-card__excerpt">
                            {post.seoDescription || post.excerpt}
                          </div>
                        )}
                        <div className="article-card__meta">
                          <span className="muted">{relativeTime(post.publishedAt)}</span>
                          <div className="interests-row" style={{ marginTop: ".25rem" }}>
                            {post.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="chip chip-soft">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="profile-section">
              <div className="section-head">
                <div>
                  <div className="section-kicker">Publicações</div>
                  <h2 className="section-title">
                    {tab === "replies"
                      ? "Respostas"
                      : tab === "media"
                        ? "Mídia"
                        : tab === "reposts"
                          ? "Reposts"
                          : "Publicações"}
                  </h2>
                  <p className="section-subtitle">
                    {tab === "replies"
                      ? "Respostas feitas pelo perfil"
                      : tab === "media"
                        ? "Conteúdos com mídia"
                        : tab === "reposts"
                          ? "Conteúdos compartilhados"
                          : "Publicações em ordem cronológica"}
                  </p>
                </div>
              </div>
              {tab === "media" ? (
                <div className="panel-card" style={{ marginTop: "0.5rem" }}>
                  <div className="muted">Sem mídia por enquanto.</div>
                </div>
              ) : tab === "reposts" ? (
                <div className="panel-card" style={{ marginTop: "0.5rem" }}>
                  <div className="muted">Sem reposts por enquanto.</div>
                </div>
              ) : threadList.length === 0 ? (
                <div className="panel-card" style={{ marginTop: "0.5rem" }}>
                  <div className="muted">Nada por aqui ainda.</div>
                </div>
              ) : (
                threadList.map((thread) => (
                  <ThreadCard
                    key={thread.id}
                    thread={thread}
                    viewerId={user.id}
                    viewerUsername={user.username}
                    viewerImage={user.image}
                  />
                ))
              )}
            </section>
          </div>
        </main>
        <RightPanel currentUserId={user.id} />
      </div>
    </>
  );
}
