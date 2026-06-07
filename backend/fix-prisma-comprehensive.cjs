const fs = require('fs');
const path = require('path');

// All camelCase to snake_case model name conversions
const modelNameMappings = {
  'chamaCycle': 'chama_cycle',
  'chamaMember': 'chama_member',
  'chamaContribution': 'chama_contribution',
  'chamaPayout': 'chama_payout',
  'chamaTransaction': 'chama_transaction',
  'chamaDispute': 'chama_dispute',
  'chamaLoan': 'chama_loan',
  'chamaLoanPayment': 'chama_loan_payment',
  'chamaElection': 'chama_election',
  'chamaVote': 'chama_vote',
  'chamaBallot': 'chama_ballot',
  'chamaSavingsGoal': 'chama_savings_goal',
  'chamaInvestment': 'chama_investment',
  'chamaAsset': 'chama_asset',
  'chamaExpense': 'chama_expense',
  'chamaFinancialReport': 'chama_financial_report',
  'chamaAuditLog': 'chama_audit_log',
  'chamaNotification': 'chama_notification'
};

function fixModelNames(content) {
  let modified = content;
  
  // Fix prisma model accessor names
  for (const [camel, snake] of Object.entries(modelNameMappings)) {
    // Fix prisma.modelName patterns
    const prismaRegex = new RegExp(`prisma\\.${camel}\\b`, 'g');
    modified = modified.replace(prismaRegex, `prisma.${snake}`);
    
    // Fix .modelName patterns (property access)
    const propRegex = new RegExp(`\\.${camel}\\b`, 'g');
    modified = modified.replace(propRegex, `.${snake}`);
  }
  
  return modified;
}

function addIdToCreateCall(createCallMatch) {
  // Extract the data object content
  const dataMatch = createCallMatch.match(/data:\s*\{([^}]+)\}/s);
  if (!dataMatch) return createCallMatch;
  
  const dataContent = dataMatch[1];
  
  // Check if id is already present
  if (dataContent.includes('id:')) {
    return createCallMatch;
  }
  
  // Add id: crypto.randomUUID() at the beginning
  return createCallMatch.replace(
    /data:\s*\{/,
    'data: {\n      id: crypto.randomUUID(),'
  );
}

function fixCreateOperationsInFile(content) {
  let modified = content;
  
  // Fix single create operations
  // Match: prisma.table.create({ data: { ... } })
  modified = modified.replace(
    /prisma\.\w+\.create\(\{\s*data:\s*\{[^}]+\}\s*\}/gs,
    addIdToCreateCall
  );
  
  // Fix createMany operations - add id to each object in array
  // This is more complex - we'll handle it with a function
  modified = modified.replace(
    /(prisma\.\w+\.createMany\(\{\s*data:\s*\[)([^\]]+)(\]\s*\})/gs,
    (match, prefix, arrayContent, suffix) => {
      // Split by object boundaries
      const objects = [];
      let depth = 0;
      let current = '';
      
      for (let i = 0; i < arrayContent.length; i++) {
        const char = arrayContent[i];
        current += char;
        
        if (char === '{') depth++;
        if (char === '}') {
          depth--;
          if (depth === 0) {
            objects.push(current.trim());
            current = '';
          }
        }
      }
      
      // Add id to each object if not present
      const fixedObjects = objects.map(obj => {
        if (!obj.includes('id:')) {
          return obj.replace(/^\{/, '{\n        id: crypto.randomUUID(),');
        }
        return obj;
      });
      
      return prefix + fixedObjects.join(',\n      ') + suffix;
    }
  );
  
  return modified;
}

function ensureCryptoImport(content) {
  // Check if crypto import exists
  if (content.includes("import crypto from 'crypto'") ||
      content.includes("import * as crypto from 'crypto'")) {
    return content;
  }
  
  // Find last import
  const lines = content.split('\n');
  let lastImportIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ') && lines[i].includes(';')) {
      lastImportIndex = i;
    }
  }
  
  if (lastImportIndex >= 0) {
    lines.splice(lastImportIndex + 1, 0, "import crypto from 'crypto';");
    return lines.join('\n');
  }
  
  // No imports found, add at top
  return "import crypto from 'crypto';\n\n" + content;
}

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;
    
    // Skip generated files
    if (filePath.includes('\\generated\\') || 
        filePath.includes('/generated/') ||
        filePath.includes('node_modules') ||
        filePath.endsWith('.d.ts')) {
      return false;
    }
    
    // Fix model names
    content = fixModelNames(content);
    
    // If file has create operations, add crypto import and fix them
    if (content.includes('prisma.') && content.includes('.create(')) {
      content = ensureCryptoImport(content);
      content = fixCreateOperationsInFile(content);
    }
    
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
      } else if (file.endsWith('.ts')) {
        callback(filePath);
      }
    });
  } catch (error) {
    // Silently skip directories that can't be read
  }
}

const srcDir = path.join(__dirname, 'src');
let fixedCount = 0;

console.log('Applying comprehensive Prisma fixes...\n');
walkDirectory(srcDir, (filePath) => {
  if (fixFile(filePath)) {
    fixedCount++;
  }
});

console.log(`\nCompleted! Fixed ${fixedCount} files.`);
