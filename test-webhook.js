// Test script to simulate Whop webhook
// Run: node test-webhook.js

const crypto = require('crypto');

const WEBHOOK_SECRET = 'ws_e3e6909107300dd9fc0b40d1490829f67b13f39d341270c562b52ca3186abd5e';
const YOUR_USER_ID = '5a01dbbb-3369-4ca1-b97e-75cd17f450c4'; // Replace with your actual user ID

// Webhook payload (what Whop sends when user pays)
const payload = {
  action: 'membership_activated',
  data: {
    id: 'mem_test_123456',
    plan_id: 'plan_AhTV9u0UD48Z0', // Monthly plan
    status: 'active',
    metadata: {
      supabase_user_id: YOUR_USER_ID
    },
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }
};

const body = JSON.stringify(payload);
const timestamp = Date.now().toString();
const signedPayload = `${timestamp}.${body}`;
const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(signedPayload)
  .digest('base64');

console.log('\n🧪 Testing Whop Webhook...\n');
console.log('Run this curl command:\n');
console.log(`curl -X POST http://localhost:3000/api/whop \\
  -H "Content-Type: application/json" \\
  -H "webhook-signature: ${signature}" \\
  -H "webhook-timestamp: ${timestamp}" \\
  -d '${body}'`);

console.log('\n\n📋 Or use this for production:\n');
console.log(`curl -X POST https://notewave.app/api/whop \\
  -H "Content-Type: application/json" \\
  -H "webhook-signature: ${signature}" \\
  -H "webhook-timestamp: ${timestamp}" \\
  -d '${body}'`);

console.log('\n\n✅ Expected result: {"ok":true}\n');
