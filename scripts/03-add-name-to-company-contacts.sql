-- ============================================================================
-- Add name field to company_contacts table
-- ============================================================================
-- This migration adds a name column to store contact person's name
ALTER TABLE public.company_contacts
ADD COLUMN IF NOT EXISTS name TEXT;
-- Create index for searching by name
CREATE INDEX IF NOT EXISTS idx_company_contacts_name ON public.company_contacts(name);
-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Run this in Supabase SQL Editor to add the name field
-- ============================================================================