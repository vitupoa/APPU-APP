#!/usr/bin/env node

// Startup wrapper to catch and log initialization errors
console.log('🚀 Starting Krieta Backend...');
console.log('📍 Working directory:', process.cwd());
console.log('🔧 Node version:', process.version);
console.log('📦 Environment:', process.env.NODE_ENV || 'development');

// Log environment variables (without sensitive data)
console.log('🔐 Environment check:');
console.log('  - PORT:', process.env.PORT || '3000');
console.log('  - DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
console.log('  - REDIS_URL:', process.env.REDIS_URL ? '✅ Set' : '❌ Missing');
console.log('  - JWT_ACCESS_SECRET:', process.env.JWT_ACCESS_SECRET ? '✅ Set' : '❌ Missing');

// Catch unhandled errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  process.exit(1);
});

// Import and start the app
console.log('📥 Loading application...');
try {
  await import('./dist/index.ts');
  console.log('✅ Application loaded successfully');
} catch (error) {
  console.error('❌ Failed to load application:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
}
