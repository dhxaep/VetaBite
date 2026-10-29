"use client";
import { InputHTMLAttributes } from "react";
export function Input(p:InputHTMLAttributes<HTMLInputElement>){ return <input {...p} className={"w-full rounded-sm border px-3 py-2 text-sm outline-none bg-surface text-text-main "+(p.className??"")} style={{border:"var(--glass-border-subtle)"}} />; }