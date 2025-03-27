import React, { useState, useEffect } from 'react';
import { X, Plus, Save, ArrowUp, ArrowDown, ChevronsUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Questionnaire } from '../types/database';

interface QuestionnaireFormProps {
  questionnaire?: Questionnaire;
  initialQuestions?: Array<{
    label: string;
    category: string;
  }>;
  onSubmit: (data: {
    title: string;
    author: string;
    questions: Array<{
      label: string;
      category: string;
    }>;
  }) => void;
  onCancel: () => void;
}

export function QuestionnaireForm({
  questionnaire,
  initialQuestions,
  onSubmit,
  onCancel,
}: QuestionnaireFormProps) {
  const [title, setTitle] = useState(questionnaire?.title || '');
  const [author, setAuthor] = useState(questionnaire?.author || '');
  const [coaches, setCoaches] = useState<Array<{ id: string; name: string }>>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [questions, setQuestions] = useState<Array<{
    label: string;
    category: string;
  }>>(initialQuestions || []);

  useEffect(() => {
    loadCoaches();
    loadCategories();
  }, []);

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

  async function loadCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading categories:', error);
      return;
    }

    setCategories(data || []);
  }

  const addQuestion = () => {
    setQuestions([...questions, { label: '', category: '' }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: 'label' | 'category', value: string) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...questions];
    if (direction === 'up' && index > 0) {
      [newQuestions[index], newQuestions[index - 1]] = [newQuestions[index - 1], newQuestions[index]];
    } else if (direction === 'down' && index < questions.length - 1) {
      [newQuestions[index], newQuestions[index + 1]] = [newQuestions[index + 1], newQuestions[index]];
    }
    setQuestions(newQuestions);
  };

  const moveQuestionToTop = (index: number) => {
    if (index === 0) return;
    const newQuestions = [...questions];
    const [question] = newQuestions.splice(index, 1);
    newQuestions.unshift(question);
    setQuestions(newQuestions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ title, author, questions });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
      <div className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Titre
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="author" className="block text-sm font-medium text-gray-700">
            Auteur
          </label>
          <select
            id="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            <option value="">Sélectionner un coach</option>
            {coaches.map((coach) => (
              <option key={coach.id} value={coach.name}>
                {coach.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Questions</h3>
            <button
              type="button"
              onClick={addQuestion}
              className="flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une question
            </button>
          </div>

          <div className="space-y-4">
            {questions.map((question, questionIndex) => (
              <div
                key={questionIndex}
                className="border rounded-md p-4"
                style={{ backgroundColor: '#dceafc' }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      Question {questionIndex + 1}
                    </h4>
                    <div className="flex space-x-1">
                      <button
                        type="button"
                        onClick={() => moveQuestionToTop(questionIndex)}
                        disabled={questionIndex === 0}
                        className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Déplacer en première position"
                      >
                        <ChevronsUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveQuestion(questionIndex, 'up')}
                        disabled={questionIndex === 0}
                        className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveQuestion(questionIndex, 'down')}
                        disabled={questionIndex === questions.length - 1}
                        className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeQuestion(questionIndex)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex gap-4">
                  <div className="w-1/3">
                    <label className="block text-sm font-medium text-gray-700">
                      Catégorie
                    </label>
                    <select
                      value={question.category}
                      onChange={(e) =>
                        updateQuestion(questionIndex, 'category', e.target.value)
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    >
                      <option value="">Sélectionner une catégorie</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Libellé
                    </label>
                    <input
                      type="text"
                      value={question.label}
                      onChange={(e) =>
                        updateQuestion(questionIndex, 'label', e.target.value)
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Save className="h-4 w-4 mr-2" />
            Enregistrer
          </button>
        </div>
      </div>
    </form>
  );
}