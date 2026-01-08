"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";

export async function createThread({
  text,
  parentId,
}: {
  text: string;
  parentId?: string | null;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Não autorizado");
  }

  const content = text.trim();
  if (!content) {
    throw new Error("Escreva algo para publicar");
  }

  const parentThread = parentId
    ? await prisma.thread.findUnique({
        where: { id: parentId },
        select: { authorId: true },
      })
    : null;

  await prisma.thread.create({
    data: {
      text: content,
      authorId: session.user.id,
      parentId: parentId ?? null,
    },
  });

  if (parentThread && parentThread.authorId !== session.user.id) {
    await prisma.notification.create({
      data: {
        type: "reply",
        userId: parentThread.authorId,
        actorId: session.user.id,
        threadId: parentId ?? null,
      },
    });
  }

  revalidatePath("/");
  if (parentId) {
    revalidatePath(`/thread/${parentId}`);
  }
  revalidatePath(`/profile/${session.user.username ?? ""}`);
  revalidatePath("/notifications");
}

export async function toggleLike(threadId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Não autorizado");
  }

  const existing = await prisma.like.findUnique({
    where: {
      userId_threadId: {
        userId: session.user.id,
        threadId,
      },
    },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    await prisma.like.create({
      data: { userId: session.user.id, threadId },
    });

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      select: { authorId: true },
    });

    if (thread && thread.authorId !== session.user.id) {
      await prisma.notification.create({
        data: {
          type: "like",
          userId: thread.authorId,
          actorId: session.user.id,
          threadId,
        },
      });
    }
  }

  revalidatePath("/");
  revalidatePath(`/thread/${threadId}`);
  revalidatePath(`/profile/${session.user.username ?? ""}`);
  revalidatePath("/notifications");
}

export async function toggleFollow(targetUserId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Não autorizado");
  }

  if (session.user.id === targetUserId) return;

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: session.user.id,
        followingId: targetUserId,
      },
    },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
  } else {
    await prisma.follow.create({
      data: { followerId: session.user.id, followingId: targetUserId },
    });

    await prisma.notification.create({
      data: {
        type: "follow",
        userId: targetUserId,
        actorId: session.user.id,
      },
    });
  }

  revalidatePath("/");
  revalidatePath(`/profile/${session.user.username ?? ""}`);
  revalidatePath("/notifications");
  // revalidate profile of the target
  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (target) {
    revalidatePath(`/profile/${target.username}`);
  }
}
