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
    const existing = await prisma.admin_profile.findUnique({ where: { user_id: user.id } });
    if (existing) {
      console.log(`⚠️  User already has role: ${existing.role}`);
      const confirm = await ask('Override to SUPER_ADMIN? [y/N]: ');
      if (confirm.toLowerCase() !== 'y') {
        console.log('Cancelled.');
        process.exit(0);
      }
      await prisma.admin_profile.update({
        where: { id: existing.id },
        data: { role: 'SUPER_ADMIN', is_active: true }
      });
    } else {
      await prisma.admin_profile.create({
        data: {
          user_id: user.id,
          role: 'SUPER_ADMIN',
          granted_by: 'CLI_BOOTSTRAP',
        }
      });
    }

    // Set is_admin flag on user
    await prisma.user.update({
      where: { id: user.id },
      data: { is_admin: true }
    });

    console.log(`\n✅ ${user.display_name} (${user.email}) is now SUPER_ADMIN`);
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

    const password_hash = await bcrypt.hash(password, 12);
    const display_name = `${firstName} ${lastName}`;

    const user = await prisma.user.create({
      data: {
        email,
        first_name: firstName,
        last_name: lastName,
        display_name,
        username,
        password_hash,
        country: country.toUpperCase(),
        currency: currency.toUpperCase(),
        account_type: 'CREATOR',
        is_admin: true,
      }
    });

    await prisma.admin_profile.create({
      data: {
        user_id: user.id,
        role: 'SUPER_ADMIN',
        granted_by: 'CLI_BOOTSTRAP',
      }
    });

    console.log(`\n✅ Super Admin created successfully!`);
    console.log(`   Name: ${display_name}`);
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
