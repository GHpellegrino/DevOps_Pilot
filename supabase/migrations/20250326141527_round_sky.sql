/*
  # Add coaches table and update accompaniments

  1. New Tables
    - `coaches`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `coaches` table
    - Add policy for public access to coaches
*/

-- Create coaches table
CREATE TABLE IF NOT EXISTS coaches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;

-- Add policy for public access
CREATE POLICY "Allow public access to coaches"
  ON coaches
  FOR ALL
  TO public
  USING (true);