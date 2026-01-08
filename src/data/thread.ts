import prisma from "@/lib/prisma";
import { ThreadWithExtras } from "@/types/thread";

export async function getThreadWithReplies(
  threadId: string,
  currentUserId?: string,
): Promise<ThreadWithExtras | null> {
  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    include: {
      author: {
        select: { id: true, name: true, username: true, image: true, bio: true },
      },
      parent: {
        select: {
          id: true,
          author: { select: { id: true, name: true, username: true } },
        },
      },
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              bio: true,
            },
          },
          _count: { select: { likes: true, replies: true } },
        },
      },
      _count: { select: { likes: true, replies: true } },
    },
  });

  if (!thread) return null;

  const ids = [thread.id, ...thread.replies.map((r) => r.id)];
  const authorIds = [
    thread.authorId,
    ...thread.replies.map((r) => r.authorId),
  ];

  const [liked, following] = currentUserId
    ? await Promise.all([
        prisma.like.findMany({
          where: { userId: currentUserId, threadId: { in: ids } },
          select: { threadId: true },
        }),
        prisma.follow.findMany({
          where: { followerId: currentUserId, followingId: { in: authorIds } },
          select: { followingId: true },
        }),
      ])
    : [[], []];

  const likedIds = new Set(liked.map((l) => l.threadId));
  const followingIds = new Set(following.map((f) => f.followingId));

  const hydratedReplies = thread.replies.map((reply) => ({
    ...reply,
    likedByMe: likedIds.has(reply.id),
    isFollowed: followingIds.has(reply.authorId),
  }));

  const hydratedThread: ThreadWithExtras = {
    ...thread,
    likedByMe: likedIds.has(thread.id),
    isFollowed: followingIds.has(thread.authorId),
    replies: hydratedReplies,
  };

  return hydratedThread;
}
