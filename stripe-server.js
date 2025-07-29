import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
const { cancellationScheduledTemplate, cancellationEndedTemplate } = require('./email-templates/subscriptionCancellationNotice.js');

dotenv.config({ path: '.env.local' });

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-06-30.basil' });
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Email sending function
const sendEmail = async (emailData) => {
  try {
    const { data, error } = await resend.emails.send({
      from: emailData.from || 'JobSmartly <noreply@jobsmartly.com>',
      to: emailData.to || "support@jobsmartly.com",
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

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { userEmail } = req.body;
    
    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required' });
    }

    // Get user's subscription fee and customer ID from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('subscription_fee, stripe_customer_id')
      .eq('email', userEmail)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'User not found' });
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

    const userAmount = userData.subscription_fee * 100; // Convert to cents

    // Create a price object with user's specific amount
    const product = await stripe.products.create({ name: PRODUCT_NAME });
    const price = await stripe.prices.create({
      unit_amount: userAmount,
      currency: CURRENCY,
      recurring: { interval: 'month' },
      product: product.id,
    });

    console.log('Creating checkout session for user:', userEmail, 'amount:', userAmount, 'customer:', customerId);
    
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
      customer: customerId,
      allow_promotion_codes: true, // Allow promotion codes
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Error creating checkout session:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to create Stripe Checkout session', details: err.message });
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

// Get payment method for a customer
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
    console.log('📋 Customer data:', {
      id: customer.id,
      email: customer.email,
      default_source: customer.default_source,
      default_payment_method: customer.invoice_settings?.default_payment_method,
      invoice_settings: customer.invoice_settings,
      sources: customer.sources?.data?.length || 0
    });
    
    // Check for default payment method first (preferred)
    if (customer.invoice_settings?.default_payment_method) {
      paymentMethodId = customer.invoice_settings.default_payment_method;
      console.log('✅ Using default payment method:', paymentMethodId);
    } else if (customer.default_source) {
      // Fallback to default source (older method)
      paymentMethodId = customer.default_source;
      console.log('✅ Using default source:', paymentMethodId);
    } else {
      // If no default is set, try to get the first available payment method
      console.log('🔍 No default payment method, checking available payment methods...');
      
      // First try payment methods
      try {
        const paymentMethods = await stripe.paymentMethods.list({
          customer: customerId,
          type: 'card',
        });
        
        if (paymentMethods.data.length > 0) {
          paymentMethodId = paymentMethods.data[0].id;
          console.log('✅ Using first available payment method:', paymentMethodId);
        } else {
          console.log('💳 No payment methods found, checking sources...');
          
          // If no payment methods, check sources (older Stripe method)
          if (customer.sources && customer.sources.data.length > 0) {
            const cardSource = customer.sources.data.find(source => source.object === 'card');
            if (cardSource) {
              paymentMethodId = cardSource.id;
              console.log('✅ Using card source:', paymentMethodId);
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

// Stripe Webhook Handler
app.post('/api/stripe-webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
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

    // Insert or update subscription
    const { data: existingSubscription, error: existingSubError } = await supabase
      .from('subscriptions')
      .select('subscription_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    console.log('Existing subscription check:', { existingSubscription, error: existingSubError?.message });

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
      console.log('Subscription update:', { updateError: updateError?.message });
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
      console.log('Subscription insert:', { insertError: insertError?.message });
      subscriptionId = data?.[0]?.subscription_id;
    }

    // Only update user status, don't create payment records here
    // Payment records will be created by invoice.paid event

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
    console.log('User update:', { userUpdateError: userUpdateError?.message });

    console.log('Subscription created successfully for user:', userData.email);
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

    // --- COUPON USAGE TRACKING START ---
    // Coupon usage is now handled in checkout.session.completed webhook
    // This ensures we capture the coupon information when it's available
    console.log('📋 Coupon tracking handled in checkout.session.completed webhook');
    // --- COUPON USAGE TRACKING END ---

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

async function handleCheckoutSessionCompleted(checkoutSession) {
  try {
    console.log('🛒 Processing checkout.session.completed event');
    console.log('📋 Checkout Session ID:', checkoutSession.id);
    console.log('📋 Customer ID:', checkoutSession.customer);
    console.log('📋 Subscription ID:', checkoutSession.subscription);
    console.log('📋 Amount Total:', checkoutSession.amount_total);
    console.log('📋 Amount Subtotal:', checkoutSession.amount_subtotal);
    
    // Get the full session with expanded breakdown to access discount details
    const sessionWithDiscounts = await stripe.checkout.sessions.retrieve(checkoutSession.id, { 
      expand: ['total_details.breakdown'] 
    });
    
    console.log('🎫 Session with discounts:', JSON.stringify(sessionWithDiscounts.total_details, null, 2));
    
    // Check if there are any discounts applied
    const totalDetails = sessionWithDiscounts.total_details;
    console.log('🎫 Total Details:', totalDetails);
    
    if (totalDetails && totalDetails.breakdown && totalDetails.breakdown.discounts && totalDetails.breakdown.discounts.length > 0) {
      console.log('🎫 Discounts found in checkout session:', totalDetails.breakdown.discounts);
      
      // Process each discount
      for (const discount of totalDetails.breakdown.discounts) {
        console.log('🎫 Processing discount:', discount);
        
        // Get the discount information
        const discountInfo = discount.discount;
        console.log('🎫 Discount info:', discountInfo);
        
        if (discountInfo && discountInfo.coupon) {
          console.log('🎫 Coupon used:', discountInfo.coupon.id);
          console.log('🎫 Promotion code ID:', discountInfo.promotion_code);
          
          let promotionCodeName = null;
          
          // If we have a promotion_code ID, fetch the actual promotion code name
          if (discountInfo.promotion_code) {
            try {
              const promotionCode = await stripe.promotionCodes.retrieve(discountInfo.promotion_code);
              promotionCodeName = promotionCode.code;
              console.log('🎫 Promotion code name:', promotionCodeName);
            } catch (error) {
              console.log('⚠️ Error fetching promotion code:', error.message);
            }
          }
          
          // Try to find the coupon by promotion code name first, then by coupon ID
          let couponData = null;
          let couponError = null;
          
          if (promotionCodeName) {
            console.log('🔍 Searching for coupon by promotion code name:', promotionCodeName);
            const { data, error } = await supabase
              .from('coupons')
              .select('coupon_id, code, affiliate_user_id, no_of_coupon_used')
              .eq('code', promotionCodeName)
              .single();
            couponData = data;
            couponError = error;
          }
          
          // If not found by promotion code, try by coupon ID
          if (!couponData && discountInfo.coupon.id) {
            console.log('🔍 Searching for coupon by coupon ID:', discountInfo.coupon.id);
            const { data, error } = await supabase
              .from('coupons')
              .select('coupon_id, code, affiliate_user_id, no_of_coupon_used')
              .eq('code', discountInfo.coupon.id)
              .single();
            couponData = data;
            couponError = error;
          }

          if (couponError && couponError.code !== 'PGRST116') {
            console.log('⚠️ Error fetching coupon:', couponError.message);
          } else if (couponData) {
            console.log('✅ Found coupon in database:', couponData.code);
            
            // Get user ID from subscription or customer
            let userId = null;
            if (checkoutSession.subscription) {
              console.log('🔍 Looking for user by subscription ID:', checkoutSession.subscription);
              const { data: subscriptionData, error: subError } = await supabase
                .from('subscriptions')
                .select('user_id')
                .eq('stripe_subscription_id', checkoutSession.subscription)
                .single();
              
              if (subError) {
                console.log('⚠️ Error finding subscription:', subError.message);
              } else if (subscriptionData) {
                userId = subscriptionData.user_id;
                console.log('✅ Found user ID from subscription:', userId);
              }
            }
            
            // If not found by subscription, try by customer ID
            if (!userId && checkoutSession.customer) {
              console.log('🔍 Looking for user by customer ID:', checkoutSession.customer);
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('user_id')
                .eq('stripe_customer_id', checkoutSession.customer)
                .single();
              
              if (userError) {
                console.log('⚠️ Error finding user by customer:', userError.message);
              } else if (userData) {
                userId = userData.user_id;
                console.log('✅ Found user ID from customer:', userId);
              }
            }
            
            if (userId) {
              // Check if this coupon usage already exists
              const { data: existingUsage, error: usageCheckError } = await supabase
                .from('coupon_usages')
                .select('usage_id')
                .eq('user_id', userId)
                .eq('coupon_id', couponData.coupon_id)
                .eq('stripe_invoice_id', checkoutSession.id)
                .single();

              if (usageCheckError && usageCheckError.code !== 'PGRST116') {
                console.log('⚠️ Error checking existing coupon usage:', usageCheckError.message);
              } else if (!existingUsage) {
                // Insert coupon usage record
                const { data: usageData, error: usageError } = await supabase
                  .from('coupon_usages')
                  .insert({
                    coupon_id: couponData.coupon_id,
                    user_id: userId,
                    stripe_invoice_id: checkoutSession.id, // Using checkout session ID as reference
                    used_at: new Date().toISOString()
                  })
                  .select();

                if (usageError) {
                  console.error('❌ Error inserting coupon usage:', usageError);
                } else {
                  console.log('✅ Coupon usage recorded:', usageData?.[0]?.usage_id);
                  
                  // Increment coupon usage count
                  const { error: updateError } = await supabase
                    .from('coupons')
                    .update({
                      no_of_coupon_used: (couponData.no_of_coupon_used || 0) + 1
                    })
                    .eq('coupon_id', couponData.coupon_id);

                  if (updateError) {
                    console.error('❌ Error updating coupon count:', updateError);
                  } else {
                    console.log('✅ Coupon usage count incremented');
                  }
                }
              } else {
                console.log('⚠️ Coupon usage already recorded for this checkout session');
              }
            } else {
              console.log('⚠️ Could not find user ID for checkout session');
            }
          } else {
            console.log('⚠️ Coupon not found in database:', discountInfo.coupon.id);
          }
        } else {
          console.log('⚠️ No coupon information found in discount');
        }
      }
    } else {
      console.log('📋 No discounts found in checkout session');
    }
  } catch (error) {
    console.error('❌ Error handling checkout session completed:', error.message, error.stack);
  }
}

async function handleSubscriptionUpdated(subscription) {
  console.log('Handling subscription updated:', subscription.id, 'Customer:', subscription.customer);
  
  try {
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
      await sendEmail({ to: user.email, subject, html });
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
      await sendEmail({ to: 'd.vamsitej333@gmail.com', subject: adminSubject, html: adminHtml });
    }
    // Send cancellation ended email
    if (subscription.status === 'canceled') {
      const { subject, html } = cancellationEndedTemplate(fullName);
      await sendEmail({ to: user.email, subject, html });
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
      await sendEmail({ to: 'd.vamsitej333@gmail.com', subject: adminSubject, html: adminHtml });
    }

    console.log('Subscription updated successfully for subscription:', subscription.id);
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

    // Fetch user details
    const { data: user, error: userFetchError } = await supabase
      .from('users')
      .select('email, first_name, last_name')
      .eq('stripe_customer_id', subscription.customer)
      .single();
    const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ');
    // Send cancellation ended email
    const { subject, html } = cancellationEndedTemplate(fullName);
    await sendEmail({ to: user.email, subject, html });
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
    await sendEmail({ to: 'd.vamsitej333@gmail.com', subject: adminSubject, html: adminHtml });

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
    let subscriptionId = null;
    
    // Extract subscription_id based on event type
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        // For subscription events, the event data is the subscription object
        subscriptionId = event.data.object.id;
        break;
        
      case 'invoice.paid':
      case 'invoice.payment_failed':
      case 'invoice.upcoming':
        // For invoice events, get subscription_id from the invoice
        subscriptionId = event.data.object.subscription;
        break;
        
      case 'checkout.session.completed':
        // For checkout session events, get subscription_id from the session
        subscriptionId = event.data.object.subscription;
        
        // Handle coupon tracking for checkout sessions
        await handleCheckoutSessionCompleted(event.data.object);
        break;
        
      default:
        // For other events, try to find subscription_id in the event data
        subscriptionId = event.data.object.subscription || event.data.object.id;
        break;
    }

    // If we have a subscription_id, try to get the local subscription_id from our database
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
        console.log('Could not find local subscription_id for stripe_subscription_id:', subscriptionId);
      }
    }

    const { error } = await supabase
      .from('subscription_events')
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        event_data: event.data.object,
        subscription_id: localSubscriptionId,
        processed: true
      });
    console.log('Logged subscription event:', event.id, event.type, { 
      subscriptionId: localSubscriptionId,
      error: error?.message 
    });
  } catch (error) {
    console.error('Error logging subscription event:', error.message, error.stack);
  }
}
const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log(`Stripe server running on http://localhost:${PORT}`);
}); 