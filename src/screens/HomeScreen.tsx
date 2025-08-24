import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, useColorScheme, TextInput, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors, COLORS } from '@constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { getPagedMuseums } from '@services/museum/getListarMuseums';
import { MuseumResponse } from '@interfaces/museum/MuseumResponse';
import GMap from '@components/Map/GMap';

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

  useEffect(() => { loadAllMuseums(); }, []);

  const loadAllMuseums = async () => {
    try {
      const data = await getPagedMuseums(0, 100);
      setAllMuseums(data.contents);
    } catch (error) {
      console.error('Error al cargar museos:', error);
    }
  };

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const query = searchQuery.toLowerCase().trim();
      const filteredMuseums = allMuseums.filter(m => {
        const name = m.name.toLowerCase();
        const description = m.description.toLowerCase();
        if (name.includes(query) || description.includes(query)) return true;
        const nameWords = name.split(/\s+/);
        const descWords = description.split(/\s+/);
        if (nameWords.some(w => w.includes(query))) return true;
        if (descWords.some(w => w.includes(query))) return true;
        if (query.length >= 2) {
          const initials = nameWords.map(w => w.charAt(0)).join('');
          if (initials.includes(query)) return true;
        }
        return false;
      });

      const sorted = filteredMuseums.sort((a, b) => {
        const A = a.name.toLowerCase(), B = b.name.toLowerCase();
        if (A === query && B !== query) return -1;
        if (B === query && A !== query) return 1;
        if (A.startsWith(query) && !B.startsWith(query)) return -1;
        if (B.startsWith(query) && !A.startsWith(query)) return 1;
        const Am = A.includes(query), Bm = B.includes(query);
        if (Am && !Bm) return -1;
        if (Bm && !Am) return 1;
        return A.localeCompare(B);
      });

      const results: SearchResult[] = sorted.map(m => ({
        id: m.id, name: m.name, latitude: m.latitude, longitude: m.longitude, type: 'museum'
      }));
      setSearchResults(results);
    } catch (e) {
      console.error('Error en búsqueda:', e);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, allMuseums]);

  const handleSearchInputChange = useCallback((text: string) => {
    setSearchQuery(text);
    if (!text.trim()) { setSearchResults([]); return; }
    if (text.trim().length >= 2) {
      const t = setTimeout(() => { handleSearch(); }, 300);
      return () => clearTimeout(t);
    }
  }, [handleSearch]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  const handleResultPress = useCallback((r: SearchResult) => {
    console.log('Resultado seleccionado:', r);
    // luego podrás mover la cámara del mapa aquí
  }, []);

  const renderResultItem = ({ item }: { item: SearchResult }) => (
    <Pressable
      style={[styles.resultItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
      onPress={() => handleResultPress(item)}
    >
      <View style={styles.resultIcon}>
        <Ionicons name="business" size={18} color={COLORS.primary} />
      </View>
      <View style={styles.resultTextContainer}>
        <Text style={[styles.resultName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.resultSub, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.type === 'museum' ? 'Museo' : 'Lugar'} • {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Barra de búsqueda */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon}/>
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
          <Pressable style={[styles.searchButton, { backgroundColor: COLORS.primary }]} onPress={handleSearch} disabled={isSearching}>
            <Ionicons name="search" size={20} color="#fff" />
          </Pressable>
        </View>

        {/* Indicador */}
        {searchQuery.length > 0 && (
          <View style={styles.resultsIndicator}>
            <Text style={[styles.resultsText, { color: colors.textSecondary }]}>
              {isSearching ? 'Buscando...' :
                searchResults.length === 0 ? 'No se encontraron resultados' :
                `Se encontraron ${searchResults.length} museo${searchResults.length !== 1 ? 's' : ''}`}
            </Text>
          </View>
        )}

        {/* Área de mapa / lista */}
        <View style={styles.mapContainer}>
          {searchResults.length === 0 ? (
            // Renderiza el mapa a pantalla completa dentro del contenedor
            <View style={{ flex: 1, borderRadius: 15, overflow: 'hidden' }}>
              <GMap />
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderResultItem}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 0 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, marginTop: 0, gap: 10 },
  searchInputContainer: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 25,
    paddingHorizontal: 15, paddingVertical: 12,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 0 },
  clearButton: { padding: 5 },
  searchButton: {
    width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4,
  },
  resultsIndicator: { alignItems: 'center', marginBottom: 10, paddingVertical: 5 },
  resultsText: { fontSize: 14 },
  mapContainer: { flex: 1, width: '100%' },
  listContent: { paddingVertical: 8, gap: 8 },
  resultItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  resultIcon: {
    width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    marginRight: 10, backgroundColor: 'rgba(33,150,243,0.12)',
  },
  resultTextContainer: { flex: 1 },
  resultName: { fontSize: 15, fontWeight: '600' },
  resultSub: { fontSize: 12, marginTop: 2 },
});
