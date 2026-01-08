import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/authOptions";
import { availableInterests } from "@/data/interests";

const schema = z.object({
  interests: z.array(z.string().min(1).max(32)).max(12),
});

export async function PATCH(request: Request) {
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

    const allowed = new Set(availableInterests);
    const normalized = parsed.data.interests
      .map((item) => item.toLowerCase().trim())
      .filter((item) => allowed.has(item));

    await prisma.user.update({
      where: { id: session.user.id },
      data: { interests: normalized },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Nao foi possivel salvar interesses" },
      { status: 500 },
    );
  }
}
