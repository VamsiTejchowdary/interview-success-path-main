// Test script to simulate subscription event processing
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Simulate a subscription event
const mockSubscriptionEvent = {
  id: 'evt_test_subscription',
  type: 'customer.subscription.created',
  data: {
    object: {
      id: 'sub_test_123',
      customer: 'cus_test_456',
      status: 'active',
      items: {
        data: [{
          price: {
            id: 'price_test_789',
            unit_amount: 1500
          }
        }]
      }
    }
  }
};

// Simulate an invoice event with subscription
const mockInvoiceEvent = {
  id: 'evt_test_invoice',
  type: 'invoice.paid',
  data: {
    object: {
      id: 'in_test_123',
      subscription: 'sub_test_123',
      customer: 'cus_test_456',
      parent: {
        subscription_details: {
          subscription: 'sub_test_123'
        }
      }
    }
  }
};

async function testSubscriptionIdExtraction() {
  console.log('🧪 Testing subscription_id extraction...');
  
  // Test subscription event
  console.log('\n📋 Testing subscription event:');
  let subscriptionId = mockSubscriptionEvent.data.object.id;
  console.log('Subscription ID:', subscriptionId);
  
  // Test invoice event
  console.log('\n📋 Testing invoice event:');
  let invoiceSubscriptionId = mockInvoiceEvent.data.object.subscription || 
                             mockInvoiceEvent.data.object.parent?.subscription_details?.subscription;
  console.log('Invoice Subscription ID:', invoiceSubscriptionId);
  
  // Test database lookup
  console.log('\n📋 Testing database lookup:');
  try {
    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('subscription_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single();
    
    console.log('Database lookup result:', subscriptionData);
  } catch (error) {
    console.log('Database lookup error (expected for test data):', error.message);
  }
  
  console.log('\n✅ Test completed!');
}

testSubscriptionIdExtraction(); 