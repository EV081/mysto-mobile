import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { startGoals } from '@services/goals/startGoal';
import { getGoals } from '@services/goals/getGoal';

type LatLng = { latitude: number; longitude: number };

export type GoalInitStatus =
  | 'idle'
  | 'starting'
  | 'ready'
  | 'blocked_distance'
  | 'insufficient_objects'
  | 'not_found'
  | 'unauthorized'
  | 'error';

interface UseGoalInitOptions {
  museumId: number | null | undefined;
  userLocation?: LatLng | null;
  autostart?: boolean; // default: true
}

interface UseGoalInitResult {
  goalId: number | null;
  status: GoalInitStatus;
  message?: string;
  isInitializing: boolean;
  startIfNeeded: () => Promise<number | null>;
  resetGoalCache: () => Promise<void>;
}

function ymd(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function cacheKey(museumId: number) {
  return `goal:${museumId}:${ymd()}`;
}

function extractGoalId(anyResp: any): number | null {
  const src = anyResp?.data ?? anyResp;
  const candidates = [
    src?.goalId, src?.id, src?.goal?.id, src?.goal?.goalId,
    typeof src?.goalId === 'string' ? Number(src.goalId) : null,
    typeof src?.id === 'string' ? Number(src.id) : null,
  ].filter((v) => Number.isFinite(v)) as number[];
  return candidates.length ? candidates[0]! : null;
}

export function useGoalInit(options: UseGoalInitOptions): UseGoalInitResult {
  const { museumId, userLocation, autostart = true } = options;
  const [goalId, setGoalId] = useState<number | null>(null);
  const [status, setStatus] = useState<GoalInitStatus>('idle');
  const [message, setMessage] = useState<string | undefined>(undefined);

  const key = useMemo(() => (museumId ? cacheKey(museumId) : null), [museumId]);
  const isInitializing = status === 'starting';

  const resetGoalCache = useCallback(async () => {
    if (!key) return;
    await AsyncStorage.removeItem(key);
  }, [key]);

  const startIfNeeded = useCallback(async (): Promise<number | null> => {
    if (!museumId) return null;
    setMessage(undefined);

    // 0) Revisar cache local (por día y museo)
    try {
      const cached = key ? await AsyncStorage.getItem(key) : null;
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Number.isFinite(parsed?.goalId)) {
          setGoalId(parsed.goalId);
          setStatus('ready');
          return parsed.goalId as number;
        }
      }
    } catch {/* ignore cache errors */}

    setStatus('starting');

    // 1) Intentar iniciar metas
    try {
      if (userLocation) {
        const id = await startGoals(museumId, userLocation.latitude, userLocation.longitude);
        if (Number.isFinite(id)) {
          setGoalId(id);
          setStatus('ready');
          if (key) await AsyncStorage.setItem(key, JSON.stringify({ goalId: id, at: new Date().toISOString() }));
          return id;
        }
      }
    } catch (error: any) {
      const code = error?.response?.status;
      const msg = error?.response?.data?.message || error?.message || String(error);

      // 403 por distancia
      if (code === 403 && typeof msg === 'string' && msg.includes('20 metros')) {
        setStatus('blocked_distance');
        setMessage('Debes estar a menos de 20 metros del museo para iniciar las metas.');
        // Intentar recuperar goal existente abajo
      }
      // 400 ya tiene meta activa hoy
      else if (code === 400 && typeof msg === 'string' && msg.includes('meta activa')) {
        // Intentar recuperar goal existente abajo
      }
      // 400 insuficientes objetos
      else if (code === 400 && typeof msg === 'string' && msg.includes('suficientes objetos')) {
        setStatus('insufficient_objects');
        setMessage('El museo no tiene suficientes objetos culturales.');
        return null;
      }
      // 404 museo no encontrado
      else if (code === 404) {
        setStatus('not_found');
        setMessage('Museo no encontrado.');
        return null;
      }
      // 401 no autorizado
      else if (code === 401) {
        setStatus('unauthorized');
        setMessage('Sesión expirada o no autorizada.');
        return null;
      }
      else {
        // otros errores: seguimos a intentar recuperar goal
        setMessage(msg);
      }
    }

    // 2) Intentar recuperar un goalId activo en el backend (si el user ya tenía uno)
    try {
      const resp = await getGoals(museumId);
      const id = extractGoalId(resp);
      if (Number.isFinite(id)) {
        setGoalId(id);
        setStatus('ready');
        if (key) await AsyncStorage.setItem(key, JSON.stringify({ goalId: id, at: new Date().toISOString() }));
        return id!;
      }
    } catch (e: any) {
      // ignore; daremos fallback abajo
    }

    // 3) Si no se pudo iniciar ni recuperar
    if (status !== 'blocked_distance' && status !== 'insufficient_objects' && status !== 'not_found' && status !== 'unauthorized') {
      setStatus('error');
      setMessage(prev => prev || 'No se pudo obtener la misión activa.');
    }
    return null;
  }, [museumId, userLocation, key, status]);

  // autostart
  useEffect(() => {
    if (autostart && museumId) {
      startIfNeeded();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autostart, museumId]);

  return { goalId, status, message, isInitializing, startIfNeeded, resetGoalCache };
}
