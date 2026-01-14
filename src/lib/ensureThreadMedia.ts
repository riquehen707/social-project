import prisma from "@/lib/prisma";

let ensured = false;
let ensurePromise: Promise<void> | null = null;

export async function ensureThreadMediaColumns() {
  if (ensured) return;
  if (!ensurePromise) {
    ensurePromise = (async () => {
      const columns = await prisma.$queryRaw<{ column_name: string }[]>`
        select column_name
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'Thread'
          and column_name in ('mediaUrl', 'mediaType')
      `;
      const existing = new Set(columns.map((col) => col.column_name));
      if (!existing.has("mediaUrl") || !existing.has("mediaType")) {
        await prisma.$executeRaw`
          ALTER TABLE "Thread"
          ADD COLUMN IF NOT EXISTS "mediaUrl" TEXT,
          ADD COLUMN IF NOT EXISTS "mediaType" TEXT
        `;
      }
      ensured = true;
    })().catch((error) => {
      ensurePromise = null;
      throw error;
    });
  }

  return ensurePromise;
}
