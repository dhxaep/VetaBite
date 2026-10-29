import bcrypt from "bcryptjs"; import { cookies } from "next/headers"; import { prisma } from "./prisma";
const COOKIE="vb_session"; const TTL=7*24*3600*1000;
function secret(){ return process.env.SESSION_SECRET ?? "dev-secret-change-me"; }
function b64uEncode(s:string){ return Buffer.from(s).toString("base64url"); }
function b64uDecode(s:string){ return Buffer.from(s,"base64url").toString("utf8"); }
function sign(p:string){ const c=require("crypto"); return c.createHmac("sha256",secret()).update(p).digest("base64url"); }
export type Session={ uid:string; role:string; status:string; exp:number };
export async function hashPassword(p:string){ return bcrypt.hash(p,10); }
export async function verifyPassword(p:string,h:string){ return bcrypt.compare(p,h); }
export function createSessionToken(s:Session){ const p=b64uEncode(JSON.stringify(s)); return p+"."+sign(p); }
export function readSessionToken(t:string|null|undefined):Session|null{ if(!t) return null; const [p,s]=t.split("."); if(!p||!s) return null; const c=require("crypto"); const good=c.timingSafeEqual(Buffer.from(sign(p)),Buffer.from(s)); if(!good) return null; try{ const o=JSON.parse(b64uDecode(p)) as Session; if(o.exp<Date.now()) return null; return o; }catch{ return null; } }
export async function setSession(s:Session){ const t=createSessionToken(s); (await cookies()).set(COOKIE,t,{httpOnly:true,path:"/",maxAge:TTL/1000,sameSite:"lax"}); }
export async function clearSession(){ (await cookies()).set(COOKIE,"",{httpOnly:true,path:"/",maxAge:0}); }
export async function getSession():Promise<Session|null>{ const c=await cookies(); return readSessionToken(c.get(COOKIE)?.value); }
export function newSession(uid:string,role:string,status:string):Session{ return {uid,role,status,exp:Date.now()+TTL}; }
export async function createSession(uid:string){ const u=await prisma.user.findUnique({where:{id:uid}}); if(!u) throw new Error('Akun tidak ditemukan.'); await setSession(newSession(u.id,u.role,u.status)); }
export async function destroySession(){ await clearSession(); }
export function redirectFor(u:{role:string;status:string}):string{ if(u.status==='PENDING') return '/pending-verification'; if(u.role==='ADMIN') return '/admin/verifikasi'; if(u.role==='PENJUAL') return '/seller/pesanan'; return '/dashboard'; }