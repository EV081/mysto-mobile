import { useState, useEffect, useCallback } from 'react';
import { getGoals } from '@services/goals/getGoal';
import { useToast } from './useToast';
import { useNavigation } from '@react-navigation/native';

interface UseGoalsCompletionProps {
  museumId: number;
  museumName?: string;
  onGoalsCompleted?: () => void;
}

export const useGoalsCompletion = ({ museumId, museumName, onGoalsCompleted }: UseGoalsCompletionProps) => {
  const [isCheckingGoals, setIsCheckingGoals] = useState(false);
  const [goalsData, setGoalsData] = useState<any>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const { showCelebration } = useToast();
  const navigation = useNavigation<any>();

  const checkGoalsCompletion = useCallback(async () => {
    setIsCheckingGoals(true);
    try {
      const response = await getGoals(museumId);
      setGoalsData(response);
      
      // Verificar si se completaron las metas (3 objetos encontrados)
      const foundCount = response.found?.length || 0;
      const totalCount = response.culturalObject?.length || 0;
      
      if (foundCount >= 3 && foundCount === totalCount) {
        setIsCompleted(true);
        showCelebration('¡Felicidades! Has completado todas las metas del museo');
        
        // NOTA: Redirección automática al quiz deshabilitada para permitir acceso libre
        // setTimeout(() => {
        //   navigation.navigate('Quiz', {
        //     museumId,
        //     museumName: museumName || 'Museo',
        //     goalId: response.id, // Usar el ID de la meta, no del museo
        //   });
        // }, 3000);
        
        onGoalsCompleted?.();
      }
      
      return response;
    } catch (error) {
      console.error('Error verificando metas:', error);
      return null;
    } finally {
      setIsCheckingGoals(false);
    }
  }, [museumId, museumName, showCelebration, navigation, onGoalsCompleted]);

  // Verificar metas al montar el componente
  useEffect(() => {
    checkGoalsCompletion();
  }, [checkGoalsCompletion]);

  return {
    isCheckingGoals,
    goalsData,
    isCompleted,
    checkGoalsCompletion,
  };
};
