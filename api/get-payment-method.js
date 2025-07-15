import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-06-30.basil' });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    // Get all card payment methods for the customer, most recent first
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    if (paymentMethods.data.length === 0) {
      return res.status(404).json({ error: 'No payment method found' });
    }

    // Map all payment methods to return relevant card details
    const paymentMethodsData = paymentMethods.data.map(pm => ({
      id: pm.id,
      type: pm.type,
      card: pm.card ? {
        brand: pm.card.brand,
        last4: pm.card.last4,
        exp_month: pm.card.exp_month,
        exp_year: pm.card.exp_year,
        country: pm.card.country
      } : null,
      billing_details: pm.billing_details
    }));

    // Return all payment methods (most recent first)
    return res.status(200).json({
      paymentMethods: paymentMethodsData
    });

  } catch (error) {
    console.error('Error fetching payment method:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch payment method',
      details: error.message 
    });
  }
} 