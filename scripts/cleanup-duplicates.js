import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function cleanupDuplicatePayments() {
  console.log('🧹 Cleaning up duplicate payment records...\n');

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

    console.log(`📊 Total payment records: ${payments.length}`);

    // Group payments by invoice
    const paymentsByInvoice = {};
    payments.forEach(payment => {
      if (!paymentsByInvoice[payment.stripe_invoice_id]) {
        paymentsByInvoice[payment.stripe_invoice_id] = [];
      }
      paymentsByInvoice[payment.stripe_invoice_id].push(payment);
    });

    // Find duplicates
    const duplicates = [];
    Object.entries(paymentsByInvoice).forEach(([invoiceId, paymentList]) => {
      if (paymentList.length > 1) {
        duplicates.push({ invoiceId, payments: paymentList });
      }
    });

    console.log(`❌ Found ${duplicates.length} invoices with duplicate payments\n`);

    if (duplicates.length === 0) {
      console.log('✅ No duplicates found!');
      return;
    }

    // Clean up duplicates - keep the most recent payment for each invoice
    for (const { invoiceId, payments } of duplicates) {
      console.log(`🧹 Cleaning up invoice: ${invoiceId}`);
      console.log(`   Found ${payments.length} payments`);
      
      // Sort by created_at descending (most recent first)
      const sortedPayments = payments.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      
      // Keep the first (most recent) payment
      const paymentToKeep = sortedPayments[0];
      const paymentsToDelete = sortedPayments.slice(1);
      
      console.log(`   Keeping payment ID: ${paymentToKeep.payment_id} (created: ${paymentToKeep.created_at})`);
      console.log(`   Deleting ${paymentsToDelete.length} duplicate payments`);
      
      // Delete duplicate payments
      for (const payment of paymentsToDelete) {
        const { error: deleteError } = await supabase
          .from('payments')
          .delete()
          .eq('payment_id', payment.payment_id);
        
        if (deleteError) {
          console.error(`   ❌ Error deleting payment ${payment.payment_id}:`, deleteError.message);
        } else {
          console.log(`   ✅ Deleted payment ${payment.payment_id}`);
        }
      }
      
      console.log('   ---');
    }

    console.log('\n✅ Duplicate cleanup completed!');

    // Verify cleanup
    const { data: remainingPayments, error: verifyError } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (verifyError) {
      console.error('❌ Error verifying cleanup:', verifyError.message);
      return;
    }

    console.log(`📊 Remaining payment records: ${remainingPayments.length}`);

    // Check for any remaining duplicates
    const remainingByInvoice = {};
    remainingPayments.forEach(payment => {
      if (!remainingByInvoice[payment.stripe_invoice_id]) {
        remainingByInvoice[payment.stripe_invoice_id] = [];
      }
      remainingByInvoice[payment.stripe_invoice_id].push(payment);
    });

    const remainingDuplicates = Object.entries(remainingByInvoice)
      .filter(([invoiceId, payments]) => payments.length > 1);

    if (remainingDuplicates.length > 0) {
      console.log('⚠️ Still found duplicates after cleanup:');
      remainingDuplicates.forEach(([invoiceId, payments]) => {
        console.log(`   Invoice: ${invoiceId} - ${payments.length} payments`);
      });
    } else {
      console.log('✅ No remaining duplicates found!');
    }

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

cleanupDuplicatePayments(); 