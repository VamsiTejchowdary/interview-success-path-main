# 🚀 Vercel Deployment Guide for Stripe Integration

## Prerequisites
- Vercel account
- Stripe account (switch to Live mode)
- Supabase project

## 1. Environment Variables Setup

### In Vercel Dashboard:
Go to your project → Settings → Environment Variables

**Add these variables:**

```
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe (LIVE MODE)
STRIPE_SECRET_KEY=sk_live_your_live_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret

# Email (Resend)
RESEND_API_KEY=your_resend_api_key

# App URL
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
```

## 2. Stripe Live Mode Setup

### Get Live Stripe Keys:
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Switch to "Live" mode
3. Copy your live secret key and publishable key

### Create Live Webhook Endpoint:
1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. **Endpoint URL:** `https://your-domain.vercel.app/api/stripe-webhook`
4. **Events to send:**
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `invoice.upcoming`

## 3. Update Domain in Code

Replace `https://your-domain.vercel.app` in `stripe-server.js` with your actual Vercel domain.

## 4. Deploy to Vercel

```bash
vercel --prod
```

## 5. Test Production Setup

1. Create a test subscription in your live app
2. Check webhook events in Stripe Dashboard
3. Verify database updates in Supabase

## 6. Monitoring

- Monitor webhook events in Stripe Dashboard
- Check Vercel function logs for errors
- Monitor Supabase for successful database updates

## Security Notes

- ✅ Never commit live Stripe keys to git
- ✅ Use environment variables for all secrets
- ✅ Enable webhook signature verification
- ✅ Monitor for failed webhook deliveries 