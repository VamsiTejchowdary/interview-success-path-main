import Stripe from 'stripe';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

async function listAllCustomers() {
  console.log('🔍 Listing all Stripe customers...\n');
  
  try {
    let allCustomers = [];
    let hasMore = true;
    let startingAfter = null;
    
    while (hasMore) {
      const params = {
        limit: 100,
        ...(startingAfter && { starting_after: startingAfter })
      };
      
      const customers = await stripe.customers.list(params);
      allCustomers = allCustomers.concat(customers.data);
      
      console.log(`📋 Found ${customers.data.length} customers in this batch`);
      
      if (customers.has_more) {
        startingAfter = customers.data[customers.data.length - 1].id;
      } else {
        hasMore = false;
      }
    }
    
    console.log(`\n📊 Total customers found: ${allCustomers.length}\n`);
    
    if (allCustomers.length > 0) {
      console.log('📋 Customer details:');
      allCustomers.forEach((customer, index) => {
        console.log(`${index + 1}. ID: ${customer.id}`);
        console.log(`   Email: ${customer.email || 'No email'}`);
        console.log(`   Name: ${customer.name || 'No name'}`);
        console.log(`   Created: ${new Date(customer.created * 1000).toISOString()}`);
        console.log(`   Subscriptions: ${customer.subscriptions?.total_count || 0}`);
        console.log(`   Default payment method: ${customer.invoice_settings?.default_payment_method || 'None'}`);
        console.log('');
      });
    } else {
      console.log('✅ No customers found in Stripe account');
    }
    
    return allCustomers;
  } catch (error) {
    console.error('❌ Error listing customers:', error.message);
    throw error;
  }
}

listAllCustomers(); 