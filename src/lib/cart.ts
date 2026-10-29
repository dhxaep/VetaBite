export type CartItem={menu_item_id:string;name:string;price:number;qty:number;note?:string;photo_url?:string};
export type Cart={canteen_id:string;canteen_name:string;qris_image_url?:string;items:CartItem[]};
const KEY="vetabite_cart";
export function loadCart():Cart|null{if(typeof window==="undefined")return null;try{const s=localStorage.getItem(KEY);return s?JSON.parse(s):null}catch{return null}}
export function saveCart(c:Cart|null){if(typeof window==="undefined")return;if(!c)localStorage.removeItem(KEY);else localStorage.setItem(KEY,JSON.stringify(c))}
export function clearCart(){if(typeof window!=="undefined")localStorage.removeItem(KEY)}
export function cartCount(c:Cart|null):number{return c?c.items.reduce((a,i)=>a+i.qty,0):0}
export function cartTotal(c:Cart|null):number{return c?c.items.reduce((a,i)=>a+i.qty*i.price,0):0}
