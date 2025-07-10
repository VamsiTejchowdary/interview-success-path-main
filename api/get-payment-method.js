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

    // Get the customer's default payment method
    const customer = await stripe.customers.retrieve(customerId, {
      expand: ['invoice_settings.default_payment_method', 'sources']
    });
    
    let paymentMethodId = null;
    
    // Check for default payment method first (preferred)
    if (customer.invoice_settings?.default_payment_method) {
      paymentMethodId = customer.invoice_settings.default_payment_method;
    } else if (customer.default_source) {
      // Fallback to default source (older method)
      paymentMethodId = customer.default_source;
    } else {
      // If no default is set, try to get the first available payment method
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });
      
      if (paymentMethods.data.length > 0) {
        paymentMethodId = paymentMethods.data[0].id;
      } else {
        return res.status(404).json({ error: 'No payment method found' });
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
} 