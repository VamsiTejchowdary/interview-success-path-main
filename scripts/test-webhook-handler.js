import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load both .env and .env.local files
dotenv.config();
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testWebhookHandler() {
  console.log('🧪 Testing Webhook Handler...\n');

  try {
    // Get the subscription data
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', 'sub_1RhzDtGfLF2DUqQKR9413gCK')
      .single();

    if (!subscription) {
      console.log('❌ Subscription not found');
      return;
    }

    console.log('📋 Current subscription data:');
    console.log(`   ID: ${subscription.stripe_subscription_id}`);
    console.log(`   Customer: ${subscription.stripe_customer_id}`);
    console.log(`   Period: ${new Date(subscription.current_period_start).toISOString()} - ${new Date(subscription.current_period_end).toISOString()}`);

    // Create a test subscription.updated event
    const testEvent = {
      id: 'evt_test_subscription_updated',
      object: 'event',
      api_version: '2023-10-16',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: subscription.stripe_subscription_id,
          object: 'subscription',
          customer: subscription.stripe_customer_id,
          status: 'active',
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
          created: Math.floor(new Date(subscription.created_at).getTime() / 1000),
          items: {
            data: [{
              id: 'si_test',
              price: {
                id: subscription.stripe_price_id,
                unit_amount: subscription.amount * 100,
                currency: subscription.currency.toLowerCase()
              }
            }]
          }
        }
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: 'req_test',
        idempotency_key: null
      },
      type: 'customer.subscription.updated'
    };

    console.log('\n🔔 Testing subscription.updated event...');
    console.log('Event data:', JSON.stringify(testEvent.data.object, null, 2));

    // Try to process this event manually
    await processSubscriptionUpdated(testEvent.data.object);

    console.log('\n✅ Test completed. Check database for updates.');

  } catch (error) {
    console.error('❌ Error testing webhook handler:', error);
  }
}

async function processSubscriptionUpdated(subscription) {
  try {
    console.log('Processing subscription update...');
    
    // Update subscription
    const { error: subError } = await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    if (subError) {
      console.log('❌ Error updating subscription:', subError);
    } else {
      console.log('✅ Subscription updated');
    }

    // Update user
    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (subscriptionData) {
      const { error: userError } = await supabase
        .from('users')
        .update({
          next_billing_at: new Date(subscription.current_period_end * 1000).toISOString()
        })
        .eq('user_id', subscriptionData.user_id);

      if (userError) {
        console.log('❌ Error updating user:', userError);
      } else {
        console.log('✅ User updated');
      }
    }

    // Log event
    const { error: eventError } = await supabase
      .from('subscription_events')
      .insert({
        stripe_event_id: 'evt_test_subscription_updated',
        event_type: 'customer.subscription.updated',
        event_data: subscription,
        processed: true
      });

    if (eventError) {
      console.log('❌ Error logging event:', eventError);
    } else {
      console.log('✅ Event logged');
    }

  } catch (error) {
    console.error('❌ Error in processSubscriptionUpdated:', error);
  }
}

async function main() {
  await testWebhookHandler();
}

main().catch(console.error); 