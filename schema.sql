-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create clientes table
CREATE TABLE clientes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  status_cliente BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create courses table
CREATE TABLE courses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  order_position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create modules table
CREATE TABLE modules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  order_position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create lessons table
CREATE TABLE lessons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  youtube_video_id TEXT NOT NULL,
  support_text TEXT,
  duration TEXT,
  thumbnail_url TEXT,
  order_position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow public read access to content
CREATE POLICY "Allow public read access" ON courses FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON modules FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON lessons FOR SELECT USING (true);

-- Allow all access for now (controlled by client-side admin check)
CREATE POLICY "Allow all access" ON courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON modules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON lessons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON clientes FOR ALL USING (true);

-- Function to check user access
CREATE OR REPLACE FUNCTION check_user_access(email_input TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  has_access BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM clientes 
    WHERE email = email_input AND status_cliente = true
  ) INTO has_access;
  
  RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users table policy (if table exists)
-- create policy "Enable all for authenticated users only" on public.users for all to authenticated using (true);
