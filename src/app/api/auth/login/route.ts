import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createSession, redirectFor } from '@/lib/auth';
import { jsonOk, jsonErr, zodMsg } from '@/lib/api';
const S=z.object({username:z.string().min(1,{message:'Username wajib diisi.'}),password:z.string().min(1,{message:'Kata sandi wajib diisi.'})});
export async function POST(req:Request){
 try{ const b=S.parse(await req.json());
  const u=await prisma.user.findUnique({where:{username:b.username}});
  if(!u||!(await verifyPassword(b.password,u.password_hash))) return jsonErr('UNAUTHORIZED','Username atau kata sandi salah.',401);
  await createSession(u.id);
  return jsonOk({user:{id:u.id,username:u.username,full_name:u.full_name,role:u.role,status:u.status},redirectTo:redirectFor(u)});
 }catch(e:unknown){ if(e instanceof z.ZodError) return jsonErr('VALIDATION_ERROR',zodMsg(e),400); return jsonErr('SERVER_ERROR','Terjadi kesalahan server.',500); }
}
