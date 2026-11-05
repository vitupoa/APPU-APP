import { prisma } from '../../config/database.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';


async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL || 'admin@runinga.com';
  const username = process.env.SUPER_ADMIN_USERNAME || 'runinga_admin';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'RembrandtRAR2026!';

  try {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });

    if (existing) {
      await prisma.admin_profile.upsert({
        where: { user_id: existing.id },
        update: { role: 'SUPER_ADMIN' },
        create: {
          user_id: existing.id,
          role: 'SUPER_ADMIN',
        }
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({ data: { id: crypto.randomUUID(), email,
        username,
        first_name: 'Super',
        last_name: 'Admin',
        display_name: 'Super Admin',
        country: 'KE',
        currency: 'KES',
        password_hash: hashedPassword,
        is_verified: true,
        account_type: 'CREATOR',
        updated_at: new Date(),
        adminProfile: {
          create: {
            role: 'SUPER_ADMIN',}} as any)
      }
    });

    } catch (err) {
    console.error('Error creating super admin:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
