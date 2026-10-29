import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ownerCanteen } from '@/lib/owner';
import { jsonOk, jsonErr } from '@/lib/api';
import { publishOrder, publishCanteen } from '@/lib/sse';
export async function PATCH(_:Request,{params}:{params:Promise<{id:string}>}){
 const s=await getSession(); if(!s) return jsonErr('UNAUTHORIZED','Silakan masuk terlebih dahulu.',401);
 if(s.role!=='PENJUAL') return jsonErr('FORBIDDEN','Tidak memiliki hak akses.',403);
 const c=await ownerCanteen(s.uid); if(!c) return jsonErr('NOT_FOUND','Kantin tidak ditemukan.',404);
 const o=await prisma.order.findUnique({where:{id:(await params).id}});
 if(!o||o.canteen_id!==c.id) return jsonErr('NOT_FOUND','Pesanan tidak ditemukan.',404);
 const u=await prisma.order.update({where:{id:o.id},data:{payment_status:'SUDAH_DIBAYAR'}});
 const p={event:'order_update',data:{order_id:u.id,order_status:u.order_status,payment_status:u.payment_status,can_pickup:u.can_pickup,updated_at:u.updated_at}};
 publishOrder(o.id,p); publishCanteen(c.id,p);
 return jsonOk(u);
}
