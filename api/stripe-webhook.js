import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-06-30.basil' });



// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
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
    // For Vercel, we need to stringify the parsed body back to JSON for signature verification
    const rawBody = JSON.stringify(req.body);
    
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
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
    // First try to find user by Stripe customer ID
    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_id, email, subscription_fee')
      .eq('stripe_customer_id', subscription.customer)
      .single();

    // If not found by customer ID, try to find by email from customer object
    if (userError || !userData) {
      console.log('User not found by customer ID, trying to find by email...');
      
      // Get customer details from Stripe to find the email
      const customer = await stripe.customers.retrieve(subscription.customer);
      console.log('Customer details:', customer.email);
      
      if (customer.email) {
        const { data: userByEmail, error: emailError } = await supabase
          .from('users')
          .select('user_id, email, subscription_fee')
          .eq('email', customer.email)
          .single();
        
        if (emailError || !userByEmail) {
          console.error('User not found by email either:', customer.email);
          return;
        }
        
        userData = userByEmail;
        
        // Store the customer ID since it wasn't stored before
        console.log('Storing customer ID for user:', customer.email);
        await supabase
          .from('users')
          .update({ stripe_customer_id: subscription.customer })
          .eq('email', customer.email);
      } else {
        console.error('No email found for customer:', subscription.customer);
        return;
      }
    }

    // Create or update subscription record
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('subscription_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (existingSubscription) {
      // Update existing subscription
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
      // Create new subscription record
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

    // Update user table
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

    console.log('Subscription created successfully for user:', userData.email);
  } catch (error) {
    console.error('Error handling subscription created:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription) {
  console.log('🔄 Processing event type: subscription.updated');
  console.log('Handling subscription updated:', subscription.id);
  
  try {
    // Get the latest subscription data from Stripe
    console.log('🔄 Retrieving subscription from Stripe...');
    const updatedSubscription = await stripe.subscriptions.retrieve(subscription.id);
    
    // Safely handle timestamps
    let currentPeriodStart = updatedSubscription.current_period_start ? 
      new Date(updatedSubscription.current_period_start * 1000).toISOString() : null;
    let currentPeriodEnd = updatedSubscription.current_period_end ? 
      new Date(updatedSubscription.current_period_end * 1000).toISOString() : null;
    const canceledAt = updatedSubscription.canceled_at ? 
      new Date(updatedSubscription.canceled_at * 1000).toISOString() : null;
    
    console.log('📅 Stripe subscription period start:', currentPeriodStart);
    console.log('📅 Stripe subscription period end:', currentPeriodEnd);
    
    // If subscription dates are null, try to get from the latest invoice
    if (!currentPeriodStart || !currentPeriodEnd) {
      console.log('📅 Subscription dates are null, checking latest invoice...');
      const invoices = await stripe.invoices.list({
        subscription: subscription.id,
        limit: 1,
        status: 'paid'
      });
      
      if (invoices.data.length > 0) {
        const latestInvoice = invoices.data[0];
        console.log('📅 Invoice period start:', new Date(latestInvoice.period_start * 1000).toISOString());
        console.log('📅 Invoice period end:', new Date(latestInvoice.period_end * 1000).toISOString());
        
        // Fallback to invoice line item period dates if subscription dates are null
        if (!currentPeriodStart && latestInvoice.lines?.data?.[0]?.period?.start) {
          currentPeriodStart = new Date(latestInvoice.lines.data[0].period.start * 1000).toISOString();
          console.log('📅 Using invoice line period start as fallback:', currentPeriodStart);
        }
        if (!currentPeriodEnd && latestInvoice.lines?.data?.[0]?.period?.end) {
          currentPeriodEnd = new Date(latestInvoice.lines.data[0].period.end * 1000).toISOString();
          console.log('📅 Using invoice line period end as fallback:', currentPeriodEnd);
        }
      }
    }
    
    console.log('🔄 Updating subscription in database...');
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: updatedSubscription.status,
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
        cancel_at_period_end: updatedSubscription.cancel_at_period_end,
        canceled_at: canceledAt,
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
      const nextBillingAt = currentPeriodEnd;
      
      const userUpdate = {
        next_billing_at: nextBillingAt
      };

      if (updatedSubscription.status === 'canceled' || updatedSubscription.status === 'unpaid') {
        userUpdate.is_paid = false;
        userUpdate.status = 'on_hold';
      } else if (updatedSubscription.status === 'active') {
        userUpdate.is_paid = true;
        userUpdate.status = 'approved';
      }

      await supabase
        .from('users')
        .update(userUpdate)
        .eq('user_id', subscriptionData.user_id);
      console.log('🔄 Updating user billing date...');
      console.log('✅ User updated successfully');
    }

    console.log('✅ Subscription updated successfully');
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
    // First, try to find existing subscription
    let { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('subscription_id, user_id')
      .eq('stripe_subscription_id', invoice.subscription)
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

    // Update user billing date using invoice line item period end
    const nextBillingAt = invoice.lines?.data?.[0]?.period?.end ? 
      new Date(invoice.lines.data[0].period.end * 1000).toISOString() : null;
    
    if (nextBillingAt) {
      await supabase
        .from('users')
        .update({
          is_paid: true,
          status: 'approved',
          next_billing_at: nextBillingAt
        })
        .eq('user_id', subscriptionData.user_id);
      console.log('📅 Updated next billing date to:', nextBillingAt);
    } else {
      console.log('⚠️ Could not determine next billing date from invoice');
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