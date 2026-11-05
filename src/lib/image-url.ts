/**
 * Client & Server safe helper untuk resolusi URL gambar:
 * - Menangani data lama base64 secara transparan
 * - Menangani null/undefined dengan fallback placeholder yang ramah
 * - Mengembalikan URL utuh dari Supabase Storage atau aset lokal
 */

export function isBase64Image(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith('data:image/');
}

export function resolveImageUrl(value?: string | null, fallback = '/placeholder-food.svg'): string {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return fallback;
  }
  const trimmed = value.trim();
  // Fallback data lama base64: kembalikan apa adanya
  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }
  // URL lengkap atau path lokal publik
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
    return trimmed;
  }
  return trimmed;
}

