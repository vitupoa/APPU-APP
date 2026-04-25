/**
 * RembrandtRAR — Create Super Admin CLI Script
 * Usage: npx tsx scripts/create-superadmin.ts
 *
 * Creates the first Super Admin by email lookup or registration.
 * This script is the ONLY way to bootstrap the initial super admin.
 */
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { prisma } from '../src/config/database.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question: string): Promise<string> {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  console.log('\n🎨 RembrandtRAR — Super Admin Setup\n');
  console.log('─'.repeat(45));

  const mode = await ask('(1) Promote existing user  (2) Create new user\nChoose [1/2]: ');

  if (mode === '1') {
    const email = await ask('Enter user email: ');
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.error('❌ No user found with that email.');
      process.exit(1);
    }

    // Check if already a super admin
    const existing = await prisma.adminProfile.findUnique({ where: { userId: user.id } });
    if (existing) {
      console.log(`⚠️  User already has role: ${existing.role}`);
      const confirm = await ask('Override to SUPER_ADMIN? [y/N]: ');
      if (confirm.toLowerCase() !== 'y') {
        console.log('Cancelled.');
        process.exit(0);
      }
      await prisma.adminProfile.update({
        where: { id: existing.id },
        data: { role: 'SUPER_ADMIN', isActive: true }
      });
    } else {
      await prisma.adminProfile.create({
        data: {
          userId: user.id,
          role: 'SUPER_ADMIN',
          grantedBy: 'CLI_BOOTSTRAP',
        }
      });
    }

    // Set isAdmin flag on user
    await prisma.user.update({
      where: { id: user.id },
      data: { isAdmin: true }
    });

    console.log(`\n✅ ${user.displayName} (${user.email}) is now SUPER_ADMIN`);
    console.log(`   User ID: ${user.id}`);

  } else if (mode === '2') {
    const email = await ask('Email: ');
    const firstName = await ask('First Name: ');
    const lastName = await ask('Last Name: ');
    const username = await ask('Username: ');
    const password = await ask('Password (min 8 chars): ');
    const country = await ask('Country Code (e.g., KE): ');
    const currency = await ask('Currency Code (e.g., KES): ');

    if (password.length < 8) {
      console.error('❌ Password must be at least 8 characters.');
      process.exit(1);
    }

    // Check conflicts
    const emailExists = await prisma.user.findUnique({ where: { email } });
    if (emailExists) {
      console.error('❌ Email already in use.');
      process.exit(1);
    }
    const usernameExists = await prisma.user.findUnique({ where: { username } });
    if (usernameExists) {
      console.error('❌ Username already taken.');
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const displayName = `${firstName} ${lastName}`;

    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        displayName,
        username,
        passwordHash,
        country: country.toUpperCase(),
        currency: currency.toUpperCase(),
        accountType: 'CREATOR',
        isAdmin: true,
      }
    });

    await prisma.adminProfile.create({
      data: {
        userId: user.id,
        role: 'SUPER_ADMIN',
        grantedBy: 'CLI_BOOTSTRAP',
      }
    });

    console.log(`\n✅ Super Admin created successfully!`);
    console.log(`   Name: ${displayName}`);
    console.log(`   Email: ${email}`);
    console.log(`   Username: ${username}`);
    console.log(`   User ID: ${user.id}`);

  } else {
    console.log('Invalid option. Exiting.');
  }

  rl.close();
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('❌ Error:', e.message);
  rl.close();
  await prisma.$disconnect();
  process.exit(1);
});
