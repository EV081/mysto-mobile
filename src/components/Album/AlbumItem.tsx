import { View, Text, Image, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AlbumResponseDto } from '@interfaces/album/AlbumResponse';
import { CulturalObjectType } from '@interfaces/cuturalObject/CulturalObjectType';
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
}

export default function AlbumItem({ item, isObtained }: AlbumItemProps) {
  const colorScheme = useColorScheme();
  const colors = getThemeColors(colorScheme === 'dark');
  const navigation = useNavigation<NavigationProp>();
  
  const handlePress = () => {
    console.log('Pressed item ID:', item.id, 'Name:', item.name, 'isObtained:', isObtained);
    
    if (isObtained) {
      console.log('Navigating to ObjectDetail with item:', item);
      navigation.navigate('ObjectDetail', { 
        albumItem: item,
        fromScreen: 'Album'
      });
    } else {
      console.log('Item not obtained, not navigating');
    }
  };

  const getCardConfig = (type: string) => {
    switch (type) {
      case CulturalObjectType.CERAMICS:
        return {
          frameColors: ['#8B4513', '#D2691E', '#CD853F'] as [ColorValue, ColorValue, ...ColorValue[]], 
          borderColor: '#654321',
          typeText: 'CERÁMICA',
          hologramColor: ['#8B4513', '#CD853F'] as [ColorValue, ColorValue]
        };
      case CulturalObjectType.TEXTILES:
        return {
          frameColors: ['#800080', '#DA70D6', '#DDA0DD'] as [ColorValue, ColorValue, ...ColorValue[]], 
          borderColor: '#4B0082',
          typeText: 'TEXTIL',
          hologramColor: ['#800080', '#DDA0DD'] as [ColorValue, ColorValue]
        };
      case CulturalObjectType.PAINTING:
        return {
          frameColors: ['#4169E1', '#6495ED', '#87CEEB'] as [ColorValue, ColorValue, ...ColorValue[]], 
          borderColor: '#191970',
          typeText: 'PINTURA',
          hologramColor: ['#4169E1', '#87CEEB'] as [ColorValue, ColorValue]
        };
      case CulturalObjectType.GOLDSMITHING:
        return {
          frameColors: ['#DAA520', '#FFD700', '#FFF8DC'] as [ColorValue, ColorValue, ...ColorValue[]], 
          borderColor: '#B8860B',
          typeText: 'ORFEBRERÍA',
          hologramColor: ['#DAA520', '#FFF8DC'] as [ColorValue, ColorValue]
        };
      default:
        return {
          frameColors: ['#8B4513', '#D2691E', '#CD853F'] as [ColorValue, ColorValue, ...ColorValue[]],
          borderColor: '#654321',
          typeText: 'OBJETO',
          hologramColor: ['#8B4513', '#CD853F'] as [ColorValue, ColorValue, ...ColorValue[]]
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
    
    let baseStars = 1;
    switch (item.type) {
      case CulturalObjectType.GOLDSMITHING:
        baseStars = 5; 
        break;
      case CulturalObjectType.TEXTILES:
        baseStars = 4;
        break;
      case CulturalObjectType.CERAMICS:
        baseStars = 3;
        break;
      case CulturalObjectType.PAINTING:
        baseStars = 2;
        break;
      default:
        baseStars = 2;
        break;
    }
    
    let rarityModifier = 0;
    if (reviewCount <= 5) rarityModifier = 0;      
    else if (reviewCount <= 15) rarityModifier = -1; 
    else if (reviewCount <= 30) rarityModifier = -1; 
    else if (reviewCount <= 50) rarityModifier = -2; 
    else rarityModifier = -2; 

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
          <View style={[styles.innerBorder, { borderColor: cardConfig.borderColor }]}>
            
            <View style={styles.headerSection}>
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
            </View>

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
                      size={24} 
                      color="#666" 
                    />
                  </View>
                )}
                
                {!isObtained && (
                  <View style={styles.lockOverlay}>
                    <View style={styles.lockIcon}>
                      <Ionicons name="lock-closed" size={20} color="#fff" />
                    </View>
                  </View>
                )}
              </View>
            </View>

            <View style={[styles.typeSection, { backgroundColor: cardConfig.borderColor }]}>
              <Text style={styles.typeLabel}>[{cardConfig.typeText}]</Text>
              <LinearGradient
                colors={cardConfig.hologramColor}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.hologramStripe}
              />
            </View>

            <View style={styles.descriptionSection}>
              {isObtained ? (
                <Text style={styles.descriptionText} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : (
                <Text style={styles.hiddenText} numberOfLines={2}>
                  Reliquia cultural oculta...
                </Text>
              )}
            </View>

            <View style={styles.statsSection}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>VAL</Text>
                <Text style={styles.statValue}>{valueStars}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>RAR</Text>
                <Text style={styles.statValue}>{rarityStars}</Text>
              </View>
            </View>

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
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    borderRadius: 10,
  },
  lockedCard: {
    opacity: 0.7,
  },
  cardFrame: {
    borderRadius: 10,
    padding: 3,
    minHeight: 240, // Reducido de 280
  },
  innerBorder: {
    flex: 1,
    borderWidth: 2.5,
    borderRadius: 8,
    backgroundColor: '#F5F5DC',
    padding: 6,
    position: 'relative',
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  nameBar: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  cardName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.8,
  },
  obtainedBadge: {
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 2,
  },
  badgeGradient: {
    padding: 6,
    borderRadius: 14,
  },
  artworkFrame: {
    backgroundColor: '#1E3A8A',
    padding: 3,
    borderRadius: 6,
    marginBottom: 6,
    elevation: 2,
  },
  artworkContainer: {
    height: 80,
    backgroundColor: '#000',
    borderRadius: 4,
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
    borderRadius: 16,
    padding: 6,
  },
  typeSection: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 6,
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  typeLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 1,
  },
  hologramStripe: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.6,
  },
  descriptionSection: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#8B4513',
    borderRadius: 4,
    padding: 6,
    marginBottom: 6,
    minHeight: 35,
  },
  descriptionText: {
    fontSize: 8,
    lineHeight: 11,
    color: '#2F2F2F',
    textAlign: 'justify',
  },
  hiddenText: {
    fontSize: 8,
    lineHeight: 11,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: '#E8D5B7',
    borderWidth: 1.5,
    borderColor: '#8B4513',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1.5,
    height: 20,
    backgroundColor: '#8B4513',
    marginHorizontal: 8,
  },
  statLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#2F2F2F',
    marginBottom: 1,
  },
  statValue: {
    fontSize: 8,
    color: '#8B4513',
    fontWeight: 'bold',
  },
  cornerDecor: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: '#DAA520',
    borderRadius: 1,
    transform: [{ rotate: '45deg' }],
  },
  topLeft: {
    top: 4,
    left: 4,
  },
  topRight: {
    top: 4,
    right: 4,
  },
  bottomLeft: {
    bottom: 4,
    left: 4,
  },
  bottomRight: {
    bottom: 4,
    right: 4,
  },
});