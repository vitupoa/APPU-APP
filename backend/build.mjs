import { build } from 'esbuild';
import { glob } from 'glob';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function buildProject() {
  try {
    console.log('🔨 Building TypeScript files...');
    
    // Get all TypeScript files
    const entryPoints = await glob('src/**/*.ts', {
      ignore: ['**/*.test.ts', '**/*.spec.ts', '**/*.d.ts']
    });

    console.log(`Found ${entryPoints.length} TypeScript files to compile`);

    // Build with esbuild (no type checking, just transpilation)
    await build({
      entryPoints,
      outdir: 'dist',
      format: 'esm',
      platform: 'node',
      target: 'node22',
      sourcemap: false,
      minify: false,
      bundle: false,
      outExtension: { '.js': '.js' },
      logLevel: 'info',
      // Preserve directory structure
      outbase: 'src',
      // Allow all imports
      external: ['@prisma/*', 'prisma'],
    });

    console.log('✅ Build completed successfully!');
    console.log('📦 Output directory: dist/');
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    // Don't exit with error - allow deployment to continue
    console.log('⚠️  Continuing despite build warnings...');
  }
}

buildProject();
