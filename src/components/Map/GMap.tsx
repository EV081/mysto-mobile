import React from 'react';
import { AppleMaps, GoogleMaps } from 'expo-maps';
import { Platform, Text } from 'react-native';

export default function GMap() {
  if (Platform.OS === 'ios') {
    return <AppleMaps.View style={{ flex: 1 }} />;
  } else if (Platform.OS === 'android') {
    return <GoogleMaps.View style={{ flex: 1 }}
    cameraPosition={{coordinates: {
      latitude: 49.282729,
      longitude: -123.120737,
    },
    zoom: 10,
  }} 
  />;
  } else {
    return <Text>Maps are only available on Android and iOS</Text>;
  }
}
