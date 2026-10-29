import { getSession } from '@/lib/auth';
import { jsonOk, jsonErr } from '@/lib/api';
import { MAX, extFor } from '@/lib/upload';
import { randomUUID } from 'crypto';
import { writeFile } from 'fs/promises';
import path from 'path';
export async function POST(req:Request){
 const s=await getSession(); if(!s) return jsonErr('UNAUTHORIZED','Silakan masuk terlebih dahulu.',401);
 const fd=await req.formData(); const f=fd.get('file') as unknown as File|null;
 if(!f) return jsonErr('VALIDATION_ERROR','File bukti pembayaran wajib diunggah.',400);
 if(f.size>MAX) return jsonErr('VALIDATION_ERROR','Ukuran file maksimal 5 MB.',400);
 const buf=Buffer.from(await f.arrayBuffer());
 const ext=extFor(buf.subarray(0,16),f.type);
 if(!ext) return jsonErr('VALIDATION_ERROR','Format file harus JPEG, PNG, atau WebP.',400);
 const name=`proof-${randomUUID()}.${ext}`;
 await writeFile(path.join(process.cwd(),'public','uploads',name),buf);
 return jsonOk({fileUrl:`/uploads/${name}`},201);
}
