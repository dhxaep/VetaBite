"use client";
import { ButtonHTMLAttributes } from "react";
type P=ButtonHTMLAttributes<HTMLButtonElement>&{variant?:"primary"|"ghost"};
export function Button({variant="primary",className="",...r}:P){ return <button {...r} className={(variant==="primary"?"btn-primary px-5 py-2.5 text-sm ":"glass-panel px-5 py-2.5 text-sm ")+className} />; }