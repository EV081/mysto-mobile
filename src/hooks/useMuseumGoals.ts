import { useCallback, useEffect, useState } from 'react';
import { getGoals } from '@services/goals/getGoal';
import { startGoals } from '@services/goals/startGoal';

interface UseMuseumGoalsOptions {
  museumId: number;
  userLocation?: { latitude: number; longitude: number } | null;
  autoStart?: boolean;
}

interface UseMuseumGoalsResult {
  goalId: number | null;
  found: Set<number>;
  culturalObjects: any[];
  isLoading: boolean;
  error: string | null;
  startGoal: () => Promise<void>;
  refreshGoals: () => Promise<void>;
  markObjectFound: (objectId: number) => void;
}

export function useMuseumGoals({ 
  museumId, 
  userLocation, 
  autoStart = true 
}: UseMuseumGoalsOptions): UseMuseumGoalsResult {
  const [goalId, setGoalId] = useState<number | null>(null);
  const [found, setFound] = useState<Set<number>>(new Set());
  const [culturalObjects, setCulturalObjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGoals = useCallback(async () => {
    if (!museumId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const goalsResponse = await getGoals(museumId);
      
      if (goalsResponse && goalsResponse.id) {
        setGoalId(goalsResponse.id);
        setFound(new Set(goalsResponse.found || []));
        setCulturalObjects(goalsResponse.culturalObject || []);
      } else {
        setGoalId(null);
        setFound(new Set());
        setCulturalObjects([]);
      }
    } catch (err: any) {
      console.error('Error loading goals:', err);
      
      if (err?.response?.status === 404) {
        // No hay metas activas, intentar iniciar una nueva
        console.log('No hay metas activas, intentando iniciar una nueva...');
        await startGoal();
      } else {
        setError(err?.message || 'Error al cargar metas');
      }
    } finally {
      setIsLoading(false);
    }
  }, [museumId, startGoal]);

  const startGoal = useCallback(async () => {
    if (!museumId || !userLocation) {
      console.log('No se puede iniciar meta: falta museumId o userLocation');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Iniciando nueva meta para museo:', museumId);
      const newGoalId = await startGoals(
        museumId, 
        userLocation.latitude, 
        userLocation.longitude
      );
      
      if (newGoalId) {
        console.log('Meta iniciada exitosamente con ID:', newGoalId);
        setGoalId(newGoalId);
        // Recargar goals después de iniciar
        await loadGoals();
      }
    } catch (err: any) {
      console.error('Error starting goal:', err);
      
      if (err?.response?.status === 403) {
        setError('Debes estar cerca del museo para iniciar las metas');
      } else if (err?.response?.status === 400) {
        setError('El museo no tiene suficientes objetos culturales');
      } else {
        setError(err?.message || 'Error al iniciar meta');
      }
    } finally {
      setIsLoading(false);
    }
  }, [museumId, userLocation, loadGoals]);

  const refreshGoals = useCallback(async () => {
    await loadGoals();
  }, [loadGoals]);

  const markObjectFound = useCallback((objectId: number) => {
    setFound(prev => {
      const newSet = new Set(prev);
      newSet.add(objectId);
      return newSet;
    });
  }, []);

  // Auto-start si está habilitado
  useEffect(() => {
    if (autoStart && museumId) {
      loadGoals();
    }
  }, [autoStart, museumId, loadGoals]);

  return {
    goalId,
    found,
    culturalObjects,
    isLoading,
    error,
    startGoal,
    refreshGoals,
    markObjectFound,
  };
}
