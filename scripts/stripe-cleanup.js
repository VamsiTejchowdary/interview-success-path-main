import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local' });

import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('❌ STRIPE_SECRET_KEY not set in environment variables.');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

async function deleteAllTestCustomersAndSubscriptions() {
  try {
    console.log('🔍 Fetching all customers...');
    let hasMore = true;
    let startingAfter = undefined;
    let totalDeleted = 0;
    while (hasMore) {
      const customers = await stripe.customers.list({ limit: 100, starting_after: startingAfter });
      for (const customer of customers.data) {
        // Delete all subscriptions for this customer
        const subs = await stripe.subscriptions.list({ customer: customer.id, limit: 100 });
        for (const sub of subs.data) {
          await stripe.subscriptions.del(sub.id);
          console.log(`🗑️  Deleted subscription: ${sub.id} for customer: ${customer.id}`);
        }
        // Delete the customer
        await stripe.customers.del(customer.id);
        console.log(`🗑️  Deleted customer: ${customer.id}`);
        totalDeleted++;
      }
      hasMore = customers.has_more;
      if (hasMore) {
        startingAfter = customers.data[customers.data.length - 1].id;
      }
    }
    console.log(`🎉 Deleted ${totalDeleted} customers and all their subscriptions from Stripe (test mode).`);
  } catch (error) {
    console.error('❌ Error deleting customers/subscriptions:', error);
  }
}

deleteAllTestCustomersAndSubscriptions(); 