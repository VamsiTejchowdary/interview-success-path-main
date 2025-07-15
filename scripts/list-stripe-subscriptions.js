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

async function listAllSubscriptions() {
  console.log('🔍 Listing all Stripe subscriptions...\n');
  
  try {
    let allSubscriptions = [];
    let hasMore = true;
    let startingAfter = null;
    
    while (hasMore) {
      const params = {
        limit: 100,
        ...(startingAfter && { starting_after: startingAfter })
      };
      
      const subscriptions = await stripe.subscriptions.list(params);
      allSubscriptions = allSubscriptions.concat(subscriptions.data);
      
      console.log(`📋 Found ${subscriptions.data.length} subscriptions in this batch`);
      
      if (subscriptions.has_more) {
        startingAfter = subscriptions.data[subscriptions.data.length - 1].id;
      } else {
        hasMore = false;
      }
    }
    
    console.log(`\n📊 Total subscriptions found: ${allSubscriptions.length}\n`);
    
    if (allSubscriptions.length > 0) {
      console.log('📋 Subscription details:');
      allSubscriptions.forEach((sub, index) => {
        console.log(`${index + 1}. ID: ${sub.id}`);
        console.log(`   Customer: ${sub.customer}`);
        console.log(`   Status: ${sub.status}`);
        console.log(`   Created: ${new Date(sub.created * 1000).toISOString()}`);
        console.log(`   Current period: ${new Date(sub.current_period_start * 1000).toISOString()} to ${new Date(sub.current_period_end * 1000).toISOString()}`);
        console.log('');
      });
    } else {
      console.log('✅ No subscriptions found in Stripe account');
    }
    
    return allSubscriptions;
  } catch (error) {
    console.error('❌ Error listing subscriptions:', error.message);
    throw error;
  }
}

listAllSubscriptions(); 