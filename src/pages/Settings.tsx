import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Tribe {
  id: string;
  name: string;
}

interface Squad {
  id: string;
  name: string;
  tribe_id: string;
}

interface Category {
  id: string;
  name: string;
}

interface Coach {
  id: string;
  name: string;
}

interface PredefinedAnswer {
  id: string;
  text: string;
}

export default function Settings() {
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [answers, setAnswers] = useState<PredefinedAnswer[]>([]);
  const [newTribe, setNewTribe] = useState('');
  const [newSquad, setNewSquad] = useState('');
  const [selectedTribeId, setSelectedTribeId] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newCoach, setNewCoach] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  useEffect(() => {
    loadReferenceData();
  }, []);

  async function loadReferenceData() {
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

    // Load categories
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    if (categoriesData) setCategories(categoriesData);

    // Load coaches
    const { data: coachesData } = await supabase
      .from('coaches')
      .select('*')
      .order('name');
    if (coachesData) setCoaches(coachesData);

    // Load predefined answers
    const { data: answersData } = await supabase
      .from('predefined_answers')
      .select('*')
      .order('created_at');
    if (answersData) setAnswers(answersData);
  }

  async function handleAddTribe() {
    if (!newTribe.trim()) return;

    const { error } = await supabase
      .from('tribes')
      .insert([{ name: newTribe.trim() }]);

    if (error) {
      console.error('Error adding tribe:', error);
      return;
    }

    setNewTribe('');
    loadReferenceData();
  }

  async function handleAddSquad() {
    if (!newSquad.trim() || !selectedTribeId) return;

    const { error } = await supabase
      .from('squads')
      .insert([{ 
        name: newSquad.trim(),
        tribe_id: selectedTribeId
      }]);

    if (error) {
      console.error('Error adding squad:', error);
      return;
    }

    setNewSquad('');
    loadReferenceData();
  }

  async function handleAddCategory() {
    if (!newCategory.trim()) return;

    const { error } = await supabase
      .from('categories')
      .insert([{ name: newCategory.trim() }]);

    if (error) {
      console.error('Error adding category:', error);
      return;
    }

    setNewCategory('');
    loadReferenceData();
  }

  async function handleAddCoach() {
    if (!newCoach.trim()) return;

    const { error } = await supabase
      .from('coaches')
      .insert([{ name: newCoach.trim() }]);

    if (error) {
      console.error('Error adding coach:', error);
      return;
    }

    setNewCoach('');
    loadReferenceData();
  }

  async function handleAddAnswer() {
    if (!newAnswer.trim()) return;

    const { error } = await supabase
      .from('predefined_answers')
      .insert([{ text: newAnswer.trim() }]);

    if (error) {
      console.error('Error adding answer:', error);
      return;
    }

    setNewAnswer('');
    loadReferenceData();
  }

  async function handleDelete(table: string, id: string) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting from ${table}:`, error);
      return;
    }

    loadReferenceData();
  }

  function getTribeName(tribeId: string) {
    return tribes.find(tribe => tribe.id === tribeId)?.name || '';
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Paramètres</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
          {/* Tribes */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tribus</h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTribe}
                  onChange={(e) => setNewTribe(e.target.value)}
                  placeholder="Nouvelle tribu"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <button
                  onClick={handleAddTribe}
                  className="p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              <ul className="space-y-2">
                {tribes.map((tribe) => (
                  <li key={tribe.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                    <span>{tribe.name}</span>
                    <button
                      onClick={() => handleDelete('tribes', tribe.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Squads */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Squads</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <select
                  value={selectedTribeId}
                  onChange={(e) => setSelectedTribeId(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Sélectionner une tribu</option>
                  {tribes.map((tribe) => (
                    <option key={tribe.id} value={tribe.id}>
                      {tribe.name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSquad}
                    onChange={(e) => setNewSquad(e.target.value)}
                    placeholder="Nouveau squad"
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <button
                    onClick={handleAddSquad}
                    disabled={!selectedTribeId}
                    className="p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <ul className="space-y-2">
                {squads.map((squad) => (
                  <li key={squad.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                    <div>
                      <span className="block">{squad.name}</span>
                      <span className="text-sm text-gray-500">{getTribeName(squad.tribe_id)}</span>
                    </div>
                    <button
                      onClick={() => handleDelete('squads', squad.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Catégories</h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Nouvelle catégorie"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <button
                  onClick={handleAddCategory}
                  className="p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              <ul className="space-y-2">
                {categories.map((category) => (
                  <li key={category.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                    <span>{category.name}</span>
                    <button
                      onClick={() => handleDelete('categories', category.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Coaches */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Coachs</h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCoach}
                  onChange={(e) => setNewCoach(e.target.value)}
                  placeholder="Nouveau coach"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <button
                  onClick={handleAddCoach}
                  className="p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              <ul className="space-y-2">
                {coaches.map((coach) => (
                  <li key={coach.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                    <span>{coach.name}</span>
                    <button
                      onClick={() => handleDelete('coaches', coach.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Predefined Answers */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Réponses prédéfinies</h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="Nouvelle réponse"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <button
                  onClick={handleAddAnswer}
                  className="p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              <ul className="space-y-2">
                {answers.map((answer) => (
                  <li key={answer.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                    <span>{answer.text}</span>
                    <button
                      onClick={() => handleDelete('predefined_answers', answer.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}