import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_PUBLIC_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency = 'INR', receipt } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to cents
      currency: 'USD',
      receipt: receipt || `receipt_${Date.now()}`,
    });

    res.status(200).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: error.message });
  }
} 