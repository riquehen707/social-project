import Link from "next/link";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";
import { relativeTime } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth");
  }
  const user = session.user!;

  const items = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      actor: { select: { id: true, username: true, name: true } },
      thread: { select: { id: true, text: true } },
    },
  });

  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });

  return (
    <>
      <Topbar username={user.username} />
      <div className="app-shell">
        <Sidebar username={user.username ?? undefined} />
        <main className="feed-surface chat-surface">
          <div className="panel-card">
            <div className="section-kicker">Notificacoes</div>
            <h1 className="section-title">Atividade</h1>
            <div className="notifications-list">
              {items.length === 0 && (
                <div className="muted">Nenhuma notificacao ainda.</div>
              )}
              {items.map((item) => {
                const actor = item.actor?.name || "Alguem";
                const when = relativeTime(item.createdAt);
                let text = "";
                if (item.type === "follow") {
                  text = `${actor} comecou a seguir voce.`;
                } else if (item.type === "like") {
                  text = `${actor} curtiu sua thread.`;
                } else if (item.type === "reply") {
                  text = `${actor} respondeu sua thread.`;
                } else {
                  text = `${actor} enviou uma atualizacao.`;
                }

                return (
                  <div key={item.id} className="notification-item">
                    <div>
                      <div className="thread-name">{text}</div>
                      <div className="muted">{when}</div>
                    </div>
                    {item.threadId && (
                      <Link className="btn btn-ghost" href={`/thread/${item.threadId}`}>
                        Ver
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
