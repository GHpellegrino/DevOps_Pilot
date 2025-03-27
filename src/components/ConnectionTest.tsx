import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function ConnectionTest() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    testConnection();
  }, []);

  async function testConnection() {
    try {
      // Test 1: Vérifier les variables d'environnement
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!url || !key) {
        throw new Error('Variables d\'environnement manquantes');
      }

      // Test 2: Faire une requête simple à Supabase
      const { data, error } = await supabase
        .from('tribes')
        .select('count')
        .limit(1)
        .single();

      if (error) {
        throw error;
      }

      setStatus('success');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Erreur inconnue');
    }
  }

  return (
    <div className="fixed bottom-4 right-4 p-4 rounded-lg shadow-lg bg-white">
      <div className="flex items-center space-x-2">
        {status === 'loading' && (
          <>
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <span>Test de connexion en cours...</span>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Connexion à Supabase OK</span>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="h-5 w-5 text-red-500" />
            <div className="flex flex-col">
              <span>Erreur de connexion</span>
              <span className="text-sm text-red-600">{errorMessage}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}