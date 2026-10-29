export const formatRupiah = (n:number)=>"Rp "+Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,".");
export const fmtDate = (s:string)=>{try{return new Date(s).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"})}catch{return s}};
