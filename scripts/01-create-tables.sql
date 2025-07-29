-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  admin_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recruiters table
CREATE TABLE IF NOT EXISTS recruiters (
  recruiter_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  status TEXT DEFAULT 'pending',
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  salary NUMERIC DEFAULT 5000 NOT NULL
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  user_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address VARCHAR(255) NOT NULL,
  resume_url TEXT NOT NULL,
  linkedin_url TEXT,
  subscription_fee NUMERIC DEFAULT 200 NOT NULL,
  recruiter_id uuid REFERENCES recruiters(recruiter_id),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  next_billing_at TIMESTAMP DEFAULT NULL,
  is_paid bool DEFAULT 'false',
  stripe_customer_id TEXT
);

-- Add index for better performance when querying by stripe_customer_id
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  subscription_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(user_id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  plan_name VARCHAR(100) NOT NULL DEFAULT 'Premium Plan',
  amount NUMERIC NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  interval VARCHAR(20) DEFAULT 'month',
  status VARCHAR(20) DEFAULT 'active',
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Payments table for payment history
CREATE TABLE IF NOT EXISTS payments (
  payment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES subscriptions(subscription_id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(user_id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_invoice_id TEXT,
  amount NUMERIC NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) NOT NULL,
  payment_method VARCHAR(50),
  billing_reason VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP
);

-- Subscription events table for webhook tracking
CREATE TABLE IF NOT EXISTS subscription_events (
  event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES subscriptions(subscription_id) ON DELETE CASCADE,
  stripe_event_id TEXT UNIQUE,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Job Applications table
CREATE TABLE IF NOT EXISTS job_applications (
  application_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(user_id),
  recruiter_id UUID REFERENCES recruiters(recruiter_id),
  resume_id UUID REFERENCES resumes(resume_id),
  job_title TEXT NOT NULL,
  company_name TEXT,
  job_link TEXT,
  status TEXT DEFAULT 'applied',
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- To add company_name to an existing table in Supabase, run:
-- ALTER TABLE job_applications ADD COLUMN company_name TEXT;

-- Resumes table
CREATE TABLE IF NOT EXISTS resumes (
  resume_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(user_id),
  recruiter_id UUID REFERENCES recruiters(recruiter_id),
  storage_key TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coupons table (for affiliate/influencer codes)
CREATE TABLE IF NOT EXISTS coupons (
  coupon_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  affiliate_user_id uuid REFERENCES affiliates(affiliate_user_id),
  no_of_coupon_used INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Coupon usages table (tracks each use of a coupon)
CREATE TABLE IF NOT EXISTS coupon_usages (
  usage_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid REFERENCES coupons(coupon_id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(user_id) ON DELETE CASCADE,
  stripe_invoice_id TEXT,
  used_at TIMESTAMP DEFAULT NOW()
);

-- Affiliates table
CREATE TABLE IF NOT EXISTS affiliates (
  affiliate_user_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  name VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Update coupons table to reference affiliates table
ALTER TABLE coupons
  DROP CONSTRAINT IF EXISTS coupons_affiliate_user_id_fkey,
  ADD CONSTRAINT coupons_affiliate_user_id_fkey
    FOREIGN KEY (affiliate_user_id) REFERENCES affiliates(affiliate_user_id) ON DELETE SET NULL;

-- Optional: Index for fast lookup by code
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

-- Optional: Index for fast lookup by affiliate
CREATE INDEX IF NOT EXISTS idx_coupons_affiliate_user_id ON coupons(affiliate_user_id);

-- Optional: Index for fast lookup by coupon usage
CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon_id ON coupon_usages(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_user_id ON coupon_usages(user_id);
