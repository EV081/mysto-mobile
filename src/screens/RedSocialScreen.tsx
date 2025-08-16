import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import ObjetosListados from '@components/ObjetosListados';

export default function RedSocialScreen() {
  return (
    <View style={styles.container}>
      <ObjetosListados />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
  },
});