import { PrismaClient } from "@prisma/client"; import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
async function main(){
  const adminPw = await bcrypt.hash("Admin123!",10);
  const sellerPw = await bcrypt.hash("Kantin123!",10);
  const mhsPw = await bcrypt.hash("Mhs12345!",10);
  const admin = await prisma.user.upsert({where:{username:"dhafagifari0412@gmail.com"},update:{},create:{username:"dhafagifari0412@gmail.com",password_hash:adminPw,full_name:"Admin VetaBite",role:"ADMIN",status:"ACTIVE"}});
  const seller = await prisma.user.upsert({where:{username:"sandinurfajarpapakajuhaindini@gmail.com"},update:{},create:{username:"sandinurfajarpapakajuhaindini@gmail.com",password_hash:sellerPw,full_name:"Kantin Barokah",role:"PENJUAL",status:"ACTIVE"}});
  const mhs = await prisma.user.upsert({where:{username:"mahasiswa1@mhs.upnvj.ac.id"},update:{},create:{username:"mahasiswa1@mhs.upnvj.ac.id",password_hash:mhsPw,full_name:"Mahasiswa Satu",role:"MAHASISWA",status:"ACTIVE"}});
  void admin; void mhs;
  let canteen = await prisma.canteen.findUnique({where:{owner_id:seller.id}});
  if(!canteen) canteen = await prisma.canteen.create({data:{owner_id:seller.id,name:"Kantin Barokah",description:"Loket A — masakan rumahan",is_open:true,queue_prefix:"A",qris_image_url:"/images/qris-placeholder.png"}});
  const menus:[string,number,string][]=[["Nasi Goreng Spesial",15000,"Makanan"],["Ayam Geprek",13000,"Makanan"],["Mie Ayam",12000,"Makanan"],["Soto Ayam",12000,"Makanan"],["Nasi Ayam Bakar",16000,"Makanan"],["Es Teh Manis",5000,"Minuman"],["Es Jeruk",6000,"Minuman"],["Kopi Susu",8000,"Minuman"],["Pisang Goreng",7000,"Camilan"],["Cireng Isi",6000,"Camilan"]];
  for(const [n,p,c] of menus){ const ex = await prisma.menuItem.findFirst({where:{canteen_id:canteen.id,name:n}}); if(!ex) await prisma.menuItem.create({data:{canteen_id:canteen.id,name:n,price:p,category:c,is_available:true}}); }
  const prefixes=["B","C"];
  for(const px of prefixes){ const u=await prisma.user.upsert({where:{username:"demo-"+px+"@kantin.local"},update:{},create:{username:"demo-"+px+"@kantin.local",password_hash:sellerPw,full_name:"Kantin Demo "+px,role:"PENJUAL",status:"ACTIVE"}});
    let ct=await prisma.canteen.findUnique({where:{owner_id:u.id}}); if(!ct) ct=await prisma.canteen.create({data:{owner_id:u.id,name:"Kantin Demo "+px,is_open:true,queue_prefix:px,qris_image_url:"/images/qris-placeholder.png"}});
    for(const [n,p,c] of menus.slice(0,4)){ const ex=await prisma.menuItem.findFirst({where:{canteen_id:ct.id,name:n}}); if(!ex) await prisma.menuItem.create({data:{canteen_id:ct.id,name:n,price:p,category:c}}); } }
  console.log("seed ok");
}
main().finally(()=>prisma.$disconnect());