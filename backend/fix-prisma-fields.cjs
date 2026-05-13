const fs = require('fs');
const path = require('path');

// Map of camelCase to snake_case for Prisma model fields
const fieldMap = {
  // Transaction fields
  'amountFiat': 'amount_fiat',
  'amountKr': 'amount_kr',
  'userId': 'user_id',
  
  // User fields  
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
  
  // Wallet fields
  'krBalance': 'kr_balance',
  
  // Daily stats fields
  'newAdmirers': 'new_admirers',
  'krEarned': 'kr_earned',
  'krSpent': 'kr_spent',
  
  // Admires fields
  'admirerId': 'admirer_id',
  'admiredId': 'admired_id',
  
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
  
  // Refresh token fields
  'tokenHash': 'token_hash',
  'expiresAt': 'expires_at',
  'deviceId': 'device_id',
  
  // Other fields
  'influencerId': 'influencer_id',
  'senderId': 'sender_id',
  'isRead': 'is_read',
  'mediaUrl': 'media_url',
  'mediaType': 'media_type',
  'forwardedFromId': 'forwarded_from_id',
  'isSystemEvent': 'is_system_event',
};

// Unique constraint mappings
const uniqueConstraintMap = {
  'chamaId_userId': 'chama_id_user_id',
  'userId_date': 'user_id_date',
};

// Model name mappings (for prisma.model access)
const modelMap = {
  'chamaMember': 'chama_member',
  'chamaWallet': 'chama_wallet',
  'chamaContribution': 'chama_contribution',
  'chamaCycle': 'chama_cycle',
  'chamaPayout': 'chama_payout',
  'chamaPayoutApproval': 'chama_payout_approval',
  'chamaTransaction': 'chama_transaction',
};

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix property access (e.g., transaction.amountFiat -> transaction.amount_fiat)
  for (const [camel, snake] of Object.entries(fieldMap)) {
    const regex = new RegExp(`\\.${camel}\\b`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, `.${snake}`);
      modified = true;
    }
  }
  
  // Fix object literal keys in Prisma operations (where, data, select, include, etc.)
  // Pattern: { key: value } or { key, } or { key }
  for (const [camel, snake] of Object.entries(fieldMap)) {
    // Match object literal keys
    const regex = new RegExp(`([{,]\\s*)${camel}(\\s*[,:}])`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, `$1${snake}$2`);
      modified = true;
    }
  }
  
  // Fix unique constraints
  for (const [camel, snake] of Object.entries(uniqueConstraintMap)) {
    const regex = new RegExp(`\\b${camel}\\b`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, snake);
      modified = true;
    }
  }
  
  // Fix Prisma model access (prisma.chamaMember -> prisma.chama_member)
  for (const [camel, snake] of Object.entries(modelMap)) {
    const regex = new RegExp(`(prisma|tx)\\.${camel}\\b`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, `$1.${snake}`);
      modified = true;
    }
  }
  
  // Fix messages.payload -> messages.text
  content = content.replace(/\.payload\b/g, '.text');
  content = content.replace(/([{,]\s*)payload(\s*:)/g, '$1text$2');
  
  if (modified || content !== fs.readFileSync(filePath, 'utf8')) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

function getAllTsFiles(dir, exclude = ['node_modules', 'dist', '.git', 'generated']) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      if (!exclude.includes(file)) {
        results = results.concat(getAllTsFiles(filePath, exclude));
      }
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      results.push(filePath);
    }
  });
  
  return results;
}

console.log('Fixing Prisma field names...\n');

const srcDir = path.join(__dirname, 'src');
const files = getAllTsFiles(srcDir);

console.log(`Found ${files.length} TypeScript files\n`);

let fixedCount = 0;
files.forEach(file => {
  if (fixFile(file)) {
    console.log(`Fixed: ${path.relative(__dirname, file)}`);
    fixedCount++;
  }
});

console.log(`\nFixed ${fixedCount} files`);
