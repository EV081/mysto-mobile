import React from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { getThemeColors, COLORS } from '@constants/colors';
import HomeScreen from '@screens/HomeScreen';
import ShopScreen from '@screens/ShopScreen';
import { useAuthContext } from '@contexts/AuthContext';
import { useModal } from '@contexts/ModalContext';
import AlbumScreen from '@screens/AlbumScreen';
import ObjectDetailScreen from '@screens/ObjectDetailScreen';
import MuseumScreen from '@screens/MuseumScreen';
import RedSocialScreen from '@screens/RedSocialScreen';
import UserScreen from '@screens/UserScreen';
import AventureScreen from '@screens/AventureScreen';
import AvatarScreen from "@screens/AvatarScreen";
import MuseumforOneScreen from '@screens/MuseumforOneScreen';

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props: any) {
  const { logout } = useAuthContext();
  const { confirmLogout } = useModal();
  const colorScheme = useColorScheme();
  const colors = getThemeColors(colorScheme === 'dark');
  const isDark = colorScheme === 'dark';

  const handleLogoutPress = () => {
    confirmLogout(() => {
      props.navigation.closeDrawer();
      setTimeout(() => {
        logout();
      }, 300);
    });
  };
  
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
      <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 16 }}>
        <TouchableOpacity
          onPress={handleLogoutPress}
          style={[styles.logoutButton, {
            backgroundColor: COLORS.primary,
          }]}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
          <Text style={styles.logoutIcon}>🏃</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

export default function DrawerNavigator() {
  const colorScheme = useColorScheme();
  const colors = getThemeColors(colorScheme === 'dark');
  
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
      <Drawer.Screen name="User" component={UserScreen} options={{ title: 'Mi Perfil' }} />
      <Drawer.Screen name="Avatar" component={AvatarScreen} options={{ title: "Avatar" }} />
      <Drawer.Screen name="Album" component={AlbumScreen} options={{ title: 'Mi Álbum' }} />
      <Drawer.Screen 
        name="ObjectDetail" 
        component={ObjectDetailScreen} 
        options={{ 
          drawerItemStyle: { display: 'none' }
        }} 
      />
      <Drawer.Screen name= "Aventura" component={AventureScreen} options = {{title: 'Aventura'}} />
      <Drawer.Screen name="Museums" component={MuseumScreen} options={{ title: 'Museos' }} />
      <Drawer.Screen 
        name="MuseumforOneScreen" 
        component={MuseumforOneScreen} 
        options={{ 
          drawerItemStyle: { display: 'none' },
          headerShown: false,   
          swipeEnabled: false, 
        }} 
      />
      <Drawer.Screen name= "RedSocial" component={RedSocialScreen} options= {{title: 'Red Social'}} />
      <Drawer.Screen name="Shop" component={ShopScreen} options={{ title: 'Tienda' }} />
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    paddingVertical: 10,
    paddingHorizontal: 32,
    minWidth: 180,
    gap: 8,
  },
  logoutIcon: {
    fontSize: 18,
  },
  logoutButtonText: {
    color: COLORS.input.background,
    fontWeight: 'bold',
    fontSize: 16,
  },
});