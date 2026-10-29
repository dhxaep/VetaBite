import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonOk, jsonErr } from '@/lib/api';
export async function PATCH(_:Request,{params}:any){
 const s=await getSession(); if(!s) return jsonErr('UNAUTHORIZED','Silakan masuk terlebih dahulu.',401);
 if(s.role!=='ADMIN') return jsonErr('FORBIDDEN','Tidak memiliki hak akses.',403);
 const u=await prisma.user.findUnique({where:{id:(params.id ?? (await params)?.id)},include:{canteen:true}});
 if(!u) return jsonErr('NOT_FOUND','Akun tidak ditemukan.',404);
 const ns=u.status==='ACTIVE'?'INACTIVE':'ACTIVE';
 const upd=await prisma.user.update({where:{id:u.id},data:{status:ns}});
 if(u.canteen) await prisma.canteen.update({where:{id:u.canteen.id},data:{is_open:ns==='ACTIVE'?u.canteen.is_open:false}});
 return jsonOk({id:upd.id,status:upd.status});
}
