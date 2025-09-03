import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { getGoals } from '@services/goals/getGoal';

type FoundSet = Set<number>;

interface MuseumGoalState {
  goalId: number | null;
  found: FoundSet;
  isLoading: boolean;
  error?: string | null;
}

interface GoalContextValue {
  getStateForMuseum: (museumId: number) => MuseumGoalState;
  refreshMuseumGoals: (museumId: number) => Promise<void>;
  markObjectAsFoundLocal: (museumId: number, objectId: number) => void;
}

const GoalContext = createContext<GoalContextValue | undefined>(undefined);

export const GoalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const stateRef = useRef<Map<number, MuseumGoalState>>(new Map());
  const [, force] = useState({});

  const getStateForMuseum = useCallback((museumId: number): MuseumGoalState => {
    // Validar que museumId sea un número válido
    if (!Number.isFinite(museumId) || museumId <= 0) {
      console.warn('useGoalsState: museumId inválido:', museumId);
      return { goalId: null, found: new Set<number>(), isLoading: false, error: 'ID de museo inválido' };
    }
    
    const existing = stateRef.current.get(museumId);
    if (existing) return existing;
    
    const initial: MuseumGoalState = { 
      goalId: null, 
      found: new Set<number>(), 
      isLoading: false, 
      error: null 
    };
    stateRef.current.set(museumId, initial);
    return initial;
  }, []);

  const setStateForMuseum = useCallback((museumId: number, partial: Partial<MuseumGoalState>) => {
    if (!Number.isFinite(museumId) || museumId <= 0) {
      console.warn('setStateForMuseum: museumId inválido:', museumId);
      return;
    }
    
    const prev = getStateForMuseum(museumId);
    const next: MuseumGoalState = {
      goalId: partial.goalId ?? prev.goalId,
      found: partial.found ?? prev.found,
      isLoading: partial.isLoading ?? prev.isLoading,
      error: partial.error ?? prev.error,
    };
    stateRef.current.set(museumId, next);
    force({});
  }, [getStateForMuseum]);

  const refreshMuseumGoals = useCallback(async (museumId: number) => {
    if (!Number.isFinite(museumId) || museumId <= 0) {
      console.warn('refreshMuseumGoals: museumId inválido:', museumId);
      return;
    }
    
    // Evitar refrescar si ya estamos cargando
    const currentState = getStateForMuseum(museumId);
    if (currentState.isLoading) {
      console.log('refreshMuseumGoals: Ya se está cargando para museo:', museumId);
      return;
    }
    
    setStateForMuseum(museumId, { isLoading: true, error: null });
    try {
      const goalsResponse = await getGoals(museumId);
      
      // Verificar que goalsResponse existe y tiene la estructura esperada
      if (!goalsResponse || typeof goalsResponse !== 'object') {
        throw new Error('Respuesta inválida del servidor');
      }
      
      // Extraer found de forma segura
      const foundArray = Array.isArray(goalsResponse.found) ? goalsResponse.found : [];
      const foundSet = new Set<number>(foundArray);
      
      setStateForMuseum(museumId, {
        isLoading: false,
        goalId: goalsResponse.id ?? null,
        found: foundSet,
        error: null,
      });
    } catch (err: any) {
      console.error('Error refreshing museum goals:', err);
      
      // Si es un 404 (no hay metas), no es un error crítico
      if (err?.response?.status === 404) {
        setStateForMuseum(museumId, { 
          isLoading: false, 
          goalId: null,
          found: new Set<number>(),
          error: null // No es un error, simplemente no hay metas
        });
      } else {
        setStateForMuseum(museumId, { 
          isLoading: false, 
          error: err?.message || 'Error al cargar metas' 
        });
      }
    }
  }, [setStateForMuseum, getStateForMuseum]);

  const markObjectAsFoundLocal = useCallback((museumId: number, objectId: number) => {
    if (!Number.isFinite(museumId) || museumId <= 0) {
      console.warn('markObjectAsFoundLocal: museumId inválido:', museumId);
      return;
    }
    
    if (!Number.isFinite(objectId) || objectId <= 0) {
      console.warn('markObjectAsFoundLocal: objectId inválido:', objectId);
      return;
    }
    
    const prev = getStateForMuseum(museumId);
    const nextFound = new Set<number>(prev.found);
    nextFound.add(objectId);
    setStateForMuseum(museumId, { found: nextFound });
  }, [getStateForMuseum, setStateForMuseum]);

  const value = useMemo<GoalContextValue>(() => ({
    getStateForMuseum,
    refreshMuseumGoals,
    markObjectAsFoundLocal,
  }), [getStateForMuseum, refreshMuseumGoals, markObjectAsFoundLocal]);

  return (
    <GoalContext.Provider value={value}>
      {children}
    </GoalContext.Provider>
  );
};

export function useGoalsState(museumId: number) {
  const ctx = useContext(GoalContext);
  if (!ctx) throw new Error('useGoalsState debe usarse dentro de GoalProvider');
  
  const state = ctx.getStateForMuseum(museumId);
  
  const refresh = useCallback(() => {
    try {
      // Solo refrescar si no estamos ya cargando
      if (!state.isLoading) {
        ctx.refreshMuseumGoals(museumId);
      }
    } catch (error) {
      console.error('Error in refresh:', error);
    }
  }, [ctx, museumId, state.isLoading]);
  
  const markFound = useCallback((objectId: number) => {
    try {
      ctx.markObjectAsFoundLocal(museumId, objectId);
    } catch (error) {
      console.error('Error in markFound:', error);
    }
  }, [ctx, museumId]);
  
  return { 
    ...state, 
    refresh, 
    markFound 
  };
}


