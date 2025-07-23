import { buffer } from 'micro';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
// import { accountApprovedTemplate } from '../email-templates/accountApproved.js';
// import { subscriptionRenewalTemplate } from '../email-templates/subscriptionRenewal.js';
// import { Resend } from 'resend';
// const resend = new Resend(process.env.RESEND_API_KEY);
import fetch from 'node-fetch';
import { cancellationScheduledTemplate, cancellationEndedTemplate } from '../email-templates/subscriptionCancellationNotice.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-06-30.basil' });
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);


const apiBase = process.env.NEXT_PUBLIC_BASE_URL; 

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('📨 Webhook received:', req.method, req.url);
  console.log('📋 Headers:', Object.keys(req.headers));

  const rawBody = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    console.log('✅ Webhook signature verified');
    console.log('📨 Event type:', event.type);
    console.log('📨 Event ID:', event.id);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
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
        console.log('⚠️ Unhandled event type:', event.type);
        break;
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
        await supabase
          .from('users')
          .update({ stripe_customer_id: subscription.customer })
          .eq('email', customer.email);
      } else {
        console.error('No email found for customer:', subscription.customer);
        return;
      }
    }

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

    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('subscription_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    let subscriptionId;
    if (existingSubscription) {
      const { data } = await supabase
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
      const { data } = await supabase
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

    // Only update user status, don't create payment records here
    // Payment records will be created by invoice.paid event
    const nextBillingAt = currentPeriodEnd;
    await supabase
      .from('users')
      .update({
        is_paid: true,
        status: 'approved',
        next_billing_at: nextBillingAt
      })
      .eq('user_id', userData.user_id);
      
    console.log('✅ Subscription created successfully:', subscriptionId);
  } catch (error) {
    console.error('Error handling subscription created:', error.message, error.stack);
    throw error;
  }
}

