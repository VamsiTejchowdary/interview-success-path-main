const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_PUBLIC_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

// Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Test endpoint
app.get('/api/payments/test', (req, res) => {
  res.json({
    message: 'Payment API is working locally',
    publicKey: process.env.RAZORPAY_PUBLIC_KEY ? 'Set' : 'Missing',
    secretKey: process.env.RAZORPAY_SECRET_KEY ? 'Set' : 'Missing',
    timestamp: new Date().toISOString()
  });
});

// Create order endpoint
app.post('/api/payments/create-order', async (req, res) => {
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

    console.log('Order created:', order);
    res.status(200).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify payment endpoint
app.post('/api/payments/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, user_id } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !user_id) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Verify the payment signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET_KEY)
      .update(sign)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Invalid signature' });
    }

    // Payment is verified, update user's payment status in Supabase
    const now = new Date();
    const nextBilling = new Date(now);
    nextBilling.setMonth(now.getMonth() + 1);

    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_paid: true,
        next_billing_at: nextBilling.toISOString(),
      })
      .eq('user_id', user_id);

    if (updateError) {
      console.error('Error updating user payment status:', updateError);
      return res.status(500).json({ success: false, error: 'Failed to update payment status' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Payment verified and user status updated',
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Local server running on http://localhost:${PORT}`);
  console.log(`📝 Test endpoint: http://localhost:${PORT}/api/payments/test`);
  console.log(`💳 Payment endpoints: http://localhost:${PORT}/api/payments/`);
}); 