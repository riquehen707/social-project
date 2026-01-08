export const dynamic = "force-dynamic";
export const revalidate = 0;

import { notFound, redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import ThreadCard from "@/components/feed/ThreadCard";
import ThreadComposer from "@/components/shared/ThreadComposer";
import { getThreadWithReplies } from "@/data/thread";
import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";

type PageProps = {
  params: Promise<{ id?: string }>;
};

export default async function ThreadPage({ params }: PageProps) {
  const { id } = await params;
  if (!id) notFound();

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth");
  }

  const thread = await getThreadWithReplies(id, session.user.id);
  if (!thread) notFound();

  const isOwner = thread.authorId === session.user.id;

  return (
    <>
      <Topbar username={session.user.username} />
      <div className="app-shell">
        <Sidebar username={session.user.username ?? undefined} />
        <main className="feed-surface thread-surface">
          <div className="profile-section" style={{ margin: "1rem" }}>
            <ThreadCard
              thread={thread}
              viewerId={session.user.id}
              viewerUsername={session.user.username}
              viewerImage={session.user.image}
              showReplies
            />
            <div style={{ padding: "0 1rem 1rem" }}>
              <ThreadComposer
                parentId={thread.id}
                userImage={session.user.image}
                username={session.user.username}
                placeholder={
                  isOwner
                    ? "Responda e continue a conversa..."
                    : "Participe da conversa..."
                }
                compact
              />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
