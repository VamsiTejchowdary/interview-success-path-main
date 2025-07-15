# Stripe Webhook Setup Guide

This guide will help you set up Stripe webhooks to handle subscription events and test your existing subscription functionality.

## Prerequisites

1. Stripe account with API keys
2. Supabase database with the required tables
3. Node.js environment with the necessary dependencies

## Step 1: Database Setup

First, run the migration script to add the `stripe_customer_id` column to your users table:

```sql
-- Run this in your Supabase SQL editor
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
```

Or use the provided migration script:
```bash
# Copy the SQL from scripts/02-add-stripe-customer-id.sql and run it in Supabase
```

## Step 2: Environment Variables

Add these environment variables to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook endpoint secret (you'll get this in step 3)

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Application Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:4242 # Your app URL
```

## Step 3: Configure Stripe Webhook Endpoint

### For Development (using Stripe CLI):

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli

2. Login to Stripe:
```bash
stripe login
```

3. Forward webhooks to your local server:
```bash
stripe listen --forward-to localhost:4242/api/stripe-webhook
```

4. Copy the webhook signing secret from the output and add it to your `.env` file:
```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

### For Production:

1. Go to your Stripe Dashboard → Developers → Webhooks

2. Click "Add endpoint"

3. Set the endpoint URL:
   - Development: `http://localhost:4242/api/stripe-webhook`
   - Production: `https://your-domain.com/api/stripe-webhook`

4. Select these events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `invoice.upcoming`

5. Click "Add endpoint"

6. Copy the webhook signing secret and add it to your environment variables

## Step 4: Deploy the Webhook Handler

The webhook handler is located at `api/stripe-webhook.js`. Make sure it's accessible at your webhook endpoint URL.

### For Vercel:
- The file should be automatically deployed when you push to your repository
- The endpoint will be available at: `https://your-domain.vercel.app/api/stripe-webhook`

### For Local Development:
- Make sure your development server is running on port 3000
- Use Stripe CLI to forward webhooks (see step 3)

## Step 5: Test Your Setup

### 1. Check Current Database State

Run the database check script to see your current subscription status:

```bash
node scripts/check-subscription-status.js
```

To check a specific user:
```bash
node scripts/check-subscription-status.js user user@example.com
```

### 2. Test Webhook Events

Run the webhook testing script to simulate Stripe events:

```bash
# Test complete subscription lifecycle
node scripts/test-webhooks.js lifecycle

# Test payment failure
node scripts/test-webhooks.js failure

# Test subscription cancellation
node scripts/test-webhooks.js cancellation

# Run all tests
node scripts/test-webhooks.js all
```

### 3. Test with Real Stripe Events

1. Create a test subscription in Stripe Dashboard
2. Use Stripe CLI to trigger real events:
```bash
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
```

## Step 6: Monitor Webhook Events

### Check Webhook Logs

The webhook handler logs all events to the `subscription_events` table. You can query this table to see:

```sql
SELECT * FROM subscription_events ORDER BY created_at DESC LIMIT 10;
```

### Monitor Failed Webhooks

Check your server logs for webhook processing errors. Common issues:

1. **Signature verification failed**: Check your `STRIPE_WEBHOOK_SECRET`
2. **Database connection errors**: Verify your Supabase credentials
3. **Missing user records**: Ensure users have `stripe_customer_id` set

## Step 7: Test Your Existing Subscription

To test whether your existing subscription will work after one month:

### 1. Check Current Subscription Status

```bash
node scripts/check-subscription-status.js
```

### 2. Simulate Monthly Renewal

```bash
# This will simulate a payment success event for the next billing cycle
node scripts/test-webhooks.js lifecycle
```

### 3. Verify Database Updates

After running the test, check that these fields were updated:

- `users.next_billing_at` - Should be set to next month
- `users.is_paid` - Should remain true
- `payments` table - Should have a new payment record
- `subscriptions.current_period_end` - Should be updated

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**:
   - Check your endpoint URL is correct
   - Verify the webhook is active in Stripe Dashboard
   - Check your server is running and accessible

2. **Signature verification errors**:
   - Ensure `STRIPE_WEBHOOK_SECRET` is correct
   - Check you're using the right secret for your environment (test/live)

3. **Database errors**:
   - Verify Supabase credentials
   - Check table schema matches the webhook handler expectations
   - Ensure required columns exist

4. **User not found errors**:
   - Make sure users have `stripe_customer_id` set
   - Check the customer ID matches between Stripe and your database

### Debug Mode

Enable debug logging by adding this to your webhook handler:

```javascript
console.log('Webhook event received:', JSON.stringify(event, null, 2));
```

### Testing with Stripe CLI

Use Stripe CLI to test specific scenarios:

```bash
# Test subscription creation
stripe trigger customer.subscription.created

# Test payment success
stripe trigger invoice.payment_succeeded

# Test payment failure
stripe trigger invoice.payment_failed

# Test subscription cancellation
stripe trigger customer.subscription.deleted
```

## Production Considerations

1. **Webhook Retry Logic**: Stripe will retry failed webhooks. Ensure your handler is idempotent.

2. **Error Handling**: Always return 200 status even if processing fails, to prevent Stripe from retrying.

3. **Monitoring**: Set up alerts for webhook failures in production.

4. **Rate Limiting**: Be aware of Stripe's webhook rate limits.

5. **Security**: Never log sensitive data like payment details.

## Next Steps

After setting up webhooks:

1. Test with real subscriptions
2. Monitor webhook events in production
3. Set up alerts for failed payments
4. Implement email notifications for payment failures
5. Add subscription management features to your admin dashboard

## Support

If you encounter issues:

1. Check Stripe webhook logs in your dashboard
2. Review your server logs for errors
3. Verify database schema and data
4. Test with Stripe CLI in development
5. Check Stripe documentation: https://stripe.com/docs/webhooks 