import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { QuestionnaireList } from '../components/QuestionnaireList';
import { QuestionnaireForm } from '../components/QuestionnaireForm';
import { Questionnaire, Question } from '../types/database';

export default function Questionnaires() {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuestionnaire, setEditingQuestionnaire] = useState<Questionnaire | undefined>();
  const [editingQuestions, setEditingQuestions] = useState<Array<{
    label: string;
    category: string;
  }>>([]);

  useEffect(() => {
    loadQuestionnaires();
  }, []);

  async function loadQuestionnaires() {
    const { data, error } = await supabase
      .from('questionnaires')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading questionnaires:', error);
      return;
    }

    setQuestionnaires(data);
  }

  async function loadQuestionnaireDetails(questionnaireId: string) {
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('label, category')
      .eq('questionnaire_id', questionnaireId);

    if (questionsError) {
      console.error('Error loading questions:', questionsError);
      return;
    }

    setEditingQuestions(questions || []);
  }

  async function handleSubmit(data: {
    title: string;
    author: string;
    questions: Array<{
      label: string;
      category: string;
    }>;
  }) {
    try {
      if (editingQuestionnaire) {
        // Update existing questionnaire
        const { error: questionnaireError } = await supabase
          .from('questionnaires')
          .update({ title: data.title, author: data.author })
          .eq('id', editingQuestionnaire.id);

        if (questionnaireError) throw questionnaireError;

        // Delete existing questions
        const { error: deleteError } = await supabase
          .from('questions')
          .delete()
          .eq('questionnaire_id', editingQuestionnaire.id);

        if (deleteError) throw deleteError;

        // Create new questions
        const questionsToInsert = data.questions.map(question => ({
          questionnaire_id: editingQuestionnaire.id,
          label: question.label,
          category: question.category
        }));

        const { error: questionsError } = await supabase
          .from('questions')
          .insert(questionsToInsert);

        if (questionsError) throw questionsError;
      } else {
        // Create new questionnaire
        const { data: newQuestionnaire, error: questionnaireError } = await supabase
          .from('questionnaires')
          .insert([{ title: data.title, author: data.author }])
          .select()
          .single();

        if (questionnaireError) throw questionnaireError;

        // Create questions
        const questionsToInsert = data.questions.map(question => ({
          questionnaire_id: newQuestionnaire.id,
          label: question.label,
          category: question.category
        }));

        const { error: questionsError } = await supabase
          .from('questions')
          .insert(questionsToInsert);

        if (questionsError) throw questionsError;
      }

      setIsFormOpen(false);
      setEditingQuestionnaire(undefined);
      setEditingQuestions([]);
      loadQuestionnaires();
    } catch (error) {
      console.error('Error saving questionnaire:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce questionnaire ?')) {
      return;
    }

    const { error } = await supabase
      .from('questionnaires')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting questionnaire:', error);
      return;
    }

    loadQuestionnaires();
  }

  async function handleEdit(questionnaire: Questionnaire) {
    setEditingQuestionnaire(questionnaire);
    await loadQuestionnaireDetails(questionnaire.id);
    setIsFormOpen(true);
  }

  return (
    <div>
      {isFormOpen ? (
        <QuestionnaireForm
          questionnaire={editingQuestionnaire}
          initialQuestions={editingQuestions}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingQuestionnaire(undefined);
            setEditingQuestions([]);
          }}
        />
      ) : (
        <QuestionnaireList
          questionnaires={questionnaires}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCreate={() => setIsFormOpen(true)}
        />
      )}
    </div>
  );
}