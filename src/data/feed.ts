import prisma from "@/lib/prisma";
import { ThreadWithExtras } from "@/types/thread";

export async function getFeed(
  currentUserId?: string,
  limit = 25,
): Promise<ThreadWithExtras[]> {
  const currentUser = currentUserId
    ? await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { interests: true },
      })
    : null;
  const interestTerms =
    currentUser?.interests?.map((item) => item.toLowerCase()).filter(Boolean) ?? [];

  const fetchLimit = interestTerms.length > 0 ? limit * 4 : limit;
  const threads = await prisma.thread.findMany({
    where: { parentId: null },
    orderBy: { createdAt: "desc" },
    take: fetchLimit,
    include: {
      author: {
        select: { id: true, name: true, username: true, image: true, bio: true },
      },
      replies: {
        take: 2,
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

  const allThreadIds = threads.flatMap((thread) => [
    thread.id,
    ...thread.replies.map((reply) => reply.id),
  ]);

  const [liked, following] = currentUserId
    ? await Promise.all([
        prisma.like.findMany({
          where: { userId: currentUserId, threadId: { in: allThreadIds } },
          select: { threadId: true },
        }),
        prisma.follow.findMany({
          where: { followerId: currentUserId },
          select: { followingId: true },
        }),
      ])
    : [[], []];

  const likedIds = new Set(liked.map((like) => like.threadId));
  const followingIds = new Set(following.map((follow) => follow.followingId));

  const enriched = threads.map((thread) => {
    const text = thread.text.toLowerCase();
    const matchCount = interestTerms.reduce(
      (count, term) => (text.includes(term) ? count + 1 : count),
      0,
    );
    const isFollowed = followingIds.has(thread.authorId);

    return {
      ...thread,
      likedByMe: likedIds.has(thread.id),
      isFollowed,
      replies: thread.replies.map((reply) => ({
        ...reply,
        likedByMe: likedIds.has(reply.id),
        isFollowed: followingIds.has(reply.authorId),
      })),
      _score: matchCount * 10 + (isFollowed ? 3 : 0),
    };
  });

  if (interestTerms.length === 0) {
    return enriched.map(({ _score, ...thread }) => thread);
  }

  const sorted = enriched.sort((a, b) => {
    if (b._score !== a._score) return b._score - a._score;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return sorted
    .slice(0, limit)
    .map(({ _score, ...thread }) => thread);
}
