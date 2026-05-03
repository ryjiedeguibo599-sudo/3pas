import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import API from '../../services/api';

export default function ProviderLiveTrackingScreen({ navigation, route }) {
  const { rideId } = route.params || {};
  const [location, setLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }
      let initialLocation = await Location.getCurrentPositionAsync({});
      setLocation(initialLocation.coords);
    })();

    return () => stopTracking(); // cleanup on unmount
  }, []);

  const startTracking = async () => {
    setIsTracking(true);
    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 3000,
        distanceInterval: 10,
      },
      (loc) => {
        setLocation(loc.coords);
        if (rideId) {
          API.post(`/pasakay/rides/${rideId}/location`, {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          }).catch(console.error);
        }
      }
    );
    setSubscription(sub);
  };

  const stopTracking = () => {
    setIsTracking(false);
    if (subscription) {
      subscription.remove();
      setSubscription(null);
    }
  };

  return (
    <View style={styles.container}>
      {location ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          region={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
        >
          <Marker coordinate={location} title="You" description="Provider Location" />
        </MapView>
      ) : (
        <View style={styles.loadingContainer}>
          <Text>Getting Location...</Text>
        </View>
      )}

      <View style={styles.controls}>
        <Text style={styles.title}>Live GPS Tracking</Text>
        {isTracking ? (
          <TouchableOpacity style={[styles.btn, styles.stopBtn]} onPress={stopTracking}>
            <Text style={styles.btnText}>Stop Sharing Location</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.btn, styles.startBtn]} onPress={startTracking}>
            <Text style={styles.btnText}>Start Sharing Location</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  controls: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: 'white', padding: 20, borderRadius: 16, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  btn: { padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  startBtn: { backgroundColor: '#10B981' },
  stopBtn: { backgroundColor: '#EF4444' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  backBtn: { alignItems: 'center', padding: 10 },
  backText: { color: '#64748B' },
});
