import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Baca .env
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const isApply = process.argv.includes('--apply');
const isDryRun = !isApply;

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gkdcbdljujqoxqnvqiil.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!DATABASE_URL) {
  console.error('[FATAL] DATABASE_URL atau DIRECT_URL tidak ditemukan di .env.');
  process.exit(1);
}

let supabase: SupabaseClient | null = null;
if (isApply) {
  if (!SUPABASE_KEY) {
    console.error('[FATAL] Mode --apply membutuhkan SUPABASE_SERVICE_ROLE_KEY di .env.');
    console.error('Silakan tambahkan SUPABASE_SERVICE_ROLE_KEY ke file .env sebelum menjalankan --apply.');
    process.exit(1);
  }
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });
}

function parseBase64DataUri(dataUri: string): { mime: string; buffer: Buffer } | null {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return {
    mime: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  };
}

async function compressImage(
  buffer: Buffer,
  kind: 'menu' | 'canteen_banner' | 'qris' | 'avatar' | 'site' | 'payment_proof'
): Promise<{ webpBuffer: Buffer; width?: number; height?: number }> {
  let maxWidth = 1000;
  let maxHeight: number | undefined = undefined;
  let initialQuality = 80;
  let minQuality = 50;
  let targetMaxBytes = 200 * 1024;

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
      minQuality = 85;
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

  const baseSharp = sharp(buffer).rotate().resize({
    width: maxWidth,
    height: maxHeight,
    fit: 'inside',
    withoutEnlargement: true,
  });

  let currentQuality = initialQuality;
  let webpBuffer = await baseSharp.webp({ quality: currentQuality, effort: 4 }).toBuffer();

  while (webpBuffer.length > targetMaxBytes && currentQuality > minQuality) {
    currentQuality = Math.max(minQuality, currentQuality - 10);
    webpBuffer = await baseSharp.webp({ quality: currentQuality, effort: 4 }).toBuffer();
  }

  return { webpBuffer };
}

interface BackupItem {
  table: string;
  id: string;
  column: string;
  originalValue: string;
  createdAt?: string;
  notes?: string;
}

const backups: BackupItem[] = [];

