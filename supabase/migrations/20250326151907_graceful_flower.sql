/*
  # Add coach column to accompaniments table

  1. Changes
    - Add `coach` column to `accompaniments` table
    - Make it nullable to maintain compatibility with existing records
    - Add foreign key constraint to ensure coach exists in coaches table

  2. Security
    - No changes to RLS policies
*/

-- Add coach column to accompaniments table
ALTER TABLE accompaniments 
ADD COLUMN IF NOT EXISTS coach text REFERENCES coaches(name);