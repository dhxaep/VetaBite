import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ownerCanteen } from '@/lib/owner';
import { jsonOk, jsonErr } from '@/lib/api';
export async function DELETE(_:Request,{params}:any){
 const s=await getSession(); if(!s) return jsonErr('UNAUTHORIZED','Silakan masuk terlebih dahulu.',401);
 if(s.role!=='PENJUAL') return jsonErr('FORBIDDEN','Tidak memiliki hak akses.',403);
 const c=await ownerCanteen(s.uid); if(!c) return jsonErr('NOT_FOUND','Kantin tidak ditemukan.',404);
 await prisma.canteenBan.deleteMany({where:{canteen_id:c.id,user_id:(params.userId ?? (await params)?.userId)}});
 return jsonOk({unbanned:true});
}
