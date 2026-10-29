import { prisma } from './prisma';
export async function ownerCanteen(uid:string){ return prisma.canteen.findFirst({where:{owner_id:uid}}); }
