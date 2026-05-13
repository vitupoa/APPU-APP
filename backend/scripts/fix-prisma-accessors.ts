/**
 * Script to fix Prisma model accessor naming mismatch
 * 
 * This script:
 * 1. Extracts all model names from the Prisma schema
 * 2. Generates singular → plural accessor mappings
 * 3. Systematically replaces incorrect singular accessors with correct plural forms
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pluralization rules
function pluralize(singular: string): string {
  // Handle special cases first
  const specialCases: Record<string, string> = {
    'analytics': 'analytics',
    'details': 'details',
    'settings': 'settings',
    'stats': 'stats',
  };

  if (specialCases[singular.toLowerCase()]) {
    return specialCases[singular.toLowerCase()];
  }

  // Standard pluralization rules
  if (singular.endsWith('s') || singular.endsWith('x') || singular.endsWith('z') || 
      singular.endsWith('ch') || singular.endsWith('sh')) {
    return singular + 'es';
  }
  
  if (singular.endsWith('y') && !/[aeiou]y$/i.test(singular)) {
    return singular.slice(0, -1) + 'ies';
  }
  
  return singular + 's';
}

// Convert PascalCase to camelCase
function toCamelCase(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

// Extract model names from schema
function extractModelNames(schemaPath: string): string[] {
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  const modelRegex = /^model\s+(\w+)\s*{/gm;
  const models: string[] = [];
  
  let match;
  while ((match = modelRegex.exec(schemaContent)) !== null) {
    models.push(match[1]);
  }
  
  return models;
}

// Generate accessor mapping
function generateAccessorMapping(modelNames: string[]): Map<string, string> {
  const mapping = new Map<string, string>();
  
  for (const modelName of modelNames) {
    const singularAccessor = toCamelCase(modelName);
    const pluralAccessor = pluralize(singularAccessor);
    
    // Only add if singular and plural are different
    if (singularAccessor !== pluralAccessor) {
      mapping.set(singularAccessor, pluralAccessor);
    }
  }
  
  return mapping;
}

// Replace accessors in a file
function replaceAccessorsInFile(filePath: string, mapping: Map<string, string>): number {
  let content = fs.readFileSync(filePath, 'utf-8');
  let replacementCount = 0;
  
  for (const [singular, plural] of mapping.entries()) {
    // Match prisma.{singularAccessor} but not prisma.{singularAccessor}s (to avoid double replacement)
    const regex = new RegExp(`\\bprisma\\.${singular}\\b(?!s)`, 'g');
    const matches = content.match(regex);
    
    if (matches) {
      replacementCount += matches.length;
      content = content.replace(regex, `prisma.${plural}`);
    }
  }
  
  if (replacementCount > 0) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }
  
  return replacementCount;
}

// Recursively find all TypeScript files
function findTypeScriptFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, dist, build directories
      if (!['node_modules', 'dist', 'build', '.git'].includes(file)) {
        findTypeScriptFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

// Main execution
async function main() {
  const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
  const backendDir = path.join(__dirname, '..');
  
  console.log('Step 1: Extracting model names from Prisma schema...');
  const modelNames = extractModelNames(schemaPath);
  console.log(`Found ${modelNames.length} models`);
  
  console.log('\nStep 2: Generating accessor mapping...');
  const mapping = generateAccessorMapping(modelNames);
  console.log(`Generated ${mapping.size} mappings (singular → plural)`);
  
  // Print mapping for verification
  console.log('\nAccessor Mapping:');
  const sortedMappings = Array.from(mapping.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  for (const [singular, plural] of sortedMappings) {
    console.log(`  ${singular} → ${plural}`);
  }
  
  console.log('\nStep 3: Finding TypeScript files in backend...');
  const tsFiles = findTypeScriptFiles(backendDir);
  console.log(`Found ${tsFiles.length} TypeScript files`);
  
  console.log('\nStep 4: Replacing incorrect accessors...');
  let totalReplacements = 0;
  const filesModified: string[] = [];
  
  for (const filePath of tsFiles) {
    const count = replaceAccessorsInFile(filePath, mapping);
    if (count > 0) {
      totalReplacements += count;
      filesModified.push(path.relative(backendDir, filePath));
      console.log(`  ${path.relative(backendDir, filePath)}: ${count} replacements`);
    }
  }
  
  console.log(`\n✅ Complete!`);
  console.log(`   Files modified: ${filesModified.length}`);
  console.log(`   Total replacements: ${totalReplacements}`);
  
  if (filesModified.length > 0) {
    console.log('\nModified files:');
    for (const file of filesModified) {
      console.log(`  - ${file}`);
    }
  }
}

main().catch(console.error);
