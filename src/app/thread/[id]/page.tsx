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
  const user = session.user!;

  const thread = await getThreadWithReplies(id, user.id);
  if (!thread) notFound();

  const isOwner = thread.authorId === user.id;

  return (
    <>
      <Topbar username={user.username} />
      <div className="app-shell">
        <Sidebar username={user.username ?? undefined} />
        <main className="feed-surface thread-surface">
          <div className="profile-section" style={{ margin: "1rem" }}>
            <ThreadCard
              thread={thread}
              viewerId={user.id}
              viewerUsername={user.username}
              viewerImage={user.image}
              showReplies
            />
            <div style={{ padding: "0 1rem 1rem" }}>
              <ThreadComposer
                parentId={thread.id}
                userImage={user.image}
                username={user.username}
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
