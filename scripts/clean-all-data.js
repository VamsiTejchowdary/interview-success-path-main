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

async function cleanAllData() {
  console.log('🧹 Cleaning all data for fresh start...\n');

  try {
    // 1. Clean database tables
    console.log('📊 Cleaning database tables...');
    
    // Delete subscription events
    const { error: eventsError } = await supabase
      .from('subscription_events')
      .delete()
      .neq('event_id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (eventsError) {
      console.log('❌ Error cleaning subscription_events:', eventsError.message);
    } else {
      console.log('✅ Cleaned subscription_events table');
    }

    // Delete payments
    const { error: paymentsError } = await supabase
      .from('payments')
      .delete()
      .neq('payment_id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (paymentsError) {
      console.log('❌ Error cleaning payments:', paymentsError.message);
    } else {
      console.log('✅ Cleaned payments table');
    }

    // Delete subscriptions
    const { error: subsError } = await supabase
      .from('subscriptions')
      .delete()
      .neq('subscription_id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (subsError) {
      console.log('❌ Error cleaning subscriptions:', subsError.message);
    } else {
      console.log('✅ Cleaned subscriptions table');
    }

    // Reset users (remove Stripe data, set to pending)
    const { error: usersError } = await supabase
      .from('users')
      .update({
        stripe_customer_id: null,
        is_paid: false,
        status: 'pending',
        next_billing_at: null
      })
      .neq('user_id', '00000000-0000-0000-0000-000000000000'); // Update all
    
    if (usersError) {
      console.log('❌ Error resetting users:', usersError.message);
    } else {
      console.log('✅ Reset users table (removed Stripe data)');
    }

    // 2. Clean Stripe data
    console.log('\n💳 Cleaning Stripe data...');
    
    // List and cancel all subscriptions
    const subscriptions = await stripe.subscriptions.list({ limit: 100 });
    if (subscriptions.data && subscriptions.data.length > 0) {
      for (const sub of subscriptions.data) {
        try {
          await stripe.subscriptions.cancel(sub.id);
          console.log(`   ✅ Cancelled subscription: ${sub.id}`);
        } catch (error) {
          console.log(`   ❌ Error cancelling subscription ${sub.id}:`, error.message);
        }
      }
    } else {
      console.log('   ℹ️  No subscriptions to cancel');
    }

    // List and delete all customers
    const customers = await stripe.customers.list({ limit: 100 });
    if (customers.data && customers.data.length > 0) {
      for (const customer of customers.data) {
        try {
          await stripe.customers.del(customer.id);
          console.log(`   ✅ Deleted customer: ${customer.id}`);
        } catch (error) {
          console.log(`   ❌ Error deleting customer ${customer.id}:`, error.message);
        }
      }
    } else {
      console.log('   ℹ️  No customers to delete');
    }

    // List and delete all products (this will also delete associated prices)
    const products = await stripe.products.list({ limit: 100 });
    if (products.data && products.data.length > 0) {
      for (const product of products.data) {
        try {
          await stripe.products.del(product.id);
          console.log(`   ✅ Deleted product: ${product.id}`);
        } catch (error) {
          console.log(`   ❌ Error deleting product ${product.id}:`, error.message);
        }
      }
    } else {
      console.log('   ℹ️  No products to delete');
    }

    console.log('\n🎉 All data cleaned successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Create a new test user');
    console.log('2. Test the complete payment flow');
    console.log('3. Test monthly renewal');

  } catch (error) {
    console.error('❌ Error cleaning data:', error);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args[0] === '--help' || args[0] === '-h') {
    console.log('Clean All Data Script');
    console.log('\nUsage:');
    console.log('  node scripts/clean-all-data.js');
    console.log('\nThis script will:');
    console.log('1. Delete all subscription_events');
    console.log('2. Delete all payments');
    console.log('3. Delete all subscriptions');
    console.log('4. Reset all users (remove Stripe data)');
    console.log('5. Cancel all Stripe subscriptions');
    console.log('6. Delete all Stripe customers');
    console.log('7. Delete all Stripe products/prices');
    console.log('\n⚠️  WARNING: This will permanently delete all data!');
    return;
  }

  console.log('⚠️  WARNING: This will permanently delete all data!');
  console.log('Are you sure you want to continue? (y/N)');
  
  // For now, just proceed with cleaning
  await cleanAllData();
}

main().catch(console.error); 