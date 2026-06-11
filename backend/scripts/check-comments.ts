import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function checkProblematicComments() {
  console.log('Checking for problematic comments...');
  
  const contentId = '38984da1-c03f-4c44-8753-f66afff475fa';
  
  const comments = await prisma.comments.findMany({
    where: {
      content_type: 'short',
      content_id: contentId
    },
    include: {
      user_comments_user_idTouser: {
        select: {
          id: true,
          username: true,
          display_name: true,
          is_verified: true,
          first_name: true,
          last_name: true
        }
      }
    }
  });
  
  console.log(`Found ${comments.length} comments for contentId ${contentId}`);
  
  comments.forEach((comment, index) => {
    const user = comment.user_comments_user_idTouser;
    console.log(`Comment #${index + 1}:`);
    console.log(`  ID: ${comment.id}`);
    console.log(`  User ID: ${comment.user_id}`);
    console.log(`  User found: ${!!user}`);
    if (user) {
      console.log(`  Username: ${user.username}`);
      console.log(`  Display Name: ${user.display_name}`);
      console.log(`  Is Verified: ${user.is_verified}`);
      console.log(`  First Name: ${user.first_name}`);
      console.log(`  Last Name: ${user.last_name}`);
    }
    console.log('');
  });
  
  await prisma.$disconnect();
}

checkProblematicComments();
