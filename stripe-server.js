import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-06-30.basil' });

// CORS configuration for production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173', // Add preview server port
  'http://localhost:8080',
  'https://app.jobsmartly.com', // Replace with your actual domain
  process.env.NEXT_PUBLIC_BASE_URL
].filter(Boolean);

app.use(cors({ 
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

// Configure express.json() to skip the webhook endpoint
app.use((req, res, next) => {
  if (req.path === '/api/stripe-webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Replace with your actual product/price IDs if you create them in the dashboard
const PRODUCT_NAME = 'Premium Plan';
const CURRENCY = 'usd';

// Create a price object on the fly (for demo; in production, use a fixed price ID)
async function getOrCreatePrice(amount = 1500) { // Default to $15.00
  // In production, create the product/price in Stripe dashboard and use the price ID
  const product = await stripe.products.create({ name: PRODUCT_NAME });
  const price = await stripe.prices.create({
    unit_amount: amount,
    currency: CURRENCY,
    recurring: { interval: 'month' },
    product: product.id,
  });
  return price.id;
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { userEmail } = req.body;
    
    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required' });
    }

    // Get user's subscription fee from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('subscription_fee')
      .eq('email', userEmail)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userAmount = userData.subscription_fee * 100; // Convert to cents

    // Create a price object with user's specific amount
    const product = await stripe.products.create({ name: PRODUCT_NAME });
    const price = await stripe.prices.create({
      unit_amount: userAmount,
      currency: CURRENCY,
      recurring: { interval: 'month' },
      product: product.id,
    });

    console.log('Creating checkout session for amount:', userAmount);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4173'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4173'}/cancel`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create Stripe Checkout session' });
  }
});

// Get payment details after successful payment
app.get('/payment-success', async (req, res) => {
  try {
    const { session_id } = req.query;
    
    if (!session_id) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status === 'paid') {
      res.json({
        session_id: session.id,
        customer: session.customer,
        subscription: session.subscription,
        amount_total: session.amount_total,
        currency: session.currency,
        payment_status: session.payment_status,
        status: session.status
      });
    } else {
      res.status(400).json({ error: 'Payment not completed' });
    }
  } catch (err) {
    console.error('Payment success error:', err);
    res.status(500).json({ error: 'Failed to retrieve payment details' });
  }
});

// Stripe Webhook Handler
app.post('/api/stripe-webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log('✅ Webhook signature verified successfully');
    console.log('📨 Received event type:', event.type);
    console.log('📋 Event data:', JSON.stringify(event.data.object, null, 2));
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    console.log('🔄 Processing event type:', event.type);
    switch (event.type) {
      case 'customer.subscription.created':
        console.log('📅 Handling subscription.created...');
        await handleSubscriptionCreated(event.data.object);
        break;
      case 'customer.subscription.updated':
        console.log('📅 Handling subscription.updated...');
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        console.log('📅 Handling subscription.deleted...');
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        console.log('💰 Handling invoice.payment_succeeded...');
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        console.log('💰 Handling invoice.payment_failed...');
        await handleInvoicePaymentFailed(event.data.object);
        break;
      case 'invoice.upcoming':
        console.log('💰 Handling invoice.upcoming...');
        await handleInvoiceUpcoming(event.data.object);
        break;
      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }
    // Log the event for tracking
    await supabase
      .from('subscription_events')
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        event_data: event.data.object,
        processed: true
      });
    res.status(200).send('Webhook processed');
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).send('Webhook processing failed');
  }
});

// --- Webhook Event Handlers ---
async function handleSubscriptionCreated(subscription) {
  try {
    // First, try to find user by stripe_customer_id
    let { data: userData } = await supabase
      .from('users')
      .select('user_id, email, subscription_fee')
      .eq('stripe_customer_id', subscription.customer)
      .single();
    
    // If not found by stripe_customer_id, try to find by email from customer object
    if (!userData && subscription.customer) {
      const customer = await stripe.customers.retrieve(subscription.customer);
      if (customer.email) {
        const { data: userByEmail } = await supabase
          .from('users')
          .select('user_id, email, subscription_fee')
          .eq('email', customer.email)
          .single();
        userData = userByEmail;
        
        // Update user with stripe_customer_id if found
        if (userData) {
          await supabase
            .from('users')
            .update({ stripe_customer_id: subscription.customer })
            .eq('user_id', userData.user_id);
        }
      }
    }
    
    if (!userData) {
      console.log('No user found for subscription:', subscription.id);
      return;
    }
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('subscription_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();
    if (existingSubscription) {
      // Safely handle timestamps
      const currentPeriodStart = subscription.current_period_start ? 
        new Date(subscription.current_period_start * 1000).toISOString() : null;
      const currentPeriodEnd = subscription.current_period_end ? 
        new Date(subscription.current_period_end * 1000).toISOString() : null;
      
      await supabase
        .from('subscriptions')
        .update({
          stripe_customer_id: subscription.customer,
          stripe_price_id: subscription.items.data[0]?.price.id,
          amount: subscription.items.data[0]?.price.unit_amount / 100,
          status: subscription.status,
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString()
        })
        .eq('subscription_id', existingSubscription.subscription_id);
    } else {
      // Safely handle timestamps
      const currentPeriodStart = subscription.current_period_start ? 
        new Date(subscription.current_period_start * 1000).toISOString() : null;
      const currentPeriodEnd = subscription.current_period_end ? 
        new Date(subscription.current_period_end * 1000).toISOString() : null;
      
      await supabase
        .from('subscriptions')
        .insert({
          user_id: userData.user_id,
          stripe_customer_id: subscription.customer,
          stripe_subscription_id: subscription.id,
          stripe_price_id: subscription.items.data[0]?.price.id,
          plan_name: 'Premium Plan',
          amount: subscription.items.data[0]?.price.unit_amount / 100,
          currency: subscription.currency.toUpperCase(),
          interval: subscription.items.data[0]?.price.recurring.interval,
          status: subscription.status,
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
          cancel_at_period_end: subscription.cancel_at_period_end
        });
    }
    const nextBillingAt = subscription.current_period_end ? 
      new Date(subscription.current_period_end * 1000).toISOString() : null;
    
    await supabase
      .from('users')
      .update({
        is_paid: true,
        status: 'approved',
        next_billing_at: nextBillingAt
      })
      .eq('user_id', userData.user_id);
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription) {
  try {
    console.log('🔄 Updating subscription:', subscription.id);
    
    // Safely handle timestamps
    const currentPeriodStart = subscription.current_period_start ? 
      new Date(subscription.current_period_start * 1000).toISOString() : null;
    const currentPeriodEnd = subscription.current_period_end ? 
      new Date(subscription.current_period_end * 1000).toISOString() : null;
    const canceledAt = subscription.canceled_at ? 
      new Date(subscription.canceled_at * 1000).toISOString() : null;
    
    console.log('📅 New period start:', currentPeriodStart);
    console.log('📅 New period end:', currentPeriodEnd);
    
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: canceledAt,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);
    
    if (updateError) {
      console.error('❌ Error updating subscription:', updateError);
    } else {
      console.log('✅ Subscription updated successfully');
    }
    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();
    if (subscriptionData) {
      const nextBillingAt = subscription.current_period_end ? 
        new Date(subscription.current_period_end * 1000).toISOString() : null;
      
      const userUpdate = {
        next_billing_at: nextBillingAt
      };
      if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
        userUpdate.is_paid = false;
        userUpdate.status = 'on_hold';
      } else if (subscription.status === 'active') {
        userUpdate.is_paid = true;
        userUpdate.status = 'approved';
      }
      await supabase
        .from('users')
        .update(userUpdate)
        .eq('user_id', subscriptionData.user_id);
    }
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription) {
  try {
    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();
    if (subscriptionData) {
      await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscription.id);
      await supabase
        .from('users')
        .update({
          is_paid: false,
          status: 'on_hold',
          next_billing_at: null
        })
        .eq('user_id', subscriptionData.user_id);
    }
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice) {
  try {
    console.log('💰 Processing invoice payment succeeded for invoice:', invoice.id);
    console.log('📅 Invoice period start:', new Date(invoice.period_start * 1000).toISOString());
    console.log('📅 Invoice period end:', new Date(invoice.period_end * 1000).toISOString());
    
    // Get subscription ID from invoice
    const subscriptionId = invoice.subscription || 
                          (invoice.parent?.subscription_details?.subscription);
    console.log('🔗 Subscription ID:', subscriptionId);
    
    if (!subscriptionId) {
      console.log('❌ No subscription ID found in invoice');
      return;
    }
    
    // First, try to find existing subscription
    let { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('subscription_id, user_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single();
    
    // If subscription doesn't exist yet, try to find user by customer ID
    if (!subscriptionData && invoice.customer) {
      console.log('📝 Subscription not found, looking for user by customer ID...');
      const { data: userByCustomer } = await supabase
        .from('users')
        .select('user_id')
        .eq('stripe_customer_id', invoice.customer)
        .single();
      
      if (userByCustomer) {
        console.log('✅ Found user by customer ID, will create subscription record later');
        // We'll create the subscription record when the subscription.created webhook fires
        subscriptionData = { user_id: userByCustomer.user_id };
      } else {
        // Try to find user by email from customer object
        console.log('🔍 Looking for user by email from customer...');
        const customer = await stripe.customers.retrieve(invoice.customer);
        if (customer.email) {
          const { data: userByEmail } = await supabase
            .from('users')
            .select('user_id')
            .eq('email', customer.email)
            .single();
          
          if (userByEmail) {
            console.log('✅ Found user by email, updating stripe_customer_id...');
            // Update user with stripe_customer_id
            await supabase
              .from('users')
              .update({ stripe_customer_id: invoice.customer })
              .eq('user_id', userByEmail.user_id);
            
            subscriptionData = { user_id: userByEmail.user_id };
          }
        }
      }
    }
    
    if (!subscriptionData) {
      console.log('❌ No user found for this invoice');
      return;
    }
    
    // Ensure user has stripe_customer_id
    const { data: userData } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('user_id', subscriptionData.user_id)
      .single();
    
    if (userData && !userData.stripe_customer_id && invoice.customer) {
      console.log('🔧 Adding stripe_customer_id to user...');
      await supabase
        .from('users')
        .update({ stripe_customer_id: invoice.customer })
        .eq('user_id', subscriptionData.user_id);
    }
    // Only create payment record if we have a subscription record
    if (subscriptionData.subscription_id) {
      await supabase
        .from('payments')
        .insert({
          subscription_id: subscriptionData.subscription_id,
          user_id: subscriptionData.user_id,
          stripe_payment_intent_id: invoice.payment_intent,
          stripe_invoice_id: invoice.id,
          amount: invoice.amount_paid / 100,
          currency: invoice.currency.toUpperCase(),
          status: 'succeeded',
          payment_method: 'card',
          billing_reason: invoice.billing_reason,
          paid_at: new Date().toISOString()
        });
      console.log('✅ Payment record created');
    } else {
      console.log('📝 Skipping payment record creation - subscription not created yet');
    }
        if (subscriptionId) {
      console.log('🔄 Retrieving subscription from Stripe...');
      try {
        // Get the subscription to update its period
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        // Safely log timestamps
        const periodStart = subscription.current_period_start ? 
          new Date(subscription.current_period_start * 1000).toISOString() : 'null';
        const periodEnd = subscription.current_period_end ? 
          new Date(subscription.current_period_end * 1000).toISOString() : 'null';
        
        console.log('📅 Stripe subscription period start:', periodStart);
        console.log('📅 Stripe subscription period end:', periodEnd);
        
        // Use invoice period dates if subscription dates are null
        let currentPeriodStart = subscription.current_period_start ? 
          new Date(subscription.current_period_start * 1000).toISOString() : null;
        let currentPeriodEnd = subscription.current_period_end ? 
          new Date(subscription.current_period_end * 1000).toISOString() : null;
        
        // Fallback to invoice line item period dates if subscription dates are null
        if (!currentPeriodStart && invoice.lines?.data?.[0]?.period?.start) {
          currentPeriodStart = new Date(invoice.lines.data[0].period.start * 1000).toISOString();
          console.log('📅 Using invoice line period start as fallback:', currentPeriodStart);
        }
        if (!currentPeriodEnd && invoice.lines?.data?.[0]?.period?.end) {
          currentPeriodEnd = new Date(invoice.lines.data[0].period.end * 1000).toISOString();
          console.log('📅 Using invoice line period end as fallback:', currentPeriodEnd);
        }
        
        // Only update subscription if we have a subscription record
        if (subscriptionData.subscription_id) {
          // Update subscription with new period
          console.log('🔄 Updating subscription in database...');
          
          const { error: subUpdateError } = await supabase
            .from('subscriptions')
            .update({
              current_period_start: currentPeriodStart,
              current_period_end: currentPeriodEnd,
              updated_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', subscriptionId);
          
          if (subUpdateError) {
            console.error('❌ Error updating subscription:', subUpdateError);
          } else {
            console.log('✅ Subscription updated successfully');
          }
        } else {
          console.log('📝 Skipping subscription update - subscription record not created yet');
        }
        
        // Update user with new billing date
        console.log('🔄 Updating user billing date...');
        const nextBillingAt = currentPeriodEnd || (invoice.period_end ? 
          new Date(invoice.period_end * 1000).toISOString() : null);
        
        const { error: userUpdateError } = await supabase
          .from('users')
          .update({
            is_paid: true,
            status: 'approved',
            next_billing_at: nextBillingAt
          })
          .eq('user_id', subscriptionData.user_id);
        
        if (userUpdateError) {
          console.error('❌ Error updating user:', userUpdateError);
        } else {
          console.log('✅ User updated successfully');
        }
      } catch (subscriptionError) {
        console.error('❌ Error retrieving subscription from Stripe:', subscriptionError);
        
        // Fallback: use invoice period dates if subscription retrieval fails
        console.log('🔄 Using invoice period dates as fallback...');
        const nextBillingAt = invoice.period_end ? 
          new Date(invoice.period_end * 1000).toISOString() : null;
        
        const { error: userUpdateError } = await supabase
          .from('users')
          .update({
            is_paid: true,
            status: 'approved',
            next_billing_at: nextBillingAt
          })
          .eq('user_id', subscriptionData.user_id);
        
        if (userUpdateError) {
          console.error('❌ Error updating user with fallback:', userUpdateError);
        } else {
          console.log('✅ User updated successfully with fallback');
        }
      }
    }
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
  }
}

async function handleInvoicePaymentFailed(invoice) {
  try {
    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('subscription_id, user_id')
      .eq('stripe_subscription_id', invoice.subscription)
      .single();
    if (!subscriptionData) return;
    await supabase
      .from('payments')
      .insert({
        subscription_id: subscriptionData.subscription_id,
        user_id: subscriptionData.user_id,
        stripe_payment_intent_id: invoice.payment_intent,
        stripe_invoice_id: invoice.id,
        amount: invoice.amount_due / 100,
        currency: invoice.currency.toUpperCase(),
        status: 'failed',
        payment_method: 'card',
        billing_reason: invoice.billing_reason
      });
    await supabase
      .from('users')
      .update({
        is_paid: false,
        status: 'on_hold'
      })
      .eq('user_id', subscriptionData.user_id);
  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
  }
}

async function handleInvoiceUpcoming(invoice) {
  try {
    // You can implement email notifications here
    console.log('Upcoming invoice event received');
  } catch (error) {
    console.error('Error handling invoice upcoming:', error);
  }
}

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log(`Stripe server running on http://localhost:${PORT}`);
}); 