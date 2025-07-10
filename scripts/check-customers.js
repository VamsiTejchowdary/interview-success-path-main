import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-06-30.basil' });

async function checkCustomers() {
  console.log('🔍 Checking customers in database...');
  
  // Get all users with stripe_customer_id
  const { data: users, error } = await supabase
    .from('users')
    .select('user_id, email, stripe_customer_id, is_paid')
    .not('stripe_customer_id', 'is', null);
  
  if (error) {
    console.error('❌ Error fetching users:', error);
    return;
  }
  
  console.log('📋 Users with stripe_customer_id:', users);
  
  // Check each customer in Stripe
  for (const user of users) {
    console.log(`\n🔍 Checking customer: ${user.stripe_customer_id} (${user.email})`);
    
    try {
      const customer = await stripe.customers.retrieve(user.stripe_customer_id);
      console.log('✅ Customer exists in Stripe:', {
        id: customer.id,
        email: customer.email,
        created: customer.created
      });
    } catch (error) {
      console.log('❌ Customer not found in Stripe:', error.message);
    }
  }
  
  // List all Stripe customers
  console.log('\n📋 All Stripe customers:');
  try {
    const customers = await stripe.customers.list({ limit: 20 });
    customers.data.forEach(customer => {
      console.log(`- ${customer.id}: ${customer.email} (created: ${new Date(customer.created * 1000).toISOString()})`);
    });
  } catch (error) {
    console.error('❌ Error listing Stripe customers:', error);
  }
}

checkCustomers().catch(console.error); 