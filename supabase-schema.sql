-- Lead Scout — Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor to create the required table

-- Create the leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL,
  company_name TEXT,
  objective TEXT,
  dossier_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_leads_domain ON leads(domain);
CREATE INDEX IF NOT EXISTS idx_leads_company_name ON leads(company_name);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- Enable Row Level Security (optional, recommended for production)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (for development)
-- In production, restrict this to authenticated users
CREATE POLICY "Allow all operations on leads" ON leads
  FOR ALL
  USING (true)
  WITH CHECK (true);
