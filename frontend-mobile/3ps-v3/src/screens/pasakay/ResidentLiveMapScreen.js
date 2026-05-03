import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import io from 'socket.io-client';
import { API_URL } from '../../services/api';
import * as SecureStore from 'expo-secure-store';

export default function ResidentLiveMapScreen({ navigation, route }) {
  const { rideId } = route.params || {};
  const [providerLoc, setProviderLoc] = useState(null);
  
  useEffect(() => {
    let socket;
    (async () => {
      const userStr = await SecureStore.getItemAsync('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        socket = io(API_URL);
        socket.emit('join', user.id);
        
        socket.on('location_updated', (data) => {
          if (String(data.ride_id) === String(rideId)) {
            setProviderLoc({ latitude: data.latitude, longitude: data.longitude });
          }
        });
      }
    })();

    return () => {
      if (socket) socket.disconnect();
    };
  }, [rideId]);

  return (
    <View style={styles.container}>
      {providerLoc ? (
        <MapView
          style={styles.map}
          region={{
            latitude: providerLoc.latitude,
            longitude: providerLoc.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
        >
          <Marker coordinate={providerLoc} title="Provider" description="Rider is here!">
            <Text style={{fontSize: 30}}>🛵</Text>
          </Marker>
        </MapView>
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={{fontSize: 40, marginBottom: 10}}>📡</Text>
          <Text style={styles.loadingText}>Waiting for provider's GPS signal...</Text>
        </View>
      )}

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Tracking (Ride #{rideId || '...'})</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFF' },
  map: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#64748B', fontSize: 16 },
  header: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 12, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  backBtn: { paddingRight: 15 },
  backText: { color: '#2563EB', fontWeight: 'bold' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' }
});
