// Test script to verify Cloudinary signature generation
// Run with: node test-cloudinary-signature.js

const crypto = require('crypto');

// Your Cloudinary credentials (replace with actual values)
const API_SECRET = 'YOUR_API_SECRET_HERE'; // Replace with your actual API secret
const timestamp = Math.round(Date.now() / 1000);
const uploadPreset = 'Krieta';

// Parameters to sign (must be in alphabetical order)
const paramsToSign = {
  timestamp: timestamp,
  upload_preset: uploadPreset
};

// Convert to string format that Cloudinary expects
// Format: key1=value1&key2=value2 (alphabetically sorted)
const paramsString = Object.keys(paramsToSign)
  .sort()
  .map(key => `${key}=${paramsToSign[key]}`)
  .join('&');

console.log('Parameters to sign:', paramsToSign);
console.log('String to sign:', paramsString);

// Generate signature using SHA1
const signature = crypto
  .createHash('sha1')
  .update(paramsString + API_SECRET)
  .digest('hex');

console.log('\nGenerated signature:', signature);
console.log('Timestamp:', timestamp);
console.log('\nUse these values in your upload request:');
console.log('  api_key: YOUR_API_KEY');
console.log('  timestamp:', timestamp);
console.log('  signature:', signature);
console.log('  upload_preset:', uploadPreset);
