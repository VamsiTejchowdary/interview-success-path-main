# Razorpay Payment Integration Setup

This guide explains how to set up Razorpay payments for the JobSmartly application.

## 🚀 Overview

The payment system uses:
- **Vercel API Routes** (serverless functions) for secure payment processing
- **Razorpay Checkout** for the payment UI
- **Supabase** for storing payment status

## 📋 Prerequisites

1. **Razorpay Account**: Sign up at [razorpay.com](https://razorpay.com)
2. **Vercel Account**: For deploying the serverless functions
3. **Supabase Project**: Already set up for your app

## 🔑 Environment Variables

Add these to your `.env` file:

```env
# Frontend (public key)
VITE_RAZORPAY_PUBLIC_KEY=your_razorpay_public_key

# Backend (serverless functions)
RAZORPAY_PUBLIC_KEY=your_razorpay_public_key
RAZORPAY_SECRET_KEY=your_razorpay_secret_key
```

## 🛠️ Setup Steps

### 1. Get Razorpay Keys

1. Log into your Razorpay Dashboard
2. Go to **Settings** → **API Keys**
3. Copy your **Key ID** and **Key Secret**
4. Add them to your environment variables

### 2. Deploy to Vercel

1. Push your code to GitHub
2. Connect your repo to Vercel
3. Add the environment variables in Vercel dashboard:
   - `RAZORPAY_PUBLIC_KEY`
   - `RAZORPAY_SECRET_KEY`
   - `VITE_RAZORPAY_PUBLIC_KEY`

### 3. Test the Integration

1. Deploy your app
2. Go to a user's profile dashboard
3. Click "Pay Now" button
4. Complete a test payment

## 🔒 Security Features

- **Server-side order creation**: Orders are created securely in serverless functions
- **Payment verification**: All payments are verified using Razorpay signatures
- **Database updates**: Payment status is only updated after successful verification
- **No secret keys in frontend**: Secret keys are never exposed to the browser

## 📁 Files Created

- `api/payments/create-order.js` - Creates Razorpay orders
- `api/payments/verify.js` - Verifies payments and updates user status
- Updated `src/components/dashboards/student/ProfileTab.tsx` - Added payment UI
- Updated `index.html` - Added Razorpay script

## 💰 Payment Flow

1. User clicks "Pay Now" in profile dashboard
2. Frontend calls `/api/payments/create-order` to create order
3. Razorpay Checkout opens with order details
4. User completes payment
5. Frontend calls `/api/payments/verify` to verify payment
6. User's payment status is updated in Supabase
7. UI refreshes to show new payment status

## 🧪 Testing

### Test Mode
- Use Razorpay's test mode for development
- Test cards: 4111 1111 1111 1111 (any future expiry, any CVV)
- Test UPI: success@razorpay
- **Note**: Razorpay primarily supports INR. For USD payments, consider using Stripe or PayPal as alternatives.

### Production Mode
- Switch to live mode in Razorpay dashboard
- Update environment variables with live keys

## 🚨 Important Notes

- **Never commit secret keys** to your repository
- **Always verify payments** on the server side
- **Test thoroughly** before going live
- **Monitor payments** in Razorpay dashboard

## 🆘 Troubleshooting

### Common Issues

1. **"Failed to create order"**
   - Check if Razorpay keys are correct
   - Verify environment variables are set
   - Ensure `RAZORPAY_PUBLIC_KEY` and `RAZORPAY_SECRET_KEY` are configured

2. **"Invalid signature"**
   - Ensure you're using the correct `RAZORPAY_SECRET_KEY`
   - Check if the payment was actually successful

3. **Payment not updating in database**
   - Check Supabase connection
   - Verify user_id is being passed correctly

### Support

- Razorpay Documentation: [docs.razorpay.com](https://docs.razorpay.com)
- Vercel API Routes: [vercel.com/docs/functions](https://vercel.com/docs/functions) 