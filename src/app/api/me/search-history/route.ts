import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonOk, jsonErr } from '@/lib/api';
export async function GET(){
 const s=await getSession(); if(!s) return jsonErr('UNAUTHORIZED','Silakan masuk terlebih dahulu.',401);
 return jsonOk(await prisma.searchHistory.findMany({where:{user_id:s.uid},orderBy:{created_at:'desc'},take:20}));
}
export async function DELETE(){
 const s=await getSession(); if(!s) return jsonErr('UNAUTHORIZED','Silakan masuk terlebih dahulu.',401);
 await prisma.searchHistory.deleteMany({where:{user_id:s.uid}});
 return jsonOk({deleted:true});
}
