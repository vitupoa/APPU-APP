const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Common field name mappings from camelCase to snake_case
const fieldMappings = {
  // User fields
  'userId': 'user_id',
  'firstName': 'first_name',
  'lastName': 'last_name',
  'displayName': 'display_name',
  'avatarUrl': 'avatar_url',
  'coverPhotoUrl': 'cover_photo_url',
  'passwordHash': 'password_hash',
  'isAdmin': 'is_admin',
  'isVerified': 'is_verified',
  'isWalletUnlocked': 'is_wallet_unlocked',
  'accountType': 'account_type',
  'createdAt': 'created_at',
  'updatedAt': 'updated_at',
  'googleId': 'google_id',
  'appleId': 'apple_id',
  
  // Transaction fields
  'amountKr': 'amount_kr',
  'amountFiat': 'amount_fiat',
  'krBalance': 'kr_balance',
  'krEarned': 'kr_earned',
  'krSpent': 'kr_spent',
  
  // Chama fields
  'chamaId': 'chama_id',
  'memberId': 'member_id',
  'recipientId': 'recipient_id',
  'approverId': 'approver_id',
  'payoutId': 'payout_id',
  'cycleId': 'cycle_id',
  'cycleNumber': 'cycle_number',
  'chatId': 'chat_id',
  'contributionAmountKr': 'contribution_amount_kr',
  'currentCycleNumber': 'current_cycle_number',
  'minApprovals': 'min_approvals',
  'totalContributed': 'total_contributed',
  'totalReceived': 'total_received',
  'collectedAmountKr': 'collected_amount_kr',
  'targetAmountKr': 'target_amount_kr',
  'disbursedAt': 'disbursed_at',
  'receiptUrl': 'receipt_url',
  'startDate': 'start_date',
  'endDate': 'end_date',
  
  // Admires fields
  'admirerId': 'admirer_id',
  'admiredId': 'admired_id',
  
  // Daily stats fields
  'newAdmirers': 'new_admirers',
  
  // Unique constraint names
  'chamaId_userId': 'chama_id_user_id',
  'userId_date': 'user_id_date',
  
  // Other fields
  'tokenHash': 'token_hash',
  'expiresAt': 'expires_at',
  'deviceId': 'device_id',
  'influencerId': 'influencer_id',
  'senderId': 'sender_id',
  'recipientId': 'recipient_id',
  'isRead': 'is_read',
  'mediaUrl': 'media_url',
  'mediaType': 'media_type',
  'forwardedFromId': 'forwarded_from_id',
  'isSystemEvent': 'is_system_event',
  
  // Model names (lowercase)
  'chamaMember': 'chama_member',
  'chamaWallet': 'chama_wallet',
  'chamaContribution': 'chama_contribution',
  'chamaCycle': 'chama_cycle',
  'chamaPayout': 'chama_payout',
  'chamaPayoutApproval': 'chama_payout_approval',
  'chamaTransaction': 'chama_transaction',
  
  // Messages field
  'payload': 'text',
};

// Get all TypeScript files in src directory
function getAllTsFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        results = results.concat(getAllTsFiles(filePath));
      }
    } else if (file.endsWith('.ts')) {
      results.push(filePath);
    }
  });
  
  return results;
}

// Fix a single file
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Replace field names in object literals and property access
  for (const [camelCase, snake_case] of Object.entries(fieldMappings)) {
    // Pattern 1: Object property access (e.g., user.userId)
    const accessPattern = new RegExp(`\\.${camelCase}\\b`, 'g');
    if (accessPattern.test(content)) {
      content = content.replace(accessPattern, `.${snake_case}`);
      modified = true;
    }
    
    // Pattern 2: Object literal keys (e.g., { userId: ... })
    const literalPattern = new RegExp(`([{,]\\s*)${camelCase}(\\s*:)`, 'g');
    if (literalPattern.test(content)) {
      content = content.replace(literalPattern, `$1${snake_case}$2`);
      modified = true;
    }
    
    // Pattern 3: Prisma model access (e.g., prisma.chamaMember)
    if (camelCase.startsWith('chama')) {
      const prismaPattern = new RegExp(`(prisma|tx)\\.${camelCase}\\b`, 'g');
      if (prismaPattern.test(content)) {
        content = content.replace(prismaPattern, `$1.${snake_case}`);
        modified = true;
      }
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
    return true;
  }
  
  return false;
}

// Main execution
console.log('Starting field name fixes...\n');

const srcDir = path.join(__dirname, 'src');
const files = getAllTsFiles(srcDir);

console.log(`Found ${files.length} TypeScript files\n`);

let fixedCount = 0;
files.forEach(file => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

console.log(`\nFixed ${fixedCount} files`);
console.log('\nRunning build to check remaining errors...');

try {
  execSync('npm run build', { stdio: 'inherit' });
} catch (error) {
  console.log('\nBuild completed with errors. Check output above.');
}
