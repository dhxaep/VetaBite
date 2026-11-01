import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createSession, redirectFor } from '@/lib/auth';
import { jsonOk, jsonErr, zodMsg } from '@/lib/api';
const S=z.object({
  username:z.string().min(1,{message:'Username wajib diisi.'}),
  password:z.string().min(1,{message:'Kata sandi wajib diisi.'}),
  remember_me:z.boolean().optional(),
});
export async function POST(req:Request){
 try{ const b=S.parse(await req.json());
  const rawInput = b.username.trim();
  const cleanPhone = rawInput.replace(/[^0-9]/g, "");

  const u = await prisma.user.findFirst({
    where: {
      OR: [
        { username: { equals: rawInput, mode: "insensitive" } },
        { email: { equals: rawInput, mode: "insensitive" } },
        { full_name: { equals: rawInput, mode: "insensitive" } },
        ...(cleanPhone.length >= 8
          ? [
              { whatsapp: rawInput },
              { whatsapp: cleanPhone },
              { whatsapp: { contains: cleanPhone.slice(-8) } },
            ]
          : []),
      ],
    },
  });
  if (!u) return jsonErr('UNAUTHORIZED', 'Username atau kata sandi salah.', 401);
  if (!u.password_hash) {
    return jsonErr('OAUTH_ACCOUNT', 'Akun ini terdaftar via Google SSO Mahasiswa. Silakan masuk menggunakan Akun Google (@mahasiswa.upnvj.ac.id).', 400);
  }
  if (!(await verifyPassword(b.password, u.password_hash))) return jsonErr('UNAUTHORIZED', 'Username atau kata sandi salah.', 401);
  await createSession(u.id, b.remember_me);
  return jsonOk({user:{id:u.id,username:u.username,full_name:u.full_name,role:u.role,status:u.status},redirectTo:redirectFor(u)});
 }catch(e:unknown){ if(e instanceof z.ZodError) return jsonErr('VALIDATION_ERROR',zodMsg(e),400); return jsonErr('SERVER_ERROR','Terjadi kesalahan server.',500); }
}
