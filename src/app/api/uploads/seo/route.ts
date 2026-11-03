import { getSession } from "@/lib/auth";
import { jsonOk, jsonErr } from "@/lib/api";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: Request) {
  try {
    const s = await getSession();
    if (!s || s.role !== "ADMIN") {
      return jsonErr("FORBIDDEN", "Hanya administrator yang dapat mengunggah aset SEO.", 403);
    }

    const fd = await req.formData();
    const f = fd.get("file") as unknown as File | null;
    const kind = (fd.get("kind") as string) || "seo";

    if (!f) return jsonErr("VALIDATION_ERROR", "File gambar wajib dipilih.", 400);
    if (f.size > MAX_SIZE) return jsonErr("VALIDATION_ERROR", "Ukuran file gambar maksimal 5 MB.", 400);

    const buf = Buffer.from(await f.arrayBuffer());
    let ext = "png";
    const type = f.type.toLowerCase();

    if (type.includes("jpeg") || type.includes("jpg")) ext = "jpg";
    else if (type.includes("png")) ext = "png";
    else if (type.includes("webp")) ext = "webp";
    else if (type.includes("svg")) ext = "svg";
    else if (type.includes("icon") || type.includes("ico") || f.name.endsWith(".ico")) ext = "ico";

    const name = `${kind}-${randomUUID()}.${ext}`;
    const uploadsDir = path.join(process.cwd(), "public", "uploads");

    let fileUrl = `/uploads/${name}`;
    try {
      await mkdir(uploadsDir, { recursive: true });
      await writeFile(path.join(uploadsDir, name), buf);
    } catch (fsErr) {
      console.warn("Filesystem read-only on serverless, using base64 data URI fallback:", fsErr);
      const mimeType = f.type || (ext === "ico" ? "image/x-icon" : ext === "svg" ? "image/svg+xml" : `image/${ext}`);
      fileUrl = `data:${mimeType};base64,${buf.toString("base64")}`;
    }

    return jsonOk({ fileUrl }, 201);
  } catch (err: unknown) {
    console.error("POST /api/uploads/seo error:", err);
    return jsonErr("SERVER_ERROR", "Terjadi kesalahan saat memproses file unggahan SEO.", 500);
  }
}

