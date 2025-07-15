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

async function checkSubscriptionEvents() {
  console.log('🔍 Checking subscription events...\n');
  
  try {
    const { data: events, error } = await supabase
      .from('subscription_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('❌ Error fetching events:', error);
      return;
    }
    
    console.log(`📊 Found ${events.length} recent events:\n`);
    
    events.forEach((event, index) => {
      console.log(`${index + 1}. Event ID: ${event.stripe_event_id}`);
      console.log(`   Type: ${event.event_type}`);
      console.log(`   Subscription ID: ${event.subscription_id || 'NULL'}`);
      console.log(`   Created: ${event.created_at}`);
      console.log(`   Processed: ${event.processed}`);
      console.log('');
    });
    
    // Count events with and without subscription_id
    const withSubscriptionId = events.filter(e => e.subscription_id !== null).length;
    const withoutSubscriptionId = events.filter(e => e.subscription_id === null).length;
    
    console.log(`📈 Summary:`);
    console.log(`   Events with subscription_id: ${withSubscriptionId}`);
    console.log(`   Events without subscription_id: ${withoutSubscriptionId}`);
    console.log(`   Total events: ${events.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkSubscriptionEvents(); 