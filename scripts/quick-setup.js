import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load both .env and .env.local files
dotenv.config();
dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkEnvironment() {
  console.log('🔍 Checking environment setup...\n');

  const requiredVars = [
    'STRIPE_SECRET_KEY',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];

  const missing = [];
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    console.log('❌ Missing required environment variables:');
    missing.forEach(varName => console.log(`   - ${varName}`));
    console.log('\n💡 Add these to your .env file and try again');
    return false;
  }

  console.log('✅ All required environment variables are set');
  return true;
}

async function checkDatabaseSchema() {
  console.log('\n🔍 Checking database schema...\n');

  try {
    // Check if stripe_customer_id column exists
    const { data: users, error } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .limit(1);

    if (error && error.message.includes('column "stripe_customer_id" does not exist')) {
      console.log('❌ Missing stripe_customer_id column in users table');
      console.log('\n💡 Run this SQL in your Supabase SQL editor:');
      console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;');
      console.log('CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);');
      return false;
    }

    console.log('✅ Database schema is correct');
    return true;
  } catch (error) {
    console.log('❌ Error checking database schema:', error.message);
    return false;
  }
}

async function checkStripeConnection() {
  console.log('\n🔍 Checking Stripe connection...\n');

  try {
    const account = await stripe.accounts.retrieve();
    console.log('✅ Stripe connection successful');
    console.log(`   Account: ${account.business_profile?.name || 'Unnamed'}`);
    console.log(`   Mode: ${account.charges_enabled ? 'Live' : 'Test'}`);
    return true;
  } catch (error) {
    console.log('❌ Stripe connection failed:', error.message);
    console.log('💡 Check your STRIPE_SECRET_KEY');
    return false;
  }
}

async function checkSupabaseConnection() {
  console.log('\n🔍 Checking Supabase connection...\n');

  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Supabase connection failed:', error.message);
      return false;
    }

    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.log('❌ Supabase connection failed:', error.message);
    return false;
  }
}

async function setupWebhookEndpoint() {
  console.log('\n🔧 Setting up webhook endpoint...\n');

  try {
    const webhookUrl = process.env.NODE_ENV === 'production'
      ? 'https://your-domain.com/api/stripe-webhook' // Replace with your actual domain
      : 'http://localhost:3000/api/stripe-webhook';

    // Check if webhook already exists
    const { data: existingWebhooks } = await stripe.webhookEndpoints.list();
    const existingWebhook = existingWebhooks.find(webhook => webhook.url === webhookUrl);

    if (existingWebhook) {
      console.log('✅ Webhook endpoint already exists');
      console.log(`   URL: ${existingWebhook.url}`);
      console.log(`   Status: ${existingWebhook.status}`);
      
      if (!process.env.STRIPE_WEBHOOK_SECRET) {
        console.log('\n⚠️  STRIPE_WEBHOOK_SECRET not set in environment');
        console.log('💡 Add this to your .env file:');
        console.log(`STRIPE_WEBHOOK_SECRET=${existingWebhook.secret}`);
      }
      
      return existingWebhook;
    }

    // Create new webhook
    const webhook = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: [
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.payment_succeeded',
        'invoice.payment_failed',
        'invoice.upcoming'
      ],
      description: 'Interview Success Path - Subscription Management'
    });

    console.log('✅ Webhook endpoint created');
    console.log(`   URL: ${webhook.url}`);
    console.log(`   ID: ${webhook.id}`);
    
    console.log('\n🔑 Add this to your .env file:');
    console.log(`STRIPE_WEBHOOK_SECRET=${webhook.secret}`);

    return webhook;
  } catch (error) {
    console.log('❌ Error creating webhook:', error.message);
    return null;
  }
}

async function checkExistingData() {
  console.log('\n🔍 Checking existing data...\n');

  try {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('user_id, email, is_paid, stripe_customer_id')
      .order('created_at', { ascending: false })
      .limit(5);

    if (usersError) {
      console.log('❌ Error fetching users:', usersError.message);
      return;
    }

    console.log(`📊 Found ${users.length} users in database`);
    
    if (users.length > 0) {
      const paidUsers = users.filter(u => u.is_paid);
      const usersWithStripe = users.filter(u => u.stripe_customer_id);
      
      console.log(`   Paid users: ${paidUsers.length}`);
      console.log(`   Users with Stripe customer ID: ${usersWithStripe.length}`);
      
      if (paidUsers.length > 0) {
        console.log('\n👥 Sample paid users:');
        paidUsers.slice(0, 3).forEach(user => {
          console.log(`   - ${user.email} (Stripe: ${user.stripe_customer_id ? '✅' : '❌'})`);
        });
      }
    }

    // Check subscriptions
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('subscription_id, status')
      .limit(5);

    if (!subsError) {
      console.log(`💳 Found ${subscriptions.length} subscriptions in database`);
    }

    // Check payments
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('payment_id, status')
      .limit(5);

    if (!paymentsError) {
      console.log(`💰 Found ${payments.length} payments in database`);
    }

  } catch (error) {
    console.log('❌ Error checking existing data:', error.message);
  }
}

async function runTests() {
  console.log('\n🧪 Running quick tests...\n');

  try {
    // Test database queries
    const { data: testUser } = await supabase
      .from('users')
      .select('user_id, email')
      .limit(1);

    if (testUser && testUser.length > 0) {
      console.log('✅ Database queries working');
    } else {
      console.log('⚠️  No users found in database');
    }

    // Test Stripe API
    const { data: prices } = await stripe.prices.list({ limit: 1 });
    console.log('✅ Stripe API working');

    console.log('\n🎉 All tests passed!');
    console.log('\n📋 Next steps:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Test webhooks: node scripts/test-webhooks.js lifecycle');
    console.log('3. Check database: node scripts/check-subscription-status.js');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

async function main() {
  console.log('🚀 Stripe Webhook Quick Setup\n');
  console.log('This script will help you set up Stripe webhooks for your subscription system.\n');

  // Check environment
  if (!await checkEnvironment()) {
    return;
  }

  // Check database schema
  if (!await checkDatabaseSchema()) {
    return;
  }

  // Check connections
  if (!await checkStripeConnection()) {
    return;
  }

  if (!await checkSupabaseConnection()) {
    return;
  }

  // Setup webhook
  const webhook = await setupWebhookEndpoint();
  if (!webhook) {
    return;
  }

  // Check existing data
  await checkExistingData();

  // Run tests
  await runTests();

  console.log('\n🎯 Setup complete!');
  console.log('\n📚 For detailed instructions, see: STRIPE_WEBHOOK_SETUP.md');
  console.log('\n🔗 Useful commands:');
  console.log('  node scripts/check-subscription-status.js     - Check database state');
  console.log('  node scripts/test-webhooks.js lifecycle       - Test webhook events');
  console.log('  node scripts/setup-stripe-webhook.js list     - List webhook endpoints');
}

main().catch(console.error); 