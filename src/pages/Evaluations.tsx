import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface Question {
  id: string;
  label: string;
  category: string;
}

interface PredefinedAnswer {
  id: string;
  text: string;
}

interface Questionnaire {
  id: string;
  title: string;
}

interface Squad {
  id: string;
  name: string;
  tribe_id: string;
}

interface Tribe {
  id: string;
  name: string;
}

interface CategoryScore {
  category: string;
  score: number;
}

interface Accompaniment {
  id: string;
  tribe: string;
  squad: string;
}

interface LocationState {
  prefilledData?: {
    tribe: string;
    squad: string;
  };
}

export default function Evaluations() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [predefinedAnswers, setPredefinedAnswers] = useState<PredefinedAnswer[]>([]);
  const [selectedTribeId, setSelectedTribeId] = useState('');
  const [selectedSquadId, setSelectedSquadId] = useState('');
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [scores, setScores] = useState<CategoryScore[]>([]);
  const [step, setStep] = useState<'selection' | 'evaluation'>('selection');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    // Handle pre-filled data from navigation state
    const state = location.state as LocationState;
    if (state?.prefilledData) {
      const { tribe: prefilledTribe, squad: prefilledSquad } = state.prefilledData;
      
      // Find and set the tribe ID
      const tribe = tribes.find(t => t.name === prefilledTribe);
      if (tribe) {
        setSelectedTribeId(tribe.id);
        
        // Find and set the squad ID
        const squad = squads.find(s => s.name === prefilledSquad && s.tribe_id === tribe.id);
        if (squad) {
          setSelectedSquadId(squad.id);
        }
      }
      
      // Clear the navigation state
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, tribes, squads]);

  useEffect(() => {
    if (selectedQuestionnaire) {
      loadQuestions();
    }
  }, [selectedQuestionnaire]);

  async function loadInitialData() {
    // Load tribes
    const { data: tribesData } = await supabase
      .from('tribes')
      .select('*')
      .order('name');
    if (tribesData) setTribes(tribesData);

    // Load squads
    const { data: squadsData } = await supabase
      .from('squads')
      .select('*')
      .order('name');
    if (squadsData) setSquads(squadsData);

    // Load questionnaires
    const { data: questionnairesData } = await supabase
      .from('questionnaires')
      .select('id, title')
      .order('created_at', { ascending: false });
    if (questionnairesData) setQuestionnaires(questionnairesData);

    // Load predefined answers
    const { data: answersData } = await supabase
      .from('predefined_answers')
      .select('*')
      .order('created_at');
    if (answersData) setPredefinedAnswers(answersData);
  }

  async function loadQuestions() {
    const { data: questionsData, error: questionsError } = await supabase
      .from('questions')
      .select('id, label, category')
      .eq('questionnaire_id', selectedQuestionnaire);

    if (questionsError) {
      console.error('Error loading questions:', questionsError);
      return;
    }

    setQuestions(questionsData || []);
  }

  async function findExistingAccompaniment(squadName: string, tribeName: string): Promise<Accompaniment | null> {
    const { data, error } = await supabase
      .from('accompaniments')
      .select('*')
      .eq('squad', squadName)
      .eq('tribe', tribeName)
      .maybeSingle();

    if (error) {
      console.error('Error finding accompaniment:', error);
      return null;
    }

    return data;
  }

  function calculateScores(questions: Question[], answers: Record<string, string>) {
    const categoryScores: Record<string, { total: number; count: number }> = {};

    questions.forEach((question) => {
      const answerId = answers[question.id];
      if (answerId) {
        const answerIndex = predefinedAnswers.findIndex((a) => a.id === answerId);
        const score = ((answerIndex + 1) / predefinedAnswers.length) * 100;

        if (!categoryScores[question.category]) {
          categoryScores[question.category] = { total: 0, count: 0 };
        }
        categoryScores[question.category].total += score;
        categoryScores[question.category].count += 1;
      }
    });

    const newScores: CategoryScore[] = Object.entries(categoryScores).map(([category, { total, count }]) => ({
      category,
      score: count > 0 ? total / count : 0,
    }));

    setScores(newScores);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedSquadId || !selectedQuestionnaire) return;

    try {
      // Get squad and tribe information
      const squad = squads.find(s => s.id === selectedSquadId);
      const tribe = tribes.find(t => t.id === selectedTribeId);

      if (!squad || !tribe) {
        throw new Error('Squad or tribe not found');
      }

      // Check for existing accompaniment
      let accompaniment = await findExistingAccompaniment(squad.name, tribe.name);

      if (!accompaniment) {
        // Create new accompaniment only if one doesn't exist
        const { data: newAccompaniment, error: accompanimentError } = await supabase
          .from('accompaniments')
          .insert([{
            tribe: tribe.name,
            squad: squad.name,
          }])
          .select()
          .single();

        if (accompanimentError) throw accompanimentError;
        accompaniment = newAccompaniment;
      }

      // Create evaluation
      const { data: evaluation, error: evaluationError } = await supabase
        .from('evaluations')
        .insert([{
          accompaniment_id: accompaniment.id,
          questionnaire_id: selectedQuestionnaire,
        }])
        .select()
        .single();

      if (evaluationError) throw evaluationError;

      // Create answers and evaluation answers
      for (const [questionId, predefinedAnswerId] of Object.entries(selectedAnswers)) {
        // Get the text of the predefined answer
        const predefinedAnswer = predefinedAnswers.find(a => a.id === predefinedAnswerId);
        if (!predefinedAnswer) continue;

        // Create a new answer
        const { data: answer, error: answerError } = await supabase
          .from('answers')
          .insert([{
            question_id: questionId,
            text: predefinedAnswer.text
          }])
          .select()
          .single();

        if (answerError) {
          console.error('Error creating answer:', answerError);
          continue;
        }

        // Create evaluation answer
        const { error: evaluationAnswerError } = await supabase
          .from('evaluation_answers')
          .insert([{
            evaluation_id: evaluation.id,
            question_id: questionId,
            answer_id: answer.id
          }]);

        if (evaluationAnswerError) {
          console.error('Error creating evaluation answer:', evaluationAnswerError);
        }
      }

      // Navigate to the accompaniment details page
      navigate('/accompaniments', { state: { selectedAccompanimentId: accompaniment.id } });
    } catch (error) {
      console.error('Error saving evaluation:', error);
    }
  }

  function handleAnswerChange(questionId: string, answerId: string) {
    setSelectedAnswers((prev) => {
      const newAnswers = { ...prev, [questionId]: answerId };
      calculateScores(questions, newAnswers);
      return newAnswers;
    });
  }

  const filteredSquads = squads.filter(squad => squad.tribe_id === selectedTribeId);

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Nouvelle Évaluation</h2>

        {step === 'selection' ? (
          <form className="space-y-6">
            <div>
              <label htmlFor="tribe" className="block text-sm font-medium text-gray-700">
                Tribu
              </label>
              <select
                id="tribe"
                value={selectedTribeId}
                onChange={(e) => {
                  setSelectedTribeId(e.target.value);
                  setSelectedSquadId('');
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              >
                <option value="">Sélectionner une tribu</option>
                {tribes.map((tribe) => (
                  <option key={tribe.id} value={tribe.id}>
                    {tribe.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="squad" className="block text-sm font-medium text-gray-700">
                Squad
              </label>
              <select
                id="squad"
                value={selectedSquadId}
                onChange={(e) => setSelectedSquadId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
                disabled={!selectedTribeId}
              >
                <option value="">Sélectionner un squad</option>
                {filteredSquads.map((squad) => (
                  <option key={squad.id} value={squad.id}>
                    {squad.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="questionnaire" className="block text-sm font-medium text-gray-700">
                Questionnaire
              </label>
              <select
                id="questionnaire"
                value={selectedQuestionnaire}
                onChange={(e) => setSelectedQuestionnaire(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              >
                <option value="">Sélectionner un questionnaire</option>
                {questionnaires.map((questionnaire) => (
                  <option key={questionnaire.id} value={questionnaire.id}>
                    {questionnaire.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setStep('evaluation')}
                disabled={!selectedTribeId || !selectedSquadId || !selectedQuestionnaire}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400"
              >
                Commencer l'évaluation
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {questions.map((question) => (
                <div key={question.id} className="border rounded-md p-4">
                  <p className="font-medium text-gray-900 mb-2">{question.label}</p>
                  <p className="text-sm text-gray-500 mb-4">Catégorie: {question.category}</p>
                  <div className="space-y-2">
                    {predefinedAnswers.map((answer) => (
                      <label key={answer.id} className="flex items-center">
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={answer.id}
                          checked={selectedAnswers[question.id] === answer.id}
                          onChange={() => handleAnswerChange(question.id, answer.id)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                          required
                        />
                        <span className="ml-2 text-gray-700">{answer.text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {scores.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Résultats par catégorie</h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={scores}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="category" />
                      <PolarRadiusAxis domain={[0, 100]} />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke="#4f46e5"
                        fill="#4f46e5"
                        fillOpacity={0.6}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setStep('selection')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Retour
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Enregistrer l'évaluation
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}