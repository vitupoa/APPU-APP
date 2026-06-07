const fs = require('fs');
const path = require('path');

// Model name corrections
const modelNameFixes = {
  'prisma.chamaMember': 'prisma.chama_member',
  '.chamaMember': '.chama_member',
};

// Tables that require explicit id in create operations
const tablesRequiringId = [
  'audit_logs',
  'transactions', 
  'daily_stats',
  'refresh_tokens',
  'user',
  'admires',
  'comment_likes',
  'comment_reports',
  'comment_settings',
  'kyc_documents',
  'withdrawal_limits',
  'suspicious_activities',
  'contest_prize_distributions',
  'judge_invites',
  'contest_participants',
  'contest_votes',
  'contest_judges',
  'judge_scores',
  'creator_boost_global_settings',
  'display_ad_campaigns',
  'ad_platform_settings',
  'content_niche_tags',
  'ad_impressions',
  'influencer_profiles',
  'contest_purchase_entries',
  'contest_engagement_actions',
  'conversion_campaigns',
  'conversion_campaign_recipients',
  'sales_funnel_events',
  'gamification_activities',
  'gamification_points',
  'social_media_accounts',
  'social_media_sync_logsimport crypto from',
  'platform_config',
  'creator_niche',
  'location_master',
  'brand_campaigns',
  'campaign_applications',
  'contest_sponsorships',
  'subscriptions',
  'wallets',
  'withdrawal_requests',
  'content_distribution',
  'user_content_delivery',
  'user_interaction_signals',
  'user_micro_interests',
  'admin_profile',
  'listing_fee_config',
  'listing_fee_transaction',
  'product_analytics',
  'flash_sales',
  'flash_sale_products',
  'group_buys',
  'group_buy_participants',
  'deal_alerts',
  'user_listing_quota',
  'product_discounts',
  'vehicle_favorites',
  'product_reviews',
  'wishlists',
  'wishlist_items',
  'cart_items',
  'gifts',
  'garage_profiles',
  'garage_bookings',
  'garage_reviews',
  'importer_profiles',
  'import_requests',
  'import_quotes',
  'logistics_companies',
  'shipping_jobs',
  'premium_listings',
  'product_shares',
  'product_tags',
  'short_likes',
  'escrows',
  'sponsored_content',
  'sponsored_impressions',
  'story',
  'team',
  'team_members',
  'team_invitations',
  'team_contest_registrations',
  'team_submissions',
  'bio_links',
  'milestone_completions',
  'trending_topics',
  'prohibited_names',
  'reserved_usernames',
  'user_suspensions',
  'notificationsimport',
  'transaction_nonces',
  'contest_analytics',
  'campaign_analytics',
  'content_moderation_logs',
  'feature_flags',
  'suspicious_activity_logs',
  'device_fingerprints',
  'locked_chat_tasks',
  'locked_chat_settings',
  'ofac_screening_cache',
  'compliance_reviews',
  'user_risk_profiles',
  'suspicious_activity_reports',
  'flagged_transactions',
  'user_session_secrets',
  'financial_transaction_logs',
  'hashtag',
  'post_likes',
  'post_comments',
];

function ensureCryptoImport(content) {
  // Check if crypto is already imported
  if (content.includes("import crypto from 'crypto'") || 
      content.includes('import { randomUUID }') ||
      content.includes("import * as crypto from 'crypto'")) {
    return content;
  }
  
  // Find the last import statement
  const importRegex = /^import .+;$/gm;
  const imports = content.match(importRegex);
  
  if (imports && imports.length > 0) {
    const lastImport = imports[imports.length - 1];
    const lastImportIndex = content.indexOf(lastImport) + lastImport.length;
    
    return content.slice(0, lastImportIndex) + 
           "\nimport crypto from 'crypto';" + 
           content.slice(lastImportIndex);
  }
  
  // If no imports found, add at the beginning
  return "import crypto from 'crypto';\n\n" + content;
}

function fixCreateOperations(content) {
  let modified = content;
  
  // Fix model names first
  for (const [wrong, correct] of Object.entries(modelNameFixes)) {
    const regex = new RegExp(wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    modified = modified.replace(regex, correct);
  }
  
  // Fix create operations by adding id: crypto.randomUUID() where needed
  tablesRequiringId.forEach(table => {
    // Pattern: prisma.table.create({ data: { ... } })
    // We need to add id if not present
    const createRegex = new RegExp(
      `prisma\\.${table}\\.create\\(\\{\\s*data:\\s*\\{([^}]+)\\}`,
      'g'
    );
    
    modified = modified.replace(createRegex, (match, dataContent) => {
      // Check if id is already present
      if (dataContent.includes('id:')) {
        return match;
      }
      
      // Add id at the beginning of data object
      return `prisma.${table}.create({ data: { id: crypto.randomUUID(), ${dataContent.trim()}}`;
    });
    
    // Pattern: prisma.table.createMany({ data: [{ ... }] })
    const createManyRegex = new RegExp(
      `prisma\\.${table}\\.createMany\\(\\{\\s*data:\\s*\\[`,
      'g'
    );
    
    // For createMany, we need to ensure each object in the array has an id
    // This is more complex, so we'll handle it differently
  });
  
  return modified;
}

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;
    
    // Skip generated files and node_modules
    if (filePath.includes('generated') || 
        filePath.includes('node_modules') ||
        filePath.includes('.d.ts')) {
      return false;
    }
    
    // Add crypto import if file has prisma.create operations
    if (content.match(/prisma\.\w+\.create/)) {
      content = ensureCryptoImport(content);
    }
    
    content = fixCreateOperations(content);
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function walkDirectory(dir, callback) {
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        if (!['node_modules', 'dist', '.git', 'coverage', 'generated'].includes(file)) {
          walkDirectory(filePath, callback);
        }
      } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
        callback(filePath);
      }
    });
  } catch (error) {
    console.error(`Error walking directory ${dir}:`, error.message);
  }
}

const srcDir = path.join(__dirname, 'src');
let fixedCount = 0;

console.log('Fixing Prisma create operations and model names...\n');
walkDirectory(srcDir, (filePath) => {
  if (fixFile(filePath)) {
    fixedCount++;
  }
});

console.log(`\nCompleted! Fixed ${fixedCount} files.`);
