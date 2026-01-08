import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import GlobalChat from "@/components/chat/GlobalChat";
import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth");
  }
  const user = session.user!;

  return (
    <>
      <Topbar username={user.username} />
      <div className="app-shell">
        <Sidebar username={user.username ?? undefined} />
        <main className="feed-surface chat-surface">
          <GlobalChat currentUserId={user.id} />
        </main>
      </div>
    </>
  );
}
