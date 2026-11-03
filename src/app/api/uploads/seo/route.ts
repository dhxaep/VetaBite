import { getSession } from "@/lib/auth";
import { jsonOk, jsonErr } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const assetKey = url.searchParams.get("asset") || "thumbnail";
    const dbKey = assetKey === "favicon" ? "asset_favicon" : "asset_thumbnail";

    const config = await prisma.siteConfig.findUnique({
      where: { key: dbKey },
    });

    if (config?.value) {
      let mimeType = assetKey === "favicon" ? "image/png" : "image/jpeg";
      let base64Data = config.value;

      if (config.value.startsWith("data:")) {
        const match = config.value.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          base64Data = match[2];
        }
      }

      const buf = Buffer.from(base64Data, "base64");
      return new Response(buf, {
        headers: {
          "Content-Type": mimeType,
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      });
    }

    // Fallback: logo default dari aset statis public/LOGO.jpeg
    return Response.redirect(new URL("/LOGO.jpeg", req.url), 302);
  } catch (err) {
    console.error("GET /api/uploads/seo error:", err);
    return new Response("Server error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const s = await getSession();
    if (!s || s.role !== "ADMIN") {
      return jsonErr("FORBIDDEN", "Hanya administrator yang dapat mengunggah aset SEO.", 403);
    }

    const fd = await req.formData();
    const f = fd.get("file") as unknown as File | null;
    const kind = (fd.get("kind") as string) || "thumbnail";

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

    const mimeType = f.type || (ext === "ico" ? "image/x-icon" : ext === "svg" ? "image/svg+xml" : `image/${ext}`);
    const base64Uri = `data:${mimeType};base64,${buf.toString("base64")}`;

    const assetKey = kind === "favicon" ? "favicon" : "thumbnail";
    const dbKey = assetKey === "favicon" ? "asset_favicon" : "asset_thumbnail";

    // Simpan gambar langsung ke database SiteConfig agar persisten di Vercel Serverless
    await prisma.siteConfig.upsert({
      where: { key: dbKey },
      update: {
        value: base64Uri,
        updatedAt: new Date(),
      },
      create: {
        key: dbKey,
        value: base64Uri,
        description: `Aset gambar SEO untuk ${assetKey}`,
      },
    });

    const fileUrl = `/api/uploads/seo?asset=${assetKey}&v=${Date.now()}`;
    return jsonOk({ fileUrl }, 201);
  } catch (err: unknown) {
    console.error("POST /api/uploads/seo error:", err);
    return jsonErr("SERVER_ERROR", "Terjadi kesalahan saat memproses file unggahan SEO.", 500);
  }
}
