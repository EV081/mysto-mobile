import { useState, useCallback } from 'react';
import { checkPlace } from '@services/goals/checkPlace';
import { useToast } from '../useToast';

interface UseLocationValidationProps {
  museumId: number;
  userLocation?: { latitude: number; longitude: number } | null;
}

export const useLocationValidation = ({ museumId, userLocation }: UseLocationValidationProps) => {
  const [isValidatingLocation, setIsValidatingLocation] = useState(false);
  const [isLocationValid, setIsLocationValid] = useState(false);
  const { showError, showSuccess } = useToast();

  const validateLocation = useCallback(async () => {
    if (!userLocation) {
      showError('No se pudo obtener tu ubicación');
      return false;
    }

    setIsValidatingLocation(true);
    try {
      const isValid = await checkPlace(
        museumId,
        userLocation.latitude,
        userLocation.longitude
      );
      
      setIsLocationValid(isValid);
      
      if (isValid) {
        showSuccess('¡Estás en el lugar correcto!');
      } else {
        showError('Debes estar más cerca del museo para continuar');
      }
      
      return isValid;
    } catch (error) {
      console.error('Error validando ubicación:', error);
      showError('Error al validar tu ubicación');
      return false;
    } finally {
      setIsValidatingLocation(false);
    }
  }, [museumId, userLocation, showError, showSuccess]);

  return {
    isValidatingLocation,
    isLocationValid,
    validateLocation,
  };
};
