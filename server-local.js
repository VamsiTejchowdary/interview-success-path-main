import express from 'express';
import cors from 'cors';
import { Resend } from 'resend';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { buffer } from 'micro';
import bodyParser from 'body-parser'; // <-- Add this import
import { 
  accountVerifiedTemplate, 
  accountApprovedTemplate, 
  passwordResetTemplate 
} from './email-templates/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

// Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Utility function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const app = express();
const port = 4242;

// Middleware
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:4173'],
  credentials: true
}));

// Stripe webhook route FIRST, with raw body parser
app.post('/api/stripe-webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    // Use the raw body for signature verification
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
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
        console.log('⚠️ Unhandled event type:', event.type);
    }

    await logSubscriptionEvent(event);
    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// All other routes use express.json()
app.use(express.json());

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Email templates
const emailTemplates = {
  accountVerified: accountVerifiedTemplate,
  accountApproved: accountApprovedTemplate,
  passwordReset: passwordResetTemplate
};

// Email sending function
const sendEmail = async (emailData) => {
  try {
    const { data, error } = await resend.emails.send({
      from: emailData.from || 'noreply@jobsmartly.com',
      to: [emailData.to],
      subject: emailData.subject,
      html: emailData.html,
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

// Stripe webhook handlers
async function handleSubscriptionCreated(subscription) {
  try {
    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_id, email, subscription_fee')
      .eq('stripe_customer_id', subscription.customer)
      .single();

    if (userError || !userData) {
      const customer = await stripe.customers.retrieve(subscription.customer);
      
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
        const { error: updateError } = await supabase
          .from('users')
          .update({ stripe_customer_id: subscription.customer })
          .eq('email', customer.email);
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
      const invoices = await stripe.invoices.list({
        subscription: subscription.id,
        limit: 1,
        status: 'paid'
      });
      if (invoices.data.length > 0) {
        const latestInvoice = invoices.data[0];
        if (!currentPeriodStart && latestInvoice.lines?.data?.[0]?.period?.start) {
          currentPeriodStart = new Date(latestInvoice.lines.data[0].period.start * 1000).toISOString();
        }
        if (!currentPeriodEnd && latestInvoice.lines?.data?.[0]?.period?.end) {
          currentPeriodEnd = new Date(latestInvoice.lines.data[0].period.end * 1000).toISOString();
        }
      }
    }

    // Insert or update subscription
    const { data: existingSubscription, error: existingSubError } = await supabase
      .from('subscriptions')
      .select('subscription_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    let subscriptionId;
    if (existingSubscription) {
      const { data, error: updateError } = await supabase
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
        .eq('subscription_id', existingSubscription.subscription_id)
        .select();
      subscriptionId = data?.[0]?.subscription_id;
    } else {
      const { data, error: insertError } = await supabase
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
        })
        .select();
      subscriptionId = data?.[0]?.subscription_id;
    }

    // Backfill subscription_id in payments table for initial payment
    if (subscriptionId) {
      const invoices = await stripe.invoices.list({
        subscription: subscription.id,
        limit: 1,
        status: 'paid'
      });
      if (invoices.data.length > 0) {
        const latestInvoice = invoices.data[0];
        
        // First try to update existing payment record
        const { data: updatedPayment, error: paymentUpdateError } = await supabase
          .from('payments')
          .update({ subscription_id: subscriptionId })
          .eq('stripe_invoice_id', latestInvoice.id)
          .eq('user_id', userData.user_id)
          .is('subscription_id', null)
          .select();
        
        // If no payment record was updated, check if one already exists for this invoice
        if (!updatedPayment || updatedPayment.length === 0) {
          // Check if payment already exists for this invoice
          const { data: existingPayment, error: checkError } = await supabase
            .from('payments')
            .select('payment_id')
            .eq('stripe_invoice_id', latestInvoice.id)
            .single();

          if (existingPayment) {
            console.log('⚠️ Payment already exists for invoice:', latestInvoice.id);
            console.log('⚠️ Skipping payment creation to avoid duplicates');
          } else {
            console.log('💳 Creating new payment record for subscription creation');
            const paymentData = {
              user_id: userData.user_id,
              subscription_id: subscriptionId,
              stripe_invoice_id: latestInvoice.id,
              amount: latestInvoice.amount_paid / 100,
              currency: latestInvoice.currency.toUpperCase(),
              status: 'succeeded',
              payment_method: latestInvoice.payment_method_details?.type || 'card',
              billing_reason: latestInvoice.billing_reason,
              paid_at: latestInvoice.paid_at ? new Date(latestInvoice.paid_at * 1000).toISOString() : new Date().toISOString()
            };
            
            // Only add payment_intent_id if it exists
            if (latestInvoice.payment_intent) {
              paymentData.stripe_payment_intent_id = latestInvoice.payment_intent;
            }
            
            const { data: newPayment, error: insertError } = await supabase
              .from('payments')
              .insert(paymentData)
              .select();
            
            if (insertError) {
              console.error('❌ Error creating payment record:', insertError.message);
            } else {
              console.log('✅ Created payment record for subscription:', newPayment?.[0]?.payment_id);
            }
          }
        } else {
          console.log('✅ Updated existing payment record with subscription_id');
        }
      }
    }

    // Update user with next_billing_at
    const nextBillingAt = currentPeriodEnd;
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        is_paid: true,
        status: 'approved',
        next_billing_at: nextBillingAt
      })
      .eq('user_id', userData.user_id);
  } catch (error) {
    console.error('Error handling subscription created:', error.message, error.stack);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription) {
  
  try {
    // Retrieve the latest subscription data from Stripe
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
    
    // Fallback to latest invoice if period dates are missing
    if (!currentPeriodStart || !currentPeriodEnd) {
      const invoices = await stripe.invoices.list({
        subscription: subscription.id,
        limit: 1,
        status: 'paid'
      });
      
      if (invoices.data.length > 0 && invoices.data[0].lines?.data?.[0]) {
        const latestInvoice = invoices.data[0];
        
        if (!currentPeriodStart && latestInvoice.lines.data[0].period?.start) {
          currentPeriodStart = new Date(latestInvoice.lines.data[0].period.start * 1000).toISOString();
        }
        if (!currentPeriodEnd && latestInvoice.lines.data[0].period?.end) {
          currentPeriodEnd = new Date(latestInvoice.lines.data[0].period.end * 1000).toISOString();
        }
      } else {
      }
    }

    // Validate period dates
    if (!currentPeriodStart || !currentPeriodEnd) {
      console.error('Cannot update subscription: Missing valid period start or end dates');
      throw new Error('Missing valid period start or end dates for subscription update');
    }

    // Try updating subscription by stripe_subscription_id
    let { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: updatedSubscription.status,
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
        cancel_at_period_end: updatedSubscription.cancel_at_period_end,
        canceled_at: canceledAt,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)
      .select();

    // If no rows updated, try finding subscription by stripe_customer_id
    if (error || !data?.length) {
      console.error('Initial subscription update failed:', {
        error: error?.message,
        details: error?.details,
        code: error?.code
      });
      console.log('Attempting fallback update using stripe_customer_id:', subscription.customer);

      const { data: subscriptionData, error: subError } = await supabase
        .from('subscriptions')
        .select('subscription_id, user_id, stripe_subscription_id')
        .eq('stripe_customer_id', subscription.customer)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (subError || !subscriptionData) {
        console.error('Fallback subscription lookup failed:', {
          error: subError?.message,
          customerId: subscription.customer
        });
        // If no active subscription found, create a new one
        console.log('No active subscription found, creating new subscription record...');
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('user_id')
          .eq('stripe_customer_id', subscription.customer)
          .single();

        if (userError || !userData) {
          console.error('User lookup failed for customer:', subscription.customer, userError?.message);
          throw new Error(`No user found for customer: ${subscription.customer}`);
        }

        const { data: newSubData, error: insertError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: userData.user_id,
            stripe_customer_id: subscription.customer,
            stripe_subscription_id: subscription.id,
            stripe_price_id: updatedSubscription.items.data[0]?.price.id,
            plan_name: 'Premium Plan',
            amount: updatedSubscription.items.data[0]?.price.unit_amount / 100,
            currency: updatedSubscription.currency.toUpperCase(),
            interval: updatedSubscription.items.data[0]?.price.recurring.interval,
            status: updatedSubscription.status,
            current_period_start: currentPeriodStart,
            current_period_end: currentPeriodEnd,
            cancel_at_period_end: updatedSubscription.cancel_at_period_end,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();

        if (insertError || !newSubData?.length) {
          console.error('Failed to create new subscription:', insertError?.message);
          throw new Error(`Failed to create subscription: ${insertError?.message}`);
        }

        data = newSubData;
      } else {
        // Update existing subscription with new stripe_subscription_id
        console.log('Found subscription by customer_id, updating with new stripe_subscription_id:', subscription.id);
        const { data: updateData, error: updateError } = await supabase
          .from('subscriptions')
          .update({
            stripe_subscription_id: subscription.id,
            status: updatedSubscription.status,
            current_period_start: currentPeriodStart,
            current_period_end: currentPeriodEnd,
            cancel_at_period_end: updatedSubscription.cancel_at_period_end,
            canceled_at: canceledAt,
            updated_at: new Date().toISOString()
          })
          .eq('subscription_id', subscriptionData.subscription_id)
          .select();

        if (updateError || !updateData?.length) {
          console.error('Fallback subscription update failed:', {
            error: updateError?.message,
            details: updateError?.details,
            code: updateError?.code
          });
          throw new Error(`Failed to update subscription: ${updateError?.message || 'Unknown error'}`);
        }

        data = updateData;
      }
    } else {
    }

    // Update user with next_billing_at
    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (subscriptionData) {
      const userUpdate = {
        next_billing_at: currentPeriodEnd,
        is_paid: updatedSubscription.status === 'active',
        status: updatedSubscription.status === 'active' ? 'approved' : updatedSubscription.status === 'canceled' || updatedSubscription.status === 'unpaid' ? 'on_hold' : 'pending'
      };

      const { error: userUpdateError } = await supabase
        .from('users')
        .update(userUpdate)
        .eq('user_id', subscriptionData.user_id);
    } else {
    }
  } catch (error) {
    console.error('Error handling subscription updated:', error.message, error.stack);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription) {
  console.log('🔄 Processing event type: subscription.deleted');
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
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
    throw error;
  }
}

async function handleInvoicePaid(invoice) {
  console.log('Handling invoice paid:', invoice.id, 'Subscription:', invoice.subscription, 'Customer:', invoice.customer);
  
  try {
    let subscriptionData = null;
    let maxRetries = 3;
    let retryCount = 0;

    // Try to find subscription by stripe_subscription_id with retries
    if (invoice.subscription) {
      while (!subscriptionData && retryCount < maxRetries) {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('subscription_id, user_id')
          .eq('stripe_subscription_id', invoice.subscription)
          .single();
        
        if (data) {
          subscriptionData = data;
        } else {
          retryCount++;
          if (retryCount < maxRetries) {
            await delay(retryCount * 1000);
          }
        }
      }
    }

    // If subscription not found, try finding by stripe_customer_id
    if (!subscriptionData && invoice.customer) {
      console.log('Subscription not found by stripe_subscription_id, trying stripe_customer_id:', invoice.customer);
      const { data: subByCustomer, error: subError } = await supabase
        .from('subscriptions')
        .select('subscription_id, user_id')
        .eq('stripe_customer_id', invoice.customer)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (subByCustomer) {
        subscriptionData = subByCustomer;
        // Update subscription with correct stripe_subscription_id if mismatched
        if (invoice.subscription && subByCustomer.stripe_subscription_id !== invoice.subscription) {
          console.log('Updating subscription with new stripe_subscription_id:', invoice.subscription);
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
              stripe_subscription_id: invoice.subscription,
              updated_at: new Date().toISOString()
            })
            .eq('subscription_id', subByCustomer.subscription_id);
        }
      }
    }

    // If still no subscription, try user lookup by customer_id or email
    if (!subscriptionData && invoice.customer) {
      console.log('No subscription found, looking for user by customer ID...');
      let { data: userByCustomer, error: userError } = await supabase
        .from('users')
        .select('user_id')
        .eq('stripe_customer_id', invoice.customer)
        .single();
      
      if (!userByCustomer) {
        console.log('Looking for user by email from customer...');
        const customer = await stripe.customers.retrieve(invoice.customer);
        
        if (customer.email) {
          const { data: userByEmail, error: emailError } = await supabase
            .from('users')
            .select('user_id')
            .eq('email', customer.email)
            .single();
          
          if (userByEmail) {
            console.log('Found user by email, updating stripe_customer_id...');
            const { error: updateError } = await supabase
              .from('users')
              .update({ stripe_customer_id: invoice.customer })
              .eq('user_id', userByEmail.user_id);
          }
        }
      }

      if (userByCustomer) {
        subscriptionData = { user_id: userByCustomer.user_id };
      }
    }
    
    if (!subscriptionData) {
      console.log('No user or subscription found for invoice, skipping payment insertion:', invoice.id);
      return;
    }

    // Update subscription period if subscription exists and invoice has period data
    if (subscriptionData.subscription_id && invoice.lines?.data?.[0]?.period) {
      const periodStart = invoice.lines.data[0].period.start
        ? new Date(invoice.lines.data[0].period.start * 1000).toISOString()
        : null;
      const periodEnd = invoice.lines.data[0].period.end
        ? new Date(invoice.lines.data[0].period.end * 1000).toISOString()
        : null;
      const { error: subUpdateError } = await supabase
        .from('subscriptions')
        .update({
          current_period_start: periodStart,
          current_period_end: periodEnd,
          status: invoice.status === 'paid' ? 'active' : 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('subscription_id', subscriptionData.subscription_id);
    }

    // Insert payment record with better duplicate prevention
    const paymentData = {
      user_id: subscriptionData.user_id,
      stripe_invoice_id: invoice.id,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency.toUpperCase(),
      status: 'succeeded',
      payment_method: invoice.payment_method_details?.type || 'card',
      billing_reason: invoice.billing_reason,
      paid_at: invoice.paid_at ? new Date(invoice.paid_at * 1000).toISOString() : new Date().toISOString()
    };

    // Only add payment_intent_id if it exists and is not null
    if (invoice.payment_intent) {
      paymentData.stripe_payment_intent_id = invoice.payment_intent;
    }

    if (subscriptionData.subscription_id) {
      paymentData.subscription_id = subscriptionData.subscription_id;
    }

    console.log('💳 Inserting payment record:', paymentData);

    // Check if payment already exists for this invoice
    const { data: existingPayment, error: checkError } = await supabase
      .from('payments')
      .select('payment_id')
      .eq('stripe_invoice_id', invoice.id)
      .single();

    if (existingPayment) {
      console.log('⚠️ Payment already exists for invoice:', invoice.id);
      console.log('⚠️ Skipping payment insertion to avoid duplicates');
      return;
    }

    // Use insert with conflict handling to prevent duplicates
    const { data: paymentResult, error: paymentError } = await supabase
      .from('payments')
      .insert(paymentData)
      .select();

    if (paymentError) {
      console.error('❌ Error inserting payment:', paymentError.message);
      console.error('❌ Payment data that failed:', JSON.stringify(paymentData, null, 2));
      
      // Try to get more details about the error
      if (paymentError.code === '23505') {
        console.error('❌ This is a unique constraint violation');
      } else if (paymentError.code === '23503') {
        console.error('❌ This is a foreign key constraint violation');
      }
    } else {
      console.log('✅ Payment record inserted successfully');
      console.log('✅ Payment ID:', paymentResult?.[0]?.payment_id);
    }

    // Update user with next_billing_at
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
    } else {
    }
  } catch (error) {
    console.error('Error handling invoice paid:', error.message, error.stack);
    throw error;
  }
}

async function handleInvoicePaymentFailed(invoice) {
  console.log('🔄 Processing event type: invoice.payment_failed');
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

    // Create payment record for failed payment with duplicate prevention
    await supabase
      .from('payments')
      .upsert({
        subscription_id: subscriptionData.subscription_id,
        user_id: subscriptionData.user_id,
        stripe_payment_intent_id: invoice.payment_intent,
        stripe_invoice_id: invoice.id,
        amount: invoice.amount_due / 100,
        currency: invoice.currency.toUpperCase(),
        status: 'failed',
        payment_method: 'card',
        billing_reason: invoice.billing_reason
      }, {
        onConflict: 'stripe_invoice_id',
        ignoreDuplicates: true
      });

    // Update user status
    await supabase
      .from('users')
      .update({
        is_paid: false,
        status: 'on_hold'
      })
      .eq('user_id', subscriptionData.user_id);
  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
    throw error;
  }
}

async function handleInvoiceUpcoming(invoice) {
  console.log('🔄 Processing event type: invoice.upcoming');
  console.log('Handling invoice upcoming:', invoice.id);
  
  try {
    // This is useful for sending reminder emails before payment
    // You can implement email notifications here
    
  } catch (error) {
    console.error('Error handling invoice upcoming:', error);
    throw error;
  }
}

async function logSubscriptionEvent(event) {
  try {
    let subscriptionId = null;
    let extractionSource = null;
    
    // 1. Subscription events
    if ([
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted'
    ].includes(event.type)) {
      subscriptionId = event.data.object.id;
      extractionSource = 'subscription object (event.data.object.id)';
    }
    // 2. Invoice events
    else if (event.type.startsWith('invoice.')) {
      subscriptionId = event.data.object.subscription;
      extractionSource = 'invoice.subscription (event.data.object.subscription)';
    }
    // 3. Checkout session events
    else if (event.type === 'checkout.session.completed') {
      subscriptionId = event.data.object.subscription;
      extractionSource = 'checkout.session.subscription (event.data.object.subscription)';
    }
    // 4. Payment intent events
    else if (event.type.startsWith('payment_intent.')) {
      // Try to get invoice, then subscription
      if (event.data.object.invoice) {
        extractionSource = 'payment_intent.invoice (event.data.object.invoice)';
        // Fetch the invoice from Stripe to get the subscription
        try {
          const invoice = await stripe.invoices.retrieve(event.data.object.invoice);
          subscriptionId = invoice.subscription;
          extractionSource += ' → fetched invoice.subscription';
        } catch (err) {
          console.log('⚠️ Could not fetch invoice for payment_intent:', err.message);
        }
      }
    }
    // 5. Charge events
    else if (event.type.startsWith('charge.')) {
      if (event.data.object.invoice) {
        extractionSource = 'charge.invoice (event.data.object.invoice)';
        try {
          const invoice = await stripe.invoices.retrieve(event.data.object.invoice);
          subscriptionId = invoice.subscription;
          extractionSource += ' → fetched invoice.subscription';
        } catch (err) {
          console.log('⚠️ Could not fetch invoice for charge:', err.message);
        }
      }
    }
    // 6. Default: try to find subscription in object
    if (!subscriptionId) {
      if (event.data.object.subscription) {
        subscriptionId = event.data.object.subscription;
        extractionSource = 'default: event.data.object.subscription';
      } else if (event.data.object.id && String(event.data.object.id).startsWith('sub_')) {
        subscriptionId = event.data.object.id;
        extractionSource = 'default: event.data.object.id (sub_*)';
      }
    }

    if (subscriptionId) {
      console.log(`🔍 Extracted Stripe subscription ID: ${subscriptionId} (source: ${extractionSource})`);
    } else {
      console.log('⚠️ No Stripe subscription ID found in event.');
    }

    // If we have a subscriptionId, try to get the local subscription_id from our database
    let localSubscriptionId = null;
    if (subscriptionId) {
      try {
        const { data: subscriptionData, error: lookupError } = await supabase
          .from('subscriptions')
          .select('subscription_id, stripe_subscription_id')
          .eq('stripe_subscription_id', subscriptionId.trim())
          .maybeSingle();
        if (subscriptionData) {
          localSubscriptionId = subscriptionData.subscription_id;
        } else {
        }
      } catch (error) {
        console.log('❌ Could not find local subscription_id for stripe_subscription_id:', subscriptionId, 'Error:', error.message);
      }
    }

    await supabase
      .from('subscription_events')
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        event_data: event.data.object,
        subscription_id: localSubscriptionId,
        processed: true
      });
    
  } catch (error) {
    console.error('❌ Error logging subscription event:', error);
  }
}

