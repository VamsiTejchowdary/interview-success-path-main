import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-06-30.basil' });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // console.log('🔍 Next invoice request received');
  // console.log('📋 Request body:', req.body);
  
  try {
    const { subscriptionId } = req.body;
    if (!subscriptionId) {
      return res.status(400).json({ error: 'Missing subscriptionId' });
    }

    // 1. Get the subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // 2. Get the latest invoice (if available)
    let invoice = null;
    if (subscription.latest_invoice) {
      invoice = await stripe.invoices.retrieve(subscription.latest_invoice);
    }

    // 3. Calculate next billing amount and date
    let nextBillingAmountCents = null;
    let nextBillingAmountDollars = null;
    if (subscription.items && subscription.items.data && subscription.items.data[0] && subscription.items.data[0].price) {
      nextBillingAmountCents = subscription.items.data[0].price.unit_amount;
      nextBillingAmountDollars = (nextBillingAmountCents / 100).toFixed(2);
    }
    let nextBillingDateTimestamp = subscription.current_period_end;
    let nextBillingDateISO = nextBillingDateTimestamp ? new Date(nextBillingDateTimestamp * 1000).toISOString() : null;

    // 4. Respond with relevant info
    res.json({
      current_period_end: subscription.current_period_end,
      next_billing_date: {
        timestamp: nextBillingDateTimestamp,
        iso: nextBillingDateISO
      },
      next_billing_amount: {
        cents: nextBillingAmountCents,
        dollars: nextBillingAmountDollars
      },
      amount_due: invoice ? invoice.amount_due : null,
      next_payment_attempt: invoice ? invoice.next_payment_attempt : null,
      currency: subscription.currency,
      discount: invoice ? invoice.discount : null,
      invoice_url: invoice ? invoice.hosted_invoice_url : null,
      lines: invoice ? invoice.lines : null,
    });
  } catch (error) {
    console.error('❌ Error fetching next invoice:', error);
    res.status(500).json({ error: error.message });
  }
}