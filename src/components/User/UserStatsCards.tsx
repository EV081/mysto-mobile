import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { UsersResponseDto } from '@interfaces/user/UsersResponseDto';
import { getThemeColors, COLORS } from '@constants/colors';

interface UserStatsCardsProps {
  user: UsersResponseDto;
}

const UserStatsCards: React.FC<UserStatsCardsProps> = ({ user }) => {
  const colorScheme = useColorScheme();
  const colors = getThemeColors(colorScheme === 'dark');
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Estadísticas
      </Text>

      <View style={styles.statsContainer}>
        <TouchableOpacity 
          style={[styles.statCard, { 
            backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)'
          }]}
          activeOpacity={0.8}
        >
          <View style={[styles.statIcon, { backgroundColor: '#f59e0b20' }]}>
            <Text style={styles.coinIcon}>🪙</Text>
          </View>
          <Text style={[styles.statValue, { color: '#f59e0b' }]}>
            {user.coins.toLocaleString()}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Monedas
          </Text>
          <View style={[styles.statBorder, { borderColor: '#f59e0b30' }]} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.statCard, { 
            backgroundColor: isDark ? 'rgba(217, 119, 6, 0.15)' : 'rgba(217, 119, 6, 0.1)'
          }]}
          activeOpacity={0.8}
        >
          <View style={[styles.statIcon, { backgroundColor: '#d9770620' }]}>
            <Text style={styles.pointIcon}>⭐</Text>
          </View>
          <Text style={[styles.statValue, { color: '#d97706' }]}>
            {user.points.toLocaleString()}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Puntos
          </Text>
          <View style={[styles.statBorder, { borderColor: '#d9770630' }]} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  coinIcon: {
    fontSize: 24,
  },
  pointIcon: {
    fontSize: 24,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  statBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopWidth: 3,
  },
});

export default UserStatsCards;