import { sseResponse } from '@/lib/sse';
export async function GET(_:Request,{params}:{params:Promise<{canteenId:string}>}){
 const {canteenId}=await params; return sseResponse('canteen:'+canteenId);
}
