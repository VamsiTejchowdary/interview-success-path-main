// Simple Stripe Checkout server for subscription
import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

app.use(cors({ origin: /http:\/\/localhost:\d+/ }));
app.use(express.json());

// Replace with your actual product/price IDs if you create them in the dashboard
const PRODUCT_NAME = 'Premium Plan';
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

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { userEmail } = req.body;
    
    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required' });
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
      success_url: 'http://localhost:8080/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:8080/cancel',
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

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log(`Stripe server running on http://localhost:${PORT}`);
}); 