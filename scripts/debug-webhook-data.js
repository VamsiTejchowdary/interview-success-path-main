import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load both .env and .env.local files
dotenv.config();
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugWebhookData() {
  console.log('🔍 Debugging Webhook Data...\n');

  try {
    // Check subscription_events table
    console.log('📝 Checking subscription_events table...');
    const { data: events, error: eventsError } = await supabase
      .from('subscription_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (eventsError) {
      console.error('❌ Error fetching events:', eventsError);
    } else {
      console.log(`Found ${events?.length || 0} events:`);
      if (events && events.length > 0) {
        events.forEach((event, index) => {
          console.log(`   ${index + 1}. ${event.event_type} - ${new Date(event.created_at).toLocaleString()}`);
          console.log(`      Stripe Event ID: ${event.stripe_event_id}`);
          console.log(`      Processed: ${event.processed}`);
        });
      }
    }

    console.log('\n📅 Checking subscriptions table...');
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (subsError) {
      console.error('❌ Error fetching subscriptions:', subsError);
    } else {
      console.log(`Found ${subscriptions?.length || 0} subscriptions:`);
      if (subscriptions && subscriptions.length > 0) {
        subscriptions.forEach((sub, index) => {
          console.log(`   ${index + 1}. ${sub.stripe_subscription_id}`);
          console.log(`      Status: ${sub.status}`);
          console.log(`      Period: ${new Date(sub.current_period_start).toLocaleDateString()} - ${new Date(sub.current_period_end).toLocaleDateString()}`);
          console.log(`      Amount: $${sub.amount}`);
          console.log(`      Created: ${new Date(sub.created_at).toLocaleString()}`);
          console.log(`      Updated: ${new Date(sub.updated_at).toLocaleString()}`);
        });
      }
    }

    console.log('\n💰 Checking payments table...');
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (paymentsError) {
      console.error('❌ Error fetching payments:', paymentsError);
    } else {
      console.log(`Found ${payments?.length || 0} payments:`);
      if (payments && payments.length > 0) {
        payments.forEach((payment, index) => {
          console.log(`   ${index + 1}. $${payment.amount} - ${payment.status}`);
          console.log(`      Stripe Invoice: ${payment.stripe_invoice_id}`);
          console.log(`      Created: ${new Date(payment.created_at).toLocaleString()}`);
        });
      }
    }

    // Check specific user data
    console.log('\n👤 Checking Tech User specifically...');
    const { data: techUser, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        subscriptions (*),
        payments (*)
      `)
      .eq('email', 'tech2@truechoicepack.com')
      .single();

    if (userError) {
      console.error('❌ Error fetching Tech User:', userError);
    } else if (techUser) {
      console.log(`User: ${techUser.first_name} ${techUser.last_name}`);
      console.log(`Email: ${techUser.email}`);
      console.log(`Status: ${techUser.status}`);
      console.log(`Is Paid: ${techUser.is_paid}`);
      console.log(`Stripe Customer ID: ${techUser.stripe_customer_id}`);
      console.log(`Next Billing: ${techUser.next_billing_at ? new Date(techUser.next_billing_at).toLocaleString() : 'Not set'}`);
      console.log(`Subscriptions: ${techUser.subscriptions?.length || 0}`);
      console.log(`Payments: ${techUser.payments?.length || 0}`);
    }

  } catch (error) {
    console.error('❌ Error debugging webhook data:', error);
  }
}

async function main() {
  await debugWebhookData();
}

main().catch(console.error); 