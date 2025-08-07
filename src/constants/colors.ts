// Paleta de colores principal de la aplicación
export const COLORS = {
  // Color principal
  primary: '#7300BF',
  background: '#fff',
  text: '#1e293b',
  border: '#e0e0e0',

  // Colores de tema
  light: {
    background: '#FFFFFF',
    text: '#000000',
    textSecondary: '#666666',
    cardBackground: '#F8F8F8',
    border: '#E0E0E0',
    buttonBackground: '#7300BF',
    buttonText: '#FFFFFF',
  },
  
  dark: {
    background: '#000000',
    text: '#FFFFFF',
    textSecondary: '#CCCCCC',
    cardBackground: '#1A1A1A',
    border: '#333333',
    buttonBackground: '#7300BF',
    buttonText: '#FFFFFF',
  },
  
  // Colores de estado
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
};

// Función para obtener colores según el tema
export const getThemeColors = (isDark: boolean) => {
  return isDark ? COLORS.dark : COLORS.light;
};