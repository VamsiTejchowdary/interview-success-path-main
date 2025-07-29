import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-06-30.basil' });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { customerId, subscriptionId } = req.body;
  if (!customerId || !subscriptionId) {
    return res.status(400).json({ error: 'Missing customerId or subscriptionId' });
  }
  try {
    console.log('customerId_in_get_next_invoice', customerId);
    console.log('subscriptionId_in_get_next_invoice', subscriptionId);
    const invoice = await stripe.invoices.retrieveUpcoming({
      customer: customerId,
      subscription: subscriptionId,
    });
    res.json({
      amount_due: invoice.amount_due,
      next_payment_attempt: invoice.next_payment_attempt,
      currency: invoice.currency,
      discount: invoice.discount,
      invoice_url: invoice.hosted_invoice_url,
      lines: invoice.lines,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 
