import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkPayments() {
  console.log('🔍 Checking payments table for duplicates...\n');
  
  try {
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching payments:', error);
      return;
    }
    
    console.log(`📊 Found ${payments.length} payment records:\n`);
    
    // Group by stripe_invoice_id to find duplicates
    const groupedByInvoice = {};
    payments.forEach(payment => {
      if (payment.stripe_invoice_id) {
        if (!groupedByInvoice[payment.stripe_invoice_id]) {
          groupedByInvoice[payment.stripe_invoice_id] = [];
        }
        groupedByInvoice[payment.stripe_invoice_id].push(payment);
      }
    });
    
    // Check for duplicates
    let hasDuplicates = false;
    Object.keys(groupedByInvoice).forEach(invoiceId => {
      if (groupedByInvoice[invoiceId].length > 1) {
        hasDuplicates = true;
        console.log(`⚠️  DUPLICATE FOUND for invoice ${invoiceId}:`);
        groupedByInvoice[invoiceId].forEach((payment, index) => {
          console.log(`   ${index + 1}. Payment ID: ${payment.payment_id}`);
          console.log(`      Amount: $${payment.amount}`);
          console.log(`      Status: ${payment.status}`);
          console.log(`      Created: ${payment.created_at}`);
          console.log(`      User ID: ${payment.user_id}`);
          console.log(`      Subscription ID: ${payment.subscription_id || 'NULL'}`);
          console.log('');
        });
      }
    });
    
    if (!hasDuplicates) {
      console.log('✅ No duplicate payments found by invoice ID');
    }
    
    // Show all payments for reference
    console.log('📋 All payment records:');
    payments.forEach((payment, index) => {
      console.log(`${index + 1}. Payment ID: ${payment.payment_id}`);
      console.log(`   Invoice ID: ${payment.stripe_invoice_id}`);
      console.log(`   Amount: $${payment.amount}`);
      console.log(`   Status: ${payment.status}`);
      console.log(`   User ID: ${payment.user_id}`);
      console.log(`   Subscription ID: ${payment.subscription_id || 'NULL'}`);
      console.log(`   Created: ${payment.created_at}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkPayments(); 