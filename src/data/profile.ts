import prisma from "@/lib/prisma";
import { ProfileUser, ThreadWithExtras } from "@/types/thread";

export async function getProfileWithThreads(
  handle?: string,
  currentUserId?: string,
): Promise<{ profile: ProfileUser; threads: ThreadWithExtras[] } | null> {
  if (!handle) return null;
  const normalized = handle.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { username: normalized },
    select: {
      id: true,
      name: true,
      username: true,
      bio: true,
      image: true,
      link: true,
      interests: true,
      _count: { select: { followers: true, following: true } },
    },
  });

  if (!user) return null;

  const threads = await prisma.thread.findMany({
    where: { authorId: user.id },
    orderBy: { createdAt: "desc" },
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

  const allIds = threads.flatMap((thread) => [
    thread.id,
    ...thread.replies.map((reply) => reply.id),
  ]);

  const [liked, followingEntry] = currentUserId
    ? await Promise.all([
        prisma.like.findMany({
          where: { userId: currentUserId, threadId: { in: allIds } },
          select: { threadId: true },
        }),
        prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: currentUserId,
              followingId: user.id,
            },
          },
        }),
      ])
    : [[], null];

  const likedIds = new Set(liked.map((like) => like.threadId));

  const hydratedThreads: ThreadWithExtras[] = threads.map((thread) => ({
    ...thread,
    likedByMe: likedIds.has(thread.id),
    isFollowed: !!followingEntry,
    replies: thread.replies.map((reply) => ({
      ...reply,
      likedByMe: likedIds.has(reply.id),
      isFollowed: !!followingEntry,
    })),
  }));

  const profile: ProfileUser = {
    id: user.id,
    name: user.name,
    username: user.username,
    bio: user.bio,
    image: user.image,
    link: user.link,
    interests: user.interests,
    followerCount: user._count.followers,
    followingCount: user._count.following,
    isFollowedByMe: !!followingEntry,
  };

  return { profile, threads: hydratedThreads };
}
