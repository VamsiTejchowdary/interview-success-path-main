import { buffer } from 'micro';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-06-30.basil' });
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Webhook environment variables:', {
    stripeSecret: !!process.env.STRIPE_SECRET_KEY,
    webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: !!process.env.SUPABASE_ANON_KEY,
  });

  const rawBody = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    console.log('Received webhook event:', event.type, 'ID:', event.id, 'Data:', JSON.stringify(event.data.object, null, 2));
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  try {
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
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object);
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

    await logSubscriptionEvent(event);
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error.message, error.stack);
    return res.status(500).json({ error: `Webhook processing failed: ${error.message}` });
  }
}

export const config = {
  api: { bodyParser: false },
};

async function handleSubscriptionCreated(subscription) {
  console.log('Handling subscription created:', subscription.id, 'Customer:', subscription.customer);
  try {
    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_id, email, subscription_fee')
      .eq('stripe_customer_id', subscription.customer)
      .single();

    console.log('User lookup by customer ID:', { userData, userError: userError?.message });

    if (userError || !userData) {
      console.log('User not found by customer ID, trying to find by email...');
      const customer = await stripe.customers.retrieve(subscription.customer);
      console.log('Customer details:', { email: customer.email, customerId: customer.id });
      
      if (customer.email) {
        const { data: userByEmail, error: emailError } = await supabase
          .from('users')
          .select('user_id, email, subscription_fee')
          .eq('email', customer.email)
          .single();
        
        console.log('User lookup by email:', { userByEmail, emailError: emailError?.message });
        
        if (emailError || !userByEmail) {
          console.error('User not found by email either:', customer.email);
          return;
        }
        
        userData = userByEmail;
        console.log('Storing customer ID for user:', customer.email);
        const { error: updateError } = await supabase
          .from('users')
          .update({ stripe_customer_id: subscription.customer })
          .eq('email', customer.email);
        console.log('Customer ID update:', { updateError: updateError?.message });
      } else {
        console.error('No email found for customer:', subscription.customer);
        return;
      }
    }

    // Fallback logic for current_period_start and current_period_end
    let currentPeriodStart = subscription.current_period_start 
      ? new Date(subscription.current_period_start * 1000).toISOString() 
      : null;
    let currentPeriodEnd = subscription.current_period_end 
      ? new Date(subscription.current_period_end * 1000).toISOString() 
      : null;

    if (!currentPeriodStart || !currentPeriodEnd) {
      console.log('Subscription period fields missing, fetching latest paid invoice as fallback...');
      const invoices = await stripe.invoices.list({
        subscription: subscription.id,
        limit: 1,
        status: 'paid'
      });
      if (invoices.data.length > 0) {
        const latestInvoice = invoices.data[0];
        if (!currentPeriodStart && latestInvoice.lines?.data?.[0]?.period?.start) {
          currentPeriodStart = new Date(latestInvoice.lines.data[0].period.start * 1000).toISOString();
          console.log('Using invoice line period start as fallback:', currentPeriodStart);
        }
        if (!currentPeriodEnd && latestInvoice.lines?.data?.[0]?.period?.end) {
          currentPeriodEnd = new Date(latestInvoice.lines.data[0].period.end * 1000).toISOString();
          console.log('Using invoice line period end as fallback:', currentPeriodEnd);
        }
      }
    }

    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('subscription_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    console.log('Existing subscription check:', { existingSubscription });

    if (existingSubscription) {
      const { error: updateError } = await supabase
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
      console.log('Subscription update:', { updateError: updateError?.message });
    } else {
      const { error: insertError } = await supabase
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
          cancel_at_period_end: subscription.cancel_at_period_end,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      console.log('Subscription insert:', { insertError: insertError?.message });
    }

    const nextBillingAt = currentPeriodEnd;
    
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        is_paid: true,
        status: 'approved',
        next_billing_at: nextBillingAt
      })
      .eq('user_id', userData.user_id);
    console.log('User update:', { userUpdateError: userUpdateError?.message });

    console.log('Subscription created successfully for user:', userData.email);
  } catch (error) {
    console.error('Error handling subscription created:', error.message, error.stack);
    throw error;
  }
}

