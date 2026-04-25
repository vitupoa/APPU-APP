import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();
async function main() {
    console.log('--- RembrandtRAR Super Admin Initializer ---');
    const email = process.env.SUPER_ADMIN_EMAIL || 'admin@krieta.com';
    const username = process.env.SUPER_ADMIN_USERNAME || 'krieta_admin';
    const password = process.env.SUPER_ADMIN_PASSWORD || 'RembrandtRAR2026!';
    try {
        const existing = await prisma.user.findFirst({
            where: { OR: [{ email }, { username }] }
        });
        if (existing) {
            console.log(`User ${email} or ${username} already exists. Upgrading to Super Admin...`);
            await prisma.adminProfile.upsert({
                where: { userId: existing.id },
                update: { role: 'SUPER_ADMIN', permissions: ['*'] },
                create: {
                    userId: existing.id,
                    role: 'SUPER_ADMIN',
                    permissions: ['*'],
                    adminLevel: 100,
                }
            });
            console.log('Successfully upgraded user to SUPER_ADMIN.');
            return;
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = await prisma.user.create({
            data: {
                email,
                username,
                password: hashedPassword,
                isVerified: true,
                accountType: 'USER',
                adminProfile: {
                    create: {
                        role: 'SUPER_ADMIN',
                        permissions: ['*'],
                        adminLevel: 100,
                    }
                }
            }
        });
        console.log(`Successfully created Super Admin!`);
        console.log(`Email: ${email}`);
        console.log(`Username: ${username}`);
        console.log(`Password: ${password}`);
    }
    catch (err) {
        console.error('Error creating super admin:', err);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
