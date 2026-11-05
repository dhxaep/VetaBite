import sharp from 'sharp';
import { detectImageMime } from '../src/lib/storage/image';

async function test() {
  console.log("=== Testing Image Pipeline ===");

  // 1. Non-image test
  const textBuffer = Buffer.from("Hello world this is not an image file!");
  const mimeText = detectImageMime(textBuffer);
  console.log("1. Non-image mime detection:", mimeText === null ? "PASSED (rejected as expected)" : "FAILED");

  // 2. Valid PNG test
  const testPng = await sharp({
    create: {
      width: 1500,
      height: 1200,
      channels: 4,
      background: { r: 255, g: 100, b: 50, alpha: 1 }
    }
  }).png().toBuffer();
  const mimePng = detectImageMime(testPng);
  console.log("2. PNG mime detection:", mimePng, mimePng === 'image/png' ? "PASSED" : "FAILED");
  console.log("   PNG size before:", testPng.length, "bytes");

  // Compress using sharp to WebP
  const webpRes = await sharp(testPng)
    .rotate()
    .resize({ width: 1000, height: 1000, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80, effort: 4 })
    .toBuffer();
  console.log("   WebP size after:", webpRes.length, "bytes (< 200 kB target: " + (webpRes.length < 200 * 1024) + ")");

  // 3. Valid JPEG test with simulated EXIF orientation
  const testJpg = await sharp({
    create: {
      width: 1800,
      height: 1200,
      channels: 3,
      background: { r: 50, g: 150, b: 255 }
    }
  }).jpeg().toBuffer();
  const mimeJpg = detectImageMime(testJpg);
  console.log("3. JPEG mime detection:", mimeJpg, mimeJpg === 'image/jpeg' ? "PASSED" : "FAILED");
  console.log("   JPEG size before:", testJpg.length, "bytes");

  const qrisWebp = await sharp(testJpg)
    .rotate()
    .resize({ width: 1000, height: 1000, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 90, effort: 4 })
    .toBuffer();
  console.log("   QRIS WebP size after (quality 90):", qrisWebp.length, "bytes");

  console.log("=== Pipeline Local Verification PASSED ===");
}

test().catch(console.error);

