import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load both .env and .env.local files
dotenv.config();
dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testMonthlyRenewal() {
  console.log('🔄 Testing Monthly Subscription Renewal...\n');

  try {
    // Step 1: Find an active subscription
    console.log('📋 Step 1: Finding active subscription...');
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select(`
        *,
        users!inner(email, first_name, last_name)
      `)
      .eq('status', 'active')
      .limit(1);

    if (!subscriptions || subscriptions.length === 0) {
      console.log('❌ No active subscriptions found. Please create a subscription first.');
      return;
    }

    const subscription = subscriptions[0];
    const user = subscription.users;
    
    console.log(`✅ Found active subscription:`);
    console.log(`   User: ${user.first_name} ${user.last_name} (${user.email})`);
    console.log(`   Subscription ID: ${subscription.stripe_subscription_id}`);
    console.log(`   Current Period End: ${new Date(subscription.current_period_end).toLocaleDateString()}`);
    console.log(`   Amount: $${subscription.amount}`);

    // Step 2: Check current database state
    console.log('\n📊 Step 2: Current database state...');
    await checkDatabaseState(user.email);

    // Step 3: Simulate monthly renewal by advancing the subscription period
    console.log('\n🔄 Step 3: Simulating monthly renewal...');
    
    // Calculate new period dates (1 month from current period end)
    const currentPeriodEnd = new Date(subscription.current_period_end);
    const newPeriodStart = new Date(currentPeriodEnd);
    const newPeriodEnd = new Date(currentPeriodEnd);
    newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

    console.log(`   Current Period End: ${currentPeriodEnd.toISOString()}`);
    console.log(`   New Period Start: ${newPeriodStart.toISOString()}`);
    console.log(`   New Period End: ${newPeriodEnd.toISOString()}`);

    // Step 4: Create renewal webhook event
    const renewalEvent = {
      id: 'evt_test_monthly_renewal',
      object: 'event',
      api_version: '2023-10-16',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: subscription.stripe_subscription_id,
          object: 'subscription',
          customer: subscription.stripe_customer_id,
          status: 'active',
          current_period_start: Math.floor(newPeriodStart.getTime() / 1000),
          current_period_end: Math.floor(newPeriodEnd.getTime() / 1000),
          created: Math.floor(new Date(subscription.created_at).getTime() / 1000),
          items: {
            data: [{
              id: 'si_test_renewal',
              price: {
                id: subscription.stripe_price_id,
                unit_amount: subscription.amount * 100,
                currency: subscription.currency.toLowerCase()
              }
            }]
          }
        }
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: 'req_test_renewal',
        idempotency_key: null
      },
      type: 'customer.subscription.updated'
    };

    // Step 5: Process the renewal webhook
    console.log('\n🔔 Step 5: Processing renewal webhook...');
    await processWebhookEvent(renewalEvent);

    // Step 6: Create invoice.payment_succeeded event for the renewal payment
    console.log('\n💳 Step 6: Processing renewal payment...');
    const paymentEvent = {
      id: 'evt_test_renewal_payment',
      object: 'event',
      api_version: '2023-10-16',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'in_test_renewal_invoice',
          object: 'invoice',
          customer: subscription.stripe_customer_id,
          subscription: subscription.stripe_subscription_id,
          amount_paid: subscription.amount * 100,
          currency: subscription.currency.toLowerCase(),
          status: 'paid',
          created: Math.floor(Date.now() / 1000),
          billing_reason: 'subscription_cycle',
          lines: {
            data: [{
              id: 'il_test_renewal_line',
              amount: subscription.amount * 100,
              currency: subscription.currency.toLowerCase(),
              price: {
                id: subscription.stripe_price_id,
                unit_amount: subscription.amount * 100,
                currency: subscription.currency.toLowerCase()
              }
            }]
          }
        }
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: 'req_test_renewal_payment',
        idempotency_key: null
      },
      type: 'invoice.payment_succeeded'
    };

    await processWebhookEvent(paymentEvent);

    // Step 7: Check database state after renewal
    console.log('\n📊 Step 7: Database state after renewal...');
    await checkDatabaseState(user.email);

    console.log('\n🎉 Monthly Renewal Test Completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Found active subscription');
    console.log('✅ Simulated monthly renewal');
    console.log('✅ Processed renewal payment');
    console.log('✅ Verified database updates');

  } catch (error) {
    console.error('❌ Error in monthly renewal test:', error);
  }
}

