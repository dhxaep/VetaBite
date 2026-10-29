import { randomUUID } from "crypto"; import { writeFile, mkdir } from "fs/promises"; import path from "path";
export const MAX=5*1024*1024;
const MAGIC:Record<string,number[][]>={ "image/jpeg":[[0xFF,0xD8,0xFF]], "image/png":[[0x89,0x50,0x4E,0x47]], "image/webp":[[0x52,0x49,0x46,0x46]] };
const EXT:Record<string,string>={ "image/jpeg":".jpg", "image/png":".png", "image/webp":".webp" };
function magicOk(buf:Buffer,mime:string){ const sigs=MAGIC[mime]; if(!sigs) return false; return sigs.some(s=>s.every((b,i)=>buf[i]===b)); }
export function extFor(buf:Buffer|Uint8Array,mime:string):string|null{ const b=Buffer.from(buf); if(!magicOk(b,mime)) return null; const e=EXT[mime]; return e?e.replace(".",""):null; }
export async function saveProof(file:File):Promise<string>{
  if(!EXT[file.type]) throw new Error("INVALID_TYPE");
  if(file.size>MAX) throw new Error("TOO_LARGE");
  const buf=Buffer.from(await file.arrayBuffer());
  if(!magicOk(buf,file.type)) throw new Error("INVALID_MAGIC");
  const name="proof-"+randomUUID()+EXT[file.type];
  const dir=path.join(process.cwd(),"public","uploads");
  await mkdir(dir,{recursive:true});
  await writeFile(path.join(dir,name),buf);
  return "/uploads/"+name;
}