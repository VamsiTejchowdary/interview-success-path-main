import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

// Replace with your actual product/price IDs if you create them in the dashboard
const PRODUCT_NAME = 'Premium Plan';
const PRICE_AMOUNT = 15000; // $150.00 in cents
const CURRENCY = 'usd';

// Create a price object on the fly (for demo; in production, use a fixed price ID)
async function getOrCreatePrice() {
  // In production, create the product/price in Stripe dashboard and use the price ID
  const product = await stripe.products.create({ name: PRODUCT_NAME });
  const price = await stripe.prices.create({
    unit_amount: PRICE_AMOUNT,
    currency: CURRENCY,
    recurring: { interval: 'month' },
    product: product.id,
  });
  return price.id;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Manually parse body for Vercel compatibility
  let body = req.body;
  if (!body || typeof body === 'string') {
    try {
      body = JSON.parse(body || '{}');
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
  }

  const { userEmail } = body;
  try {
    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required' });
    }

    // Check if environment variables are set
    if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Get user's subscription fee from database
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('subscription_fee')
      .eq('email', userEmail)
      .single();

    if (userError) {
      console.error('Supabase error:', userError);
      return res.status(500).json({ error: 'Database error', details: userError });
    }

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userAmount = Math.round(userData.subscription_fee * 100); // Convert to cents and round

    console.log('Creating checkout session for user:', userEmail, 'amount:', userAmount);

    // Create a price object with user's specific amount
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
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
    });
    
    res.json({ url: session.url });
  } catch (err) {
    console.error('Error creating checkout session:', err);
    res.status(500).json({ error: 'Failed to create Stripe Checkout session', details: err.message, stack: err.stack });
  }
} 