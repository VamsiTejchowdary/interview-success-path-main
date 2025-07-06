import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Webhook secret - you'll need to set this in your environment variables
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  console.log('Received webhook event:', event.type);

  try {
    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      
      case 'invoice.upcoming':
        await handleInvoiceUpcoming(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Log the event for tracking
    await logSubscriptionEvent(event);

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleSubscriptionCreated(subscription) {
  console.log('Handling subscription created:', subscription.id);
  
  try {
    // Find user by Stripe customer ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_id, email, subscription_fee')
      .eq('stripe_customer_id', subscription.customer)
      .single();

    if (userError || !userData) {
      console.error('User not found for customer:', subscription.customer);
      return;
    }

    // Create or update subscription record
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('subscription_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (existingSubscription) {
      // Update existing subscription
      await supabase
        .from('subscriptions')
        .update({
          stripe_customer_id: subscription.customer,
          stripe_price_id: subscription.items.data[0]?.price.id,
          amount: subscription.items.data[0]?.price.unit_amount / 100,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString()
        })
        .eq('subscription_id', existingSubscription.subscription_id);
    } else {
      // Create new subscription record
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
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end
        });
    }

    // Update user table
    await supabase
      .from('users')
      .update({
        is_paid: true,
        status: 'approved',
        next_billing_at: new Date(subscription.current_period_end * 1000).toISOString()
      })
      .eq('user_id', userData.user_id);

    console.log('Subscription created successfully for user:', userData.email);
  } catch (error) {
    console.error('Error handling subscription created:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription) {
  console.log('Handling subscription updated:', subscription.id);
  
  try {
    // Update subscription record
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Error updating subscription:', error);
      return;
    }

    // Update user table based on subscription status
    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (subscriptionData) {
      const userUpdate = {
        next_billing_at: new Date(subscription.current_period_end * 1000).toISOString()
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

    console.log('Subscription updated successfully');
  } catch (error) {
    console.error('Error handling subscription updated:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription) {
  console.log('Handling subscription deleted:', subscription.id);
  
  try {
    // Get subscription data
    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (subscriptionData) {
      // Update subscription status
      await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscription.id);

      // Update user table
      await supabase
        .from('users')
        .update({
          is_paid: false,
          status: 'on_hold',
          next_billing_at: null
        })
        .eq('user_id', subscriptionData.user_id);
    }

    console.log('Subscription deleted successfully');
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
    throw error;
  }
}

async function handleInvoicePaymentSucceeded(invoice) {
  console.log('Handling invoice payment succeeded:', invoice.id);
  
  try {
    // Find subscription
    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('subscription_id, user_id')
      .eq('stripe_subscription_id', invoice.subscription)
      .single();

    if (!subscriptionData) {
      console.error('Subscription not found for invoice:', invoice.subscription);
      return;
    }

    // Create payment record
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

    // Update user billing date
    if (invoice.subscription) {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('current_period_end')
        .eq('stripe_subscription_id', invoice.subscription)
        .single();

      if (subscription) {
        await supabase
          .from('users')
          .update({
            is_paid: true,
            status: 'approved',
            next_billing_at: subscription.current_period_end
          })
          .eq('user_id', subscriptionData.user_id);
      }
    }

    console.log('Payment succeeded processed successfully');
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
    throw error;
  }
}

async function handleInvoicePaymentFailed(invoice) {
  console.log('Handling invoice payment failed:', invoice.id);
  
  try {
    // Find subscription
    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('subscription_id, user_id')
      .eq('stripe_subscription_id', invoice.subscription)
      .single();

    if (!subscriptionData) {
      console.error('Subscription not found for invoice:', invoice.subscription);
      return;
    }

    // Create payment record for failed payment
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

    // Update user status
    await supabase
      .from('users')
      .update({
        is_paid: false,
        status: 'on_hold'
      })
      .eq('user_id', subscriptionData.user_id);

    console.log('Payment failed processed successfully');
  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
    throw error;
  }
}

async function handleInvoiceUpcoming(invoice) {
  console.log('Handling invoice upcoming:', invoice.id);
  
  try {
    // This is useful for sending reminder emails before payment
    // You can implement email notifications here
    
    console.log('Upcoming invoice processed successfully');
  } catch (error) {
    console.error('Error handling invoice upcoming:', error);
    throw error;
  }
}

async function logSubscriptionEvent(event) {
  try {
    await supabase
      .from('subscription_events')
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        event_data: event.data.object,
        processed: true
      });
  } catch (error) {
    console.error('Error logging subscription event:', error);
  }
} 