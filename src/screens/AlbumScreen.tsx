import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, FlatList, RefreshControl, StyleSheet, useColorScheme, Alert } from 'react-native';
import { Text, ActivityIndicator, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlbumResponseDto, AlbumStatsDto } from '@interfaces/album/AlbumResponse';
import { getCompleteAlbum } from '@services/album/getCompleteAlbum';
import AlbumItem from '@components/Album/AlbumItem';
import { getThemeColors } from '@constants/colors';
import { Ionicons } from '@expo/vector-icons';
import Pagination from '@components/common/Pagination';

export default function AlbumScreen() {
  const [albumData, setAlbumData] = useState<{
    objects: AlbumResponseDto[];
    stats: AlbumStatsDto;
  }>({
    objects: [],
    stats: { obtained: 0, total: 0, percentage: 0 }
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 6; 

  const isInitialLoad = useRef(true);
  
  const colorScheme = useColorScheme();
  const colors = getThemeColors(colorScheme === 'dark');
  
  const loadAlbum = useCallback(async (page: number = 0) => {
    try {
      setIsLoading(true);
      const response = await getCompleteAlbum(page, pageSize);
      
      setAlbumData({
        objects: response.data.contents,
        stats: response.data.stats
      });
      setCurrentPage(response.data.page);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
    } catch (error: any) {
      console.error('Error cargando álbum:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'No se pudo cargar el álbum. Intenta de nuevo.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);
  
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      loadAlbum(0);
    }
  }, [loadAlbum]);
  
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadAlbum(currentPage);
  }, [loadAlbum, currentPage]);
  
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    loadAlbum(page);
  }, [loadAlbum]);
  
  const displayedObjects = useMemo(() => {
    switch (filter) {
      case 'obtained':
        return albumData.objects.filter(obj => obj.isObtained);
      case 'missing':
        return albumData.objects.filter(obj => !obj.isObtained);
      default:
        return albumData.objects;
    }
  }, [albumData.objects, filter]);
  
  const handleFilterChange = useCallback((newFilter: string) => {
    setFilter(newFilter);
    if (newFilter !== filter) {
      setCurrentPage(0);
      loadAlbum(0);
    }
  }, [filter, loadAlbum]);
  
  const renderItem = useCallback(({ item }: { item: AlbumResponseDto }) => (
    <AlbumItem 
      item={item} 
      isObtained={item.isObtained}
    />
  ), []);
  
  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    
    const getEmptyMessage = () => {
      switch (filter) {
        case 'obtained':
          return {
            title: 'No tienes objetos aún',
            subtitle: 'Visita museos para comenzar tu colección'
          };
        case 'missing':
          return {
            title: '¡Felicitaciones!',
            subtitle: 'Has completado toda la colección'
          };
        default:
          return {
            title: 'No hay objetos disponibles',
            subtitle: 'Parece que no hay objetos culturales registrados'
          };
      }
    };
    const message = getEmptyMessage();
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons 
          name="library-outline" 
          size={64} 
          color={colors.textSecondary} 
          style={styles.emptyIcon}
        />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {message.title}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          {message.subtitle}
        </Text>
      </View>
    );
  }, [isLoading, filter, colors]);
  
  const renderHeader = useCallback(() => (
    <View style={styles.header}>
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.statNumber, { color: '#1e40af' }]}>
            {albumData.stats.obtained}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Obtenidos
          </Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.statNumber, { color: colors.text }]}>
            {albumData.stats.total}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Total
          </Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.statNumber, { color: '#10b981' }]}>
            {albumData.stats.percentage}%
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Completado
          </Text>
        </View>
      </View>

      <SegmentedButtons
        value={filter}
        onValueChange={handleFilterChange}
        buttons={[
          { value: 'all', label: 'Todos' },
          { value: 'obtained', label: 'Míos' },
          { value: 'missing', label: 'Faltantes' },
        ]}
        style={styles.filterButtons}
      />
    </View>
  ), [albumData.stats, filter, handleFilterChange, colors]);
  
  const renderFooter = useCallback(() => (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={handlePageChange}
      totalElements={totalElements}
      pageSize={pageSize}
    />
  ), [currentPage, totalPages, handlePageChange, totalElements]);
  
  if (isLoading && !isRefreshing && isInitialLoad.current) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Cargando tu álbum...
        </Text>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={displayedObjects}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#1e40af']}
          />
        }
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={displayedObjects.length > 0 ? renderFooter : null}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={displayedObjects.length === 0 ? styles.emptyList : styles.list}
        columnWrapperStyle={displayedObjects.length > 0 ? styles.row : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingVertical: 8,
  },
  emptyList: {
    flex: 1,
  },
  row: {
    justifyContent: 'space-around',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    margin: 4,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  filterButtons: {
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
