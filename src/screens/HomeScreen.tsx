import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, useColorScheme, TextInput, Pressable, FlatList, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getThemeColors, COLORS } from '@constants/colors';
import { getPagedMuseums } from '@services/museum/getListarMuseums';
import type { MuseumResponse } from '@interfaces/museum/MuseumResponse';
import GMap from '@components/Map/GMap';

type LatLng = { latitude: number; longitude: number };

type ResultMuseum = {
  id: number | string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'museum';
};

type ResultPlace = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'place';
};

type SearchResult = ResultMuseum | ResultPlace;

const GOOGLE_PLACES_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

async function searchGooglePlaces(q: string): Promise<ResultPlace[]> {
  if (!GOOGLE_PLACES_KEY) return [];
  const url = `https://places.googleapis.com/v1/places:searchText?key=${GOOGLE_PLACES_KEY}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-FieldMask': 'places.id,places.displayName,places.location',
    },
    body: JSON.stringify({
      textQuery: q,
      languageCode: 'es',
    }),
  });

  const json = await res.json();
  const places = Array.isArray(json?.places) ? json.places : [];

  return places
    .map((p: any) => {
      const lat = p?.location?.latitude;
      const lng = p?.location?.longitude;
      if (typeof lat !== 'number' || typeof lng !== 'number') return null;
      const id = p?.id || p?.name || Math.random().toString(36);
      const name = p?.displayName?.text || 'Lugar';
      return {
        id: String(id),
        name,
        latitude: lat,
        longitude: lng,
        type: 'place' as const,
      };
    })
    .filter(Boolean) as ResultPlace[];
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getThemeColors(isDark);

  const [query, setQuery] = useState('');
  const [allMuseums, setAllMuseums] = useState<MuseumResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  const [externalPlaces, setExternalPlaces] = useState<ResultPlace[]>([]);
  const [focusCoord, setFocusCoord] = useState<LatLng | null>(null);

  // NUEVO: altura medida de la barra para posicionar la card debajo
  const [cardTopInset, setCardTopInset] = useState<number>(60);

  // Cargar museos del backend (una sola vez)
  useEffect(() => {
    (async () => {
      try {
        const data = await getPagedMuseums(0, 100);
        setAllMuseums(data.contents ?? []);
      } catch (e) {
        console.warn('Error al cargar museos:', e);
      }
    })();
  }, []);

  // Búsqueda combinada: museos + Google Places (con debounce)
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setResults([]);
      setExternalPlaces([]);
      return;
    }

    setIsSearching(true);
    const t = setTimeout(async () => {
      try {
        // Museos locales
        const filtered = (allMuseums || []).filter(m => {
          const name = (m.name ?? '').toLowerCase();
          const desc = (m.description ?? '').toLowerCase();
          if (name.includes(q) || desc.includes(q)) return true;
          if (q.length >= 2) {
            const initials = name.split(/\s+/).map(w => w[0] || '').join('');
            if (initials.includes(q)) return true;
          }
          return false;
        });

        const ranked = filtered.sort((a, b) => {
          const A = (a.name ?? '').toLowerCase(), B = (b.name ?? '').toLowerCase();
          if (A === q && B !== q) return -1;
          if (B === q && A !== q) return 1;
          if (A.startsWith(q) && !B.startsWith(q)) return -1;
          if (B.startsWith(q) && !A.startsWith(q)) return 1;
          const Ai = A.includes(q), Bi = B.includes(q);
          if (Ai && !Bi) return -1;
          if (Bi && !Ai) return 1;
          return A.localeCompare(B);
        });

        const museumResults: ResultMuseum[] = ranked.slice(0, 30).map(m => ({
          id: m.id,
          name: m.name,
          latitude: m.latitude,
          longitude: m.longitude,
          type: 'museum',
        }));

        // Google Places
        const placeResults = await searchGooglePlaces(q);

        // Mezcla
        const mixed: SearchResult[] = [...museumResults, ...placeResults.slice(0, 20)];
        setResults(mixed);

        // Poner pines de lugares reales en el mapa mientras buscas
        setExternalPlaces(placeResults.slice(0, 10));
      } catch {
        setResults([]);
        setExternalPlaces([]);
      } finally {
        setIsSearching(false);
      }
    }, 320);

    return () => clearTimeout(t);
  }, [query, allMuseums]);

  const clearQuery = useCallback(() => {
    setQuery('');
    setResults([]);
    setExternalPlaces([]);
    Keyboard.dismiss();
  }, []);

  const onResultPress = useCallback((r: SearchResult) => {
    setFocusCoord({ latitude: r.latitude, longitude: r.longitude });

    if (r.type === 'place') {
      setExternalPlaces(prev => {
        const rest = prev.filter(p => p.id !== r.id);
        return [{ ...r }, ...rest];
      });
    }

    setQuery('');
    setResults([]);
    Keyboard.dismiss();
  }, []);

  const resultItem = useCallback(({ item }: { item: SearchResult }) => (
    <Pressable
      onPress={() => onResultPress(item)}
      style={({ pressed }) => [
        styles.resultItem,
        { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', opacity: pressed ? 0.85 : 1 }
      ]}
    >
      <View style={styles.resultIcon}>
        <Ionicons
          name={item.type === 'museum' ? 'business' : 'location-sharp'}
          size={18}
          color={item.type === 'museum' ? COLORS.primary : '#E53935'}
        />
      </View>
      <View style={styles.resultText}>
        <Text style={[styles.resultName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.resultSub, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.type === 'museum' ? 'Museo' : 'Lugar'} • {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </Pressable>
  ), [colors.text, colors.textSecondary, isDark, onResultPress]);

  const hasResults = results.length > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Mapa de fondo */}
      <View style={styles.mapWrap}>
        <GMap
          focusCoord={focusCoord}
          focusZoom={17}
          externalPlaces={externalPlaces.map(p => ({
            id: p.id,
            name: p.name,
            latitude: p.latitude,
            longitude: p.longitude,
          }))}
          // ⬇️ NUEVO: esto hace que la tarjeta salga debajo de la barra
          cardTopInset={cardTopInset}
        />
      </View>

      {/* Barra de búsqueda flotante */}
      <View style={styles.overlay} pointerEvents="box-none">
        <View
          style={styles.searchRow}
          pointerEvents="box-none"
          onLayout={(e) => {
            // paddingTop (8) + altura de la fila + un margen (8)
            const h = e.nativeEvent.layout.height;
            setCardTopInset(8 + h + 8);
          }}
        >
          <View style={[styles.searchBox, { backgroundColor: isDark ? 'rgba(20,20,20,0.92)' : 'rgba(255,255,255,0.95)' }]}>
            <Ionicons name="search" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar museos o lugares…"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, { color: colors.text }]}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable onPress={clearQuery} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>

          <Pressable
            onPress={() => setQuery(q => q)}
            style={[styles.goBtn, { backgroundColor: COLORS.primary }]}
          >
            <Ionicons name={isSearching ? 'hourglass' : 'search'} size={20} color="#fff" />
          </Pressable>
        </View>

        {/* Dropdown de resultados */}
        {(query.length > 0) && (
          <View style={[
            styles.dropdown,
            { backgroundColor: isDark ? 'rgba(12,12,12,0.94)' : 'rgba(255,255,255,0.98)' }
          ]}>
            {isSearching && (
              <Text style={[styles.helper, { color: colors.textSecondary }]}>
                Buscando…
              </Text>
            )}

            {!isSearching && !hasResults && (
              <Text style={[styles.helper, { color: colors.textSecondary }]}>
                No se encontraron resultados
              </Text>
            )}

            {hasResults && (
              <FlatList
                keyboardShouldPersistTaps="handled"
                data={results.slice(0, 10)}
                keyExtractor={(it) => String(it.id)}
                renderItem={resultItem}
                contentContainerStyle={{ paddingVertical: 6, gap: 6 }}
                style={{ maxHeight: 280 }}
              />
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  mapWrap: { ...StyleSheet.absoluteFillObject },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  searchBox: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  input: { flex: 1, fontSize: 15, paddingVertical: 0 },

  goBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#000',
    shadowOpacity: 0.18, shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  dropdown: {
    marginTop: 8,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },

  helper: { paddingVertical: 12, textAlign: 'center', fontSize: 13 },

  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },

  resultIcon: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
    backgroundColor: 'rgba(33,150,243,0.12)',
  },

  resultText: { flex: 1 },
  resultName: { fontSize: 15, fontWeight: '600' },
  resultSub: { fontSize: 12, marginTop: 2 },
});
