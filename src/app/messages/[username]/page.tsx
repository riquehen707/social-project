import { notFound, redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import DirectChat from "@/components/chat/DirectChat";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ username?: string }>;
};

export default async function DirectMessagePage({ params }: PageProps) {
  const { username } = await params;
  if (!username) notFound();

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth");
  }

  const recipient = await prisma.user.findUnique({
    where: { username },
    select: { id: true, name: true },
  });

  if (!recipient) notFound();

  return (
    <>
      <Topbar username={session.user.username} />
      <div className="app-shell">
        <Sidebar username={session.user.username ?? undefined} />
        <main className="feed-surface chat-surface">
          <DirectChat
            recipientId={recipient.id}
            recipientName={recipient.name}
            currentUserId={session.user.id}
          />
        </main>
      </div>
    </>
  );
}
