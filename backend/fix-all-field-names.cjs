const fs = require('fs');
const path = require('path');

// Comprehensive field mapping from camelCase to snake_case
const fieldMap = {
  // Common fields
  'userId': 'user_id',
  'createdAt': 'created_at',
  'updatedAt': 'updated_at',
  
  // Amount fields
  'amountFiat': 'amount_fiat',
  'amountKr': 'amount_kr',
  
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
  'googleId': 'google_id',
  'appleId': 'apple_id',
  'fcmToken': 'fcmToken', // Keep as is
  
  // Wallet fields
  'krBalance': 'kr_balance',
  
  // Daily stats fields
  'newAdmirers': 'new_admirers',
  'krEarned': 'kr_earned',
  'krSpent': 'kr_spent',
  
  // Admires fields
  'admirerId': 'admirer_id',
  'admiredId': 'admired_id',
  
  // Message fields
  'senderId': 'sender_id',
  'recipientId': 'recipient_id',
  'chatId': 'chat_id',
  'mediaUrl': 'media_url',
  'mediaType': 'media_type',
  'forwardedFromId': 'forwarded_from_id',
  'isRead': 'is_read',
  'isSystemEvent': 'is_system_event',
  
  // Refresh token fields
  'tokenHash': 'token_hash',
  'expiresAt': 'expires_at',
  'deviceId': 'device_id',
  
  // Flash sale fields
  'startTime': 'start_time',
  'endTime': 'end_time',
  'startDate': 'start_date',
  'endDate': 'end_date',
  
  // Product fields
  'isFeatured': 'is_featured',
  'isPromoted': 'is_promoted',
  'isTopSpot': 'is_top_spot',
  'featuredUntil': 'featured_until',
  'promotedUntil': 'promoted_until',
  'topSpotUntil': 'top_spot_until',
  'productId': 'product_id',
  'sellerId': 'seller_id',
  
  // Premium listing fields
  'isActive': 'is_active',
  
  // Group buy fields
  'minParticipants': 'min_participants',
  'maxParticipants': 'max_participants',
  'currentParticipants': 'current_participants',
  
  // Social media fields
  'accessToken': 'access_token',
  'refreshToken': 'refresh_token',
  'tokenExpiresAt': 'token_expires_at',
  'syncStatus': 'sync_status',
  'followerCount': 'follower_count',
  'videoCount': 'video_count',
  'totalViews': 'total_views',
  'avgLikes': 'avg_likes',
  'avgViews': 'avg_views',
  'avgComments': 'avg_comments',
  'engagementRate': 'engagement_rate',
  
  // Micro interest fields
  'microInterestId': 'micro_interest_id',
  
  // Story fields
  'viewCount': 'view_count',
  
  // Trending topics fields
  'engagementCount': 'engagement',
  
  // Contest fields
  'contestId': 'contest_id',
  'submissionId': 'submission_id',
  'actionId': 'action_id',
  
  // Campaign fields
  'campaignId': 'campaign_id',
  'brandId': 'brand_id',
  'creatorId': 'creator_id',
  
  // Order fields
  'orderId': 'order_id',
  'buyerId': 'buyer_id',
  'totalAmount': 'total_amount',
  'shippingAddress': 'shipping_address',
  
  // Post fields
  'postId': 'post_id',
  'likeCount': 'like_count',
  'commentCount': 'comment_count',
  'shareCount': 'share_count',
  
  // Comment fields
  'commentId': 'comment_id',
  'parentId': 'parent_id',
  
  // Live session fields
  'hostId': 'host_id',
  'viewerCount': 'viewer_count',
  'tipAmount': 'tip_amount',
  
  // Transaction fields
  'transactionId': 'transaction_id',
  'referenceId': 'reference_id',
  
  // Team fields
  'teamId': 'team_id',
  'memberId': 'member_id',
  'inviterId': 'inviter_id',
  'inviteeId': 'invitee_id',
  
  // Subscription fields
  'subscriberId': 'subscriber_id',
  'tierId': 'tier_id',
  
  // Notification fields
  'notificationId': 'notification_id',
  'isRead': 'is_read',
  
  // Location fields
  'locationId': 'location_id',
  'countryCode': 'country_code',
  'stateCode': 'state_code',
  'cityName': 'city_name',
  
  // Analytics fields
  'impressionCount': 'impression_count',
  'clickCount': 'click_count',
  'conversionCount': 'conversion_count',
  
  // Escrow fields
  'escrowId': 'escrow_id',
  'releaseDate': 'release_date',
  
  // Wishlist fields
  'wishlistId': 'wishlist_id',
  
  // Gift fields
  'giftId': 'gift_id',
  'giftType': 'gift_type',
  
  // Milestone fields
  'milestoneId': 'milestone_id',
  'completedAt': 'completed_at',
  
  // Sponsored content fields
  'sponsorId': 'sponsor_id',
  'contentId': 'content_id',
  
  // Bio link fields
  'bioLinkId': 'bio_link_id',
  'linkUrl': 'link_url',
  
  // Cart fields
  'cartId': 'cart_id',
  'quantity': 'quantity',
  
  // Review fields
  'reviewId': 'review_id',
  'rating': 'rating',
  
  // Shipping fields
  'shippingId': 'shipping_id',
  'trackingNumber': 'tracking_number',
  
  // Garage fields
  'garageId': 'garage_id',
  'bookingId': 'booking_id',
  
  // Import fields
  'importerId': 'importer_id',
  'importRequestId': 'import_request_id',
  
  // Logistics fields
  'companyId': 'company_id',
  'companyName': 'company_name',
  
  // Deal fields
  'dealId': 'deal_id',
  'dealType': 'deal_type',
  
  // Payout fields
  'payoutId': 'payout_id',
  'approverId': 'approver_id',
  'disbursedAt': 'disbursed_at',
  
  // Cycle fields
  'cycleId': 'cycle_id',
  'cycleNumber': 'cycle_number',
  'collectedAmountKr': 'collected_amount_kr',
  'targetAmountKr': 'target_amount_kr',
  
  // Chama fields
  'chamaId': 'chama_id',
  'contributionAmountKr': 'contribution_amount_kr',
  'currentCycleNumber': 'current_cycle_number',
  'minApprovals': 'min_approvals',
  'totalContributed': 'total_contributed',
  'totalReceived': 'total_received',
  'receiptUrl': 'receipt_url',
  
  // Account fields
  'accountId': 'account_id',
  'followersBefore': 'followers_before',
  'followersAfter': 'followers_after',
};

