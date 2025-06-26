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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
  subscription_fee NUMERIC DEFAULT 100 NOT NULL,
  recruiter_id uuid REFERENCES recruiters(recruiter_id),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  next_billing_at TIMESTAMP,
  is_paid bool DEFAULT 'false'
);

-- Job Applications table
CREATE TABLE IF NOT EXISTS job_applications (
  application_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(user_id),
  recruiter_id UUID REFERENCES recruiters(recruiter_id),
  resume_id UUID REFERENCES resumes(resume_id),
  job_title TEXT NOT NULL,
  job_link TEXT,
  status TEXT DEFAULT 'applied',
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resumes table
CREATE TABLE IF NOT EXISTS resumes (
  resume_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(user_id),
  recruiter_id UUID REFERENCES recruiters(recruiter_id),
  storage_key TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);