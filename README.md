# Mysto Mobile App

Aplicación móvil desarrollada con React Native y Expo.

## Estructura del Proyecto

```
mysto-mobile/
├── src/
│   ├── components/     # Componentes reutilizables
│   ├── contexts/       # Contextos de React
│   ├── hooks/          # Hooks personalizados
│   ├── interfaces/     # Interfaces TypeScript
│   ├── navigation/     # Configuración de navegación
│   ├── screens/        # Pantallas de la aplicación
│   ├── services/       # Servicios y APIs
│   │   └── api.ts      # Clase Api para peticiones HTTP
│   ├── utils/          # Utilidades y funciones helper
│   │   └── getRoleBasedOnToken.ts
│   ├── constants/      # Constantes de la aplicación
│   ├── assets/         # Recursos estáticos
│   └── App.tsx         # Componente principal
├── App.tsx             # Punto de entrada principal
├── package.json        # Dependencias del proyecto
├── env.example         # Variables de entorno de ejemplo
├── .eslintrc.cjs       # Configuración ESLint
└── .prettierrc         # Configuración Prettier
```

## Dependencias Instaladas

### Dependencias Principales
- **React Native & Expo**: Framework principal
- **TypeScript**: Tipado estático
- **Axios**: Cliente HTTP para peticiones API
- **AsyncStorage**: Almacenamiento local
- **JWT Decode**: Decodificación de tokens JWT

### Navegación
- **@react-navigation/native**: Navegación base
- **@react-navigation/stack**: Navegación por stack
- **@react-navigation/native-stack**: Stack nativo
- **@react-navigation/drawer**: Navegación drawer

### UI & Animaciones
- **react-native-paper**: Componentes Material Design
- **react-native-gesture-handler**: Gestos
- **react-native-reanimated**: Animaciones
- **react-native-vector-icons**: Iconos
- **react-native-safe-area-context**: Áreas seguras
- **react-native-screens**: Pantallas nativas

### Desarrollo
- **ESLint**: Linting de código
- **Prettier**: Formateo de código
- **TypeScript**: Verificación de tipos

## Configuración

1. **Variables de Entorno**: Copia el archivo `env.example` a `.env` y configura tu URL del backend:
   ```bash
   cp env.example .env
   ```

2. **Instalar Dependencias**:
   ```bash
   npm install
   ```

## Ejecutar la Aplicación

### Android
```bash
npm run android
```

### iOS (requiere macOS)
```bash
npm run ios
```

### Web
```bash
npm run web
```

## Scripts Disponibles

```bash
npm start          # Iniciar servidor de desarrollo
npm run android    # Ejecutar en Android
npm run ios        # Ejecutar en iOS
npm run web        # Ejecutar en web
npm run lint       # Verificar código
npm run lint:fix   # Corregir problemas automáticamente
npm run format     # Formatear código
npm run type-check # Verificar tipos TypeScript
```

## Uso de la API

La clase `Api` en `src/services/api.ts` proporciona métodos para realizar peticiones HTTP:

```typescript
import Api from '@services/api';

// Obtener instancia
const api = await Api.getInstance();

// Ejemplo de uso
const response = await api.get({
  url: '/users'
});
```

## Estructura de Directorios

### `/src/components`
Componentes reutilizables de React Native.

### `/src/screens`
Pantallas principales de la aplicación.

### `/src/services`
Servicios y APIs, incluyendo la clase Api para peticiones HTTP.

### `/src/interfaces`
Interfaces TypeScript para tipado de datos.

### `/src/hooks`
Hooks personalizados de React.

### `/src/contexts`
Contextos de React para manejo de estado global.

### `/src/navigation`
Configuración de navegación entre pantallas.

### `/src/utils`
Funciones utilitarias y helpers.

### `/src/constants`
Constantes de la aplicación (colores, tamaños, etc.).

### `/src/assets`
Recursos estáticos (imágenes, iconos, etc.).

## Características

- ✅ React Native con Expo
- ✅ TypeScript
- ✅ Estructura organizada y escalable
- ✅ Navegación completa (Stack, Drawer)
- ✅ Clase Api para manejo de peticiones HTTP
- ✅ AsyncStorage para persistencia de tokens
- ✅ JWT Decode para manejo de tokens
- ✅ Interceptores para manejo automático de errores de autenticación
- ✅ Configuración de variables de entorno
- ✅ ESLint y Prettier para formateo de código
- ✅ React Native Paper para UI
- ✅ Gestos y animaciones
- ✅ Iconos vectoriales
- ✅ Áreas seguras para diferentes dispositivos


### Configuracion de Maps
expo-location → Manejo de permisos y obtención de la ubicación en tiempo real del dispositivo.

react-native-maps → Renderizado del mapa interactivo, uso de marcadores y soporte para tiles personalizados.

Carto basemap tiles → Servicio externo de mapas base para mostrar el entorno geográfico.