async function handleInvoicePaid(invoice) {
  console.log('Handling invoice paid:', invoice.id, 'Subscription:', invoice.subscription, 'Customer:', invoice.customer);
  
  try {
    let { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('subscription_id, user_id')
      .eq('stripe_subscription_id', invoice.subscription)
      .single();
    
    console.log('Subscription lookup:', { subscriptionData, subscriptionError: subscriptionError?.message });

    // --- Update subscriptions table with invoice period if subscription exists ---
    let updatedSubscriptionId = subscriptionData && subscriptionData.subscription_id ? subscriptionData.subscription_id : null;
    if (!updatedSubscriptionId && subscriptionData && subscriptionData.user_id) {
      // Try to find the most recent active subscription for this user
      const { data: subByUser, error: subByUserError } = await supabase
        .from('subscriptions')
        .select('subscription_id')
        .eq('user_id', subscriptionData.user_id)
        .eq('status', 'active')
        .order('current_period_end', { ascending: false })
        .limit(1)
        .single();
      if (subByUser) {
        updatedSubscriptionId = subByUser.subscription_id;
        console.log('Found subscription by user_id for period update:', subByUser.subscription_id);
      }
    }
    if (updatedSubscriptionId && invoice.lines?.data?.[0]?.period) {
      const periodStart = invoice.lines.data[0].period.start
        ? new Date(invoice.lines.data[0].period.start * 1000).toISOString()
        : null;
      const periodEnd = invoice.lines.data[0].period.end
        ? new Date(invoice.lines.data[0].period.end * 1000).toISOString()
        : null;
      const status = invoice.status || 'active';
      const { error: subUpdateError } = await supabase
        .from('subscriptions')
        .update({
          current_period_start: periodStart,
          current_period_end: periodEnd,
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('subscription_id', updatedSubscriptionId);
      if (subUpdateError) {
        console.error('Error updating subscription from invoice.paid:', subUpdateError.message);
      } else {
        console.log('Updated subscription period from invoice.paid');
      }
    }
    // --- End update subscriptions table ---

    if (!subscriptionData && invoice.customer) {
      console.log('Subscription not found, looking for user by customer ID...');
      const { data: userByCustomer, error: userError } = await supabase
        .from('users')
        .select('user_id')
        .eq('stripe_customer_id', invoice.customer)
        .single();
      
      console.log('User lookup by customer ID:', { userByCustomer, userError: userError?.message });
      
      if (userByCustomer) {
        console.log('Found user by customer ID, will use user_id:', userByCustomer.user_id);
        // Try to find the most recent active subscription for this user
        const { data: subByUser, error: subByUserError } = await supabase
          .from('subscriptions')
          .select('subscription_id')
          .eq('user_id', userByCustomer.user_id)
          .eq('status', 'active')
          .order('current_period_end', { ascending: false })
          .limit(1)
          .single();
        if (subByUser) {
          subscriptionData = { user_id: userByCustomer.user_id, subscription_id: subByUser.subscription_id };
          console.log('Found subscription by user_id:', subByUser.subscription_id);
        } else {
          subscriptionData = { user_id: userByCustomer.user_id };
          console.log('No active subscription found for user_id:', userByCustomer.user_id);
        }
      } else {
        console.log('Looking for user by email from customer...');
        const customer = await stripe.customers.retrieve(invoice.customer);
        console.log('Customer details:', { email: customer.email, customerId: customer.id });
        
        if (customer.email) {
          const { data: userByEmail, error: emailError } = await supabase
            .from('users')
            .select('user_id')
            .eq('email', customer.email)
            .single();
          
          console.log('User lookup by email:', { userByEmail, emailError: emailError?.message });
          
          if (userByEmail) {
            console.log('Found user by email, updating stripe_customer_id...');
            const { error: updateError } = await supabase
              .from('users')
              .update({ stripe_customer_id: invoice.customer })
              .eq('user_id', userByEmail.user_id);
            console.log('Customer ID update:', { updateError: updateError?.message });
            // Try to find the most recent active subscription for this user
            const { data: subByUser, error: subByUserError } = await supabase
              .from('subscriptions')
              .select('subscription_id')
              .eq('user_id', userByEmail.user_id)
              .eq('status', 'active')
              .order('current_period_end', { ascending: false })
              .limit(1)
              .single();
            if (subByUser) {
              subscriptionData = { user_id: userByEmail.user_id, subscription_id: subByUser.subscription_id };
              console.log('Found subscription by user_id:', subByUser.subscription_id);
            } else {
              subscriptionData = { user_id: userByEmail.user_id };
              console.log('No active subscription found for user_id:', userByEmail.user_id);
            }
          }
        }
      }
    }
    
    if (!subscriptionData) {
      console.log('No user found for this invoice, skipping payment insertion');
      return;
    }

    const paymentData = {
      user_id: subscriptionData.user_id,
      stripe_payment_intent_id: invoice.payment_intent,
      stripe_invoice_id: invoice.id,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency.toUpperCase(),
      status: 'succeeded',
      payment_method: 'card',
      billing_reason: invoice.billing_reason,
      paid_at: invoice.paid_at ? new Date(invoice.paid_at * 1000).toISOString() : new Date().toISOString()
    };

    if (subscriptionData.subscription_id) {
      paymentData.subscription_id = subscriptionData.subscription_id;
    }

    const { error: paymentError } = await supabase
      .from('payments')
      .insert(paymentData);
    console.log('Payment insert:', { paymentError: paymentError?.message });

    const nextBillingAt = invoice.lines?.data?.[0]?.period?.end 
      ? new Date(invoice.lines.data[0].period.end * 1000).toISOString() 
      : null;
    
    if (nextBillingAt) {
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          is_paid: true,
          status: 'approved',
          next_billing_at: nextBillingAt
        })
        .eq('user_id', subscriptionData.user_id);
      console.log('User update:', { userUpdateError: userUpdateError?.message });
    } else {
      console.log('Could not determine next billing date from invoice');
    }

    console.log('Invoice paid processed successfully');
  } catch (error) {
    console.error('Error handling invoice paid:', error.message, error.stack);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription) {
  console.log('Handling subscription updated:', subscription.id, 'Customer:', subscription.customer);
  
  try {
    const updatedSubscription = await stripe.subscriptions.retrieve(subscription.id);
    let currentPeriodStart = updatedSubscription.current_period_start 
      ? new Date(updatedSubscription.current_period_start * 1000).toISOString() 
      : null;
    let currentPeriodEnd = updatedSubscription.current_period_end 
      ? new Date(updatedSubscription.current_period_end * 1000).toISOString() 
      : null;
    const canceledAt = updatedSubscription.canceled_at 
      ? new Date(updatedSubscription.canceled_at * 1000).toISOString() 
      : null;
    
    console.log('Stripe subscription period start:', currentPeriodStart);
    console.log('Stripe subscription period end:', currentPeriodEnd);
    
    if (!currentPeriodStart || !currentPeriodEnd) {
      console.log('Subscription dates are null, checking latest invoice...');
      const invoices = await stripe.invoices.list({
        subscription: subscription.id,
        limit: 1,
        status: 'paid'
      });
      
      if (invoices.data.length > 0) {
        const latestInvoice = invoices.data[0];
        console.log('Invoice period start:', new Date(latestInvoice.period_start * 1000).toISOString());
        console.log('Invoice period end:', new Date(latestInvoice.period_end * 1000).toISOString());
        
        if (!currentPeriodStart && latestInvoice.lines?.data?.[0]?.period?.start) {
          currentPeriodStart = new Date(latestInvoice.lines.data[0].period.start * 1000).toISOString();
          console.log('Using invoice line period start as fallback:', currentPeriodStart);
        }
        if (!currentPeriodEnd && latestInvoice.lines?.data?.[0]?.period?.end) {
          currentPeriodEnd = new Date(latestInvoice.lines.data[0].period.end * 1000).toISOString();
          console.log('Using invoice line period end as fallback:', currentPeriodEnd);
        }
      }
    }
    
    console.log('Updating subscription in database...');
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
      console.error('Error updating subscription:', error.message);
      return;
    }

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
      console.log('Updating user billing date...');
      console.log('User updated successfully');
    }

    console.log('Subscription updated successfully');
  } catch (error) {
    console.error('Error handling subscription updated:', error.message, error.stack);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription) {
  console.log('Handling subscription deleted:', subscription.id);
  
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

    console.log('Subscription deleted successfully');
  } catch (error) {
    console.error('Error handling subscription deleted:', error.message, error.stack);
    throw error;
  }
}

async function handleInvoicePaymentFailed(invoice) {
  console.log('Handling invoice payment failed:', invoice.id);
  
  try {
    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('subscription_id, user_id')
      .eq('stripe_subscription_id', invoice.subscription)
      .single();

    if (!subscriptionData) {
      console.error('Subscription not found for invoice:', invoice.subscription);
      return;
    }

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

    console.log('Payment failed processed successfully');
  } catch (error) {
    console.error('Error handling invoice payment failed:', error.message, error.stack);
    throw error;
  }
}

async function handleInvoiceUpcoming(invoice) {
  console.log('Handling invoice upcoming:', invoice.id);
  try {
    console.log('Upcoming invoice processed successfully');
  } catch (error) {
    console.error('Error handling invoice upcoming:', error.message, error.stack);
    throw error;
  }
}

async function logSubscriptionEvent(event) {
  try {
    const { error } = await supabase
      .from('subscription_events')
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        event_data: event.data.object,
        processed: true
      });
    console.log('Logged subscription event:', event.id, event.type, { error: error?.message });
  } catch (error) {
    console.error('Error logging subscription event:', error.message, error.stack);
  }
}