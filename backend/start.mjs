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

// Create a simple health server first
import express from 'express';
const healthApp = express();
const PORT = process.env.PORT || 3000;

healthApp.get('/health', (req, res) => {
  res.json({ 
    status: 'starting', 
    message: 'Application is initializing...',
    timestamp: new Date().toISOString()
  });
});

const healthServer = healthApp.listen(PORT, () => {
  console.log(`✅ Health endpoint listening on port ${PORT}`);
  console.log('📥 Loading main application...');
  
  // Now try to load the main app
  import('./dist/index.ts')
    .then(() => {
      console.log('✅ Main application loaded successfully');
      // Close health server as main app will take over
      healthServer.close();
    })
    .catch((error) => {
      console.error('❌ Failed to load main application:', error);
      console.error('Stack:', error.stack);
      console.error('\n⚠️  Health endpoint will continue running for debugging');
      
      // Update health endpoint to show error
      healthApp.get('/health', (req, res) => {
        res.status(500).json({ 
          status: 'error',
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
      });
    });
});

// Catch unhandled errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
});
