-- Lead Scout — Production Hardened Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor to secure your leads table

-- 1. Create the leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL,
  company_name TEXT,
  objective TEXT,
  dossier_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes for fast querying & deduplication
CREATE INDEX IF NOT EXISTS idx_leads_domain ON leads(domain);
CREATE INDEX IF NOT EXISTS idx_leads_company_name ON leads(company_name);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- 4. Clean up any insecure legacy open policies
DROP POLICY IF EXISTS "Allow all operations on leads" ON leads;
DROP POLICY IF EXISTS "Allow public read" ON leads;
DROP POLICY IF EXISTS "Allow service role full access" ON leads;

-- 5. Hardened Security Policies:
-- Policy A: Allow server-side API (service_role) full access to insert, update, select, and delete
CREATE POLICY "Allow service role full access" ON leads
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy B: Allow authenticated users to view leads
CREATE POLICY "Allow authenticated users to read leads" ON leads
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy C: Allow anon users to read leads only if explicitly authorized (optional, disabled by default)
-- To enable read-only access for anon client keys, uncomment below:
-- CREATE POLICY "Allow anon read-only access" ON leads
--   FOR SELECT
--   TO anon
--   USING (true);
