import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/authOptions";

const blockSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["heading", "paragraph", "quote", "image"]),
  text: z.string().max(5000).optional(),
  url: z.string().url().max(500).optional(),
  alt: z.string().max(160).optional(),
  width: z.number().min(30).max(100).optional(),
});

const postSchema = z.object({
  title: z.string().min(3).max(180),
  coverImage: z.string().url().max(500).optional().or(z.literal("")).nullable(),
  tags: z.array(z.string().min(1).max(40)).max(10).optional().default([]),
  seoTitle: z.string().max(180).optional().or(z.literal("")).nullable(),
  seoDescription: z.string().max(300).optional().or(z.literal("")).nullable(),
  blocks: z.array(blockSchema).min(1),
});

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-")
    .slice(0, 80) || "post";
}

function buildExcerpt(blocks: z.infer<typeof blockSchema>[]) {
  const text = blocks
    .filter((b) => b.type !== "image")
    .map((b) => b.text ?? "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, 180);
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
        { status: 400 },
      );
    }

    const { title, coverImage, tags, seoTitle, seoDescription, blocks } = parsed.data;
    const baseSlug = slugify(title);

    let slug = baseSlug;
    let attempts = 0;
    while (await prisma.post.findUnique({ where: { slug } })) {
      attempts += 1;
      slug = `${baseSlug}-${attempts}`;
      if (attempts > 5) {
        slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;
        break;
      }
    }

    const excerpt = seoDescription || buildExcerpt(blocks);
    const normalizedTags = (tags ?? []).map((t) => t.trim()).filter(Boolean);

    const post = await prisma.post.create({
      data: {
        title,
        seoTitle: seoTitle?.trim() || null,
        seoDescription: seoDescription?.trim() || null,
        slug,
        excerpt: excerpt || null,
        coverImage: coverImage || null,
        tags: normalizedTags,
        content: blocks,
        authorId: session.user.id,
      },
      select: { slug: true },
    });

    return NextResponse.json({ slug: post.slug }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Não foi possível publicar o artigo" },
      { status: 500 },
    );
  }
}