async function main() {
  console.log('='.repeat(80));
  console.log(` VETABITE - SCRIPT MIGRASI BASE64 DATABASE KE SUPABASE STORAGE`);
  console.log(` MODE: ${isDryRun ? 'DRY-RUN (Simulasi saja, tidak menulis ke DB/Storage)' : 'APPLY (Eksekusi Nyata)'}`);
  console.log('='.repeat(80));

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  console.log('[OK] Terhubung ke Supabase PostgreSQL.\n');

  let totalScanned = 0;
  let totalBase64Found = 0;
  let totalUploaded = 0;
  let totalNullified = 0;
  let totalBytesBefore = 0;
  let totalBytesAfter = 0;
  let failedCount = 0;

  // 1. MenuItem.photo_url
  console.log('--- [1/6] Memeriksa MenuItem.photo_url ---');
  const menuRows = await client.query('SELECT id, name, photo_url FROM "MenuItem" WHERE photo_url LIKE $1', ['data:%']);
  totalScanned += menuRows.rows.length;
  for (const row of menuRows.rows) {
    totalBase64Found++;
    const parsed = parseBase64DataUri(row.photo_url);
    if (!parsed) continue;

    const sizeBefore = parsed.buffer.length;
    totalBytesBefore += sizeBefore;
    const { webpBuffer } = await compressImage(parsed.buffer, 'menu');
    totalBytesAfter += webpBuffer.length;

    const storagePath = `menu/${row.id}.webp`;
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/images/${storagePath}`;

    console.log(` - MenuItem [${row.id}] "${row.name}": ${(sizeBefore / 1024).toFixed(1)} kB -> ${(webpBuffer.length / 1024).toFixed(1)} kB (WebP)`);

    backups.push({ table: 'MenuItem', id: row.id, column: 'photo_url', originalValue: row.photo_url });

    if (isApply && supabase) {
      const { error: upErr } = await supabase.storage.from('images').upload(storagePath, webpBuffer, {
        contentType: 'image/webp',
        upsert: true,
        cacheControl: '31536000',
      });
      if (upErr) {
        console.error(`   [GAGAL UPLOAD] ${upErr.message}`);
        failedCount++;
        continue;
      }
      await client.query('UPDATE "MenuItem" SET photo_url = $1 WHERE id = $2', [publicUrl, row.id]);
      totalUploaded++;
    }
  }

  // 2. Canteen.banner_url
  console.log('\n--- [2/6] Memeriksa Canteen.banner_url ---');
  const bannerRows = await client.query('SELECT id, name, banner_url FROM "Canteen" WHERE banner_url LIKE $1', ['data:%']);
  totalScanned += bannerRows.rows.length;
  for (const row of bannerRows.rows) {
    totalBase64Found++;
    const parsed = parseBase64DataUri(row.banner_url);
    if (!parsed) continue;

    const sizeBefore = parsed.buffer.length;
    totalBytesBefore += sizeBefore;
    const { webpBuffer } = await compressImage(parsed.buffer, 'canteen_banner');
    totalBytesAfter += webpBuffer.length;

    const storagePath = `canteen/${row.id}-banner.webp`;
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/images/${storagePath}`;

    console.log(` - Canteen [${row.id}] "${row.name}" (Banner): ${(sizeBefore / 1024).toFixed(1)} kB -> ${(webpBuffer.length / 1024).toFixed(1)} kB`);

    backups.push({ table: 'Canteen', id: row.id, column: 'banner_url', originalValue: row.banner_url });

    if (isApply && supabase) {
      const { error: upErr } = await supabase.storage.from('images').upload(storagePath, webpBuffer, {
        contentType: 'image/webp',
        upsert: true,
        cacheControl: '31536000',
      });
      if (upErr) {
        console.error(`   [GAGAL UPLOAD] ${upErr.message}`);
        failedCount++;
        continue;
      }
      await client.query('UPDATE "Canteen" SET banner_url = $1 WHERE id = $2', [publicUrl, row.id]);
      totalUploaded++;
    }
  }

  // 3. Canteen.qris_image_url
  console.log('\n--- [3/6] Memeriksa Canteen.qris_image_url ---');
  const qrisRows = await client.query('SELECT id, name, qris_image_url FROM "Canteen" WHERE qris_image_url LIKE $1', ['data:%']);
  totalScanned += qrisRows.rows.length;
  for (const row of qrisRows.rows) {
    totalBase64Found++;
    const parsed = parseBase64DataUri(row.qris_image_url);
    if (!parsed) continue;

    const sizeBefore = parsed.buffer.length;
    totalBytesBefore += sizeBefore;
    const { webpBuffer } = await compressImage(parsed.buffer, 'qris');
    totalBytesAfter += webpBuffer.length;

    const storagePath = `canteen/${row.id}-qris.webp`;
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/images/${storagePath}`;

    console.log(` - Canteen [${row.id}] "${row.name}" (QRIS): ${(sizeBefore / 1024).toFixed(1)} kB -> ${(webpBuffer.length / 1024).toFixed(1)} kB (WebP Q90)`);

    backups.push({ table: 'Canteen', id: row.id, column: 'qris_image_url', originalValue: row.qris_image_url });

    if (isApply && supabase) {
      const { error: upErr } = await supabase.storage.from('images').upload(storagePath, webpBuffer, {
        contentType: 'image/webp',
        upsert: true,
        cacheControl: '31536000',
      });
      if (upErr) {
        console.error(`   [GAGAL UPLOAD] ${upErr.message}`);
        failedCount++;
        continue;
      }
      await client.query('UPDATE "Canteen" SET qris_image_url = $1 WHERE id = $2', [publicUrl, row.id]);
      totalUploaded++;
    }
  }

  // 4. User.avatar_url
  console.log('\n--- [4/6] Memeriksa User.avatar_url ---');
  const avatarRows = await client.query('SELECT id, username, avatar_url FROM "User" WHERE avatar_url LIKE $1', ['data:%']);
  totalScanned += avatarRows.rows.length;
  for (const row of avatarRows.rows) {
    totalBase64Found++;
    const parsed = parseBase64DataUri(row.avatar_url);
    if (!parsed) continue;

    const sizeBefore = parsed.buffer.length;
    totalBytesBefore += sizeBefore;
    const { webpBuffer } = await compressImage(parsed.buffer, 'avatar');
    totalBytesAfter += webpBuffer.length;

    const storagePath = `avatar/${row.id}.webp`;
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/images/${storagePath}`;

    console.log(` - User [${row.id}] "${row.username}" (Avatar): ${(sizeBefore / 1024).toFixed(1)} kB -> ${(webpBuffer.length / 1024).toFixed(1)} kB`);

    backups.push({ table: 'User', id: row.id, column: 'avatar_url', originalValue: row.avatar_url });

    if (isApply && supabase) {
      const { error: upErr } = await supabase.storage.from('images').upload(storagePath, webpBuffer, {
        contentType: 'image/webp',
        upsert: true,
        cacheControl: '31536000',
      });
      if (upErr) {
        console.error(`   [GAGAL UPLOAD] ${upErr.message}`);
        failedCount++;
        continue;
      }
      await client.query('UPDATE "User" SET avatar_url = $1 WHERE id = $2', [publicUrl, row.id]);
      totalUploaded++;
    }
  }

  // 5. site_configs.value
  console.log('\n--- [5/6] Memeriksa site_configs.value ---');
  const siteRows = await client.query('SELECT id, key, value FROM "site_configs"');
  for (const row of siteRows.rows) {
    if (row.value.startsWith('data:image/')) {
      totalBase64Found++;
      const parsed = parseBase64DataUri(row.value);
      if (!parsed) continue;

      const sizeBefore = parsed.buffer.length;
      totalBytesBefore += sizeBefore;
      const { webpBuffer } = await compressImage(parsed.buffer, 'site');
      totalBytesAfter += webpBuffer.length;

      const storagePath = `site/${row.key}.webp`;
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/images/${storagePath}`;

      console.log(` - site_configs [${row.key}] (Gambar Langsung): ${(sizeBefore / 1024).toFixed(1)} kB -> ${(webpBuffer.length / 1024).toFixed(1)} kB`);

      backups.push({ table: 'site_configs', id: row.id, column: 'value', originalValue: row.value, notes: row.key });

      if (isApply && supabase) {
        const { error: upErr } = await supabase.storage.from('images').upload(storagePath, webpBuffer, {
          contentType: 'image/webp',
          upsert: true,
          cacheControl: '31536000',
        });
        if (upErr) {
          console.error(`   [GAGAL UPLOAD] ${upErr.message}`);
          failedCount++;
          continue;
        }
        await client.query('UPDATE "site_configs" SET value = $1 WHERE id = $2', [publicUrl, row.id]);
        totalUploaded++;
      }
    } else {
      // Periksa apakah berupa JSON yang di dalamnya terdapat field base64
      try {
        const json = JSON.parse(row.value);
        let modified = false;
        for (const k of Object.keys(json)) {
          if (typeof json[k] === 'string' && json[k].startsWith('data:image/')) {
            totalBase64Found++;
            const parsed = parseBase64DataUri(json[k]);
            if (parsed) {
              const sizeBefore = parsed.buffer.length;
              totalBytesBefore += sizeBefore;
              const { webpBuffer } = await compressImage(parsed.buffer, 'site');
              totalBytesAfter += webpBuffer.length;

              const storagePath = `site/${row.key}_${k}.webp`;
              const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/images/${storagePath}`;

              console.log(` - site_configs [${row.key}.${k}] (JSON nested base64): ${(sizeBefore / 1024).toFixed(1)} kB -> ${(webpBuffer.length / 1024).toFixed(1)} kB`);

              backups.push({ table: 'site_configs', id: row.id, column: `value.${k}`, originalValue: json[k], notes: `${row.key}.${k}` });

              if (isApply && supabase) {
                const { error: upErr } = await supabase.storage.from('images').upload(storagePath, webpBuffer, {
                  contentType: 'image/webp',
                  upsert: true,
                  cacheControl: '31536000',
                });
                if (!upErr) {
                  json[k] = publicUrl;
                  modified = true;
                  totalUploaded++;
                } else {
                  console.error(`   [GAGAL UPLOAD] ${upErr.message}`);
                  failedCount++;
                }
              }
            }
          }
        }
        if (isApply && modified) {
          await client.query('UPDATE "site_configs" SET value = $1 WHERE id = $2', [JSON.stringify(json), row.id]);
        }
      } catch {
        // Teks biasa non-JSON non-gambar diabaikan sesuai aturan
      }
    }
  }

  // 6. Order.payment_proof_url (ATURAN KHUSUS: Batas 5 Jam)
  console.log('\n--- [6/6] Memeriksa Order.payment_proof_url (Aturan 5 Jam) ---');
  const orderRows = await client.query(`
    SELECT id, queue_number, created_at, payment_proof_url 
    FROM "Order" 
    WHERE payment_proof_url LIKE $1
  `, ['data:%']);

  const fiveHoursMs = 5 * 60 * 60 * 1000;
  const now = Date.now();

  let activeOrderCount = 0;
  let expiredOrderCount = 0;

  for (const row of orderRows.rows) {
    totalBase64Found++;
    const orderCreatedAt = new Date(row.created_at).getTime();
    const ageMs = now - orderCreatedAt;
    const isExpired = ageMs >= fiveHoursMs;

    const parsed = parseBase64DataUri(row.payment_proof_url);
    const sizeBefore = parsed ? parsed.buffer.length : row.payment_proof_url.length;
    totalBytesBefore += sizeBefore;

    backups.push({
      table: 'Order',
      id: row.id,
      column: 'payment_proof_url',
      originalValue: row.payment_proof_url,
      createdAt: row.created_at,
      notes: isExpired ? `EXPIRED (>5h, age=${(ageMs / 36e5).toFixed(1)}h)` : `ACTIVE (<=5h, age=${(ageMs / 36e5).toFixed(1)}h)`,
    });

    if (isExpired) {
      expiredOrderCount++;
      console.log(` - Order [${row.id}] Antrean ${row.queue_number}: ${(sizeBefore / 1024).toFixed(1)} kB | Usia ${(ageMs / 36e5).toFixed(1)} jam -> [HANGUS > 5 JAM: Set ke NULL/kosong, TIDAK diupload]`);

      if (isApply) {
        await client.query(`
          UPDATE "Order" 
          SET payment_proof_url = '', payment_proof_expires_at = NULL 
          WHERE id = $1
        `, [row.id]);
        totalNullified++;
      }
    } else {
      activeOrderCount++;
      const storagePath = `order/${row.id}.webp`;
      const expiresAt = new Date(orderCreatedAt + fiveHoursMs);

      if (parsed) {
        const { webpBuffer } = await compressImage(parsed.buffer, 'payment_proof');
        totalBytesAfter += webpBuffer.length;
        console.log(` - Order [${row.id}] Antrean ${row.queue_number}: ${(sizeBefore / 1024).toFixed(1)} kB -> ${(webpBuffer.length / 1024).toFixed(1)} kB | Usia ${(ageMs / 36e5).toFixed(1)} jam -> [AKTIF <= 5 JAM: Upload ke bucket payment-proofs, expires_at=${expiresAt.toISOString()}]`);

        if (isApply && supabase) {
          const { error: upErr } = await supabase.storage.from('payment-proofs').upload(storagePath, webpBuffer, {
            contentType: 'image/webp',
            upsert: true,
          });
          if (upErr) {
            console.error(`   [GAGAL UPLOAD] ${upErr.message}`);
            failedCount++;
            continue;
          }
          await client.query(`
            UPDATE "Order" 
            SET payment_proof_url = $1, payment_proof_expires_at = $2 
            WHERE id = $3
          `, [storagePath, expiresAt, row.id]);
          totalUploaded++;
        }
      }
    }
  }

  // Backup output
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const backupFileName = `backup-images-${dateStr}.json`;
  const backupFilePath = path.resolve(process.cwd(), backupFileName);
  fs.writeFileSync(backupFilePath, JSON.stringify(backups, null, 2), 'utf8');

  console.log('\n' + '='.repeat(80));
  console.log(' RINGKASAN MIGRASI');
  console.log('='.repeat(80));
  console.log(`Total baris base64 ditemukan : ${totalBase64Found}`);
  console.log(`- MenuItem                   : ${menuRows.rows.length}`);
  console.log(`- Canteen (Banner)           : ${bannerRows.rows.length}`);
  console.log(`- Canteen (QRIS)             : ${qrisRows.rows.length}`);
  console.log(`- User (Avatar)              : ${avatarRows.rows.length}`);
  console.log(`- site_configs               : ${siteRows.rows.filter(r => r.value.startsWith('data:')).length}`);
  console.log(`- Order (Bukti Bayar)        : ${orderRows.rows.length}`);
  console.log(`  * Hangus (> 5 jam)         : ${expiredOrderCount} baris (diset NULL/kosong)`);
  console.log(`  * Aktif (<= 5 jam)         : ${activeOrderCount} baris (diunggah ke bucket private)`);
  console.log('-'.repeat(80));
  console.log(`Total ukuran data SEBELUM    : ${(totalBytesBefore / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Estimasi ukuran data SESUDAH : ${(totalBytesAfter / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Penghematan bandwidth DB     : ${(((totalBytesBefore - totalBytesAfter) / totalBytesBefore) * 100).toFixed(1)}%`);
  console.log(`File Backup JSON tersimpan di: ${backupFileName} (${backups.length} entitas dicadangkan)`);
  if (isApply) {
    console.log(`Berhasil diunggah ke Storage : ${totalUploaded}`);
    console.log(`Bukti hangus dinullkan       : ${totalNullified}`);
    console.log(`Gagal                        : ${failedCount}`);
  }
  console.log('='.repeat(80));

  await client.end();
}

main().catch((err) => {
  console.error('[ERROR]', err);
  process.exit(1);
});

