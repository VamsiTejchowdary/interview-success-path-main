-- ============================================================================
-- Email Marketer Dashboard Tables Migration - DEVELOPMENT VERSION
-- ============================================================================
-- This script creates all necessary tables for the Email Marketer Dashboard
-- Run this after 01-create-tables.sql
-- 
-- ⚠️  WARNING: This is the DEVELOPMENT version with RLS DISABLED
-- ⚠️  For production, use: 02-email-marketer-tables-production.sql
-- ============================================================================
-- ============================================================================
-- 1. EMAIL MARKETERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.email_marketers (
    email_marketer_id UUID NOT NULL DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    phone TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT email_marketers_pkey PRIMARY KEY (email_marketer_id)
);
-- ============================================================================
-- 2. COMPANIES TABLE
-- ============================================================================
-- Stores unique company names for tracking
CREATE TABLE IF NOT EXISTS public.companies (
    company_id UUID NOT NULL DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT companies_pkey PRIMARY KEY (company_id)
);
-- ============================================================================
-- 3. COMPANY CONTACTS TABLE
-- ============================================================================
-- Stores HR/hiring manager contacts for each company
CREATE TABLE IF NOT EXISTS public.company_contacts (
    contact_id UUID NOT NULL DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    email TEXT NOT NULL,
    role TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT company_contacts_pkey PRIMARY KEY (contact_id),
    CONSTRAINT company_contacts_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(company_id) ON DELETE CASCADE,
    CONSTRAINT company_contacts_unique_email UNIQUE (company_id, email)
);
-- ============================================================================
-- 4. APPLICATION CONTACTS JUNCTION TABLE
-- ============================================================================
-- Links company contacts to job applications
CREATE TABLE IF NOT EXISTS public.application_contacts (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL,
    contact_id UUID NOT NULL,
    added_by UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT application_contacts_pkey PRIMARY KEY (id),
    CONSTRAINT application_contacts_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.job_applications(application_id) ON DELETE CASCADE,
    CONSTRAINT application_contacts_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.company_contacts(contact_id) ON DELETE CASCADE,
    CONSTRAINT application_contacts_added_by_fkey FOREIGN KEY (added_by) REFERENCES public.email_marketers(email_marketer_id),
    CONSTRAINT application_contacts_unique UNIQUE (application_id, contact_id)
);
-- ============================================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_companies_name ON public.companies(company_name);
CREATE INDEX IF NOT EXISTS idx_company_contacts_company_id ON public.company_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_company_contacts_email ON public.company_contacts(email);
CREATE INDEX IF NOT EXISTS idx_application_contacts_application_id ON public.application_contacts(application_id);
CREATE INDEX IF NOT EXISTS idx_application_contacts_contact_id ON public.application_contacts(contact_id);
-- ============================================================================
-- 6. DISABLE ROW LEVEL SECURITY (FOR DEVELOPMENT)
-- ============================================================================
-- Note: Enable RLS in production with proper policies
ALTER TABLE public.email_marketers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_contacts DISABLE ROW LEVEL SECURITY;
-- ============================================================================
-- 7. UPDATE EMAIL CHECK FUNCTION
-- ============================================================================
-- Update the check_email_exists_across_tables function to include email_marketers
DROP FUNCTION IF EXISTS public.check_email_exists_across_tables(text);
CREATE OR REPLACE FUNCTION public.check_email_exists_across_tables(check_email text) RETURNS TABLE(table_name text, email text) AS $$ BEGIN RETURN QUERY
SELECT 'admins'::text,
    a.email
FROM public.admins a
WHERE a.email = check_email
UNION ALL
SELECT 'recruiters'::text,
    r.email
FROM public.recruiters r
WHERE r.email = check_email
UNION ALL
SELECT 'users'::text,
    u.email
FROM public.users u
WHERE u.email = check_email
UNION ALL
SELECT 'affiliates'::text,
    af.email
FROM public.affiliates af
WHERE af.email = check_email
UNION ALL
SELECT 'email_marketers'::text,
    em.email
FROM public.email_marketers em
WHERE em.email = check_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ============================================================================
-- 8. AUTO-APPROVE EMAIL MARKETERS AFTER EMAIL VERIFICATION
-- ============================================================================
-- Create a trigger function to auto-approve email marketers when they verify their email
CREATE OR REPLACE FUNCTION auto_approve_email_marketer() RETURNS TRIGGER AS $$ BEGIN -- When a user verifies their email in Supabase Auth
    -- Update their status in email_marketers table to 'approved'
    IF NEW.email_confirmed_at IS NOT NULL
    AND OLD.email_confirmed_at IS NULL THEN
UPDATE public.email_marketers
SET status = 'approved'
WHERE email = NEW.email;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Create trigger on auth.users table (if you have access)
-- Note: This requires superuser access. If you don't have it, you'll need to
-- manually approve email marketers after they verify their email
-- DROP TRIGGER IF EXISTS on_email_verified ON auth.users;
-- CREATE TRIGGER on_email_verified
--     AFTER UPDATE ON auth.users
--     FOR EACH ROW
--     EXECUTE FUNCTION auto_approve_email_marketer();
-- ============================================================================
-- 9. VERIFICATION QUERIES
-- ============================================================================
-- Verify tables were created
SELECT schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN (
        'email_marketers',
        'companies',
        'company_contacts',
        'application_contacts'
    )
    AND schemaname = 'public';
-- Verify no RLS policies exist (should return empty)
SELECT tablename,
    policyname
FROM pg_policies
WHERE tablename IN (
        'email_marketers',
        'companies',
        'company_contacts',
        'application_contacts'
    )
ORDER BY tablename;
-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Run this script in Supabase SQL Editor
-- 2. Create email marketers via Admin Dashboard
-- 3. Default password for all email marketers: Email@JS
-- ============================================================================