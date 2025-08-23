import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, useColorScheme, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors, COLORS } from '@constants/colors';
import MapaBase from "@components/Map/MapaBase";
import { Ionicons } from '@expo/vector-icons';
import { getPagedMuseums } from '@services/museum/getListarMuseums';
import { MuseumResponse } from '@interfaces/museum/MuseumResponse';

// Interfaz para los resultados de búsqueda
interface SearchResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  type: string;
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getThemeColors(isDark);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [allMuseums, setAllMuseums] = useState<MuseumResponse[]>([]);

  // Cargar todos los museos al montar el componente
  useEffect(() => {
    loadAllMuseums();
  }, []);

  // Función para cargar todos los museos
  const loadAllMuseums = async () => {
    try {
      const data = await getPagedMuseums(0, 100); // Cargar hasta 100 museos
      setAllMuseums(data.contents);
    } catch (error) {
      console.error('Error al cargar museos:', error);
    }
  };

  // Función para buscar lugares
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Buscar en los museos existentes con búsqueda parcial
      const query = searchQuery.toLowerCase().trim();
      
      // Búsqueda más flexible que incluye coincidencias parciales
      const filteredMuseums = allMuseums.filter(museum => {
        const name = museum.name.toLowerCase();
        const description = museum.description.toLowerCase();
        
        // Buscar en el nombre del museo
        if (name.includes(query)) return true;
        
        // Buscar en la descripción
        if (description.includes(query)) return true;
        
        // Buscar palabras individuales en el nombre
        const nameWords = name.split(/\s+/);
        if (nameWords.some(word => word.includes(query))) return true;
        
        // Buscar palabras individuales en la descripción
        const descWords = description.split(/\s+/);
        if (descWords.some(word => word.includes(query))) return true;
        
        // Búsqueda por iniciales o abreviaciones
        if (query.length >= 2) {
          // Buscar si las primeras letras de cada palabra coinciden
          const nameInitials = nameWords.map(word => word.charAt(0)).join('');
          if (nameInitials.includes(query)) return true;
        }
        
        return false;
      });

      // Ordenar resultados por relevancia
      const sortedMuseums = filteredMuseums.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        // Priorizar coincidencias exactas en el nombre
        if (aName === query && bName !== query) return -1;
        if (bName === query && aName !== query) return 1;
        
        // Priorizar coincidencias que empiecen con la búsqueda
        if (aName.startsWith(query) && !bName.startsWith(query)) return -1;
        if (bName.startsWith(query) && !aName.startsWith(query)) return 1;
        
        // Priorizar coincidencias en el nombre sobre la descripción
        const aNameMatch = aName.includes(query);
        const bNameMatch = bName.includes(query);
        if (aNameMatch && !bNameMatch) return -1;
        if (bNameMatch && !aNameMatch) return 1;
        
        // Si todo es igual, ordenar alfabéticamente
        return aName.localeCompare(bName);
      });

      // Convertir museos a formato de resultados de búsqueda
      const results: SearchResult[] = sortedMuseums.map(museum => ({
        id: museum.id,
        name: museum.name,
        latitude: museum.latitude,
        longitude: museum.longitude,
        type: 'museum'
      }));

      setSearchResults(results);
      
      // Mostrar mensaje si no hay resultados
      if (results.length === 0) {
        console.log(`No se encontraron museos para: "${searchQuery}"`);
      } else {
        console.log(`Se encontraron ${results.length} museos para: "${searchQuery}"`);
      }
      
    } catch (error) {
      console.error('Error en búsqueda:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, allMuseums]);

  // Función para búsqueda en tiempo real mientras el usuario escribe
  const handleSearchInputChange = useCallback((text: string) => {
    setSearchQuery(text);
    
    // Si el texto está vacío, limpiar resultados
    if (!text.trim()) {
      setSearchResults([]);
      return;
    }
    
    // Si el texto tiene al menos 2 caracteres, hacer búsqueda automática
    if (text.trim().length >= 2) {
      // Usar setTimeout para evitar demasiadas búsquedas mientras el usuario escribe
      const timeoutId = setTimeout(() => {
        handleSearch();
      }, 300); // Esperar 300ms después de que el usuario deje de escribir
      
      return () => clearTimeout(timeoutId);
    }
  }, [handleSearch]);

  // Función para limpiar búsqueda
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Barra de búsqueda */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons 
              name="search" 
              size={20} 
              color={colors.textSecondary} 
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Buscar museos por nombre..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={handleSearchInputChange}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={clearSearch} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>
          
          {/* Botón de búsqueda */}
          <Pressable 
            style={[styles.searchButton, { backgroundColor: COLORS.primary }]} 
            onPress={handleSearch}
            disabled={isSearching}
          >
            <Ionicons 
              name="search" 
              size={20} 
              color="#fff" 
            />
          </Pressable>
        </View>

        {/* Indicador de resultados de búsqueda */}
        {searchQuery.length > 0 && (
          <View style={styles.resultsIndicator}>
            <Text style={[styles.resultsText, { color: colors.textSecondary }]}>
              {isSearching ? 'Buscando...' : 
               searchResults.length === 0 ? 'No se encontraron resultados' :
               `Se encontraron ${searchResults.length} museo${searchResults.length !== 1 ? 's' : ''}`
              }
            </Text>
          </View>
        )}

        {/* Contenedor del mapa */}
        <View style={styles.mapContainer}>
          <MapaBase 
            searchResults={searchResults}
            onSearchResultPress={(result: SearchResult) => {
              console.log('Resultado seleccionado:', result);
              // Aquí puedes implementar la lógica para centrar el mapa en el resultado
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 0, // Eliminar el padding superior
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 0, // Agregar un pequeño margen superior
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 5,
  },
  searchButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  mapContainer: {
    flex: 1,
    width: '100%',
  },
  resultsIndicator: {
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 5,
  },
  resultsText: {
    fontSize: 14,
  },
}); 