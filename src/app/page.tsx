import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import RightPanel from "@/components/layout/RightPanel";
import Topbar from "@/components/layout/Topbar";
import ThreadCard from "@/components/feed/ThreadCard";
import ThreadComposerLauncher from "@/components/shared/ThreadComposerLauncher";
import { getFeed } from "@/data/feed";
import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth");
  }

  const feed = await getFeed(session.user.id);
  const tab = resolvedSearchParams?.tab;
  const title = tab === "discover" ? "Explorar" : "Início";
  const subtitle =
    tab === "discover" ? "Descubra perfis e threads em alta" : "Threads em tempo real";

  return (
    <>
      <Topbar username={session.user.username} />
      <div className="app-shell">
        <Sidebar username={session.user.username ?? undefined} />
        <main className="feed-surface">
          <div className="feed-header">
            <h1>{title}</h1>
            <span className="pill">{subtitle}</span>
          </div>

          <ThreadComposerLauncher
            userImage={session.user.image}
            username={session.user.username}
          />

          {feed.length === 0 ? (
            <div style={{ padding: "1.5rem" }}>
              <div className="muted">Ainda não há threads. Publique a primeira!</div>
            </div>
          ) : (
            feed.map((thread) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                viewerId={session.user.id}
                viewerUsername={session.user.username}
                viewerImage={session.user.image}
              />
            ))
          )}
        </main>
        <RightPanel currentUserId={session.user.id} />
      </div>
    </>
  );
}
