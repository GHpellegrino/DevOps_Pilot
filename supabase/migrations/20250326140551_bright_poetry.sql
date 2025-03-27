/*
  # Add tribe relationship to squads

  1. Changes
    - Add tribe_id foreign key to squads table
    - Make tribe_id NOT NULL to ensure every squad has a tribe
    - Add foreign key constraint to maintain referential integrity

  2. Security
    - Keep existing RLS policies
*/

-- Add tribe_id column to squads
ALTER TABLE squads 
ADD COLUMN tribe_id uuid REFERENCES tribes(id) ON DELETE CASCADE;

-- Make tribe_id NOT NULL after adding the column to avoid issues with existing data
ALTER TABLE squads 
ALTER COLUMN tribe_id SET NOT NULL;