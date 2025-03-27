import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AccompanimentList } from '../components/AccompanimentList';
import { AccompanimentForm } from '../components/AccompanimentForm';
import { AccompanimentDetails } from '../components/AccompanimentDetails';
import { CreateAccompanimentModal } from '../components/CreateAccompanimentModal';
import { Accompaniment, Objective } from '../types/database';

export default function Accompaniments() {
  const navigate = useNavigate();
  const location = useLocation();
  const [accompaniments, setAccompaniments] = useState<Accompaniment[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingAccompaniment, setEditingAccompaniment] = useState<Accompaniment | undefined>();
  const [editingObjectives, setEditingObjectives] = useState<Objective[]>([]);
  const [evaluations, setEvaluations] = useState<Array<{
    id: string;
    questionnaire_title: string;
    created_at: string;
  }>>([]);

  useEffect(() => {
    loadAccompaniments();
  }, []);

  // Reset detail view when pathname changes
  useEffect(() => {
    if (location.pathname === '/accompaniments' && !location.state?.selectedAccompanimentId) {
      setIsDetailsOpen(false);
      setEditingAccompaniment(undefined);
      setEditingObjectives([]);
      setEvaluations([]);
    }
  }, [location.pathname, location.state]);

  // Handle selected accompaniment from navigation state
  useEffect(() => {
    const state = location.state as { selectedAccompanimentId?: string } | null;
    if (state?.selectedAccompanimentId) {
      const accompaniment = accompaniments.find(a => a.id === state.selectedAccompanimentId);
      if (accompaniment) {
        handleEdit(accompaniment);
      }
      // Clear the state to prevent re-opening on subsequent navigation
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, accompaniments]);

  async function loadAccompaniments() {
    const { data, error } = await supabase
      .from('accompaniments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading accompaniments:', error);
      return;
    }

    setAccompaniments(data);
  }

  async function loadAccompanimentDetails(accompanimentId: string) {
    // Load objectives
    const { data: objectives, error: objectivesError } = await supabase
      .from('objectives')
      .select('*')
      .eq('accompaniment_id', accompanimentId);

    if (objectivesError) {
      console.error('Error loading objectives:', objectivesError);
      return;
    }

    setEditingObjectives(objectives || []);

    // Load evaluations with questionnaire titles
    const { data: evaluationsData, error: evaluationsError } = await supabase
      .from('evaluations')
      .select(`
        id,
        created_at,
        questionnaires (
          title
        )
      `)
      .eq('accompaniment_id', accompanimentId)
      .order('created_at', { ascending: false });

    if (evaluationsError) {
      console.error('Error loading evaluations:', evaluationsError);
      return;
    }

    setEvaluations(
      evaluationsData.map((evaluation: any) => ({
        id: evaluation.id,
        questionnaire_title: evaluation.questionnaires.title,
        created_at: evaluation.created_at,
      }))
    );
  }

  async function handleCreateAccompaniment(data: { tribe: string; squad: string; coach: string }) {
    try {
      const { data: newAccompaniment, error } = await supabase
        .from('accompaniments')
        .insert([{ tribe: data.tribe, squad: data.squad, coach: data.coach }])
        .select()
        .single();

      if (error) throw error;

      setIsModalOpen(false);
      setEditingAccompaniment(newAccompaniment);
      setIsFormOpen(true);
    } catch (error) {
      console.error('Error creating accompaniment:', error);
    }
  }

  async function handleSubmit(data: {
    tribe: string;
    squad: string;
    objectives: Array<{
      description: string;
      is_achieved: boolean;
    }>;
  }) {
    try {
      if (editingAccompaniment) {
        // Update existing accompaniment
        const { error: accompanimentError } = await supabase
          .from('accompaniments')
          .update({ tribe: data.tribe, squad: data.squad })
          .eq('id', editingAccompaniment.id);

        if (accompanimentError) throw accompanimentError;

        // Delete existing objectives
        const { error: deleteError } = await supabase
          .from('objectives')
          .delete()
          .eq('accompaniment_id', editingAccompaniment.id);

        if (deleteError) throw deleteError;

        // Create new objectives
        const objectivesToInsert = data.objectives.map((objective) => ({
          accompaniment_id: editingAccompaniment.id,
          description: objective.description,
          is_achieved: objective.is_achieved,
        }));

        const { error: objectivesError } = await supabase
          .from('objectives')
          .insert(objectivesToInsert);

        if (objectivesError) throw objectivesError;
      }

      setIsFormOpen(false);
      setEditingAccompaniment(undefined);
      setEditingObjectives([]);
      loadAccompaniments();
    } catch (error) {
      console.error('Error saving accompaniment:', error);
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('accompaniments').delete().eq('id', id);

    if (error) {
      console.error('Error deleting accompaniment:', error);
      return;
    }

    setIsDetailsOpen(false);
    setEditingAccompaniment(undefined);
    loadAccompaniments();
  }

  async function handleEdit(accompaniment: Accompaniment) {
    setEditingAccompaniment(accompaniment);
    await loadAccompanimentDetails(accompaniment.id);
    setIsDetailsOpen(true);
  }

  function handleEvaluate(accompaniment: Accompaniment) {
    navigate(`/evaluations/new/${accompaniment.id}`);
  }

  return (
    <div>
      {isDetailsOpen && editingAccompaniment ? (
        <AccompanimentDetails
          accompaniment={editingAccompaniment}
          evaluations={evaluations}
          objectives={editingObjectives}
          onDelete={() => handleDelete(editingAccompaniment.id)}
          onUpdate={() => loadAccompanimentDetails(editingAccompaniment.id)}
        />
      ) : isFormOpen ? (
        <AccompanimentForm
          accompaniment={editingAccompaniment}
          initialObjectives={editingObjectives}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingAccompaniment(undefined);
            setEditingObjectives([]);
          }}
        />
      ) : (
        <AccompanimentList
          accompaniments={accompaniments}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCreate={() => setIsModalOpen(true)}
          onEvaluate={handleEvaluate}
        />
      )}

      <CreateAccompanimentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateAccompaniment}
      />
    </div>
  );
}