async function handleInvoicePaid(invoice) {
  try {
    console.log('💰 Processing invoice.paid event');
    console.log('📋 Invoice ID:', invoice.id);
    console.log('📋 Customer ID:', invoice.customer);
    console.log('📋 Subscription ID:', invoice.subscription);
    console.log('📋 Amount:', invoice.amount_paid);
    console.log('📋 Status:', invoice.status);
    
    let subscriptionData = null;
    let userData = null;
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

    // Fallback: If still not found, try by customer (most recent subscription)
    if (!subscriptionData && invoice.customer) {
      const { data: subByCustomer, error: subError } = await supabase
        .from('subscriptions')
        .select('subscription_id, user_id')
        .eq('stripe_customer_id', invoice.customer)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (subByCustomer) {
        subscriptionData = subByCustomer;
        console.log('✅ Fallback: Found subscription by customer:', subscriptionData.subscription_id);
      } else {
        console.log('❌ Fallback: No subscription found for customer:', invoice.customer);
      }
    }

    // If subscription not found, try finding user by stripe_customer_id
    if (!subscriptionData && invoice.customer) {
      let { data: userByCustomer, error: userError } = await supabase
        .from('users')
        .select('user_id, email, first_name, last_name')
        .eq('stripe_customer_id', invoice.customer)
        .single();
      
      if (!userByCustomer) {
        const customer = await stripe.customers.retrieve(invoice.customer);
        if (customer.email) {
          const { data: userByEmail, error: emailError } = await supabase
            .from('users')
            .select('user_id, email, first_name, last_name')
            .eq('email', customer.email)
            .single();
          
          if (userByEmail) {
            userByCustomer = userByEmail;
            // Update stripe_customer_id for user
            await supabase
              .from('users')
              .update({ stripe_customer_id: invoice.customer })
              .eq('user_id', userByEmail.user_id);
          }
        }
      }

      if (userByCustomer) {
        userData = userByCustomer;
        console.log('✅ Found user by customer ID:', userData.user_id);
        
        // Try to find or create a subscription for this user
        const { data: existingSub, error: subError } = await supabase
          .from('subscriptions')
          .select('subscription_id, user_id')
          .eq('user_id', userData.user_id)
          .eq('stripe_customer_id', invoice.customer)
          .single();
          
        if (existingSub) {
          subscriptionData = existingSub;
          console.log('✅ Found existing subscription for user:', subscriptionData.subscription_id);
        }
      }
    }
    
    // If we still don't have subscription data but have user data, we'll proceed with payment recording
    // This ensures payments are recorded even if subscription lookup fails
    if (!subscriptionData && !userData) {
      console.log('❌ No subscription or user data found for invoice:', invoice.id);
      console.log('❌ Customer ID:', invoice.customer);
      console.log('❌ Subscription ID:', invoice.subscription);
      // Still return early only if we can't find any user data
      return;
    }
    
    const finalUserId = subscriptionData?.user_id || userData?.user_id;
    const finalSubscriptionId = subscriptionData?.subscription_id || null;
    
    console.log('✅ Processing payment with:', {
      user_id: finalUserId,
      subscription_id: finalSubscriptionId
    });

    // Update subscription period if subscription exists and invoice has period data
    if (finalSubscriptionId && invoice.lines?.data?.[0]?.period) {
      const periodStart = invoice.lines.data[0].period.start
        ? new Date(invoice.lines.data[0].period.start * 1000).toISOString()
        : null;
      const periodEnd = invoice.lines.data[0].period.end
        ? new Date(invoice.lines.data[0].period.end * 1000).toISOString()
        : null;
      await supabase
        .from('subscriptions')
        .update({
          current_period_start: periodStart,
          current_period_end: periodEnd,
          status: invoice.status === 'paid' ? 'active' : 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('subscription_id', finalSubscriptionId);
    }

    // Insert payment record with better duplicate prevention
    const paymentData = {
      user_id: finalUserId,
      stripe_invoice_id: invoice.id,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency.toUpperCase(),
      status: 'succeeded',
      payment_method: invoice.payment_method_details?.type || 'card',
      billing_reason: invoice.billing_reason,
      paid_at: invoice.paid_at ? new Date(invoice.paid_at * 1000).toISOString() : new Date().toISOString()
    };

    // Only add subscription_id if it exists
    if (finalSubscriptionId) {
      paymentData.subscription_id = finalSubscriptionId;
    }

    // Only add payment_intent_id if it exists and is not null
    if (invoice.payment_intent) {
      paymentData.stripe_payment_intent_id = invoice.payment_intent;
    }

    console.log('💳 Inserting payment record:', paymentData);

    // Check if payment already exists for this invoice - but be more specific
    const { data: existingPayment, error: checkError } = await supabase
      .from('payments')
      .select('payment_id, status')
      .eq('stripe_invoice_id', invoice.id)
      .single();

    if (existingPayment && existingPayment.status === 'succeeded') {
      console.log('⚠️ Successful payment already exists for invoice:', invoice.id);
      console.log('⚠️ Skipping payment insertion to avoid duplicates');
      // Still proceed with email logic in case email wasn't sent
    } else {
      // Use insert with conflict handling to prevent duplicates
      const { data: paymentResult, error: paymentError } = await supabase
        .from('payments')
        .insert(paymentData)
        .select();

      if (paymentError) {
        console.error('❌ Error inserting payment:', paymentError.message);
        console.error('❌ Payment data that failed:', JSON.stringify(paymentData, null, 2));
        if (paymentError.code === '23505') {
          console.error('❌ This is a unique constraint violation');
        } else if (paymentError.code === '23503') {
          console.error('❌ This is a foreign key constraint violation');
        }
        // Don't return early - still try to send email
      } else {
        console.log('✅ Payment record inserted successfully');
        console.log('✅ Payment ID:', paymentResult?.[0]?.payment_id);
      }
    }

    // Update subscription status to active after successful payment
    if (finalSubscriptionId) {
      await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('subscription_id', finalSubscriptionId);
    }

    // Update user with next_billing_at
    const nextBillingAt = invoice.lines?.data?.[0]?.period?.end 
      ? new Date(invoice.lines.data[0].period.end * 1000).toISOString() 
      : null;
    
    if (nextBillingAt) {
      await supabase
        .from('users')
        .update({
          is_paid: true,
          status: 'approved',
          next_billing_at: nextBillingAt,
          cancellation_requested: false // Reset cancellation_requested after payment
        })
        .eq('user_id', finalUserId);
    }

    // --- EMAIL LOGIC START ---
    // Fetch user details if we don't have them already
    let user = userData;
    if (!user) {
      const { data: fetchedUser, error: userFetchError } = await supabase
        .from('users')
        .select('email, first_name, last_name')
        .eq('user_id', finalUserId)
        .single();

      if (userFetchError) {
        console.log('[EMAIL] Supabase user fetch error:', userFetchError);
      } else {
        user = fetchedUser;
      }
    }

    const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ');

    // Check if this is the first successful payment - improved logic
    const { count: paymentCount } = await supabase
      .from('payments')
      .select('payment_id', { count: 'exact', head: true })
      .eq('user_id', finalUserId)
      .eq('status', 'succeeded');

    if (user && user.email) {
      let isFirstPayment = paymentCount <= 1; // Consider this the first if count is 1 or less
      console.log('[EMAIL] Payment count for user:', paymentCount, 'isFirstPayment:', isFirstPayment);
      console.log('[EMAIL] Preparing to send', isFirstPayment ? 'accountApproved' : 'subscriptionRenewal', 'email to user:', user.email, 'user:', fullName);
      
      try {
        const userEmailRes = await fetch(`${apiBase}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            template: isFirstPayment ? 'accountApproved' : 'subscriptionRenewal',
            templateData: [fullName || 'User', 'User'],
            to: user.email
          })
        });
        const userEmailText = await userEmailRes.text();
        console.log('[EMAIL] /api/send-email user response:', userEmailRes.status, userEmailText);
      } catch (err) {
        console.error('[EMAIL] Error sending user email:', err);
      }
      
      try {
        const adminEmailRes = await fetch(`${apiBase}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: isFirstPayment
              ? `A new user has been approved: ${fullName}`
              : `Subscription renewed: ${fullName}`,
            html: `
              <div>
                <h2>${isFirstPayment ? 'New User Approved' : 'Subscription Renewed'}</h2>
                <p>Name: ${fullName}</p>
                <p>Email: ${user.email}</p>
                <p>${isFirstPayment ? 'Payment was successful and their account is now active.' : 'A renewal payment was received and the subscription remains active.'}</p>
              </div>
            `,
            to: 'd.vamsitej333@gmail.com'
          })
        });
        const adminEmailText = await adminEmailRes.text();
        console.log('[EMAIL] /api/send-email admin response:', adminEmailRes.status, adminEmailText);
      } catch (err) {
        console.error('[EMAIL] Error sending admin email:', err);
      }
    } else {
      console.log('[EMAIL] No user found for email sending:', { user, finalUserId });
    }
    // --- EMAIL LOGIC END ---
  } catch (error) {
    console.error('❌ Error handling invoice paid:', error.message, error.stack);
    throw error;
  }
  
  console.log('✅ Invoice.paid event processed successfully');
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
      }
    }

    // Validate period dates
    if (!currentPeriodStart || !currentPeriodEnd) {
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
      const { data: subscriptionData, error: subError } = await supabase
        .from('subscriptions')
        .select('subscription_id, user_id, stripe_subscription_id')
        .eq('stripe_customer_id', subscription.customer)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (subError || !subscriptionData) {
        // If no active subscription found, create a new one
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('user_id')
          .eq('stripe_customer_id', subscription.customer)
          .single();

        if (userError || !userData) {
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
          throw new Error(`Failed to create subscription: ${insertError?.message}`);
        }

        data = newSubData;
      } else {
        // Update existing subscription with new stripe_subscription_id
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
          throw new Error(`Failed to update subscription: ${updateError?.message || 'Unknown error'}`);
        }

        data = updateData;
      }
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
    }

    // Fetch user details
    const { data: user, error: userFetchError } = await supabase
      .from('users')
      .select('email, first_name, last_name')
      .eq('stripe_customer_id', subscription.customer)
      .single();
    const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ');

    // Send cancellation scheduled email
    if (subscription.cancel_at_period_end) {
      const { subject, html } = cancellationScheduledTemplate(fullName);
      await fetch(`${apiBase}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: user.email, subject, html })
      });
      // Admin email
      const adminSubject = `[ADMIN] Subscription Cancellation Scheduled for ${fullName}`;
      const adminHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #eab308; margin-bottom: 10px;">Subscription Cancellation Scheduled</h2>
          <p><strong>User:</strong> ${fullName}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Status:</strong> Scheduled</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          <hr style="margin: 20px 0;">
          <p>The user has requested to cancel their subscription at the end of the current billing period. They will retain access until then.</p>
        </div>
      `;
      await fetch(`${apiBase}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: 'd.vamsitej333@gmail.com', subject: adminSubject, html: adminHtml })
      });
    }
    // Send cancellation ended email
    if (subscription.status === 'canceled') {
      const { subject, html } = cancellationEndedTemplate(fullName);
      await fetch(`${apiBase}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: user.email, subject, html })
      });
      // Admin email
      const adminSubject = `[ADMIN] Subscription Cancelled for ${fullName}`;
      const adminHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #ef4444; margin-bottom: 10px;">Subscription Cancelled</h2>
          <p><strong>User:</strong> ${fullName}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Status:</strong> Completed</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          <hr style="margin: 20px 0;">
          <p>The user’s subscription has been fully cancelled and access has ended.</p>
        </div>
      `;
      await fetch(`${apiBase}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: 'd.vamsitej333@gmail.com', subject: adminSubject, html: adminHtml })
      });
    }
  } catch (error) {
    console.error('Error handling subscription updated:', error.message, error.stack);
    throw error;
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

    // Fetch user details
    const { data: user, error: userFetchError } = await supabase
      .from('users')
      .select('email, first_name, last_name')
      .eq('stripe_customer_id', subscription.customer)
      .single();
    const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ');
    // Send cancellation ended email
    const { subject, html } = cancellationEndedTemplate(fullName);
    await fetch(`${apiBase}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: user.email, subject, html })
    });
    // Admin email
    const adminSubject = `[ADMIN] Subscription Cancelled for ${fullName}`;
    const adminHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #ef4444; margin-bottom: 10px;">Subscription Cancelled</h2>
        <p><strong>User:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Status:</strong> Completed</p>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        <hr style="margin: 20px 0;">
        <p>The user’s subscription has been fully cancelled and access has ended.</p>
      </div>
    `;
    await fetch(`${apiBase}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: 'd.vamsitej333@gmail.com', subject: adminSubject, html: adminHtml })
    });
  } catch (error) {
    console.error('Error handling subscription deleted:', error.message, error.stack);
    throw error;
  }
}

async function handleInvoicePaymentFailed(invoice) {
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

    await supabase
      .from('users')
      .update({
        is_paid: false,
        status: 'on_hold'
      })
      .eq('user_id', subscriptionData.user_id);
  } catch (error) {
    console.error('Error handling invoice payment failed:', error.message, error.stack);
    throw error;
  }
}

async function handleInvoiceUpcoming(invoice) {
  try {
  } catch (error) {
    console.error('Error handling invoice upcoming:', error.message, error.stack);
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
    else if (event.type.startsWith('invoice.')) {
      subscriptionId = event.data.object.subscription;
      extractionSource = 'invoice.subscription (event.data.object.subscription)';
    }
    else if (event.type === 'checkout.session.completed') {
      subscriptionId = event.data.object.subscription;
      extractionSource = 'checkout.session.subscription (event.data.object.subscription)';
    }
    else if (event.type.startsWith('payment_intent.')) {
      if (event.data.object.invoice) {
        extractionSource = 'payment_intent.invoice (event.data.object.invoice)';
        try {
          const invoice = await stripe.invoices.retrieve(event.data.object.invoice);
          subscriptionId = invoice.subscription;
          extractionSource += ' → fetched invoice.subscription';
        } catch (err) {
          // Only log error in dev
        }
      }
    }
    else if (event.type.startsWith('charge.')) {
      if (event.data.object.invoice) {
        extractionSource = 'charge.invoice (event.data.object.invoice)';
        try {
          const invoice = await stripe.invoices.retrieve(event.data.object.invoice);
          subscriptionId = invoice.subscription;
          extractionSource += ' → fetched invoice.subscription';
        } catch (err) {
          // Only log error in dev
        }
      }
    }
    if (!subscriptionId) {
      if (event.data.object.subscription) {
        subscriptionId = event.data.object.subscription;
        extractionSource = 'default: event.data.object.subscription';
      } else if (event.data.object.id && String(event.data.object.id).startsWith('sub_')) {
        subscriptionId = event.data.object.id;
        extractionSource = 'default: event.data.object.id (sub_*)';
      }
    }

    let localSubscriptionId = null;
    if (subscriptionId) {
      try {
        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('subscription_id')
          .eq('stripe_subscription_id', subscriptionId)
          .single();
        if (subscriptionData) {
          localSubscriptionId = subscriptionData.subscription_id;
        }
      } catch (error) {
        // Only log error in dev
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
    console.error('Error logging subscription event:', error.message, error.stack);
  }
}