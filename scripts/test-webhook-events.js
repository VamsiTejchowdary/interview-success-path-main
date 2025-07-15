import fetch from 'node-fetch';

const LOCAL_SERVER_URL = 'http://localhost:4242/api/stripe-webhook';

// Test webhook events
const testEvents = {
  'customer.subscription.created': {
    id: 'evt_test_subscription_created',
    type: 'customer.subscription.created',
    data: {
      object: {
        id: 'sub_test_123',
        customer: 'cus_test_123',
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
        items: {
          data: [{
            price: {
              id: 'price_test_123',
              unit_amount: 1500
            }
          }]
        },
        currency: 'usd'
      }
    }
  },
  
  'invoice.paid': {
    id: 'evt_test_invoice_paid',
    type: 'invoice.paid',
    data: {
      object: {
        id: 'in_test_123',
        customer: 'cus_test_123',
        subscription: 'sub_test_123',
        payment_intent: 'pi_test_123',
        amount_paid: 1500,
        currency: 'usd',
        status: 'paid',
        billing_reason: 'subscription_cycle',
        paid_at: Math.floor(Date.now() / 1000),
        lines: {
          data: [{
            period: {
              start: Math.floor(Date.now() / 1000),
              end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
            }
          }]
        }
      }
    }
  },
  
  'payment_intent.succeeded': {
    id: 'evt_test_payment_succeeded',
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: 'pi_test_123',
        customer: 'cus_test_123',
        amount: 1500,
        currency: 'usd',
        status: 'succeeded',
        invoice: 'in_test_123'
      }
    }
  }
};

async function sendTestWebhook(eventType) {
  const event = testEvents[eventType];
  
  if (!event) {
    console.log('❌ Unknown event type. Available types:');
    Object.keys(testEvents).forEach(type => console.log(`   - ${type}`));
    return;
  }
  
  try {
    console.log(`📨 Sending ${eventType} event to local server...`);
    
    const response = await fetch(LOCAL_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': 'test_signature' // This will be ignored in test mode
      },
      body: JSON.stringify(event)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Webhook event sent successfully!');
      console.log('📋 Response:', result);
    } else {
      console.log('❌ Failed to send webhook event');
      console.log('📋 Response:', result);
    }
    
  } catch (error) {
    console.error('❌ Error sending webhook event:', error.message);
  }
}

// Get event type from command line argument
const eventType = process.argv[2];

if (!eventType) {
  console.log('🔧 Usage: node scripts/test-webhook-events.js <event_type>');
  console.log('\n📋 Available event types:');
  Object.keys(testEvents).forEach(type => console.log(`   - ${type}`));
  console.log('\n💡 Example: node scripts/test-webhook-events.js invoice.paid');
} else {
  sendTestWebhook(eventType);
} 