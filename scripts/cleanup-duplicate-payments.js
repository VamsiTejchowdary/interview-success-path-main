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

async function cleanupDuplicatePayments() {
  console.log('🧹 Cleaning up duplicate payment records...\n');
  
  try {
    // Get all payments
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('❌ Error fetching payments:', error);
      return;
    }
    
    console.log(`📊 Found ${payments.length} total payment records`);
    
    // Group by stripe_invoice_id
    const groupedByInvoice = {};
    payments.forEach(payment => {
      if (payment.stripe_invoice_id) {
        if (!groupedByInvoice[payment.stripe_invoice_id]) {
          groupedByInvoice[payment.stripe_invoice_id] = [];
        }
        groupedByInvoice[payment.stripe_invoice_id].push(payment);
      }
    });
    
    // Find duplicates
    const duplicates = [];
    Object.keys(groupedByInvoice).forEach(invoiceId => {
      if (groupedByInvoice[invoiceId].length > 1) {
        duplicates.push({
          invoiceId,
          payments: groupedByInvoice[invoiceId]
        });
      }
    });
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicate payments found');
      return;
    }
    
    console.log(`⚠️  Found ${duplicates.length} invoice(s) with duplicate payments:\n`);
    
    // Process each duplicate
    for (const duplicate of duplicates) {
      console.log(`📋 Invoice: ${duplicate.invoiceId}`);
      console.log(`   Total payments: ${duplicate.payments.length}`);
      
      // Sort by created_at to keep the first one
      duplicate.payments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      
      const keepPayment = duplicate.payments[0];
      const deletePayments = duplicate.payments.slice(1);
      
      console.log(`   Keeping: Payment ID ${keepPayment.payment_id} (created: ${keepPayment.created_at})`);
      console.log(`   Deleting: ${deletePayments.length} duplicate(s)`);
      
      // Delete duplicate payments
      for (const paymentToDelete of deletePayments) {
        const { error: deleteError } = await supabase
          .from('payments')
          .delete()
          .eq('payment_id', paymentToDelete.payment_id);
        
        if (deleteError) {
          console.log(`   ❌ Failed to delete payment ${paymentToDelete.payment_id}: ${deleteError.message}`);
        } else {
          console.log(`   ✅ Deleted payment ${paymentToDelete.payment_id}`);
        }
      }
      console.log('');
    }
    
    console.log('✅ Duplicate cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

cleanupDuplicatePayments(); 