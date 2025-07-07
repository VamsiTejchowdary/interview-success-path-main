import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-06-30.basil' });

const PRODUCT_NAME = 'Premium Plan';
const CURRENCY = 'usd';

export default async function handler(req, res) {
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

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

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
    if (!customerId) {
      const customer = await stripe.customers.create({ email: userEmail });
      customerId = customer.id;
      const { error: updateError } = await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('email', userEmail);
      console.log('Created and stored customer ID:', customerId, { updateError: updateError?.message });
    }

    const userAmount = Math.round(userData.subscription_fee * 100);

    console.log('Creating checkout session for user:', userEmail, 'amount:', userAmount);

    const product = await stripe.products.create({ name: PRODUCT_NAME });
    const price = await stripe.prices.create({
      unit_amount: userAmount,
      currency: CURRENCY,
      recurring: { interval: 'month' },
      product: product.id,
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: price.id, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
      customer: customerId, // Use existing or new customer ID
    });

    console.log('Checkout session created:', session.id, 'Customer:', session.customer);

    res.json({ url: session.url });
  } catch (err) {
    console.error('Error creating checkout session:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to create Stripe Checkout session', details: err.message });
  }
}