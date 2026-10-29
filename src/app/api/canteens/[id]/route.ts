import { prisma } from '@/lib/prisma';
import { jsonOk, jsonErr } from '@/lib/api';
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
 const resolved = await params;
 const id = resolved.id;
 const c=await prisma.canteen.findUnique({where:{id},include:{menu_items:true,orders:{where:{order_status:{in:['ANTRIAN','MASAK']}}}}});
 if(!c) return jsonErr('NOT_FOUND','Kantin tidak ditemukan.',404);
 const cats=['Semua',...Array.from(new Set(c.menu_items.map(m=>m.category)))];
 return jsonOk({canteen:{id:c.id,name:c.name,is_open:c.is_open,qris_image_url:c.qris_image_url,description:c.description,banner_url:c.banner_url},current_queue_count:c.orders.length,estimated_minutes:c.orders.length*5+10,categories:cats,menu_items:c.menu_items});
}
