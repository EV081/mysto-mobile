import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { UsersResponseDto } from '@interfaces/user/UsersResponseDto';

interface UserStatsCardsProps {
  user: UsersResponseDto;
}

const UserStatsCards: React.FC<UserStatsCardsProps> = ({ user }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[
      styles.section,
      {
        backgroundColor: isDark ? '#23223a' : '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#000000ff',
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: 20,
        marginHorizontal: 12,
      }
    ]}>
      <Text style={[styles.sectionTitle, { color: '#000000ff' }]}>
        Estadísticas
      </Text>
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: '#F3F4F6', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB' }]}>
          <View style={[styles.statIcon, { backgroundColor: '#22c55e22' }]}>
            <Text style={[styles.coinIcon, { color: '#22c55e' }]}>
              🪙
            </Text>
          </View>
          <Text style={[styles.statValue, { color: '#7C3AED' }]}>
            {user.coins.toLocaleString()}
          </Text>
          <Text style={[styles.statLabel, { color: '#374151' }]}>
            Monedas
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#F3F4F6', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB' }]}>
          <View style={[styles.statIcon, { backgroundColor: '#22c55e22' }]}>
            <Text style={[styles.pointIcon, { color: '#22c55e' }]}>
              ⭐
            </Text>
          </View>
          <Text style={[styles.statValue, { color: '#7C3AED' }]}>
            {user.points.toLocaleString()}
          </Text>
          <Text style={[styles.statLabel, { color: '#374151' }]}>
            Puntos
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 0,
    elevation: 0,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  coinIcon: {
    fontSize: 22,
    // color se sobrescribe arriba
  },
  pointIcon: {
    fontSize: 22,
    // color se sobrescribe arriba
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default UserStatsCards;