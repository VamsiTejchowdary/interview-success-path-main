import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { createClient } from '@supabase/supabase-js';

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
          await supabase
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
            await supabase
              .from('users')
              .update({ stripe_customer_id: invoice.customer })
              .eq('user_id', userByEmail.user_id);
          }
        }
      }

      if (userByCustomer) {
        // We do NOT insert payment if we can't find a subscription_id
        // This ensures we always record subscription_id for every payment
        console.log('❌ Subscription not found for invoice, will not insert payment. Will retry on next webhook delivery.');
        return;
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
      await supabase
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
      paid_at: invoice.paid_at ? new Date(invoice.paid_at * 1000).toISOString() : new Date().toISOString(),
      subscription_id: subscriptionData.subscription_id // Always set
    };

    // Only add payment_intent_id if it exists and is not null
    if (invoice.payment_intent) {
      paymentData.stripe_payment_intent_id = invoice.payment_intent;
    }

    console.log('Inserting payment with data:', paymentData);
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
      console.log('User update:', { user_id: subscriptionData.user_id, next_billing_at: nextBillingAt, error: userUpdateError?.message });
    } else {
      console.log('Could not determine next billing date from invoice:', invoice.id);
    }

    // --- EMAIL LOGIC START ---
    // Fetch user details
    const { data: user, error: userFetchError } = await supabase
      .from('users')
      .select('email, name, role')
      .eq('user_id', subscriptionData.user_id)
      .single();

    // Check if this is the first successful payment
    const { count: paymentCount } = await supabase
      .from('payments')
      .select('payment_id', { count: 'exact', head: true })
      .eq('user_id', subscriptionData.user_id)
      .eq('status', 'succeeded');

    if (user && user.email) {
      let isFirstPayment = paymentCount === 1; // This payment was just inserted
      console.log('[EMAIL] Preparing to send', isFirstPayment ? 'accountApproved' : 'subscriptionRenewal', 'email to user:', user.email, 'user:', user.name, 'role:', user.role);
      try {
        const userEmailRes = await sendEmail({
          from: 'noreply@jobsmartly.com',
          to: user.email,
          subject: isFirstPayment ? 'Account Approved! Welcome to Interview Success Path' : 'Your Subscription Has Been Renewed!',
          html: isFirstPayment
            ? accountApprovedTemplate(user.name || 'User', user.role || 'user').html
            : subscriptionRenewalTemplate(user.name || 'User', user.role || 'user').html,
        });
        console.log('[EMAIL] sendEmail user response:', userEmailRes);
      } catch (err) {
        console.error('[EMAIL] Error sending user email:', err);
      }
      try {
        const adminEmailRes = await sendEmail({
          from: 'noreply@jobsmartly.com',
          to: 'd.vamsitej333@gmail.com',
          subject: isFirstPayment
            ? `A new user has been approved: ${user.name}`
            : `Subscription renewed: ${user.name}`,
          html: `
            <div>
              <h2>${isFirstPayment ? 'New User Approved' : 'Subscription Renewed'}</h2>
              <p>Name: ${user.name}</p>
              <p>Email: ${user.email}</p>
              <p>Role: ${user.role}</p>
              <p>${isFirstPayment ? 'Payment was successful and their account is now active.' : 'A renewal payment was received and the subscription remains active.'}</p>
            </div>
          `,
        });
        console.log('[EMAIL] sendEmail admin response:', adminEmailRes);
      } catch (err) {
        console.error('[EMAIL] Error sending admin email:', err);
      }
    } else {
      console.log('[EMAIL] No user found for email sending:', { user, subscriptionData });
    }
    // --- EMAIL LOGIC END ---

    console.log('Invoice paid processed successfully:', invoice.id);
  } catch (error) {
    console.error('Error handling invoice paid:', error.message, error.stack);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription) {
  console.log('Handling subscription updated:', subscription.id, 'Customer:', subscription.customer);
  
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
    
    console.log('Stripe subscription data:', {
      id: subscription.id,
      status: updatedSubscription.status,
      currentPeriodStart,
      currentPeriodEnd,
      canceledAt,
      customer: subscription.customer
    });

    // Fallback to latest invoice if period dates are missing
    if (!currentPeriodStart || !currentPeriodEnd) {
      console.log('Subscription dates are null or missing, checking latest invoice...');
      const invoices = await stripe.invoices.list({
        subscription: subscription.id,
        limit: 1,
        status: 'paid'
      });
      
      if (invoices.data.length > 0 && invoices.data[0].lines?.data?.[0]) {
        const latestInvoice = invoices.data[0];
        console.log('Latest invoice data:', {
          invoiceId: latestInvoice.id,
          periodStart: latestInvoice.lines.data[0].period?.start
            ? new Date(latestInvoice.lines.data[0].period.start * 1000).toISOString()
            : null,
          periodEnd: latestInvoice.lines.data[0].period?.end
            ? new Date(latestInvoice.lines.data[0].period.end * 1000).toISOString()
            : null
        });
        
        if (!currentPeriodStart && latestInvoice.lines.data[0].period?.start) {
          currentPeriodStart = new Date(latestInvoice.lines.data[0].period.start * 1000).toISOString();
          console.log('Using invoice line period start as fallback:', currentPeriodStart);
        }
        if (!currentPeriodEnd && latestInvoice.lines.data[0].period?.end) {
          currentPeriodEnd = new Date(latestInvoice.lines.data[0].period.end * 1000).toISOString();
          console.log('Using invoice line period end as fallback:', currentPeriodEnd);
        }
      } else {
        console.log('No paid invoices found for subscription:', subscription.id);
      }
    }

    // Validate period dates
    if (!currentPeriodStart || !currentPeriodEnd) {
      console.error('Cannot update subscription: Missing valid period start or end dates');
      throw new Error('Missing valid period start or end dates for subscription update');
    }

    // Try updating subscription by stripe_subscription_id
    console.log('Attempting to update subscription with:', {
      stripe_subscription_id: subscription.id,
      currentPeriodStart,
      currentPeriodEnd
    });
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
        console.log('New subscription created:', {
          subscriptionId: data[0]?.subscription_id,
          currentPeriodStart: data[0]?.current_period_start,
          currentPeriodEnd: data[0]?.current_period_end
        });
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
        console.log('Fallback subscription update successful:', {
          subscriptionId: data[0]?.subscription_id,
          currentPeriodStart: data[0]?.current_period_start,
          currentPeriodEnd: data[0]?.current_period_end
        });
      }
    } else {
      console.log('Subscription updated successfully:', {
        subscriptionId: data[0]?.subscription_id,
        currentPeriodStart: data[0]?.current_period_start,
        currentPeriodEnd: data[0]?.current_period_end
      });
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

      console.log('User update:', {
        user_id: subscriptionData.user_id,
        next_billing_at: currentPeriodEnd,
        is_paid: userUpdate.is_paid,
        status: userUpdate.status,
        error: userUpdateError?.message
      });
      console.log('User updated successfully');
    } else {
      console.log('No user found for subscription:', subscription.id);
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