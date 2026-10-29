import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ownerCanteen } from '@/lib/owner';
import { jsonOk, jsonErr } from '@/lib/api';
export async function PATCH(_:Request,{params}:{params:Promise<{id:string}>}){
 const s=await getSession(); if(!s) return jsonErr('UNAUTHORIZED','Silakan masuk terlebih dahulu.',401);
 if(s.role!=='PENJUAL') return jsonErr('FORBIDDEN','Tidak memiliki hak akses.',403);
 const c=await ownerCanteen(s.uid); if(!c) return jsonErr('NOT_FOUND','Kantin tidak ditemukan.',404);
 const m=await prisma.menuItem.findUnique({where:{id:(await params).id}});
 if(!m||m.canteen_id!==c.id) return jsonErr('NOT_FOUND','Menu tidak ditemukan.',404);
 return jsonOk(await prisma.menuItem.update({where:{id:m.id},data:{is_available:!m.is_available}}));
}
