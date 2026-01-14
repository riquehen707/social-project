import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "thread-media";

function getExtension(fileName: string, mimeType: string) {
  const extIndex = fileName.lastIndexOf(".");
  if (extIndex !== -1) return fileName.slice(extIndex).toLowerCase();
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/gif") return ".gif";
  if (mimeType === "image/heic") return ".heic";
  if (mimeType === "image/heif") return ".heif";
  return "";
}

function getAuthHeaders() {
  return {
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    apikey: SUPABASE_SERVICE_ROLE_KEY ?? "",
  };
}

let bucketEnsured = false;
let bucketEnsuring: Promise<void> | null = null;

async function ensureBucket() {
  if (bucketEnsured) return;
  if (!bucketEnsuring) {
    bucketEnsuring = (async () => {
      const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel listar buckets");
      }

      const buckets = (await response.json()) as Array<{ id: string }>;
      const exists = buckets.some((bucket) => bucket.id === SUPABASE_BUCKET);

      if (!exists) {
        const createResponse = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: SUPABASE_BUCKET,
            name: SUPABASE_BUCKET,
            public: true,
          }),
        });

        if (!createResponse.ok && createResponse.status !== 409) {
          throw new Error("Nao foi possivel criar o bucket");
        }
      }

      bucketEnsured = true;
    })().catch((error) => {
      bucketEnsuring = null;
      throw error;
    });
  }

  return bucketEnsuring;
}

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Supabase nao configurado" },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo nao encontrado" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Tipo de arquivo invalido" }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "Arquivo muito grande" }, { status: 400 });
    }

    await ensureBucket();

    const extension = getExtension(file.name, file.type);
    const filename = `${Date.now()}-${randomUUID()}${extension}`;
    const objectPath = `threads/${session.user.id}/${filename}`;
    const arrayBuffer = await file.arrayBuffer();
    const uploadResponse = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${objectPath}`,
      {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": file.type,
          "Cache-Control": "3600",
          "x-upsert": "true",
        },
        body: Buffer.from(arrayBuffer),
      },
    );

    if (!uploadResponse.ok) {
      const message = await uploadResponse.text();
      return NextResponse.json(
        { error: message || "Falha ao enviar a midia" },
        { status: 500 },
      );
    }

    const mediaType = file.type === "image/gif" ? "gif" : "image";
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${objectPath}`;

    return NextResponse.json(
      { url: publicUrl, type: mediaType },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Nao foi possivel salvar o arquivo" },
      { status: 500 },
    );
  }
}
