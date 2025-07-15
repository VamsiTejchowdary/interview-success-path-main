import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testPaymentWebhook() {
  console.log('🧪 Testing payment webhook functionality...\n');

  try {
    // Get a real subscription from the database
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id, user_id')
      .limit(1);

    if (subError || !subscriptions || subscriptions.length === 0) {
      console.log('❌ No subscriptions found in database');
      return;
    }

    const subscription = subscriptions[0];
    console.log('📋 Found subscription:', subscription.stripe_subscription_id);

    // Get invoices for this subscription
    const invoices = await stripe.invoices.list({
      subscription: subscription.stripe_subscription_id,
      limit: 1
    });

    if (invoices.data.length === 0) {
      console.log('❌ No invoices found for subscription');
      return;
    }

    const invoice = invoices.data[0];
    console.log('📋 Found invoice:', invoice.id);
    console.log('📋 Invoice status:', invoice.status);
    console.log('📋 Invoice amount:', invoice.amount_paid);

    // Test the webhook endpoint
    const webhookUrl = 'https://interview-success-path-2x5gzd0nq-vamsi-tej-chowdarys-projects.vercel.app/api/stripe-webhook';
    
    // Create a test event
    const testEvent = {
      id: `evt_test_${Date.now()}`,
      object: 'event',
      api_version: '2023-10-16',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: invoice
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: `req_test_${Date.now()}`,
        idempotency_key: null
      },
      type: 'invoice.payment_succeeded'
    };

    console.log('📨 Sending test webhook event...');
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': 'test_signature'
      },
      body: JSON.stringify(testEvent)
    });

    console.log('📨 Response status:', response.status);
    console.log('📨 Response text:', await response.text());

    // Check if payment was created
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('stripe_invoice_id', invoice.id);

    if (paymentsError) {
      console.log('❌ Error checking payments:', paymentsError.message);
    } else {
      console.log('📊 Payments found:', payments.length);
      if (payments.length > 0) {
        console.log('✅ Payment created successfully!');
        console.log('💰 Payment details:', payments[0]);
      } else {
        console.log('❌ No payment was created');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPaymentWebhook(); 