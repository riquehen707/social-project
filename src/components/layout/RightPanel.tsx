import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import FollowButton from "../shared/FollowButton";
import GlobalChat from "../chat/GlobalChat";

export default async function RightPanel({
  currentUserId,
}: {
  currentUserId?: string;
}) {
  const suggestions = await prisma.user.findMany({
    where: currentUserId ? { NOT: { id: currentUserId } } : undefined,
    orderBy: { createdAt: "desc" },
    take: 4,
    select: { id: true, name: true, username: true, bio: true, image: true },
  });

  const followingIds =
    currentUserId &&
    new Set(
      (
        await prisma.follow.findMany({
          where: { followerId: currentUserId },
          select: { followingId: true },
        })
      ).map((f) => f.followingId),
    );

  return (
    <aside className="right-panel">
      <div>
        <div className="panel-title">Para você</div>
        <div style={{ display: "grid", gap: ".75rem" }}>
          {suggestions.map((user) => (
            <div key={user.id} className="panel-card">
              <div style={{ display: "flex", alignItems: "center", gap: ".65rem" }}>
                <div className="avatar" style={{ width: 36, height: 36 }}>
                  <Image
                    src={user.image || `https://avatar.vercel.sh/${user.username}`}
                    alt={user.username}
                    width={40}
                    height={40}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Link className="thread-name" href={`/profile/${user.username}`}>
                    {user.name}
                  </Link>
                  <div className="thread-username">@{user.username}</div>
                </div>
                <FollowButton
                  targetUserId={user.id}
                  isFollowing={followingIds ? followingIds.has(user.id) : false}
                  compact
                />
              </div>
              <div className="muted" style={{ marginTop: ".4rem" }}>
                {user.bio || "Novo por aqui"}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-title">Atividade</div>
        <div className="muted">
          Likes e respostas aparecem aqui em tempo real. Experimente curtir ou
          responder uma thread para sentir o fluxo.
        </div>
      </div>

      <GlobalChat currentUserId={currentUserId} />
    </aside>
  );
}
