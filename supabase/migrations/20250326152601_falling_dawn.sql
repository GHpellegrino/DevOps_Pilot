/*
  # Update empty coaches to Mathieu

  1. Changes
    - Set coach to 'Mathieu' for all accompaniments where coach is null

  2. Notes
    - Ensures Mathieu exists in coaches table before updating
    - Only updates accompaniments where coach is null
*/

-- First ensure 'Mathieu' exists in coaches table
DO $$
BEGIN
  INSERT INTO coaches (name)
  VALUES ('Mathieu')
  ON CONFLICT (name) DO NOTHING;
END $$;

-- Update accompaniments without a coach
UPDATE accompaniments
SET coach = 'Mathieu'
WHERE coach IS NULL;