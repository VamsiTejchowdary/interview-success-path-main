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

async function setupExistingUsers() {
  console.log('🔧 Setting up Stripe customer IDs for existing paid users...\n');

  try {
    // Get all paid users without Stripe customer IDs
    const { data: users, error } = await supabase
      .from('users')
      .select('user_id, email, first_name, last_name, subscription_fee, next_billing_at')
      .eq('is_paid', true)
      .is('stripe_customer_id', null);

    if (error) {
      console.log('❌ Error fetching users:', error.message);
      return;
    }

    if (users.length === 0) {
      console.log('✅ All paid users already have Stripe customer IDs');
      return;
    }

    console.log(`📝 Found ${users.length} paid users without Stripe customer IDs\n`);

    for (const user of users) {
      try {
        console.log(`👤 Processing: ${user.first_name} ${user.last_name} (${user.email})`);
        
        // Create Stripe customer
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.first_name} ${user.last_name}`,
          metadata: {
            user_id: user.user_id,
            subscription_fee: user.subscription_fee.toString()
          }
        });

        console.log(`   ✅ Created Stripe customer: ${customer.id}`);

        // Update user with Stripe customer ID
        const { error: updateError } = await supabase
          .from('users')
          .update({ stripe_customer_id: customer.id })
          .eq('user_id', user.user_id);

        if (updateError) {
          console.log(`   ❌ Error updating user: ${updateError.message}`);
        } else {
          console.log(`   ✅ Updated user with Stripe customer ID`);
        }

        // Create a test subscription for this user
        await createTestSubscription(customer.id, user);

      } catch (error) {
        console.log(`   ❌ Error processing user: ${error.message}`);
      }
      
      console.log('');
    }

    console.log('🎉 Setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Run: node scripts/check-subscription-status.js');
    console.log('2. Test webhooks: node scripts/test-webhooks.js lifecycle');

  } catch (error) {
    console.error('❌ Error setting up users:', error);
  }
}

async function createTestSubscription(customerId, user) {
  try {
    console.log(`   📝 Creating test subscription...`);
    
    // Create a test price
    const price = await stripe.prices.create({
      unit_amount: Math.round(user.subscription_fee * 100), // Convert to cents
      currency: 'usd',
      recurring: { interval: 'month' },
      product_data: {
        name: 'Premium Plan'
      }
    });

    // Create a test subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: price.id }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent']
    });

    console.log(`   ✅ Created test subscription: ${subscription.id}`);

    // Create subscription record in database
    const { error: subError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.user_id,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        stripe_price_id: price.id,
        plan_name: 'Premium Plan',
        amount: user.subscription_fee,
        currency: 'USD',
        interval: 'month',
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end
      });

    if (subError) {
      console.log(`   ❌ Error creating subscription record: ${subError.message}`);
    } else {
      console.log(`   ✅ Created subscription record in database`);
    }

    return subscription;
  } catch (error) {
    console.log(`   ❌ Error creating subscription: ${error.message}`);
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args[0] === '--help' || args[0] === '-h') {
    console.log('Setup Existing Users Script');
    console.log('\nUsage:');
    console.log('  node scripts/setup-existing-users.js');
    console.log('\nThis script will:');
    console.log('1. Find all paid users without Stripe customer IDs');
    console.log('2. Create Stripe customers for them');
    console.log('3. Create test subscriptions');
    console.log('4. Update the database with the new information');
    return;
  }

  await setupExistingUsers();
}

main().catch(console.error); 