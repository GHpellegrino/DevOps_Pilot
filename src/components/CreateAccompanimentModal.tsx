import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CreateAccompanimentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { tribe: string; squad: string; coach: string }) => void;
}

interface Tribe {
  id: string;
  name: string;
}

interface Squad {
  id: string;
  name: string;
  tribe_id: string;
}

interface Coach {
  id: string;
  name: string;
}

export function CreateAccompanimentModal({ isOpen, onClose, onSubmit }: CreateAccompanimentModalProps) {
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [selectedTribeId, setSelectedTribeId] = useState('');
  const [selectedSquadName, setSelectedSquadName] = useState('');
  const [selectedCoachName, setSelectedCoachName] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadTribesAndSquads();
      loadCoaches();
    }
  }, [isOpen]);

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

  async function loadCoaches() {
    const { data: coachesData } = await supabase
      .from('coaches')
      .select('*')
      .order('name');
    if (coachesData) setCoaches(coachesData);
  }

  const filteredSquads = squads.filter(squad => squad.tribe_id === selectedTribeId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedTribe = tribes.find(t => t.id === selectedTribeId);
    onSubmit({
      tribe: selectedTribe?.name || '',
      squad: selectedSquadName,
      coach: selectedCoachName,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Nouvel Accompagnement</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="tribe" className="block text-sm font-medium text-gray-700">
              Tribu
            </label>
            <select
              id="tribe"
              value={selectedTribeId}
              onChange={(e) => {
                setSelectedTribeId(e.target.value);
                setSelectedSquadName('');
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
            <label htmlFor="coach" className="block text-sm font-medium text-gray-700">
              Coach
            </label>
            <select
              id="coach"
              value={selectedCoachName}
              onChange={(e) => setSelectedCoachName(e.target.value)}
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

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}