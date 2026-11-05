import sharp from 'sharp';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { isBase64Image, resolveImageUrl } from '@/lib/image-url';

export { isBase64Image, resolveImageUrl };

export const PAYMENT_PROOF_TTL_HOURS = 5;
export const PAYMENT_PROOF_TTL_MS = PAYMENT_PROOF_TTL_HOURS * 60 * 60 * 1000;
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export type ImageKind = 'menu' | 'canteen_banner' | 'qris' | 'payment_proof' | 'site' | 'avatar';

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://gkdcbdljujqoxqnvqiil.supabase.co';

let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (_supabaseAdmin) return _supabaseAdmin;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi di environment server.');
  }
  _supabaseAdmin = createClient(SUPABASE_URL, key, {
    auth: { persistSession: false },
  });
  return _supabaseAdmin;
}

/**
 * Validasi MIME type sebenarnya dari magic bytes berkas gambar.
 */
export function detectImageMime(buffer: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'image/png';
  }

  // WebP: RIFF ... WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  // GIF: GIF87a atau GIF89a
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) {
    return 'image/gif';
  }

  return null;
}

export interface ProcessImageOptions {
  kind: ImageKind;
  id: string; // ID entitas terkait (menu id, canteen id, order id, user id, atau site key)
}

export interface UploadResult {
  bucket: 'images' | 'payment-proofs';
  path: string;
  url?: string; // Hanya untuk public bucket 'images'
  sizeBytes: number;
  mimeType: 'image/webp';
}

/**
 * Pipeline pemrosesan gambar server-side:
 * Validasi -> Rotate EXIF -> Resize -> WebP Iterative Compression -> Supabase Storage Upload
 */
export async function processAndUploadImage(
  fileBuffer: Buffer,
  options: ProcessImageOptions
): Promise<UploadResult> {
  if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error('Ukuran file melebihi batas maksimal 5 MB.');
  }

  const detectedMime = detectImageMime(fileBuffer);
  if (!detectedMime) {
    throw new Error('Format gambar tidak valid. Hanya berkas JPEG, PNG, WebP, dan GIF yang didukung.');
  }

  const { kind, id } = options;
  const isPaymentProof = kind === 'payment_proof';
  const bucket: 'images' | 'payment-proofs' = isPaymentProof ? 'payment-proofs' : 'images';

  // 1. Tentukan batas dimensi resize
  let maxWidth = 1000;
  let maxHeight: number | undefined = undefined;
  let initialQuality = 80;
  let minQuality = 50;
  let targetMaxBytes = 200 * 1024; // 200 kB untuk menu

  switch (kind) {
    case 'menu':
      maxWidth = 1000;
      maxHeight = 1000;
      initialQuality = 80;
      minQuality = 50;
      targetMaxBytes = 200 * 1024;
      break;
    case 'canteen_banner':
    case 'site':
      maxWidth = 1600;
      maxHeight = undefined;
      initialQuality = 80;
      minQuality = 50;
      targetMaxBytes = 350 * 1024;
      break;
    case 'qris':
      maxWidth = 1000;
      maxHeight = 1000;
      initialQuality = 90;
      minQuality = 85; // QRIS jangan di bawah 85 agar tetap tajam dan bisa dipindai
      targetMaxBytes = 300 * 1024;
      break;
    case 'payment_proof':
      maxWidth = 1400;
      maxHeight = 1400;
      initialQuality = 80;
      minQuality = 50;
      targetMaxBytes = 400 * 1024;
      break;
    case 'avatar':
      maxWidth = 500;
      maxHeight = 500;
      initialQuality = 80;
      minQuality = 50;
      targetMaxBytes = 100 * 1024;
      break;
  }

  // 2. Base Sharp instance: rotate orientasi EXIF & strip metadata untuk privasi
  let baseSharp = sharp(fileBuffer)
    .rotate()
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    });

  // 3. WebP Iterative Compression
  let currentQuality = initialQuality;
  let webpBuffer = await baseSharp.webp({ quality: currentQuality, effort: 4 }).toBuffer();

  while (webpBuffer.length > targetMaxBytes && currentQuality > minQuality) {
    currentQuality = Math.max(minQuality, currentQuality - 10);
    webpBuffer = await baseSharp.webp({ quality: currentQuality, effort: 4 }).toBuffer();
  }

  // 4. Struktur Path Storage
  let storagePath = '';
  switch (kind) {
    case 'menu':
      storagePath = `menu/${id}.webp`;
      break;
    case 'canteen_banner':
      storagePath = `canteen/${id}-banner.webp`;
      break;
    case 'qris':
      storagePath = `canteen/${id}-qris.webp`;
      break;
    case 'site':
      storagePath = `site/${id}.webp`;
      break;
    case 'avatar':
      storagePath = `avatar/${id}.webp`;
      break;
    case 'payment_proof':
      storagePath = `order/${id}.webp`;
      break;
  }

  // 5. Upload ke Supabase Storage
  const supabase = getSupabaseAdmin();
  const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, webpBuffer, {
    contentType: 'image/webp',
    upsert: true,
    cacheControl: bucket === 'images' ? '31536000' : 'no-cache',
  });

  if (uploadError) {
    console.error(`Gagal mengunggah berkas ke Supabase Storage (${bucket}/${storagePath}):`, uploadError);
    throw new Error(`Gagal menyimpan gambar ke penyimpanan: ${uploadError.message}`);
  }

  // 6. Return response
  if (bucket === 'images') {
    const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(storagePath);
    // Tambahkan cache buster query parameter saat URL dikembalikan
    const publicUrlWithBuster = `${publicUrlData.publicUrl}?v=${Date.now()}`;
    return {
      bucket: 'images',
      path: storagePath,
      url: publicUrlWithBuster,
      sizeBytes: webpBuffer.length,
      mimeType: 'image/webp',
    };
  }

  // Bucket private 'payment-proofs' mengembalikan path saja (bukan URL)
  return {
    bucket: 'payment-proofs',
    path: storagePath,
    sizeBytes: webpBuffer.length,
    mimeType: 'image/webp',
  };
}

