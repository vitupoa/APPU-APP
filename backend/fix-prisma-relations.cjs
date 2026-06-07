const fs = require('fs');
const path = require('path');

function fixCreateOperations(content) {
  let modified = content;
  
  // Fix create operations missing 'id' by adding id generation
  // Pattern: prisma.TABLE.create({ data: { ... } })
  // We'll add conditional id generation where needed
  
  // Common fixes for specific patterns
  const fixes = [
    // Fix User relation fields in include statements
    {
      pattern: /include:\s*\{\s*User:\s*true/g,
      replacement: 'include: { user: true'
    },
    {
      pattern: /include:\s*\{\s*User:/g,
      replacement: 'include: { user:'
    },
    // Fix Contest relation
    {
      pattern: /include:\s*\{\s*Contest:\s*true/g,
      replacement: 'include: { contest: true'
    },
    {
      pattern: /include:\s*\{\s*Contest:/g,
      replacement: 'include: { contest:'
    },
    // Fix Team relation
    {
      pattern: /include:\s*\{\s*Team:\s*true/g,
      replacement: 'include: { team: true'
    },
    {
      pattern: /include:\s*\{\s*Team:/g,
      replacement: 'include: { team:'
    },
    // Fix Post relation
    {
      pattern: /include:\s*\{\s*Post:\s*true/g,
      replacement: 'include: { post: true'
    },
    {
      pattern: /include:\s*\{\s*Post:/g,
      replacement: 'include: { post:'
    },
    // Fix property access on objects
    {
      pattern: /\.User\b/g,
      replacement: '.user'
    },
    {
      pattern: /\.Contest\b/g,
      replacement: '.contest'
    },
    {
      pattern: /\.Team\b/g,
      replacement: '.team'
    },
    {
      pattern: /\.Post\b/g,
      replacement: '.post'
    },
    {
      pattern: /\.ContestSubmission\b/g,
      replacement: '.contest_submission'
    },
    {
      pattern: /\.adminProfile\b/g,
      replacement: '.admin_profile'
    },
    {
      pattern: /\.creator\b/g,
      replacement: '.user'
    },
    // Fix _count access
    {
      pattern: /'admires_admires_admired_idToUser'/g,
      replacement: "'admires_admires_admired_idTouser'"
    },
    // Fix where input patterns
    {
      pattern: /User_admires_admirer_idToUser/g,
      replacement: 'user_admires_admirer_idTouser'
    },
    {
      pattern: /User_admires_admired_idToUser/g,
      replacement: 'user_admires_admired_idTouser'
    },
    // Fix select and include patterns for relations
    {
      pattern: /_count:\s*\{\s*select:\s*\{\s*admires_admires_admired_idToUser/g,
      replacement: '_count: { select: { admires_admires_admired_idTouser'
    },
    {
      pattern: /_count:\s*\{\s*select:\s*\{\s*Post:/g,
      replacement: '_count: { select: { post:'
    },
    {
      pattern: /_count:\s*\{\s*select:\s*\{\s*Contest:/g,
      replacement: '_count: { select: { contest:'
    }
  ];
  
  fixes.forEach(({ pattern, replacement }) => {
    modified = modified.replace(pattern, replacement);
  });
  
  return modified;
}

function fixFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const modified = fixCreateOperations(content);
    
    if (content !== modified) {
      fs.writeFileSync(filePath, modified, 'utf8');
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

console.log('Starting additional Prisma fixes...\n');
walkDirectory(srcDir, (filePath) => {
  if (fixFile(filePath)) {
    fixedCount++;
  }
});

console.log(`\nCompleted! Fixed ${fixedCount} additional files.`);
