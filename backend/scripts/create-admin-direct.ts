/**
 * Direct Super Admin Creation Script
 * Creates admin user with predefined credentials and wallet balance
 */
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { prisma } from '../src/config/database.js';
import { randomUUID } from 'crypto';

async function main() {
  console.log('\n🎨 Creating Super Admin...\n');

  const email = 'admin@krieta.com';
  const username = 'supaadmin';
  const firstName = 'Supa';
  const lastName = 'Admin';
  const displayName = 'Supa Admin';
  const password = 'RembrandtRAR2026!';
  const country = 'KE';
  const currency = 'KES';
  const KR_TO_USD_RATE = 0.01;
  const KR_PRECISION = 1000000;
  const walletBalanceKr = 1000000 * KR_PRECISION; // 1M Kr in base units

  // Check conflicts and delete if exists
  const emailExists = await prisma.user.findUnique({ where: { email } });
  if (emailExists) {
    console.log('User with this email exists. Deleting...');
    await prisma.user.delete({ where: { id: emailExists.id } });
  }
  
  const usernameExists = await prisma.user.findUnique({ where: { username } });
  if (usernameExists) {
    console.log('User with this username exists. Deleting...');
    await prisma.user.delete({ where: { id: usernameExists.id } });
  }

  const password_hash = await bcrypt.hash(password, 12);
  const userId = randomUUID();
  const now = new Date();

  const user = await prisma.user.create({
    data: {
      id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      display_name: displayName,
      username,
      password_hash,
      country,
      currency,
      account_type: 'CREATOR',
      is_admin: true,
      created_at: now,
      updated_at: now,
    }
  });

  // Create admin profile
  await prisma.admin_profile.create({
    data: {
      id: randomUUID(),
      user_id: user.id,
      role: 'SUPER_ADMIN',
      granted_by: 'CLI_BOOTSTRAP',
      created_at: now,
      updated_at: now,
    }
  });

  // Create wallet and set balance
  await prisma.wallets.create({
    data: {
      id: randomUUID(),
      user_id: user.id,
      kr_balance: walletBalanceKr,
      created_at: now,
      updated_at: now,
    }
  });

  console.log(`\n✅ Super Admin created successfully!`);
  console.log(`   Name: ${displayName}`);
  console.log(`   Email: ${email}`);
  console.log(`   Username: ${username}`);
  console.log(`   User ID: ${user.id}`);
  const krAmount = walletBalanceKr / KR_PRECISION;
  const usdEquivalent = krAmount * KR_TO_USD_RATE;
  console.log(`   Wallet Balance: ${krAmount.toLocaleString()} Kr (USD ${usdEquivalent.toLocaleString()})`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('❌ Error:', e.message);
  await prisma.$disconnect();
  process.exit(1);
});
