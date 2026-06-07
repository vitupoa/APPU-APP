const fs = require('fs');
const path = require('path');

// Common Prisma field mappings that need to be fixed
const mappings = {
  // Model name mappings (PascalCase to snake_case)
  "prisma.chatParticipant": "prisma.chat_participant",
  "prisma.contestSubmission": "prisma.contest_submission",
  "prisma.adminProfile": "prisma.admin_profile",
  "prisma.subscriptionTier": "prisma.subscription_tier",
  "prisma.storyView": "prisma.story_view",
  "prisma.storyViewerPreference": "prisma.story_viewer_preference",
  "prisma.contentHashtag": "prisma.content_hashtag",
  "prisma.contentMention": "prisma.content_mention",
  
  // Include field mappings
  "'participants'": "'chat_participant'",
  "'User'": "'user'",
  "'Contest'": "'contest'",
  "'Team'": "'team'",
  "'Post'": "'post'",
  "'ContestSubmission'": "'contest_submission'",
  "'adminProfile'": "'admin_profile'",
  "'creator'": "'user'",
  "'views'": "'story_view'",
  "'User_comments_user_idToUser'": "'user_comments_user_idTouser'",
  "'User_comments_reply_to_user_idToUser'": "'user_comments_reply_to_user_idTouser'",
  "'User_admires_admirer_idToUser'": "'user_admires_admirer_idTouser'",
  "'User_admires_admired_idToUser'": "'user_admires_admired_idTouser'",
  "'User_subscriptions_creator_idToUser'": "'user_subscriptions_creator_idTouser'",
  "'User_subscriptions_subscriber_idToUser'": "'user_subscriptions_subscriber_idTouser'",
  "'User_gifts_sender_idToUser'": "'user_gifts_sender_idTouser'",
  "'contentHashtags'": "'content_hashtag'",
  "'chama_members'": "'chama_member'",
  "'chama_payouts'": "'chama_payout'",
  "'chama_contributions'": "'chama_contribution'",
  "'contest_prize_distributions'": "'contest_prize_distribution'",
  "'order_items'": "'order_item'",
  "'bio_links'": "'bio_link'",
  
  // Unique constraint mappings
  "'featureKey_scope_scopeValue'": "'key_scope_scope_value'",
  "'contentId_contentType'": "'content_id_content_type'",
  
  // OrderBy mappings
  "'admires_admires_admired_idToUser'": "'admires_admires_admired_idTouser'",
  "'admires_admires_admired_idToUser' ": "'admires_admires_admired_idTouser' ",
};

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    for (const [wrong, correct] of Object.entries(mappings)) {
      if (content.includes(wrong)) {
        const regex = new RegExp(wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        content = content.replace(regex, correct);
        modified = true;
      }
    }

    if (modified) {
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
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!['node_modules', 'dist', '.git', 'coverage', 'prisma/generated'].includes(file)) {
        walkDirectory(filePath, callback);
      }
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      callback(filePath);
    }
  });
}

const srcDir = path.join(__dirname, 'src');
let fixedCount = 0;

console.log('Starting Prisma mapping fixes...\n');
walkDirectory(srcDir, (filePath) => {
  if (fixFile(filePath)) {
    fixedCount++;
  }
});

console.log(`\nCompleted! Fixed ${fixedCount} files.`);
