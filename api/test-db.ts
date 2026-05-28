import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.club.findMany().then(c => console.log('CLUBS:', c)).finally(() => prisma.$disconnect());
