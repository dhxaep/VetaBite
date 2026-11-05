import { getSession } from "@/lib/auth";
import { jsonOk, jsonErr } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { processAndUploadImage, MAX_FILE_SIZE_BYTES } from "@/lib/storage/image";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const assetKey = url.searchParams.get("asset") || "thumbnail";
    const dbKey = assetKey === "favicon" ? "asset_favicon" : "asset_thumbnail";

    const config = await prisma.siteConfig.findUnique({
      where: { key: dbKey },
    });

    if (config?.value) {
      // Jika sudah berupa URL Supabase Storage atau URL publik, redirect langsung
      if (config.value.startsWith("http://") || config.value.startsWith("https://")) {
        return Response.redirect(new URL(config.value), 302);
      }

      // Fallback data lama base64
      if (config.value.startsWith("data:")) {
        let mimeType = assetKey === "favicon" ? "image/png" : "image/jpeg";
        let base64Data = config.value;
        const match = config.value.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          base64Data = match[2];
        }
        const buf = Buffer.from(base64Data, "base64");
        return new Response(buf, {
          headers: {
            "Content-Type": mimeType,
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
          },
        });
      }
    }

    // Fallback logo statis default
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
    if (f.size > MAX_FILE_SIZE_BYTES) return jsonErr("VALIDATION_ERROR", "Ukuran file gambar maksimal 5 MB.", 400);

    const assetKey = kind === "favicon" ? "favicon" : "thumbnail";
    const dbKey = assetKey === "favicon" ? "asset_favicon" : "asset_thumbnail";
    const buf = Buffer.from(await f.arrayBuffer());

    // Upload ke bucket public 'images' di Supabase Storage
    const uploadResult = await processAndUploadImage(buf, {
      kind: 'site',
      id: assetKey,
    });

    // Simpan URL Supabase Storage ke SiteConfig
    await prisma.siteConfig.upsert({
      where: { key: dbKey },
      update: {
        value: uploadResult.url || '',
        updatedAt: new Date(),
      },
      create: {
        key: dbKey,
        value: uploadResult.url || '',
        description: `Aset gambar SEO untuk ${assetKey}`,
      },
    });

    return jsonOk(
      {
        fileUrl: uploadResult.url,
        asset: assetKey,
      },
      201
    );
  } catch (err: unknown) {
    console.error("POST /api/uploads/seo error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat memproses gambar SEO.";
    return jsonErr("SERVER_ERROR", message, 500);
  }
}