/**
 * Membuat signed URL sementara untuk bukti pembayaran di bucket private.
 * Menolak jika bukti sudah hangus (payment_proof_expires_at lewat).
 * Masa berlaku adalah yang lebih kecil antara 10 menit (600 detik) dan sisa waktu bukti.
 */
export async function getSignedProofUrl(
  path: string | null | undefined,
  expiresAt?: Date | string | null
): Promise<string | null> {
  if (!path || path.trim() === '') return null;

  // Jika proof adalah data URI base64 lama (fallback data belum termigrasi), return apa adanya
  if (path.startsWith('data:image/')) {
    return path;
  }

  // Periksa batas kadaluarsa bukti pembayaran
  if (expiresAt) {
    const expTime = new Date(expiresAt).getTime();
    const remainingSeconds = Math.floor((expTime - Date.now()) / 1000);
    if (remainingSeconds <= 0) {
      return null; // Bukti sudah hangus
    }

    const signedExpirySec = Math.min(10 * 60, remainingSeconds);
    const supabase = getSupabaseAdmin();
    const cleanPath = extractStoragePath(path);
    const { data, error } = await supabase.storage
      .from('payment-proofs')
      .createSignedUrl(cleanPath, signedExpirySec);

    if (error || !data?.signedUrl) {
      console.warn('Gagal membuat signed URL bukti pembayaran:', error);
      return null;
    }
    return data.signedUrl;
  }

  // Default: signed URL 10 menit jika expiresAt tidak didefinisikan
  const supabase = getSupabaseAdmin();
  const cleanPath = extractStoragePath(path);
  const { data, error } = await supabase.storage.from('payment-proofs').createSignedUrl(cleanPath, 600);
  if (error || !data?.signedUrl) {
    return null;
  }
  return data.signedUrl;
}

/**
 * Menghapus file gambar dari Supabase Storage saat diganti atau dihapus.
 */
export async function deleteImage(
  bucket: 'images' | 'payment-proofs',
  pathOrUrl: string | null | undefined
): Promise<boolean> {
  if (!pathOrUrl || pathOrUrl.startsWith('data:') || pathOrUrl.startsWith('/images/')) {
    return false; // Jangan hapus aset lokal atau string data URI
  }

  try {
    const cleanPath = extractStoragePath(pathOrUrl);
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage.from(bucket).remove([cleanPath]);
    if (error) {
      console.warn(`Gagal menghapus file di ${bucket}/${cleanPath}:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`Error saat menghapus ${bucket} file:`, err);
    return false;
  }
}

/**
 * Mengekstrak path relatif dari Storage URL atau path kotor.
 */
export function extractStoragePath(pathOrUrl: string): string {
  let clean = pathOrUrl.split('?')[0]; // Hapus query params (?v=...)
  // Jika berupa URL lengkap Supabase: .../storage/v1/object/public/<bucket>/<path>
  const marker = '/storage/v1/object/';
  const idx = clean.indexOf(marker);
  if (idx !== -1) {
    const afterMarker = clean.slice(idx + marker.length);
    // afterMarker: public/images/menu/xyz.webp atau sign/payment-proofs/order/abc.webp
    const parts = afterMarker.split('/');
    if (parts[0] === 'public' || parts[0] === 'sign' || parts[0] === 'authenticated') {
      parts.shift(); // Buang 'public'
    }
    parts.shift(); // Buang nama bucket 'images' atau 'payment-proofs'
    return parts.join('/');
  }
  return clean.replace(/^\/+/, '');
}