// Unique constraint mappings
const uniqueConstraintMap = {
  'chamaId_userId': 'chama_id_user_id',
  'userId_date': 'user_id_date',
  'admirerId_admiredId': 'admirer_id_admired_id',
  'userId_contestId': 'user_id_contest_id',
  'userId_postId': 'user_id_post_id',
  'userId_productId': 'user_id_product_id',
};

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const originalContent = content;
  
  // Fix property access (e.g., transaction.amountFiat -> transaction.amount_fiat)
  for (const [camel, snake] of Object.entries(fieldMap)) {
    // Skip if they're the same
    if (camel === snake) continue;
    
    // Match property access: .fieldName (but not in comments or strings)
    const regex = new RegExp(`\\.${camel}\\b`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, `.${snake}`);
      modified = true;
    }
  }
  
  // Fix object literal keys in Prisma operations
  for (const [camel, snake] of Object.entries(fieldMap)) {
    if (camel === snake) continue;
    
    // Match object literal keys: { fieldName: or { fieldName, or { fieldName }
    // But be careful not to match TypeScript interface definitions
    const patterns = [
      // { fieldName: value }
      new RegExp(`([{,]\\s*)${camel}(\\s*:)`, 'g'),
      // { fieldName, } or { fieldName }
      new RegExp(`([{,]\\s*)${camel}(\\s*[,}])`, 'g'),
    ];
    
    for (const regex of patterns) {
      if (regex.test(content)) {
        content = content.replace(regex, `$1${snake}$2`);
        modified = true;
      }
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
  
  if (modified && content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

function getAllTsFiles(dir, exclude = ['node_modules', 'dist', '.git', 'generated', '.prisma']) {
  let results = [];
  
  try {
    const list = fs.readdirSync(dir);
    
    list.forEach(file => {
      const filePath = path.join(dir, file);
      
      try {
        const stat = fs.statSync(filePath);
        
        if (stat && stat.isDirectory()) {
          if (!exclude.includes(file)) {
            results = results.concat(getAllTsFiles(filePath, exclude));
          }
        } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
          results.push(filePath);
        }
      } catch (err) {
        // Skip files we can't access
      }
    });
  } catch (err) {
    // Skip directories we can't access
  }
  
  return results;
}

console.log('🔧 Fixing Prisma field names across the codebase...\n');

const srcDir = path.join(__dirname, 'src');
const files = getAllTsFiles(srcDir);

console.log(`📁 Found ${files.length} TypeScript files\n`);

let fixedCount = 0;
let errorCount = 0;

files.forEach(file => {
  try {
    if (fixFile(file)) {
      const relativePath = path.relative(__dirname, file);
      console.log(`✅ Fixed: ${relativePath}`);
      fixedCount++;
    }
  } catch (err) {
    console.error(`❌ Error fixing ${file}:`, err.message);
    errorCount++;
  }
});

console.log(`\n✨ Summary:`);
console.log(`   Fixed: ${fixedCount} files`);
console.log(`   Errors: ${errorCount} files`);
console.log(`   Total: ${files.length} files`);

if (fixedCount > 0) {
  console.log(`\n🎉 Field naming fixes applied successfully!`);
  console.log(`   Run 'npm run build' to verify the changes.`);
}
