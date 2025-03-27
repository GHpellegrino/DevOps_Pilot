import React from 'react';
import { Plus, UserCog } from 'lucide-react';
import { Accompaniment } from '../types/database';
import { getTribeColor } from '../utils/tribeColors';

interface AccompanimentListProps {
  accompaniments: Accompaniment[];
  onEdit: (accompaniment: Accompaniment) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  onEvaluate: (accompaniment: Accompaniment) => void;
}

export function AccompanimentList({
  accompaniments,
  onEdit,
  onCreate,
}: AccompanimentListProps) {
  // Group accompaniments by tribe
  const accompanimentsByTribe = accompaniments.reduce((acc, accompaniment) => {
    if (!acc[accompaniment.tribe]) {
      acc[accompaniment.tribe] = [];
    }
    acc[accompaniment.tribe].push(accompaniment);
    return acc;
  }, {} as Record<string, Accompaniment[]>);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Accompagnements</h2>
        <button
          onClick={onCreate}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nouvel Accompagnement
        </button>
      </div>

      <div className="space-y-8">
        {Object.entries(accompanimentsByTribe).map(([tribe, tribeAccompaniments]) => (
          <div key={tribe} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">{tribe}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {tribeAccompaniments.map((accompaniment) => (
                <div
                  key={accompaniment.id}
                  className="border-2 border-gray-200 hover:border-indigo-500 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer p-6"
                  style={{ backgroundColor: getTribeColor(accompaniment.tribe) }}
                  onClick={() => onEdit(accompaniment)}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {accompaniment.squad}
                  </h3>
                  <div className="flex items-center text-gray-700">
                    <UserCog className="h-4 w-4 mr-2" />
                    <p className="font-medium">{accompaniment.coach}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}