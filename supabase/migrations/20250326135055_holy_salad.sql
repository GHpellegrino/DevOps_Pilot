/*
  # Initial Schema for DevSecOps Maturity Platform

  1. New Tables
    - `questionnaires`: Stores questionnaire metadata
      - `id` (uuid, primary key)
      - `title` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `author` (text)
    
    - `questions`: Stores individual questions
      - `id` (uuid, primary key)
      - `questionnaire_id` (uuid, foreign key)
      - `label` (text)
      - `category` (text)
      - `created_at` (timestamp)
    
    - `answers`: Stores possible answers for questions
      - `id` (uuid, primary key)
      - `question_id` (uuid, foreign key)
      - `text` (text)
      - `created_at` (timestamp)
    
    - `accompaniments`: Stores team accompaniment data
      - `id` (uuid, primary key)
      - `tribe` (text)
      - `squad` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `objectives`: Stores objectives for accompaniments
      - `id` (uuid, primary key)
      - `accompaniment_id` (uuid, foreign key)
      - `description` (text)
      - `is_achieved` (boolean)
      - `created_at` (timestamp)
    
    - `evaluations`: Stores questionnaire results
      - `id` (uuid, primary key)
      - `accompaniment_id` (uuid, foreign key)
      - `questionnaire_id` (uuid, foreign key)
      - `created_at` (timestamp)
    
    - `evaluation_answers`: Stores answers for evaluations
      - `id` (uuid, primary key)
      - `evaluation_id` (uuid, foreign key)
      - `question_id` (uuid, foreign key)
      - `answer_id` (uuid, foreign key)
      - `created_at` (timestamp)

  2. Security
    - No RLS policies as per requirements (public access)
*/

-- Questionnaires table
CREATE TABLE IF NOT EXISTS questionnaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  author text NOT NULL
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id uuid REFERENCES questionnaires(id) ON DELETE CASCADE,
  label text NOT NULL,
  category text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Answers table
CREATE TABLE IF NOT EXISTS answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Accompaniments table
CREATE TABLE IF NOT EXISTS accompaniments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tribe text NOT NULL,
  squad text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Objectives table
CREATE TABLE IF NOT EXISTS objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accompaniment_id uuid REFERENCES accompaniments(id) ON DELETE CASCADE,
  description text NOT NULL,
  is_achieved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accompaniment_id uuid REFERENCES accompaniments(id) ON DELETE CASCADE,
  questionnaire_id uuid REFERENCES questionnaires(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Evaluation answers table
CREATE TABLE IF NOT EXISTS evaluation_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid REFERENCES evaluations(id) ON DELETE CASCADE,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  answer_id uuid REFERENCES answers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_questionnaires_updated_at
    BEFORE UPDATE ON questionnaires
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accompaniments_updated_at
    BEFORE UPDATE ON accompaniments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();