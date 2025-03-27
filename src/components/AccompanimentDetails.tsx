import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Pencil, X, Clock } from 'lucide-react';
import { formatDate } from '../utils/formatDate';
import { supabase } from '../lib/supabase';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

interface Evaluation {
  id: string;
  questionnaire_title: string;
  created_at: string;
}

interface Objective {
  id: string;
  description: string;
  is_achieved: boolean;
  created_at: string;
  updated_at: string;
}

interface CategoryScore {
  category: string;
  score: number;
}

interface AccompanimentDetailsProps {
  accompaniment: {
    id: string;
    tribe: string;
    squad: string;
    coach: string;
    created_at: string;
    updated_at: string;
  };
  evaluations: Evaluation[];
  objectives: Objective[];
  onDelete: () => void;
  onUpdate: () => void;
}

export function AccompanimentDetails({
  accompaniment,
  evaluations,
  objectives,
  onDelete,
  onUpdate,
}: AccompanimentDetailsProps) {
  const navigate = useNavigate();
  const [isEditingObjective, setIsEditingObjective] = useState(false);
  const [editingObjective, setEditingObjective] = useState<Objective | null>(null);
  const [newObjectiveDescription, setNewObjectiveDescription] = useState('');
  const [newObjectiveAchieved, setNewObjectiveAchieved] = useState(false);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState('');
  const [availableQuestionnaires, setAvailableQuestionnaires] = useState<Array<{ id: string; title: string }>>([]);
  const [isAddingQuestionnaire, setIsAddingQuestionnaire] = useState(false);
  const [latestScores, setLatestScores] = useState<CategoryScore[]>([]);
  const [coaches, setCoaches] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCoach, setSelectedCoach] = useState(accompaniment.coach);

  useEffect(() => {
    loadAvailableQuestionnaires();
    loadCoaches();
    if (evaluations.length > 0) {
      loadLatestEvaluationScores(evaluations[0].id);
    }
  }, [evaluations]);

  async function loadCoaches() {
    const { data, error } = await supabase
      .from('coaches')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading coaches:', error);
      return;
    }

    setCoaches(data || []);
  }

  async function handleCoachChange(newCoach: string) {
    const { error } = await supabase
      .from('accompaniments')
      .update({ coach: newCoach })
      .eq('id', accompaniment.id);

    if (error) {
      console.error('Error updating coach:', error);
      return;
    }

    setSelectedCoach(newCoach);
    onUpdate();
  }

  async function loadAvailableQuestionnaires() {
    const { data, error } = await supabase
      .from('questionnaires')
      .select('id, title')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading questionnaires:', error);
      return;
    }

    setAvailableQuestionnaires(data || []);
  }

  async function loadLatestEvaluationScores(evaluationId: string) {
    // Get all answers for this evaluation
    const { data: evaluationAnswers, error: answersError } = await supabase
      .from('evaluation_answers')
      .select(`
        answer_id,
        questions (
          category
        )
      `)
      .eq('evaluation_id', evaluationId);

    if (answersError) {
      console.error('Error loading evaluation answers:', answersError);
      return;
    }

    // Get all predefined answers to calculate scores
    const { data: predefinedAnswers, error: predefinedError } = await supabase
      .from('predefined_answers')
      .select('*')
      .order('created_at');

    if (predefinedError) {
      console.error('Error loading predefined answers:', predefinedError);
      return;
    }

    // Get the actual answers
    const answerIds = evaluationAnswers.map(ea => ea.answer_id);
    const { data: answers, error: answerError } = await supabase
      .from('answers')
      .select('id, text')
      .in('id', answerIds);

    if (answerError) {
      console.error('Error loading answers:', answerError);
      return;
    }

    // Calculate scores by category
    const categoryScores: Record<string, { total: number; count: number }> = {};

    evaluationAnswers.forEach((ea) => {
      const category = ea.questions.category;
      const answer = answers.find(a => a.id === ea.answer_id);
      if (!answer) return;

      const answerIndex = predefinedAnswers.findIndex(pa => pa.text === answer.text);
      if (answerIndex === -1) return;

      const score = ((answerIndex + 1) / predefinedAnswers.length) * 100;

      if (!categoryScores[category]) {
        categoryScores[category] = { total: 0, count: 0 };
      }
      categoryScores[category].total += score;
      categoryScores[category].count += 1;
    });

    const scores: CategoryScore[] = Object.entries(categoryScores).map(([category, { total, count }]) => ({
      category,
      score: Math.round(count > 0 ? total / count : 0),
    }));

    setLatestScores(scores);
  }

  const handleDelete = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet accompagnement ? Cette action est irréversible.')) {
      onDelete();
    }
  };

  const handleAddObjective = async () => {
    if (!newObjectiveDescription.trim()) return;

    const { error } = await supabase.from('objectives').insert([
      {
        accompaniment_id: accompaniment.id,
        description: newObjectiveDescription.trim(),
        is_achieved: newObjectiveAchieved,
      },
    ]);

    if (error) {
      console.error('Error adding objective:', error);
      return;
    }

    setNewObjectiveDescription('');
    setNewObjectiveAchieved(false);
    setIsEditingObjective(false);
    onUpdate();
  };

  const handleEditObjective = async (objective: Objective) => {
    setEditingObjective(objective);
    setNewObjectiveDescription(objective.description);
    setNewObjectiveAchieved(objective.is_achieved);
    setIsEditingObjective(true);
  };

  const handleUpdateObjective = async () => {
    if (!editingObjective || !newObjectiveDescription.trim()) return;

    const { error } = await supabase
      .from('objectives')
      .update({
        description: newObjectiveDescription.trim(),
        is_achieved: newObjectiveAchieved,
      })
      .eq('id', editingObjective.id);

    if (error) {
      console.error('Error updating objective:', error);
      return;
    }

    setEditingObjective(null);
    setNewObjectiveDescription('');
    setNewObjectiveAchieved(false);
    setIsEditingObjective(false);
    onUpdate();
  };

  const handleDeleteObjective = async (objectiveId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet objectif ?')) return;

    const { error } = await supabase.from('objectives').delete().eq('id', objectiveId);

    if (error) {
      console.error('Error deleting objective:', error);
      return;
    }

    onUpdate();
  };

  const handleAddQuestionnaire = () => {
    // Navigate to evaluations page with pre-filled data
    navigate('/evaluations', {
      state: {
        prefilledData: {
          tribe: accompaniment.tribe,
          squad: accompaniment.squad,
        }
      }
    });
  };

  const handleDeleteEvaluation = async (evaluationId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette évaluation ?')) return;

    const { error } = await supabase.from('evaluations').delete().eq('id', evaluationId);

    if (error) {
      console.error('Error deleting evaluation:', error);
      return;
    }

    onUpdate();
  };

  return (
    <div className="space-y-8">
      {/* Header Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Tribu</h3>
            <p className="mt-1 text-lg font-semibold text-gray-900">{accompaniment.tribe}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Squad</h3>
            <p className="mt-1 text-lg font-semibold text-gray-900">{accompaniment.squad}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Coach</h3>
            <select
              value={selectedCoach}
              onChange={(e) => handleCoachChange(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              {coaches.map((coach) => (
                <option key={coach.id} value={coach.name}>
                  {coach.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Date de création</h3>
            <p className="mt-1 text-gray-600">{formatDate(accompaniment.created_at)}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Dernière modification</h3>
            <p className="mt-1 text-gray-600">{formatDate(accompaniment.updated_at)}</p>
          </div>
        </div>
      </div>

      {/* Latest Evaluation Radar Chart */}
      {latestScores.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Dernière évaluation</h2>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={latestScores}>
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

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Evaluations Column */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Questionnaires passés</h2>
            <button 
              onClick={handleAddQuestionnaire}
              className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau
            </button>
          </div>

          {evaluations.length > 0 ? (
            <div className="space-y-4">
              {evaluations.map((evaluation) => (
                <div key={evaluation.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{evaluation.questionnaire_title}</h3>
                      <p className="text-sm text-gray-500">{formatDate(evaluation.created_at)}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteEvaluation(evaluation.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Aucun questionnaire n'a encore été passé.</p>
          )}
        </div>

        {/* Objectives Column */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Objectifs</h2>
            <button
              onClick={() => setIsEditingObjective(true)}
              className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau
            </button>
          </div>

          {isEditingObjective && (
            <div className="mb-4 p-4 border border-gray-200 rounded-lg">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <input
                    type="text"
                    value={newObjectiveDescription}
                    onChange={(e) => setNewObjectiveDescription(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newObjectiveAchieved}
                    onChange={(e) => setNewObjectiveAchieved(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">Objectif atteint</label>
                </div>
                {editingObjective && (
                  <div className="space-y-2 pt-4 border-t border-gray-200">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>Créé le {formatDate(editingObjective.created_at)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>Modifié le {formatDate(editingObjective.updated_at)}</span>
                    </div>
                  </div>
                )}
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setIsEditingObjective(false);
                      setEditingObjective(null);
                      setNewObjectiveDescription('');
                      setNewObjectiveAchieved(false);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={editingObjective ? handleUpdateObjective : handleAddObjective}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    {editingObjective ? 'Mettre à jour' : 'Ajouter'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {objectives.length > 0 ? (
            <div className="space-y-4">
              {objectives.map((objective) => (
                <div
                  key={objective.id}
                  className={`p-4 rounded-lg border ${
                    objective.is_achieved ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-gray-900">{objective.description}</p>
                      {objective.is_achieved && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                          Atteint
                        </span>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditObjective(objective)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteObjective(objective.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Aucun objectif n'a été défini.</p>
          )}
        </div>
      </div>

      {/* Delete Button */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <button
          onClick={handleDelete}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors ml-auto"
        >
          <Trash2 className="h-5 w-5 mr-2" />
          Supprimer l'accompagnement
        </button>
      </div>
    </div>
  );
}