import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Get all accessor names
const accessors = Object.getOwnPropertyNames(prisma).filter(name => !name.startsWith('_') && !name.startsWith('$'));

console.log('Prisma Client Accessors:');
console.log(accessors.sort().join('\n'));

// Check specific ones
console.log('\n\nChecking specific accessors:');
console.log('prisma.user exists:', 'user' in prisma);
console.log('prisma.users exists:', 'users' in prisma);
console.log('prisma.post exists:', 'post' in prisma);
console.log('prisma.posts exists:', 'posts' in prisma);
console.log('prisma.contest exists:', 'contest' in prisma);
console.log('prisma.contests exists:', 'contests' in prisma);
console.log('prisma.wallet exists:', 'wallet' in prisma);
console.log('prisma.wallets exists:', 'wallets' in prisma);

await prisma.$disconnect();