// API Routes
app.post('/send-email', async (req, res) => {
  try {
    const { to, subject, html, template, templateData } = req.body;

    let emailData;
    
    if (template && templateData) {
      const templateFn = emailTemplates[template];
      if (!templateFn) {
        return res.status(400).json({ error: 'Template not found' });
      }
      emailData = templateFn(...templateData);
      emailData.to = to;
    } else {
      emailData = { to, subject, html };
    }

    const result = await sendEmail(emailData);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Email API error:', error);
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
});

// Create checkout session endpoint
app.post('/create-checkout-session', async (req, res) => {
  console.log('Request method:', req.method);
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);

  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed', receivedMethod: req.method });
  }

  let body = req.body;
  if (!body || typeof body === 'string') {
    try {
      body = JSON.parse(body || '{}');
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
  }

  const { userEmail } = body;
  console.log('Processing request for user:', userEmail);

  try {
    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required' });
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_id, email, subscription_fee, stripe_customer_id')
      .eq('email', userEmail)
      .single();

    console.log('User lookup:', { userData, userError: userError?.message });

    if (userError || !userData) {
      return res.status(404).json({ error: 'User not found', email: userEmail });
    }

    let customerId = userData.stripe_customer_id;
    
    // If customer ID exists, verify it's valid in Stripe
    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
        console.log('✅ Existing customer found in Stripe:', customerId);
      } catch (error) {
        console.log('❌ Customer not found in Stripe, creating new one:', customerId);
        console.log('   Error:', error.message);
        
        // Create new customer
        const customer = await stripe.customers.create({ email: userEmail });
        customerId = customer.id;
        
        // Update database with new customer ID
        const { error: updateError } = await supabase
          .from('users')
          .update({ stripe_customer_id: customerId })
          .eq('email', userEmail);
        
        if (updateError) {
          console.error('❌ Error updating customer ID:', updateError.message);
        } else {
          console.log('✅ Updated database with new customer ID:', customerId);
        }
      }
    } else {
      // No customer ID exists, create new one
      console.log('📝 Creating new customer for user:', userEmail);
      const customer = await stripe.customers.create({ email: userEmail });
      customerId = customer.id;
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('email', userEmail);
        
      if (updateError) {
        console.error('❌ Error updating customer ID:', updateError.message);
      } else {
        console.log('✅ Created and stored new customer ID:', customerId);
      }
    }

    const userAmount = Math.round(userData.subscription_fee * 100);

    console.log('Creating checkout session for user:', userEmail, 'amount:', userAmount);

    const product = await stripe.products.create({ name: 'Premium Plan' });
    const price = await stripe.prices.create({
      unit_amount: userAmount,
      currency: 'usd',
      recurring: { interval: 'month' },
      product: product.id,
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: price.id, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4173'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4173'}/cancel`,
      customer: customerId,
    });

    console.log('Checkout session created:', session.id, 'Customer:', session.customer);

    res.json({ url: session.url });
  } catch (err) {
    console.error('Error creating checkout session:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to create Stripe Checkout session', details: err.message });
  }
});

// Get payment method endpoint
app.post('/get-payment-method', async (req, res) => {
  console.log('🔍 Payment method request received');
  console.log('📋 Request body:', req.body);
  
  try {
    const { customerId } = req.body;
    let paymentMethodId = null;

    if (!customerId) {
      console.log('❌ No customer ID provided');
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    console.log('🔍 Fetching customer from Stripe:', customerId);
    
    // Get the customer's default payment method
    const customer = await stripe.customers.retrieve(customerId, {
      expand: ['invoice_settings.default_payment_method', 'sources']
    });
    
    // Check for default payment method first (preferred)
    if (customer.invoice_settings?.default_payment_method) {
      paymentMethodId = customer.invoice_settings.default_payment_method;
    } else if (customer.default_source) {
      // Fallback to default source (older method)
      paymentMethodId = customer.default_source;
    } else {
      // If no default is set, try to get the first available payment method
      try {
        const paymentMethods = await stripe.paymentMethods.list({
          customer: customerId,
          type: 'card',
        });
        
        if (paymentMethods.data.length > 0) {
          paymentMethodId = paymentMethods.data[0].id;
        } else {
          // If no payment methods, check sources (older Stripe method)
          if (customer.sources && customer.sources.data.length > 0) {
            const cardSource = customer.sources.data.find(source => source.object === 'card');
            if (cardSource) {
              paymentMethodId = cardSource.id;
            }
          }
          
          if (!paymentMethodId) {
            console.log('❌ No payment methods or sources found for customer');
            return res.status(404).json({ error: 'No payment method found' });
          }
        }
      } catch (pmError) {
        console.log('❌ Error checking payment methods:', pmError.message);
        return res.status(500).json({ error: 'Error checking payment methods' });
      }
    }

    // Retrieve the payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    // Return the payment method data
    return res.status(200).json({
      paymentMethod: {
        id: paymentMethod.id,
        type: paymentMethod.type,
        card: paymentMethod.card ? {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          exp_month: paymentMethod.card.exp_month,
          exp_year: paymentMethod.card.exp_year,
          country: paymentMethod.card.country
        } : null,
        billing_details: paymentMethod.billing_details
      }
    });

  } catch (error) {
    console.error('Error fetching payment method:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch payment method',
      details: error.message 
    });
  }
});

// Payment success endpoint
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

app.listen(port, () => {
  console.log(`Local API server running on http://localhost:${port}`);
}); 