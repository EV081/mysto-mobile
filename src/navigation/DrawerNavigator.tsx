import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { useAuthContext } from '@contexts/AuthContext';
import { getThemeColors, COLORS } from '@constants/colors';
import HomeScreen from '@screens/HomeScreen';

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props: any) {
  const { logout } = useAuthContext();
  const colorScheme = useColorScheme();
  const colors = getThemeColors(colorScheme === 'dark');
  const isDark = colorScheme === 'dark';

  return (
    <DrawerContentScrollView 
      {...props} 
      contentContainerStyle={{ 
        flex: 1, 
        backgroundColor: colors.background, 
        paddingTop: 0 
      }}
    >
      <View style={styles.headerContainer}>
        {/* Botón de cerrar Drawer en la esquina superior derecha */}
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}
          onPress={() => props.navigation.closeDrawer()}
          activeOpacity={0.8}
        >
          <Text style={[styles.closeButtonIcon, { color: colors.text }]}>✕</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1, marginTop: 8 }}>
        <DrawerItemList {...props} />
      </View>
      {/* Botón personalizado para cerrar sesión */}
      <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 16 }}>
        <TouchableOpacity
          onPress={logout}
          style={{
            borderColor: COLORS.primary,
            borderWidth: 2,
            borderRadius: 9999,
            paddingVertical: 10,
            paddingHorizontal: 32,
            backgroundColor: 'transparent',
            minWidth: 180,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#ef4444', fontWeight: 'bold', fontSize: 16 }}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

export default function DrawerNavigator() {
  const colorScheme = useColorScheme();
  const colors = getThemeColors(colorScheme === 'dark');
  const isDark = colorScheme === 'dark';
  
  return (
    <Drawer.Navigator
      initialRouteName="Home"
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerStyle: {
          backgroundColor: colors.background,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        drawerActiveTintColor: COLORS.primary,
        drawerInactiveTintColor: colors.textSecondary,
      }}
    >
      <Drawer.Screen name="Home" component={HomeScreen} options={{ title: 'Inicio' }} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 24,
    paddingBottom: 8,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeButtonIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
}); 