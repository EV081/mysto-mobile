import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { IconButton, Menu, Card, Avatar } from 'react-native-paper';
import PostImages from './PostImages';
import { likePost } from '@services/post/incrementarLikes';
import { deletePost } from '@services/post/deletePost';
import { getMuseumPictures } from '@services/pictures/getPostPictures';
import { useAuthContext } from '@contexts/AuthContext';
import type { PostResponseDto } from '@interfaces/Post/PostResponseDto';
import { COLORS } from '@constants/colors';

interface Props {
  post: PostResponseDto;
  onUpdated: () => void;
  onDeleted: () => void;
  onOpenDetails: () => void;
}

export default function PostCard({ post, onUpdated, onDeleted, onOpenDetails }: Props) {
  const { session } = useAuthContext();
  const [likeCount, setLikeCount] = useState<number>(post.likes ?? 0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [images, setImages] = useState<{ id: number; url: string }[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [loadingImages, setLoadingImages] = useState(true);

  const isOwner = !!session;

  useEffect(() => {
    let mounted = true;
    const loadImages = async () => {
      try {
        setLoadingImages(true);
        const pics = await getMuseumPictures(post.id);
        if (mounted) {
          setImages(pics.map(p => ({ id: p.id, url: p.url })));
        }
      } catch (error) {
        console.error('Error loading post images:', error);
        if (mounted) {
          setImages([]);
        }
      } finally {
        if (mounted) {
          setLoadingImages(false);
        }
      }
    };

    loadImages();
    return () => { mounted = false; };
  }, [post.id]);

  const when = useMemo(() => {
    try { 
      const date = new Date(post.createdAt);
      return date.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }); 
    } catch { 
      return ''; 
    }
  }, [post.createdAt]);

  const onLike = async () => {
    try {
      await likePost(post.id);
      setLikeCount(prev => prev + 1);
      setIsLiked(true);
      onUpdated?.();
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const onDelete = async () => {
    try {
      await deletePost(post.id);
      onDeleted?.();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleEdit = () => {
    setMenuVisible(false);
    onOpenDetails();
  };

  return (
    <Card style={styles.card} elevation={2} onPress={() => onOpenDetails && onOpenDetails()}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Avatar.Text 
            size={40} 
            label="U"
            style={styles.avatar}
          />
          <View style={styles.userText}>
            <Text style={styles.userName}>Usuario {post.authorId}</Text>
            <Text style={styles.timestamp}>{when}</Text>
          </View>
        </View>
        
        {isOwner && (
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton 
                icon="dots-horizontal" 
                onPress={() => setMenuVisible(true)}
                size={20}
              />
            }
          >
            <Menu.Item 
              onPress={handleEdit} 
              title="Editar" 
              leadingIcon="pencil" 
            />
            <Menu.Item 
              onPress={onDelete} 
              title="Eliminar" 
              leadingIcon="delete" 
            />
          </Menu>
        )}
      </View>

      {!loadingImages && images.length > 0 && (
        <View style={styles.imagesContainer}>
          <PostImages images={images} />
        </View>
      )}

      {!!post.content && (
        <View style={styles.contentBox}>
          <Text style={styles.content}>{post.content}</Text>
        </View>
      )}

      <View style={styles.actions}>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={onLike}
            disabled={isLiked}
          >
            <IconButton 
              icon={isLiked ? "heart" : "heart-outline"} 
              size={24}
              iconColor={isLiked ? "#E91E63" : "#666"}
            />
            <Text style={[styles.actionText, isLiked && styles.likedText]}>
              {likeCount}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={onOpenDetails}
          >
            <IconButton 
              icon="comment-outline" 
              size={24}
              iconColor="#666"
            />
            <Text style={styles.actionText}>
              Comentar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { 
    borderRadius: 12, 
    marginBottom: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.black, 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userText: {
    marginLeft: 12,
    flex: 1,
  },
  userName: { 
    fontWeight: '600', 
    fontSize: 16,
    color: '#262626'
  },
  timestamp: { 
    fontSize: 12, 
    color: '#8e8e93',
    marginTop: 2
  },
  avatar: {
    backgroundColor: COLORS.primary
  },
  imagesContainer: {
    marginBottom: 8,
  },
  contentBox: { 
    paddingHorizontal: 16, 
    paddingBottom: 12 
  },
  content: { 
    color: '#262626',
    fontSize: 14,
    lineHeight: 20
  },
  actions: { 
    paddingHorizontal: 8, 
    paddingBottom: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#f0f0f0'
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: { 
    fontSize: 14, 
    color: '#666',
    marginLeft: -8
  },
  likedText: {
    color: '#E91E63',
    fontWeight: '600'
  }
});
