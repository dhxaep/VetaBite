import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonOk, jsonErr } from '@/lib/api';
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
 const s=await getSession(); if(!s) return jsonErr('UNAUTHORIZED','Silakan masuk terlebih dahulu.',401);
 const resolved = await params;
 const id = resolved.id;
 const o=await prisma.order.findUnique({
  where:{id},
  include:{
    order_items:true,
    canteen:{select:{name:true,queue_prefix:true}},
    buyer:{select:{full_name:true,username:true}}
  }
 });
 if(!o) return jsonErr('NOT_FOUND','Pesanan tidak ditemukan.',404);
 if(o.buyer_id!==s.uid&&s.role==='MAHASISWA') return jsonErr('FORBIDDEN','Tidak memiliki hak akses.',403);
 return jsonOk({
  ...o,
  buyer_name: o.buyer?.full_name || o.buyer?.username || 'Mahasiswa'
 });
}
