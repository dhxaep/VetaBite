import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ownerCanteen } from '@/lib/owner';
import { jsonOk, jsonErr, zodMsg } from '@/lib/api';
export async function GET(){
 const s=await getSession(); if(!s) return jsonErr('UNAUTHORIZED','Silakan masuk terlebih dahulu.',401);
 if(s.role!=='PENJUAL') return jsonErr('FORBIDDEN','Tidak memiliki hak akses.',403);
 const c=await ownerCanteen(s.uid); if(!c) return jsonErr('NOT_FOUND','Kantin tidak ditemukan.',404);
 return jsonOk(await prisma.menuItem.findMany({where:{canteen_id:c.id},orderBy:{created_at:'desc'}}));
}
export async function POST(req:Request){
 const s=await getSession(); if(!s) return jsonErr('UNAUTHORIZED','Silakan masuk terlebih dahulu.',401);
 if(s.role!=='PENJUAL') return jsonErr('FORBIDDEN','Tidak memiliki hak akses.',403);
 const c=await ownerCanteen(s.uid); if(!c) return jsonErr('NOT_FOUND','Kantin tidak ditemukan.',404);
 try{ const b=z.object({name:z.string().min(2,{message:'Nama menu minimal 2 karakter.'}),price:z.number().int().min(1000,{message:'Harga minimal Rp1.000.'}),category:z.string().default('Makanan'),description:z.string().optional(),photo_url:z.string().optional(),is_available:z.boolean().default(true)}).parse(await req.json());
  const m=await prisma.menuItem.create({data:{...b,canteen_id:c.id}});
  return jsonOk(m,201);
 }catch(e:unknown){ if(e instanceof z.ZodError) return jsonErr('VALIDATION_ERROR',zodMsg(e),400); return jsonErr('SERVER_ERROR','Terjadi kesalahan server.',500); }
}