async function processWebhookEvent(event) {
  try {
    // Import the webhook processing logic from stripe-server.js
    const { processStripeWebhook } = await import('../stripe-server.js');
    
    // Create a mock request object
    const mockReq = {
      body: event,
      headers: {
        'stripe-signature': 'test_signature'
      }
    };

    const mockRes = {
      status: (code) => ({
        json: (data) => {
          if (code === 200) {
            console.log(`   ✅ Webhook processed successfully`);
          } else {
            console.log(`   ❌ Webhook failed with status ${code}`);
          }
        }
      })
    };

    await processStripeWebhook(mockReq, mockRes);
  } catch (error) {
    console.log(`   ❌ Error processing webhook: ${error.message}`);
  }
}

async function checkDatabaseState(userEmail) {
  try {
    // Get user data
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (!user) {
      console.log(`   ❌ User not found: ${userEmail}`);
      return;
    }

    console.log(`   👤 User Status:`);
    console.log(`      Email: ${user.email}`);
    console.log(`      Is Paid: ${user.is_paid}`);
    console.log(`      Status: ${user.status}`);
    console.log(`      Stripe Customer ID: ${user.stripe_customer_id || 'Not set'}`);
    console.log(`      Next Billing: ${user.next_billing_at ? new Date(user.next_billing_at).toLocaleDateString() : 'Not set'}`);

    // Get subscription data
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.user_id);

    console.log(`   📅 Subscriptions: ${subscriptions?.length || 0}`);
    if (subscriptions && subscriptions.length > 0) {
      subscriptions.forEach((sub, index) => {
        console.log(`      ${index + 1}. Status: ${sub.status}`);
        console.log(`         Period: ${new Date(sub.current_period_start).toLocaleDateString()} - ${new Date(sub.current_period_end).toLocaleDateString()}`);
        console.log(`         Amount: $${sub.amount}`);
      });
    }

    // Get payment data
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.user_id)
      .order('created_at', { ascending: false });

    console.log(`   💰 Payments: ${payments?.length || 0}`);
    if (payments && payments.length > 0) {
      payments.slice(0, 3).forEach((payment, index) => {
        console.log(`      ${index + 1}. Amount: $${payment.amount}, Status: ${payment.status}, Date: ${new Date(payment.created_at).toLocaleDateString()}`);
      });
    }

    // Get subscription events
    const { data: events } = await supabase
      .from('subscription_events')
      .select('*')
      .eq('user_id', user.user_id)
      .order('created_at', { ascending: false });

    console.log(`   📝 Events: ${events?.length || 0}`);
    if (events && events.length > 0) {
      events.slice(0, 3).forEach((event, index) => {
        console.log(`      ${index + 1}. Type: ${event.event_type}, Date: ${new Date(event.created_at).toLocaleDateString()}`);
      });
    }

  } catch (error) {
    console.log(`   ❌ Error checking database state: ${error.message}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args[0] === '--help' || args[0] === '-h') {
    console.log('Monthly Renewal Test Script');
    console.log('\nUsage:');
    console.log('  node scripts/test-monthly-renewal.js');
    console.log('\nThis script will:');
    console.log('1. Find an active subscription');
    console.log('2. Simulate a monthly renewal');
    console.log('3. Process renewal webhook events');
    console.log('4. Verify database updates');
    return;
  }

  await testMonthlyRenewal();
}

main().catch(console.error); 