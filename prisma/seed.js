/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // reset data to avoid duplicate errors on repeated seeds
  await prisma.like.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.thread.deleteMany();

  const password = await bcrypt.hash("senha123", 10);

  const ana = await prisma.user.upsert({
    where: { email: "ana@threads.com" },
    update: {},
    create: {
      name: "Ana",
      username: "ana",
      email: "ana@threads.com",
      password,
      bio: "Criadora de conteúdo e fã de threads rápidas.",
      image: "https://avatar.vercel.sh/ana",
      link: "https://ana.dev",
    },
  });

  const bruno = await prisma.user.upsert({
    where: { email: "bruno@threads.com" },
    update: {},
    create: {
      name: "Bruno",
      username: "bruno",
      email: "bruno@threads.com",
      password,
      bio: "Entusiasta de produto e café forte.",
      image: "https://avatar.vercel.sh/bruno",
    },
  });

  const clara = await prisma.user.upsert({
    where: { email: "clara@threads.com" },
    update: {},
    create: {
      name: "Clara",
      username: "clara",
      email: "clara@threads.com",
      password,
      bio: "Pixel perfect e fã de UIs minimalistas.",
      image: "https://avatar.vercel.sh/clara",
      link: "https://clara.design",
    },
  });

  const henrique = await prisma.user.upsert({
    where: { email: "henrique@threads.com" },
    update: {},
    create: {
      name: "Henrique Test",
      username: "h0001",
      email: "henrique@threads.com",
      password,
      bio: "Perfil de teste.",
      image: "https://avatar.vercel.sh/h0001",
    },
  });

  await prisma.follow.createMany({
    data: [
      { followerId: ana.id, followingId: bruno.id },
      { followerId: ana.id, followingId: clara.id },
      { followerId: bruno.id, followingId: ana.id },
      { followerId: henrique.id, followingId: ana.id },
      { followerId: henrique.id, followingId: bruno.id },
    ],
  });

  const morningThread = await prisma.thread.create({
    data: {
      text: "Bom dia, Threads! ☕️\nComeçando o dia com ideias para novos produtos.",
      authorId: bruno.id,
    },
  });

  const designThread = await prisma.thread.create({
    data: {
      text: "Interfaces minimalistas não são vazias — elas dão espaço para respirar.",
      authorId: clara.id,
    },
  });

  await prisma.thread.create({
    data: {
      text: "Inspirador! Já quero testar um fluxo mais simples no app hoje.",
      authorId: ana.id,
      parentId: designThread.id,
    },
  });

  await prisma.like.createMany({
    data: [
      { userId: ana.id, threadId: morningThread.id },
      { userId: bruno.id, threadId: designThread.id },
      { userId: clara.id, threadId: morningThread.id },
    ],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
