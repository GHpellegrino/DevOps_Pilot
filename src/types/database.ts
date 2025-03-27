export interface Questionnaire {
  id: string;
  title: string;
  author: string;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  questionnaire_id: string;
  label: string;
  category: string;
  created_at: string;
}

export interface Answer {
  id: string;
  question_id: string;
  text: string;
  created_at: string;
}

export interface Accompaniment {
  id: string;
  tribe: string;
  squad: string;
  coach: string;
  created_at: string;
  updated_at: string;
}

export interface Objective {
  id: string;
  accompaniment_id: string;
  description: string;
  is_achieved: boolean;
  created_at: string;
  updated_at: string;
}