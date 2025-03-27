/*
  # Add predefined answers table and update questions table

  1. New Tables
    - `predefined_answers`
      - `id` (uuid, primary key)
      - `text` (text, not null)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `predefined_answers` table
    - Add policy for public access
*/

-- Create predefined answers table
CREATE TABLE IF NOT EXISTS predefined_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE predefined_answers ENABLE ROW LEVEL SECURITY;

-- Add policy for public access
CREATE POLICY "Allow public access to predefined_answers"
  ON predefined_answers
  FOR ALL
  TO public
  USING (true);