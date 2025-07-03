import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
} 