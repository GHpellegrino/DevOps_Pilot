import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, ClipboardList, Target, BarChart2, TrendingUp, Award } from 'lucide-react';

interface DashboardMetrics {
  totalAccompaniments: number;
  totalEvaluations: number;
  totalObjectives: number;
  completedObjectives: number;
  totalTribes: number;
  totalSquads: number;
  recentEvaluations: Array<{
    tribe: string;
    squad: string;
    questionnaire_title: string;
    created_at: string;
  }>;
  topCategories: Array<{
    category: string;
    average_score: number;
  }>;
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalAccompaniments: 0,
    totalEvaluations: 0,
    totalObjectives: 0,
    completedObjectives: 0,
    totalTribes: 0,
    totalSquads: 0,
    recentEvaluations: [],
    topCategories: [],
  });

  useEffect(() => {
    loadMetrics();
  }, []);

  async function loadMetrics() {
    try {
      // Load counts
      const [
        { count: accompanimentCount },
        { count: evaluationCount },
        { count: objectiveCount },
        { count: completedObjectiveCount },
        { count: tribeCount },
        { count: squadCount },
      ] = await Promise.all([
        supabase.from('accompaniments').select('*', { count: 'exact', head: true }),
        supabase.from('evaluations').select('*', { count: 'exact', head: true }),
        supabase.from('objectives').select('*', { count: 'exact', head: true }),
        supabase.from('objectives').select('*', { count: 'exact', head: true }).eq('is_achieved', true),
        supabase.from('tribes').select('*', { count: 'exact', head: true }),
        supabase.from('squads').select('*', { count: 'exact', head: true }),
      ]);

      // Load recent evaluations
      const { data: recentEvaluations } = await supabase
        .from('evaluations')
        .select(`
          accompaniments (
            tribe,
            squad
          ),
          questionnaires (
            title
          ),
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      // Load category scores
      const { data: evaluationAnswers } = await supabase
        .from('evaluation_answers')
        .select(`
          questions (
            category
          ),
          answers (
            text
          )
        `);

      // Calculate average scores per category
      const categoryScores: Record<string, { total: number; count: number }> = {};

      if (evaluationAnswers) {
        const { data: predefinedAnswers } = await supabase
          .from('predefined_answers')
          .select('*')
          .order('created_at');

        if (predefinedAnswers) {
          evaluationAnswers.forEach((ea) => {
            const category = ea.questions.category;
            const answerText = ea.answers.text;
            
            const answerIndex = predefinedAnswers.findIndex(pa => pa.text === answerText);
            if (answerIndex === -1) return;

            const score = ((answerIndex + 1) / predefinedAnswers.length) * 100;

            if (!categoryScores[category]) {
              categoryScores[category] = { total: 0, count: 0 };
            }
            categoryScores[category].total += score;
            categoryScores[category].count += 1;
          });
        }
      }

      const topCategories = Object.entries(categoryScores)
        .map(([category, { total, count }]) => ({
          category,
          average_score: Math.round(count > 0 ? total / count : 0),
        }))
        .sort((a, b) => b.average_score - a.average_score)
        .slice(0, 5);

      setMetrics({
        totalAccompaniments: accompanimentCount || 0,
        totalEvaluations: evaluationCount || 0,
        totalObjectives: objectiveCount || 0,
        completedObjectives: completedObjectiveCount || 0,
        totalTribes: tribeCount || 0,
        totalSquads: squadCount || 0,
        recentEvaluations: recentEvaluations?.map(e => ({
          tribe: e.accompaniments.tribe,
          squad: e.accompaniments.squad,
          questionnaire_title: e.questionnaires.title,
          created_at: e.created_at,
        })) || [],
        topCategories,
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Users className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Accompagnements</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.totalAccompaniments}</p>
            </div>
          </div>
          <div className="mt-4 flex justify-between text-sm">
            <div>
              <p className="text-gray-500">Tribus</p>
              <p className="font-medium text-gray-900">{metrics.totalTribes}</p>
            </div>
            <div>
              <p className="text-gray-500">Squads</p>
              <p className="font-medium text-gray-900">{metrics.totalSquads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <ClipboardList className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Évaluations</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.totalEvaluations}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500">Moyenne par accompagnement</p>
            <p className="font-medium text-gray-900">
              {metrics.totalAccompaniments ? (metrics.totalEvaluations / metrics.totalAccompaniments).toFixed(1) : '0'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Target className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Objectifs</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.totalObjectives}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <div className="flex-1">
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-purple-600 rounded-full"
                    style={{
                      width: `${metrics.totalObjectives ? (metrics.completedObjectives / metrics.totalObjectives) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
              <span className="ml-2 text-sm font-medium text-gray-900">
                {metrics.totalObjectives
                  ? Math.round((metrics.completedObjectives / metrics.totalObjectives) * 100)
                  : 0}%
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {metrics.completedObjectives} objectifs atteints sur {metrics.totalObjectives}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Evaluations and Top Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dernières évaluations</h2>
          <div className="space-y-4">
            {metrics.recentEvaluations.map((evaluation, index) => (
              <div key={index} className="flex items-start">
                <div className="p-2 bg-gray-100 rounded">
                  <BarChart2 className="h-5 w-5 text-gray-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {evaluation.tribe} - {evaluation.squad}
                  </p>
                  <p className="text-sm text-gray-500">{evaluation.questionnaire_title}</p>
                  <p className="text-xs text-gray-400">{formatDate(evaluation.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top 5 des catégories</h2>
          <div className="space-y-4">
            {metrics.topCategories.map((category, index) => (
              <div key={index} className="flex items-center">
                <div className="p-2 bg-gray-100 rounded">
                  <Award className="h-5 w-5 text-gray-600" />
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium text-gray-900">{category.category}</p>
                    <p className="text-sm font-medium text-gray-900">{category.average_score}%</p>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-indigo-600 rounded-full"
                      style={{ width: `${category.average_score}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}