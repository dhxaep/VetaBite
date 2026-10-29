import { redirect } from "next/navigation"; import { getSession, type Session } from "./auth";
export async function requireSession():Promise<Session>{ const s=await getSession(); if(!s) redirect("/login"); return s; }
export async function requireRole(...roles:string[]):Promise<Session>{ const s=await requireSession(); if(!roles.includes(s.role)) redirect("/login"); return s; }