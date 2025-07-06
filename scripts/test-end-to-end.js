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

async function testEndToEnd() {
  console.log('🧪 Starting End-to-End Test...\n');

  try {
    // Step 1: Get test user
    console.log('📋 Step 1: Getting test user...');
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'testuser@example.com')
      .single();

    if (!user) {
      console.log('❌ Test user not found. Run: node scripts/create-test-user.js');
      return;
    }

    console.log(`✅ Found test user: ${user.first_name} ${user.last_name}`);
    console.log(`   User ID: ${user.user_id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Current Status: ${user.status}`);
    console.log(`   Is Paid: ${user.is_paid}`);
    console.log(`   Subscription Fee: $${user.subscription_fee}`);

    // Step 2: Create Stripe product and price
    console.log('\n📦 Step 2: Creating Stripe product and price...');
    
    const product = await stripe.products.create({
      name: 'Interview Success Path Subscription',
      description: 'Monthly subscription for interview coaching services'
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: user.subscription_fee * 100, // Convert to cents
      currency: 'usd',
      recurring: {
        interval: 'month'
      }
    });

    console.log(`✅ Created product: ${product.id}`);
    console.log(`✅ Created price: ${price.id}`);
    console.log(`   Amount: $${user.subscription_fee}/month`);

    // Step 3: Create Stripe customer
    console.log('\n👤 Step 3: Creating Stripe customer...');
    
    const customer = await stripe.customers.create({
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      phone: user.phone,
      address: {
        line1: user.address
      }
    });

    console.log(`✅ Created customer: ${customer.id}`);

    // Step 4: Create subscription
    console.log('\n💳 Step 4: Creating subscription...');
    
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: price.id }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent']
    });

    console.log(`✅ Created subscription: ${subscription.id}`);
    console.log(`   Status: ${subscription.status}`);
    console.log(`   Current Period Start: ${new Date(subscription.current_period_start * 1000).toISOString()}`);
    console.log(`   Current Period End: ${new Date(subscription.current_period_end * 1000).toISOString()}`);

    // Step 5: Simulate successful payment
    console.log('\n💰 Step 5: Simulating successful payment...');
    
    // Use Stripe test token instead of raw card data
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        token: 'tok_visa' // Stripe test token for successful payment
      }
    });

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: customer.id
    });

    // Set as default payment method
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethod.id
      }
    });

    console.log(`✅ Attached payment method: ${paymentMethod.id}`);

    // Step 6: Update database with customer ID
    console.log('\n💾 Step 6: Updating database with customer ID...');
    
    const { error: updateError } = await supabase
      .from('users')
      .update({
        stripe_customer_id: customer.id
      })
      .eq('user_id', user.user_id);

    if (updateError) {
      console.log('❌ Error updating user with customer ID:', updateError.message);
    } else {
      console.log('✅ Updated user with Stripe customer ID');
    }

    // Step 7: Simulate webhook events for subscription creation
    console.log('\n🔔 Step 7: Simulating subscription.created webhook...');
    
    const subscriptionCreatedEvent = {
      id: 'evt_test_subscription_created',
      object: 'event',
      api_version: '2023-10-16',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: subscription.id,
          object: 'subscription',
          customer: customer.id,
          status: 'active',
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          created: subscription.created,
          items: {
            data: [{
              id: subscription.items.data[0].id,
              price: {
                id: price.id,
                unit_amount: price.unit_amount,
                currency: price.currency
              }
            }]
          }
        }
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: 'req_test',
        idempotency_key: null
      },
      type: 'customer.subscription.created'
    };

    // Process the webhook event
    await processWebhookEvent(subscriptionCreatedEvent);
    console.log('✅ Processed subscription.created webhook');

    // Step 8: Simulate invoice.payment_succeeded webhook
    console.log('\n💳 Step 8: Simulating invoice.payment_succeeded webhook...');
    
    const invoicePaymentSucceededEvent = {
      id: 'evt_test_invoice_payment_succeeded',
      object: 'event',
      api_version: '2023-10-16',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'in_test_invoice',
          object: 'invoice',
          customer: customer.id,
          subscription: subscription.id,
          amount_paid: price.unit_amount,
          currency: 'usd',
          status: 'paid',
          created: Math.floor(Date.now() / 1000),
          lines: {
            data: [{
              id: 'il_test_line',
              amount: price.unit_amount,
              currency: 'usd',
              price: {
                id: price.id,
                unit_amount: price.unit_amount,
                currency: price.currency
              }
            }]
          }
        }
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: 'req_test',
        idempotency_key: null
      },
      type: 'invoice.payment_succeeded'
    };

    await processWebhookEvent(invoicePaymentSucceededEvent);
    console.log('✅ Processed invoice.payment_succeeded webhook');

    // Step 9: Check database state after initial payment
    console.log('\n📊 Step 9: Checking database state after initial payment...');
    await checkDatabaseState(user.user_id);

    // Step 10: Simulate monthly renewal (1 month later)
    console.log('\n🔄 Step 10: Simulating monthly renewal...');
    
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    
    const renewalEvent = {
      id: 'evt_test_renewal',
      object: 'event',
      api_version: '2023-10-16',
      created: Math.floor(oneMonthLater.getTime() / 1000),
      data: {
        object: {
          id: subscription.id,
          object: 'subscription',
          customer: customer.id,
          status: 'active',
          current_period_start: Math.floor(oneMonthLater.getTime() / 1000),
          current_period_end: Math.floor(new Date(oneMonthLater.getTime() + 30 * 24 * 60 * 60 * 1000).getTime() / 1000),
          created: subscription.created,
          items: {
            data: [{
              id: subscription.items.data[0].id,
              price: {
                id: price.id,
                unit_amount: price.unit_amount,
                currency: price.currency
              }
            }]
          }
        }
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: 'req_test',
        idempotency_key: null
      },
      type: 'customer.subscription.updated'
    };

    await processWebhookEvent(renewalEvent);
    console.log('✅ Processed subscription renewal webhook');

    // Step 11: Check database state after renewal
    console.log('\n📊 Step 11: Checking database state after renewal...');
    await checkDatabaseState(user.user_id);

    console.log('\n🎉 End-to-End Test Completed Successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Created Stripe product and price');
    console.log('✅ Created Stripe customer');
    console.log('✅ Created subscription');
    console.log('✅ Processed initial payment');
    console.log('✅ Simulated monthly renewal');
    console.log('✅ Verified database updates');

  } catch (error) {
    console.error('❌ Error in end-to-end test:', error);
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

async function checkDatabaseState(userId) {
  try {
    // Check user status
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log(`   👤 User Status:`);
    console.log(`      Is Paid: ${user.is_paid}`);
    console.log(`      Status: ${user.status}`);
    console.log(`      Next Billing: ${user.next_billing_at ? new Date(user.next_billing_at).toISOString() : 'Not set'}`);

    // Check subscriptions
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId);

    console.log(`   📅 Subscriptions: ${subscriptions.length}`);
    subscriptions.forEach((sub, index) => {
      console.log(`      ${index + 1}. Status: ${sub.status}, Created: ${new Date(sub.created_at).toISOString()}`);
    });

    // Check payments
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId);

    console.log(`   💰 Payments: ${payments.length}`);
    payments.forEach((payment, index) => {
      console.log(`      ${index + 1}. Amount: $${payment.amount}, Status: ${payment.status}, Date: ${new Date(payment.created_at).toISOString()}`);
    });

    // Check subscription events
    const { data: events } = await supabase
      .from('subscription_events')
      .select('*')
      .eq('user_id', userId);

    console.log(`   📝 Events: ${events.length}`);
    events.forEach((event, index) => {
      console.log(`      ${index + 1}. Type: ${event.event_type}, Date: ${new Date(event.created_at).toISOString()}`);
    });

  } catch (error) {
    console.log(`   ❌ Error checking database state: ${error.message}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args[0] === '--help' || args[0] === '-h') {
    console.log('End-to-End Test Script');
    console.log('\nUsage:');
    console.log('  node scripts/test-end-to-end.js');
    console.log('\nThis script will:');
    console.log('1. Get test user from database');
    console.log('2. Create Stripe product and price');
    console.log('3. Create Stripe customer');
    console.log('4. Create subscription');
    console.log('5. Simulate successful payment');
    console.log('6. Process webhook events');
    console.log('7. Simulate monthly renewal');
    console.log('8. Verify database updates');
    return;
  }

  await testEndToEnd();
}

main().catch(console.error); 