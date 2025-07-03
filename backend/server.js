const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay order
app.post('/api/payments/create-order', async (req, res) => {
  const { amount, currency = 'INR', receipt } = req.body;
  try {
    const order = await razorpay.orders.create({
      amount: amount * 100, // paise
      currency,
      receipt,
    });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify payment
app.post('/api/payments/verify', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const sign = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(sign)
    .digest('hex');
  if (expectedSignature === razorpay_signature) {
    // TODO: Mark user as paid in your DB here!
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false, error: 'Invalid signature' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 