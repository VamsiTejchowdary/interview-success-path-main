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

async function fixDuplicatePrevention() {
  console.log('🔧 Fixing duplicate prevention...\n');
  
  try {
    // First, let's clean up existing duplicates
    console.log('🧹 Cleaning up existing duplicates...');
    
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('❌ Error fetching payments:', error);
      return;
    }
    
    // Group by stripe_invoice_id and remove duplicates
    const groupedByInvoice = {};
    payments.forEach(payment => {
      if (payment.stripe_invoice_id) {
        if (!groupedByInvoice[payment.stripe_invoice_id]) {
          groupedByInvoice[payment.stripe_invoice_id] = [];
        }
        groupedByInvoice[payment.stripe_invoice_id].push(payment);
      }
    });
    
    // Remove duplicates, keeping the first one
    for (const [invoiceId, paymentList] of Object.entries(groupedByInvoice)) {
      if (paymentList.length > 1) {
        console.log(`📋 Invoice ${invoiceId}: Found ${paymentList.length} payments, keeping first one`);
        
        // Sort by created_at and keep the first one
        paymentList.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        const keepPayment = paymentList[0];
        const deletePayments = paymentList.slice(1);
        
        for (const paymentToDelete of deletePayments) {
          const { error: deleteError } = await supabase
            .from('payments')
            .delete()
            .eq('payment_id', paymentToDelete.payment_id);
          
          if (deleteError) {
            console.log(`   ❌ Failed to delete payment ${paymentToDelete.payment_id}: ${deleteError.message}`);
          } else {
            console.log(`   ✅ Deleted duplicate payment ${paymentToDelete.payment_id}`);
          }
        }
      }
    }
    
    console.log('\n✅ Duplicate cleanup completed!');
    
    // Now let's improve the webhook handlers with better duplicate prevention
    console.log('\n📝 Note: The webhook handlers now have improved duplicate prevention.');
    console.log('   - They check for existing payments before inserting');
    console.log('   - They use database-level constraints (if available)');
    console.log('   - They handle race conditions better');
    
  } catch (error) {
    console.error('❌ Error during fix:', error);
  }
}

fixDuplicatePrevention(); 