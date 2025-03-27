import React, { useState, useEffect } from 'react';
import { X, Plus, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Accompaniment } from '../types/database';

interface Tribe {
  id: string;
  name: string;
}

interface Squad {
  id: string;
  name: string;
  tribe_id: string;
}

interface AccompanimentFormProps {
  accompaniment?: Accompaniment;
  initialObjectives?: Array<{
    description: string;
    is_achieved: boolean;
  }>;
  onSubmit: (data: {
    tribe: string;
    squad: string;
    objectives: Array<{
      description: string;
      is_achieved: boolean;
    }>;
  }) => void;
  onCancel: () => void;
}

export function AccompanimentForm({
  accompaniment,
  initialObjectives,
  onSubmit,
  onCancel,
}: AccompanimentFormProps) {
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [selectedTribeId, setSelectedTribeId] = useState('');
  const [selectedSquadName, setSelectedSquadName] = useState('');
  const [objectives, setObjectives] = useState<Array<{
    description: string;
    is_achieved: boolean;
  }>>(initialObjectives || []);

  useEffect(() => {
    loadTribesAndSquads();
  }, []);

  useEffect(() => {
    if (accompaniment) {
      const squad = squads.find(s => s.name === accompaniment.squad);
      if (squad) {
        setSelectedTribeId(squad.tribe_id);
        setSelectedSquadName(squad.name);
      }
    }
  }, [accompaniment, squads]);

  async function loadTribesAndSquads() {
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
  }

  const filteredSquads = squads.filter(squad => squad.tribe_id === selectedTribeId);

  const addObjective = () => {
    setObjectives([...objectives, { description: '', is_achieved: false }]);
  };

  const removeObjective = (index: number) => {
    setObjectives(objectives.filter((_, i) => i !== index));
  };

  const updateObjective = (index: number, field: 'description' | 'is_achieved', value: string | boolean) => {
    const newObjectives = [...objectives];
    newObjectives[index][field] = value;
    setObjectives(newObjectives);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedTribe = tribes.find(t => t.id === selectedTribeId);
    onSubmit({
      tribe: selectedTribe?.name || '',
      squad: selectedSquadName,
      objectives,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
      <div className="space-y-6">
        <div>
          <label htmlFor="tribe" className="block text-sm font-medium text-gray-700">
            Tribu
          </label>
          <select
            id="tribe"
            value={selectedTribeId}
            onChange={(e) => {
              setSelectedTribeId(e.target.value);
              setSelectedSquadName(''); // Reset squad selection when tribe changes
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
            value={selectedSquadName}
            onChange={(e) => setSelectedSquadName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
            disabled={!selectedTribeId}
          >
            <option value="">Sélectionner un squad</option>
            {filteredSquads.map((squad) => (
              <option key={squad.id} value={squad.name}>
                {squad.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Objectifs</h3>
            <button
              type="button"
              onClick={addObjective}
              className="flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un objectif
            </button>
          </div>

          <div className="space-y-4">
            {objectives.map((objective, index) => (
              <div key={index} className="border rounded-md p-4">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-sm font-medium text-gray-900">Objectif {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeObjective(index)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <input
                      type="text"
                      value={objective.description}
                      onChange={(e) => updateObjective(index, 'description', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`objective-${index}-achieved`}
                      checked={objective.is_achieved}
                      onChange={(e) => updateObjective(index, 'is_achieved', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor={`objective-${index}-achieved`}
                      className="ml-2 block text-sm text-gray-900"
                    >
                      Objectif atteint
                    </label>
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