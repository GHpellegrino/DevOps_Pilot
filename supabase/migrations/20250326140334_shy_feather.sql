/*
  # Add reference tables for tribes, squads and categories

  1. New Tables
    - `tribes`: Stores the list of tribes
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamp)
    - `squads`: Stores the list of squads
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamp)
    - `categories`: Stores the list of question categories
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (no authentication required)
*/

-- Create tribes table
CREATE TABLE IF NOT EXISTS tribes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tribes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to tribes"
  ON tribes
  FOR ALL
  USING (true);

-- Create squads table
CREATE TABLE IF NOT EXISTS squads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE squads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to squads"
  ON squads
  FOR ALL
  USING (true);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to categories"
  ON categories
  FOR ALL
  USING (true);