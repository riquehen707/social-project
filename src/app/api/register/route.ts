import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2).max(50),
  username: z
    .string()
    .toLowerCase()
    .regex(/^[a-z0-9_.]+$/, "Use apenas letras, números, ponto e underline")
    .min(3)
    .max(20),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
        { status: 400 },
      );
    }

    const { name, username, email, password } = parsed.data;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Usuário ou e-mail já usado" },
        { status: 400 },
      );
    }

    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashed,
        image: `https://avatar.vercel.sh/${username}`,
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Não foi possível criar a conta" },
      { status: 500 },
    );
  }
}
