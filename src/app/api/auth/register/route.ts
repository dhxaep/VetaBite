import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword, createSession } from '@/lib/auth';
import { jsonOk, jsonErr, zodMsg } from '@/lib/api';
const S=z.object({role:z.enum(['MAHASISWA','PENJUAL']),full_name:z.string().min(2,{message:'Nama lengkap minimal 2 karakter.'}),username:z.string().min(3,{message:'Username minimal 3 karakter.'}).regex(/^[a-zA-Z0-9_]+$/,{message:'Username hanya huruf, angka, garis bawah.'}),password:z.string().min(8,{message:'Kata sandi minimal 8 karakter.'}),whatsapp:z.string().min(9,{message:'Nomor WhatsApp tidak valid.'}).optional(),canteen_name:z.string().optional(),canteen_description:z.string().optional()});
export async function POST(req:Request){
 try{ const b=S.parse(await req.json());
  if(await prisma.user.findUnique({where:{username:b.username}})) return jsonErr('VALIDATION_ERROR','Username sudah dipakai.',409);
  if(b.role==='PENJUAL'&&!b.canteen_name) return jsonErr('VALIDATION_ERROR','Nama kantin wajib untuk penjual.',400);
  const u=await prisma.user.create({data:{username:b.username,password_hash:await hashPassword(b.password),full_name:b.full_name,role:b.role,status:b.role==='PENJUAL'?'PENDING':'ACTIVE',whatsapp:b.whatsapp}});
  if(b.role==='PENJUAL') await prisma.canteen.create({data:{owner_id:u.id,name:b.canteen_name!,description:b.canteen_description}});
  await createSession(u.id);
  return jsonOk({id:u.id,username:u.username,role:u.role,status:u.status},201);
 }catch(e:unknown){ if(e instanceof z.ZodError) return jsonErr('VALIDATION_ERROR',zodMsg(e),400); return jsonErr('SERVER_ERROR','Terjadi kesalahan server.',500); }
}
