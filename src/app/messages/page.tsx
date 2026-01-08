import Link from "next/link";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth");
  }

  const users = await prisma.user.findMany({
    where: { NOT: { id: session.user.id } },
    orderBy: { createdAt: "desc" },
    select: { id: true, username: true, name: true, image: true },
    take: 20,
  });

  return (
    <>
      <Topbar username={session.user.username} />
      <div className="app-shell">
        <Sidebar username={session.user.username ?? undefined} />
        <main className="feed-surface chat-surface">
          <div className="panel-card">
            <div className="section-kicker">Mensagens</div>
            <h1 className="section-title">Conversas</h1>
            <div className="dm-list">
              {users.map((user) => (
                <Link
                  key={user.id}
                  href={`/messages/${user.username}`}
                  className="dm-item"
                >
                  <div className="avatar">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={user.image || `https://avatar.vercel.sh/${user.username}`}
                      alt={user.username}
                      width={40}
                      height={40}
                    />
                  </div>
                  <div>
                    <div className="thread-name">{user.name}</div>
                    <div className="muted">@{user.username}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
