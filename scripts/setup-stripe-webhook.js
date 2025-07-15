import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load both .env and .env.local files
dotenv.config();
dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

async function setupWebhook() {
  console.log('🔧 Setting up Stripe webhook endpoint...\n');

  try {
    // Check if webhook already exists
    const { data: existingWebhooks } = await stripe.webhookEndpoints.list();
    
    const webhookUrl = process.env.NODE_ENV === 'production'
      ? 'https://your-domain.com/api/stripe-webhook' // Replace with your actual domain
      : 'http://localhost:4242/api/stripe-webhook';

    const existingWebhook = existingWebhooks.find(webhook => 
      webhook.url === webhookUrl
    );

    if (existingWebhook) {
      console.log('✅ Webhook endpoint already exists:');
      console.log(`   URL: ${existingWebhook.url}`);
      console.log(`   Status: ${existingWebhook.status}`);
      console.log(`   Secret: ${existingWebhook.secret ? 'Set' : 'Not set'}`);
      
      // Check if it has the required events
      const requiredEvents = [
        'customer.subscription.created',
        'customer.subscription.updated', 
        'customer.subscription.deleted',
        'invoice.payment_succeeded',
        'invoice.payment_failed',
        'invoice.upcoming'
      ];

      const missingEvents = requiredEvents.filter(event => 
        !existingWebhook.enabled_events.includes(event)
      );

      if (missingEvents.length > 0) {
        console.log('\n⚠️  Missing required events:');
        missingEvents.forEach(event => console.log(`   - ${event}`));
        
        console.log('\nTo add missing events, update the webhook in Stripe Dashboard:');
        console.log('https://dashboard.stripe.com/webhooks');
      } else {
        console.log('\n✅ All required events are configured');
      }

      return existingWebhook;
    }

    // Create new webhook endpoint
    console.log('📝 Creating new webhook endpoint...');
    
    const webhook = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: [
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.payment_succeeded',
        'invoice.payment_failed',
        'invoice.upcoming'
      ],
      description: 'Interview Success Path - Subscription Management'
    });

    console.log('✅ Webhook endpoint created successfully!');
    console.log(`   URL: ${webhook.url}`);
    console.log(`   ID: ${webhook.id}`);
    console.log(`   Status: ${webhook.status}`);
    
    console.log('\n🔑 IMPORTANT: Add this webhook secret to your .env file:');
    console.log(`STRIPE_WEBHOOK_SECRET=${webhook.secret}`);
    
    console.log('\n📋 Next steps:');
    console.log('1. Add the webhook secret to your .env file');
    console.log('2. Deploy your webhook handler to the endpoint URL');
    console.log('3. Test the webhook using: node scripts/test-webhooks.js lifecycle');

    return webhook;

  } catch (error) {
    console.error('❌ Error setting up webhook:', error.message);
    
    if (error.code === 'parameter_invalid_url') {
      console.log('\n💡 Tip: Make sure your webhook URL is accessible and uses HTTPS in production');
    }
    
    throw error;
  }
}

async function listWebhooks() {
  console.log('📋 Listing all webhook endpoints...\n');

  try {
    const { data: webhooks } = await stripe.webhookEndpoints.list();
    
    if (webhooks.length === 0) {
      console.log('No webhook endpoints found');
      return;
    }

    webhooks.forEach((webhook, index) => {
      console.log(`${index + 1}. ${webhook.description || 'No description'}`);
      console.log(`   URL: ${webhook.url}`);
      console.log(`   Status: ${webhook.status}`);
      console.log(`   Events: ${webhook.enabled_events.length} events`);
      console.log(`   Created: ${new Date(webhook.created * 1000).toLocaleDateString()}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error listing webhooks:', error.message);
  }
}

async function deleteWebhook(webhookId) {
  console.log(`🗑️  Deleting webhook endpoint: ${webhookId}\n`);

  try {
    await stripe.webhookEndpoints.del(webhookId);
    console.log('✅ Webhook endpoint deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting webhook:', error.message);
  }
}

async function testWebhookConnection(webhookId) {
  console.log(`🧪 Testing webhook connection: ${webhookId}\n`);

  try {
    // Send a test event
    const testEvent = await stripe.webhookEndpoints.test(
      webhookId,
      {
        'customer.subscription.created': {
          id: 'sub_test_connection',
          object: 'subscription',
          customer: 'cus_test_connection',
          status: 'active',
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000)
        }
      }
    );

    console.log('✅ Test event sent successfully');
    console.log(`   Event ID: ${testEvent.id}`);
    console.log('\n📋 Check your webhook handler logs to see if the event was received');

  } catch (error) {
    console.error('❌ Error testing webhook:', error.message);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  switch (args[0]) {
    case 'create':
      await setupWebhook();
      break;
    case 'list':
      await listWebhooks();
      break;
    case 'delete':
      if (!args[1]) {
        console.log('Usage: node setup-stripe-webhook.js delete <webhook_id>');
        return;
      }
      await deleteWebhook(args[1]);
      break;
    case 'test':
      if (!args[1]) {
        console.log('Usage: node setup-stripe-webhook.js test <webhook_id>');
        return;
      }
      await testWebhookConnection(args[1]);
      break;
    default:
      console.log('Stripe Webhook Setup Tool');
      console.log('\nUsage:');
      console.log('  node setup-stripe-webhook.js create    - Create new webhook endpoint');
      console.log('  node setup-stripe-webhook.js list      - List all webhook endpoints');
      console.log('  node setup-stripe-webhook.js delete <id> - Delete webhook endpoint');
      console.log('  node setup-stripe-webhook.js test <id>   - Test webhook connection');
      console.log('\nEnvironment:');
      console.log('  Make sure STRIPE_SECRET_KEY is set in your .env file');
      console.log('  Set NODE_ENV=production for production webhook URL');
  }
}

main().catch(console.error); 