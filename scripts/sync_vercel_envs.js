const fs = require('fs');
const { execSync } = require('child_process');

const envContent = fs.readFileSync('.env.local', 'utf8');
const lines = envContent.split('\n');

const keysToSync = [
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'NEXT_PUBLIC_SENTRY_DSN',
  'SENTRY_DSN',
  'GLITCHTIP_SECURITY_ENDPOINT',
  'INNGEST_EVENT_KEY',
  'INNGEST_SIGNING_KEY',
  'HF_TOKEN',
  'STAIN_DETECTION_API_URL',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'DATABASE_URL'
];

console.log('🚀 Starting Vercel Environment Sync...');

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;

  const [key, ...valueParts] = trimmed.split('=');
  const value = valueParts.join('=').replace(/^["']|["']$/g, '');

  if (keysToSync.includes(key)) {
    console.log(`📡 Uploading ${key}...`);
    try {
      // Remove existing if it exists (ignore error)
      try { execSync(`vercel env rm ${key} production --yes`, { stdio: 'ignore' }); } catch (e) {}
      
      // Add new
      execSync(`echo "${value}" | vercel env add ${key} production`, { stdio: 'inherit' });
      console.log(`✅ ${key} added.`);
    } catch (err) {
      console.error(`❌ Failed to upload ${key}: ${err.message}`);
    }
  }
}

console.log('✨ All environment variables synced to Vercel production!');
