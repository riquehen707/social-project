import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

function getExtension(fileName: string, mimeType: string) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext) return ext;
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/gif") return ".gif";
  if (mimeType === "image/heic") return ".heic";
  if (mimeType === "image/heif") return ".heif";
  return "";
}

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
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

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    const extension = getExtension(file.name, file.type);
    const filename = `${Date.now()}-${randomUUID()}${extension}`;
    const filePath = path.join(uploadDir, filename);

    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(arrayBuffer));

    const mediaType = file.type === "image/gif" ? "gif" : "image";

    return NextResponse.json(
      { url: `/uploads/${filename}`, type: mediaType },
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
