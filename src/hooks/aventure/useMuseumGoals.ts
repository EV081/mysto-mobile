import { useCallback, useEffect, useRef, useState } from 'react';
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
  startGoal: () => Promise<number | null>;
  refreshGoals: () => Promise<void>;
  markObjectFound: (objectId: number) => void;
}

/**
 * Flujo:
 * 1) getGoals(museumId) -> si 404, startGoals -> getGoals
 * 2) goalId SIEMPRE viene de resp.id (backend)
 */
export function useMuseumGoals({
  museumId,
  userLocation,
  autoStart = true,
}: UseMuseumGoalsOptions): UseMuseumGoalsResult {
  const [goalId, setGoalId] = useState<number | null>(null);
  const [found, setFound] = useState<Set<number>>(new Set());
  const [culturalObjects, setCulturalObjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startingRef = useRef(false);

  const loadFromServer = useCallback(async () => {
    const resp = await getGoals(museumId);
    if (!resp || typeof resp.id !== 'number') {
      throw new Error('Respuesta de metas inválida');
    }
    setGoalId(resp.id);
    setFound(new Set(resp.found || []));
    setCulturalObjects(resp.culturalObject || []);
  }, [museumId]);

  const startGoal = useCallback(async (): Promise<number | null> => {
    if (startingRef.current) return goalId ?? null;
    if (!userLocation) {
      setError('No hay ubicación del usuario para iniciar la meta.');
      return null;
    }
    startingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const newGoalId = await startGoals(
        museumId,
        userLocation.latitude,
        userLocation.longitude
      );
      if (typeof newGoalId === 'number') {
        setGoalId(newGoalId);
        await loadFromServer();
        return newGoalId;
      }
      throw new Error('No se recibió goalId al iniciar metas.');
    } catch (err: any) {
      const msg = String(err?.response?.data?.message || err?.message || '');
      const code = err?.response?.status;

      if (code === 403) {
        setError('Debes estar lo suficientemente cerca del museo para iniciar la meta.');
      } else if (code === 400) {
        if (msg.toLowerCase().includes('meta activa')) {
          try {
            await loadFromServer();
            return goalId;
          } catch {
            setError('No se pudo recuperar la meta activa.');
          }
        } else if (msg.toLowerCase().includes('suficientes objetos')) {
          setError('El museo no tiene suficientes objetos culturales.');
        } else {
          setError(msg || 'Error al iniciar meta.');
        }
      } else {
        setError(msg || 'Error al iniciar meta.');
      }
      return null;
    } finally {
      startingRef.current = false;
      setIsLoading(false);
    }
  }, [goalId, loadFromServer, museumId, userLocation]);

  const refreshGoals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await loadFromServer();
    } catch (err: any) {
      if (err?.response?.status === 404) {
        if (userLocation) {
          await startGoal();
        } else {
          setError('No hay una meta activa para este museo.');
        }
      } else {
        setError(err?.message || 'Error al cargar metas.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [loadFromServer, startGoal, userLocation]);

  const markObjectFound = useCallback((objectId: number) => {
    setFound(prev => {
      const next = new Set(prev);
      next.add(objectId);
      return next;
    });
  }, []);

  useEffect(() => {
    if (autoStart) {
      refreshGoals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, museumId]);

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
