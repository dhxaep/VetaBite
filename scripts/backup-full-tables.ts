import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

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

async function main() {
  const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  console.log('[BACKUP] Mengambil data lengkap seluruh tabel terkait sebelum migrasi...');

  const tables = ['MenuItem', 'Canteen', 'Order', 'OrderItem', 'User', 'site_configs'];
  const snapshot: Record<string, any[]> = {};

  for (const table of tables) {
    const res = await client.query(`SELECT * FROM "${table}"`);
    snapshot[table] = res.rows;
    console.log(` - Tabel "${table}": ${res.rows.length} baris dicadangkan.`);
  }

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const outPath = path.resolve(process.cwd(), `backup-tables-${dateStr}.json`);
  fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2), 'utf8');

  console.log(`[BACKUP SUKSES] Seluruh tabel berhasil dicadangkan ke: ${outPath} (${(fs.statSync(outPath).size / (1024 * 1024)).toFixed(2)} MB)`);
  await client.end();
}

main().catch(console.error);

