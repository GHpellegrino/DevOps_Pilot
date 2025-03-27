/*
  # Add timestamps to objectives table

  1. Changes
    - Add `updated_at` column to objectives table
    - Add trigger to automatically update `updated_at` on changes
    - Note: `created_at` already exists

  2. Security
    - No changes to security policies
*/

-- Add updated_at column
ALTER TABLE objectives ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger
CREATE TRIGGER update_objectives_updated_at
  BEFORE UPDATE ON objectives
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();