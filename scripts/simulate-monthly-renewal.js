import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load both .env and .env.local files
dotenv.config();
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function simulateMonthlyRenewal() {
  console.log('🔄 Simulating monthly subscription renewal...\n');

  try {
    // Get all subscriptions
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select(`
        subscription_id,
        user_id,
        stripe_subscription_id,
        amount,
        current_period_end,
        users(email, first_name, last_name)
      `)
      .not('stripe_subscription_id', 'is', null);

    if (error) {
      console.log('❌ Error fetching subscriptions:', error.message);
      return;
    }

    if (subscriptions.length === 0) {
      console.log('❌ No subscriptions found to renew');
      return;
    }

    console.log(`📝 Found ${subscriptions.length} subscriptions to process\n`);

    for (const subscription of subscriptions) {
      const user = subscription.users;
      console.log(`👤 Processing: ${user.first_name} ${user.last_name} (${user.email})`);
      
      // Calculate new billing period (30 days from current end)
      const currentEnd = new Date(subscription.current_period_end);
      const newEnd = new Date(currentEnd);
      newEnd.setDate(newEnd.getDate() + 30);

      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          subscription_id: subscription.subscription_id,
          user_id: subscription.user_id,
          stripe_payment_intent_id: `pi_sim_${Date.now()}`,
          stripe_invoice_id: `in_sim_${Date.now()}`,
          amount: subscription.amount,
          currency: 'USD',
          status: 'succeeded',
          payment_method: 'card',
          billing_reason: 'subscription_cycle',
          paid_at: new Date().toISOString()
        });

      if (paymentError) {
        console.log(`   ❌ Error creating payment: ${paymentError.message}`);
      } else {
        console.log(`   ✅ Created payment record: $${subscription.amount}`);
      }

      // Update subscription period
      const { error: subError } = await supabase
        .from('subscriptions')
        .update({
          current_period_start: subscription.current_period_end,
          current_period_end: newEnd.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('subscription_id', subscription.subscription_id);

      if (subError) {
        console.log(`   ❌ Error updating subscription: ${subError.message}`);
      } else {
        console.log(`   ✅ Updated subscription period: ${newEnd.toLocaleDateString()}`);
      }

      // Update user billing date
      const { error: userError } = await supabase
        .from('users')
        .update({
          next_billing_at: newEnd.toISOString(),
          is_paid: true,
          status: 'approved'
        })
        .eq('user_id', subscription.user_id);

      if (userError) {
        console.log(`   ❌ Error updating user: ${userError.message}`);
      } else {
        console.log(`   ✅ Updated user billing date`);
      }

      // Log the event
      const { error: eventError } = await supabase
        .from('subscription_events')
        .insert({
          subscription_id: subscription.subscription_id,
          stripe_event_id: `evt_sim_${Date.now()}`,
          event_type: 'invoice.payment_succeeded',
          event_data: {
            subscription: subscription.stripe_subscription_id,
            amount_paid: subscription.amount * 100,
            currency: 'usd',
            billing_reason: 'subscription_cycle'
          },
          processed: true
        });

      if (eventError) {
        console.log(`   ❌ Error logging event: ${eventError.message}`);
      } else {
        console.log(`   ✅ Logged renewal event`);
      }

      console.log('');
    }

    console.log('🎉 Monthly renewal simulation complete!');
    console.log('\n📋 Check the results:');
    console.log('node scripts/check-subscription-status.js');

  } catch (error) {
    console.error('❌ Error simulating renewal:', error);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args[0] === '--help' || args[0] === '-h') {
    console.log('Simulate Monthly Renewal Script');
    console.log('\nUsage:');
    console.log('  node scripts/simulate-monthly-renewal.js');
    console.log('\nThis script will:');
    console.log('1. Find all subscriptions');
    console.log('2. Create payment records for renewal');
    console.log('3. Update subscription periods');
    console.log('4. Update user billing dates');
    console.log('5. Log renewal events');
    return;
  }

  await simulateMonthlyRenewal();
}

main().catch(console.error); 