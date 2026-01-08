import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/authOptions";

const schema = z.object({
  recipientId: z.string().min(1),
  text: z.string().min(1).max(500),
});

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId obrigatorio" }, { status: 400 });
  }

  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: session.user.id, recipientId: userId },
        { senderId: userId, recipientId: session.user.id },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: {
      sender: { select: { id: true, username: true, name: true, image: true } },
    },
  });

  return NextResponse.json(messages);
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados invalidos" },
        { status: 400 },
      );
    }

    const message = await prisma.directMessage.create({
      data: {
        text: parsed.data.text.trim(),
        senderId: session.user.id,
        recipientId: parsed.data.recipientId,
      },
      include: {
        sender: { select: { id: true, username: true, name: true, image: true } },
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Nao foi possivel enviar a mensagem" },
      { status: 500 },
    );
  }
}
