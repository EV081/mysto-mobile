import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { FAB, ActivityIndicator } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Pagination } from '@components/common';
import PostCard from '../components/Social/PostCard';
import PostComposer from '../components/Social/PostComposer';
import { getAllPosts } from '@services/post/getallPost';
import type { PagedResponse } from '@interfaces/common/PagedResponse';
import type { PostResponseDto } from '@interfaces/Post/PostResponseDto';
import { COLORS } from '@constants/colors';

export default function RedSocialScreen() {
  const navigation: any = useNavigation();
  const [page, setPage] = useState(0);
  const [pageSize] = useState(6);
  const [data, setData] = useState<PagedResponse<PostResponseDto> | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);

  const totalPages = data?.totalPages ?? 0;

  const fetchPage = async (p = page) => {
    setLoading(true);
    try {
      const res = await getAllPosts(p, pageSize);
      setData(res);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPage(0);
      setPage(0);
    }, [])
  );

  useEffect(() => {
    fetchPage(page);
  }, [page]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPage(0);
    setPage(0);
    setRefreshing(false);
  };

  const onPostCreated = () => {
    setComposerOpen(false);
    fetchPage(0);
    setPage(0);
  };

  const renderItem = useCallback(({ item }: { item: PostResponseDto }) => (
    <PostCard
      post={item}
      onDeleted={() => fetchPage(Math.min(page, totalPages - 1))}
      onUpdated={() => fetchPage(page)}
      onOpenDetails={() => navigation.navigate('PostDetail', { postId: item.id })}
    />
  ), [page, totalPages, navigation]);

  return (
    <View style={styles.container}>
      {loading && !data ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={data?.contents ?? []}
          keyExtractor={(p) => String(p.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[COLORS.black]}
              tintColor="#000000ff"
            />
          }
          ListFooterComponent={
            totalPages > 1 ? (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalElements={data?.totalElements ?? 0}
                pageSize={pageSize}
                onPageChange={(p) => setPage(p)}
              />
            ) : null
          }
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setComposerOpen(true)}
        label="Nuevo post"
        color={COLORS.white} 
      />

      <PostComposer
        visible={composerOpen}
        onClose={() => setComposerOpen(false)}
        onCreated={onPostCreated}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  listContent: { 
    padding: 12, 
    gap: 12 
  },
  center: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  fab: { 
    position: 'absolute', 
    right: 16, 
    bottom: 24,
    backgroundColor: COLORS.primary
  },
});