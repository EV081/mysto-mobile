import { View, Text, Image, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AlbumResponseDto } from '../interfaces/album/AlbumResponse';
import { CulturalObjectType } from '@interfaces/object/CulturalObjectResponse';
import { getThemeColors } from '@constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ColorValue } from 'react-native';

type NavigationProp = {
  navigate: (screen: 'Album' | 'Home' | 'ObjectDetail', params?: any) => void;
};

interface AlbumItemProps {
  item: AlbumResponseDto;
  isObtained: boolean;
  onPress?: (item: AlbumResponseDto) => void;
}

export default function AlbumItem({ item, isObtained, onPress }: AlbumItemProps) {
  const colorScheme = useColorScheme();
  const colors = getThemeColors(colorScheme === 'dark');
  const navigation = useNavigation<NavigationProp>();
  
  const handlePress = () => {
    if (onPress) {
      onPress(item);
    } else if (isObtained) {
      navigation.navigate('ObjectDetail', { albumItem: item });
    }
  };

  // Colores y configuración según el tipo de objeto cultural
  const getCardConfig = (type: string) => {
    switch (type) {
      case CulturalObjectType.CERAMICS:
        return {
          frameColors: ['#8B4513', '#D2691E', '#CD853F'] as [ColorValue, ColorValue, ...ColorValue[]], // Marrón tierra para cerámicas
          borderColor: '#654321',
          typeText: 'CERÁMICA'
        };
      case CulturalObjectType.TEXTILES:
        return {
          frameColors: ['#800080', '#DA70D6', '#DDA0DD'] as [ColorValue, ColorValue, ...ColorValue[]], // Púrpura para textiles
          borderColor: '#4B0082',
          typeText: 'TEXTIL'
        };
      case CulturalObjectType.PAINTING:
        return {
          frameColors: ['#4169E1', '#6495ED', '#87CEEB'] as [ColorValue, ColorValue, ...ColorValue[]], // Azul para pinturas
          borderColor: '#191970',
          typeText: 'PINTURA'
        };
      case CulturalObjectType.GOLDSMITHING:
        return {
          frameColors: ['#DAA520', '#FFD700', '#FFF8DC'] as [ColorValue, ColorValue, ...ColorValue[]], // Dorado para orfebrería
          borderColor: '#B8860B',
          typeText: 'ORFEBRERÍA'
        };
      default:
        return {
          frameColors: ['#8B4513', '#D2691E', '#CD853F'] as [ColorValue, ColorValue, ...ColorValue[]],
          borderColor: '#654321',
          typeText: 'OBJETO'
        };
    }
  };

  const getValueStars = (item: AlbumResponseDto) => {
    const qualification = (item as any).qualification || 0;
    if (qualification >= 4.5) return '★★★★★';
    if (qualification >= 3.5) return '★★★★';
    if (qualification >= 2.5) return '★★★';
    if (qualification >= 1.5) return '★★';
    return '★';
  };

  const getRarityStars = (item: AlbumResponseDto) => {
    const reviewCount = (item as any).reviewCount || 0;
    
    // Rareza base según tipo
    let baseStars = 1;
    switch (item.type) {
      case CulturalObjectType.GOLDSMITHING:
        baseStars = 5; // Orfebrería es lo más raro
        break;
      case CulturalObjectType.PAINTING:
        baseStars = 4;
        break;
      case CulturalObjectType.TEXTILES:
        baseStars = 3;
        break;
      case CulturalObjectType.CERAMICS:
        baseStars = 2;
        break;
      default:
        baseStars = 2;
        break;
    }
    
    // Ajuste por número de reviews (menos reviews = más raro)
    let rarityModifier = 0;
    if (reviewCount <= 5) rarityModifier = 0;      // Mantiene rareza
    else if (reviewCount <= 15) rarityModifier = -1; // Reduce 1 estrella
    else if (reviewCount <= 30) rarityModifier = -1; // Reduce 1 estrella
    else if (reviewCount <= 50) rarityModifier = -2; // Reduce 2 estrellas
    else rarityModifier = -2; // Muy común, reduce 2 estrellas

    const finalStars = Math.max(1, Math.min(5, baseStars + rarityModifier));
    return '★'.repeat(finalStars);
  };

  const cardConfig = getCardConfig(item.type);
  const valueStars = isObtained ? getValueStars(item) : '????';
  const rarityStars = isObtained ? getRarityStars(item) : '???';

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8} style={styles.container}>
      <View style={[
        styles.cardContainer,
        !isObtained && styles.lockedCard
      ]}>
        <LinearGradient
          colors={cardConfig.frameColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardFrame}
        >
          {/* Borde interior negro */}
          <View style={[styles.innerBorder, { borderColor: cardConfig.borderColor }]}>
            
            {/* Header con nombre */}
            <LinearGradient
              colors={['#2C2C2C', '#1A1A1A']}
              style={styles.nameBar}
            >
              <Text style={[
                styles.cardName,
                !isObtained && { color: '#666' }
              ]} numberOfLines={1}>
                {isObtained ? item.name.toUpperCase() : '???'}
              </Text>
            </LinearGradient>

            {/* Contenedor de imagen con marco azul */}
            <View style={styles.artworkFrame}>
              <View style={styles.artworkContainer}>
                {item.pictureUrls && item.pictureUrls.length > 0 ? (
                  <Image 
                    source={{ uri: item.pictureUrls[0] }} 
                    style={[
                      styles.artwork,
                      !isObtained && styles.lockedImage
                    ]}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.placeholderArtwork}>
                    <Ionicons 
                      name="image-outline" 
                      size={32} 
                      color="#666" 
                    />
                  </View>
                )}
                
                {!isObtained && (
                  <View style={styles.lockOverlay}>
                    <View style={styles.lockIcon}>
                      <Ionicons name="lock-closed" size={24} color="#fff" />
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Sección inferior con tipo y descripción */}
            <View style={styles.bottomSection}>
              {/* Barra de tipo */}
              <View style={[styles.typeSection, { backgroundColor: cardConfig.borderColor }]}>
                <Text style={styles.typeLabel}>[{cardConfig.typeText}]</Text>
              </View>

              {/* Descripción */}
              <View style={styles.descriptionSection}>
                {isObtained ? (
                  <Text style={styles.descriptionText} numberOfLines={3}>
                    {item.description}
                  </Text>
                ) : (
                  <Text style={styles.hiddenText} numberOfLines={3}>
                    Esta reliquia cultural permanece oculta. Debes descubrirla para revelar sus secretos...
                  </Text>
                )}
              </View>

              {/* Sección de stats estilo Yu-Gi-Oh */}
              <View style={styles.statsSection}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>VALOR</Text>
                  <Text style={styles.statValue}>{valueStars}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>RAREZA</Text>
                  <Text style={styles.statValue}>{rarityStars}</Text>
                </View>
              </View>
            </View>

            {/* Badge de obtenido */}
            {isObtained && (
              <View style={styles.obtainedBadge}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.badgeGradient}
                >
                  <Ionicons name="star" size={14} color="#000" />
                </LinearGradient>
              </View>
            )}

            {/* Decoraciones en las esquinas */}
            <View style={[styles.cornerDecor, styles.topLeft]} />
            <View style={[styles.cornerDecor, styles.topRight]} />
            <View style={[styles.cornerDecor, styles.bottomLeft]} />
            <View style={[styles.cornerDecor, styles.bottomRight]} />

          </View>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxWidth: '50%',
  },
  cardContainer: {
    margin: 6,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderRadius: 8,
  },
  lockedCard: {
    opacity: 0.7,
  },
  cardFrame: {
    borderRadius: 8,
    padding: 3,
    minHeight: 280,
  },
  innerBorder: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 6,
    backgroundColor: '#F5F5DC', // Fondo beige claro
    padding: 4,
    position: 'relative',
  },
  nameBar: {
    marginBottom: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 3,
  },
  cardName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  artworkFrame: {
    backgroundColor: '#1E3A8A', // Azul oscuro como marco
    padding: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  artworkContainer: {
    height: 100,
    backgroundColor: '#000',
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  placeholderArtwork: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedImage: {
    opacity: 0.2,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  bottomSection: {
    flex: 1,
  },
  typeSection: {
    paddingVertical: 2,
    paddingHorizontal: 4,
    marginBottom: 4,
    borderRadius: 2,
  },
  typeLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  descriptionSection: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#8B4513',
    borderRadius: 3,
    padding: 4,
    marginBottom: 4,
    minHeight: 40,
  },
  descriptionText: {
    fontSize: 8,
    lineHeight: 10,
    color: '#2F2F2F',
    textAlign: 'justify',
  },
  hiddenText: {
    fontSize: 8,
    lineHeight: 10,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    backgroundColor: '#E8D5B7',
    borderWidth: 1,
    borderColor: '#8B4513',
    borderRadius: 2,
    padding: 2,
    flex: 0.48,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#2F2F2F',
  },
  statValue: {
    fontSize: 8,
    color: '#8B4513',
    fontWeight: 'bold',
  },
  obtainedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  badgeGradient: {
    padding: 4,
    borderRadius: 12,
  },
  cornerDecor: {
    position: 'absolute',
    width: 6,
    height: 6,
    backgroundColor: '#DAA520',
    transform: [{ rotate: '45deg' }],
  },
  topLeft: {
    top: 2,
    left: 2,
  },
  topRight: {
    top: 2,
    right: 2,
  },
  bottomLeft: {
    bottom: 2,
    left: 2,
  },
  bottomRight: {
    bottom: 2,
    right: 2,
  },
});