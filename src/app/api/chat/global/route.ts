import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/authOptions";

const schema = z.object({
  text: z.string().min(1).max(500),
});

export async function GET() {
  const messages = await prisma.globalMessage.findMany({
    orderBy: { createdAt: "asc" },
    take: 60,
    include: {
      user: { select: { id: true, username: true, name: true, image: true } },
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

    const message = await prisma.globalMessage.create({
      data: {
        text: parsed.data.text.trim(),
        userId: session.user.id,
      },
      include: {
        user: { select: { id: true, username: true, name: true, image: true } },
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
