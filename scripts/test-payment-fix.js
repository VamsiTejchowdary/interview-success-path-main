import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testPaymentRecords() {
  console.log('🔍 Testing payment record creation...\n');

  try {
    // Get all payment records
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching payments:', error.message);
      return;
    }

    console.log(`📊 Total payment records: ${payments.length}\n`);

    // Group payments by invoice to check for duplicates
    const paymentsByInvoice = {};
    payments.forEach(payment => {
      if (!paymentsByInvoice[payment.stripe_invoice_id]) {
        paymentsByInvoice[payment.stripe_invoice_id] = [];
      }
      paymentsByInvoice[payment.stripe_invoice_id].push(payment);
    });

    // Check for duplicate payments
    const duplicates = [];
    const unique = [];
    
    Object.entries(paymentsByInvoice).forEach(([invoiceId, paymentList]) => {
      if (paymentList.length > 1) {
        duplicates.push({ invoiceId, payments: paymentList });
      } else {
        unique.push({ invoiceId, payment: paymentList[0] });
      }
    });

    console.log(`✅ Unique invoices: ${unique.length}`);
    console.log(`❌ Duplicate invoices: ${duplicates.length}\n`);

    if (duplicates.length > 0) {
      console.log('🚨 DUPLICATE PAYMENTS FOUND:');
      duplicates.forEach(({ invoiceId, payments }) => {
        console.log(`   Invoice: ${invoiceId}`);
        console.log(`   Payment IDs: ${payments.map(p => p.payment_id).join(', ')}`);
        console.log(`   Count: ${payments.length}\n`);
      });
    } else {
      console.log('✅ No duplicate payments found!');
    }

    // Show recent payments
    console.log('\n📋 Recent payment records:');
    payments.slice(0, 10).forEach(payment => {
      console.log(`   ID: ${payment.payment_id}`);
      console.log(`   Invoice: ${payment.stripe_invoice_id}`);
      console.log(`   Amount: $${payment.amount}`);
      console.log(`   Status: ${payment.status}`);
      console.log(`   Created: ${payment.created_at}`);
      console.log(`   Subscription ID: ${payment.subscription_id || 'N/A'}`);
      console.log('   ---');
    });

    // Check subscription records
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (subError) {
      console.error('❌ Error fetching subscriptions:', subError.message);
      return;
    }

    console.log(`\n📊 Total subscription records: ${subscriptions.length}`);

    // Show recent subscriptions
    console.log('\n📋 Recent subscription records:');
    subscriptions.slice(0, 5).forEach(sub => {
      console.log(`   ID: ${sub.subscription_id}`);
      console.log(`   Stripe ID: ${sub.stripe_subscription_id}`);
      console.log(`   Status: ${sub.status}`);
      console.log(`   Amount: $${sub.amount}`);
      console.log(`   Created: ${sub.created_at}`);
      console.log('   ---');
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPaymentRecords(); 