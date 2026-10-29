import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonOk, jsonErr, zodMsg } from '@/lib/api';
export async function GET(_:Request,{params}:any){
 const s=await getSession(); if(!s) return jsonErr('UNAUTHORIZED','Silakan masuk terlebih dahulu.',401);
 return jsonOk(await prisma.complaintMessage.findMany({where:{complaint_id:(params.id ?? (await params)?.id)},orderBy:{created_at:'asc'}}));
}
export async function POST(req:Request,{params}:any){
 const s=await getSession(); if(!s) return jsonErr('UNAUTHORIZED','Silakan masuk terlebih dahulu.',401);
 try{ const b=z.object({body:z.string().min(1,{message:'Pesan tidak boleh kosong.'})}).parse(await req.json());
  const m=await prisma.complaintMessage.create({data:{complaint_id:(params.id ?? (await params)?.id),author_id:s.uid,body:b.body}});
  return jsonOk(m,201);
 }catch(e:unknown){ if(e instanceof z.ZodError) return jsonErr('VALIDATION_ERROR',zodMsg(e),400); return jsonErr('SERVER_ERROR','Terjadi kesalahan server.',500); }
}
