// Paleta de colores principal de la aplicación
export const COLORS = {
  // Color principal
  primary: '#684300ff',
  background: '#f7f2e9',
  text: '#1e293b',
  border: '#e0e0e0',

  // Colores de tema
  light: {
    background: '#FFFFFF',
    text: '#000000',
    textSecondary: '#666666',
    cardBackground: '#FFFFFF',
    border: '#E0E0E0',
    buttonBackground: '#684300ff',
    buttonText: '#FFFFFF',
  },
  
  dark: {
    background: '#000000',
    text: '#FFFFFF',
    textSecondary: '#CCCCCC',
    cardBackground: '#1A1A1A',
    border: '#333333',
    buttonBackground: '#f7f2e9',
    buttonText: '#FFFFFF',
  },
  
  // Colores de estado
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  // Colores adicionales para reutilización
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  purple: {
    50: '#FAF5FF',
    100: '#F3E8FF',
    200: '#E9D5FF',
    300: '#D8B4FE',
    400: '#C084FC',
    500: '#A855F7',
    600: '#9333EA',
    700: '#7C3AED',
    800: '#6B21A8',
    900: '#581C87',
  },
  red: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  green: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },
  blue: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  yellow: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  
  // Colores semánticos para componentes
  card: {
    background: '#FFFFFF',
    border: '#E5E7EB',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  button: {
    primary: '#7300BF',
    secondary: '#6B7280',
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
    disabled: '#D1D5DB',
  },
  input: {
    background: '#FFFFFF',
    border: '#D1D5DB',
    focus: '#7300BF',
    placeholder: '#9CA3AF',
  },
  modal: {
    overlay: 'rgba(0, 0, 0, 0.5)',
    background: '#FFFFFF',
    border: '#E5E7EB',
  },
};

// Función para obtener colores según el tema
export const getThemeColors = (isDark: boolean) => {
  return isDark ? COLORS.dark : COLORS.light;
};

// Función para obtener colores de estado
export const getStatusColor = (status: 'success' | 'warning' | 'error' | 'info') => {
  return COLORS[status];
};

// Función para obtener colores de botón
export const getButtonColor = (variant: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info') => {
  return COLORS.button[variant];
};