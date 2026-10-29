export type SSEClient={ send:(event:string,data:unknown)=>void; close:()=>void };
const channels=new Map<string,Set<ReadableStreamDefaultController>>();
const enc=new TextEncoder();
export function subscribe(channel:string){
  let ctrl!:ReadableStreamDefaultController;
  const stream=new ReadableStream({ start(c){ ctrl=c; let set=channels.get(channel); if(!set){ set=new Set(); channels.set(channel,set);} set.add(c); }, cancel(c){ channels.get(channel)?.delete(c); } });
  return stream;
}
export function publish(channel:string,event:string,data:unknown){
  const set=channels.get(channel); if(!set) return;
  const msg="event: "+event+"\ndata: "+JSON.stringify(data)+"\n\n";
  for(const c of set){ try{ c.enqueue(enc.encode(msg)); }catch{ /* ponytail: dead client, GC on cancel */ } }
}
export function sseResponse(channel:string){
  const stream=subscribe(channel);
  return new Response(stream,{headers:{"Content-Type":"text/event-stream","Cache-Control":"no-cache","Connection":"keep-alive"}});
}
export function publishCanteen(canteenId:string,msg:{event:string;data:unknown}){ publish('canteen:'+canteenId,msg.event,msg.data); }
export function publishOrder(orderId:string,msg:{event:string;data:unknown}){ publish('order:'+orderId,msg.event,msg.data); }