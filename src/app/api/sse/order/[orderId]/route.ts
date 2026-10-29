import { sseResponse } from '@/lib/sse';
export async function GET(_:Request,{params}:{params:Promise<{orderId:string}>}){
 const {orderId}=await params; return sseResponse('order:'+orderId);
}
