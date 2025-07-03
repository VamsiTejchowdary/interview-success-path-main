export default function handler(req, res) {
  res.status(200).json({
    message: 'Payment API is working',
    publicKey: process.env.RAZORPAY_PUBLIC_KEY ? 'Set' : 'Missing',
    secretKey: process.env.RAZORPAY_SECRET_KEY ? 'Set' : 'Missing',
    timestamp: new Date().toISOString()
  });
} 