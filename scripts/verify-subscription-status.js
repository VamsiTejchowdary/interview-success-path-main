import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load both .env and .env.local files
dotenv.config();
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function verifySubscriptionStatus() {
  console.log('🔍 Verifying Subscription Status...\n');

  try {
    // Get all users with their subscription info
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        user_id,
        email,
        first_name,
        last_name,
        is_paid,
        status,
        stripe_customer_id,
        next_billing_at,
        subscription_fee,
        subscriptions (
          subscription_id,
          stripe_subscription_id,
          status,
          amount,
          currency,
          current_period_start,
          current_period_end,
          created_at
        ),
        payments (
          payment_id,
          amount,
          status,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }

    console.log(`📊 Found ${users.length} users:\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.first_name} ${user.last_name} (${user.email})`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Is Paid: ${user.is_paid}`);
      console.log(`   Stripe Customer ID: ${user.stripe_customer_id || 'Not set'}`);
      console.log(`   Subscription Fee: $${user.subscription_fee}`);
      console.log(`   Next Billing: ${user.next_billing_at ? new Date(user.next_billing_at).toLocaleDateString() : 'Not set'}`);
      
      // Subscription info
      if (user.subscriptions && user.subscriptions.length > 0) {
        console.log(`   📅 Subscriptions: ${user.subscriptions.length}`);
        user.subscriptions.forEach((sub, subIndex) => {
          console.log(`      ${subIndex + 1}. Status: ${sub.status}`);
          console.log(`         Amount: $${sub.amount} ${sub.currency}`);
          console.log(`         Period: ${new Date(sub.current_period_start).toLocaleDateString()} - ${new Date(sub.current_period_end).toLocaleDateString()}`);
          console.log(`         Stripe ID: ${sub.stripe_subscription_id}`);
        });
      } else {
        console.log(`   📅 Subscriptions: None`);
      }

      // Payment info
      if (user.payments && user.payments.length > 0) {
        console.log(`   💰 Payments: ${user.payments.length}`);
        user.payments.slice(0, 3).forEach((payment, payIndex) => {
          console.log(`      ${payIndex + 1}. $${payment.amount} - ${payment.status} (${new Date(payment.created_at).toLocaleDateString()})`);
        });
      } else {
        console.log(`   💰 Payments: None`);
      }

      console.log(''); // Empty line for readability
    });

    // Summary statistics
    const paidUsers = users.filter(u => u.is_paid).length;
    const activeSubscriptions = users.filter(u => u.subscriptions && u.subscriptions.some(s => s.status === 'active')).length;
    const totalPayments = users.reduce((sum, u) => sum + (u.payments ? u.payments.length : 0), 0);

    console.log('📈 Summary Statistics:');
    console.log(`   Total Users: ${users.length}`);
    console.log(`   Paid Users: ${paidUsers}`);
    console.log(`   Active Subscriptions: ${activeSubscriptions}`);
    console.log(`   Total Payments: ${totalPayments}`);

  } catch (error) {
    console.error('❌ Error verifying subscription status:', error);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args[0] === '--help' || args[0] === '-h') {
    console.log('Subscription Status Verification Script');
    console.log('\nUsage:');
    console.log('  node scripts/verify-subscription-status.js');
    console.log('\nThis script will:');
    console.log('1. Show all users and their subscription status');
    console.log('2. Display payment history');
    console.log('3. Show summary statistics');
    return;
  }

  await verifySubscriptionStatus();
}

main().catch(console.error); 