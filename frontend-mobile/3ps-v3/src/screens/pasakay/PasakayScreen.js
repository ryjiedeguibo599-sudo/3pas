import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Animated, Dimensions,
  Platform, ActivityIndicator, Alert
} from 'react-native'
import MapView, { Marker, Polyline } from 'react-native-maps'
import * as Location from 'expo-location'

const { height: SCREEN_H } = Dimensions.get('window')
const SHEET_H = SCREEN_H * 0.38
const GOOGLE_API_KEY = 'AIzaSyD6YRAdn3f001AR7t-rPp54RTS0lDxRhlM'

const DEFAULT_REGION = {
  latitude: 9.6301,
  longitude: 125.9701,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
}

export default function PasakayScreen({ navigation }) {
  const [pickup, setPickup]               = useState(null)
  const [dropoff, setDropoff]             = useState(null)
  const [pickupAddress, setPickupAddress] = useState('')
  const [dropoffAddress, setDropoffAddress] = useState('')
  const [selectingFor, setSelectingFor]   = useState(null) // 'pickup' | 'dropoff' | null
  const [region, setRegion]               = useState(DEFAULT_REGION)
  const [locating, setLocating]           = useState(true)
  const [routeCoords, setRouteCoords]     = useState([])
  const mapRef = useRef(null)
  const sheetAnim = useRef(new Animated.Value(1)).current

  useEffect(() => { initLocation() }, [])

  useEffect(() => {
    if (pickup && dropoff) fetchRoute()
  }, [pickup, dropoff])

  const initLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setLocating(false)
        return
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude }
      setPickup(coords)
      setRegion({ ...coords, latitudeDelta: 0.03, longitudeDelta: 0.03 })
      const addr = await reverseGeocode(coords)
      setPickupAddress(addr)
    } catch {
      setPickupAddress('Hindi ma-detect ang location')
    } finally {
      setLocating(false)
    }
  }

  const reverseGeocode = async (coords) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.latitude},${coords.longitude}&key=${GOOGLE_API_KEY}`
      )
      const data = await res.json()
      return data.results?.[0]?.formatted_address || `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`
    } catch {
      return `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`
    }
  }

  const fetchRoute = async () => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${pickup.latitude},${pickup.longitude}&destination=${dropoff.latitude},${dropoff.longitude}&key=${GOOGLE_API_KEY}`
      )
      const data = await res.json()
      const points = data.routes?.[0]?.overview_polyline?.points
      if (points) setRouteCoords(decodePolyline(points))
    } catch {}
  }

  const decodePolyline = (encoded) => {
    let index = 0, lat = 0, lng = 0
    const coords = []
    while (index < encoded.length) {
      let b, shift = 0, result = 0
      do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5 } while (b >= 0x20)
      lat += result & 1 ? ~(result >> 1) : result >> 1
      shift = 0; result = 0
      do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5 } while (b >= 0x20)
      lng += result & 1 ? ~(result >> 1) : result >> 1
      coords.push({ latitude: lat / 1e5, longitude: lng / 1e5 })
    }
    return coords
  }

  const handleMapPress = async (e) => {
    if (!selectingFor) return
    const coords = e.nativeEvent.coordinate
    const addr = await reverseGeocode(coords)
    if (selectingFor === 'pickup') {
      setPickup(coords)
      setPickupAddress(addr)
    } else {
      setDropoff(coords)
      setDropoffAddress(addr)
    }
    setSelectingFor(null)
    // Animate sheet back in
    Animated.spring(sheetAnim, { toValue: 1, useNativeDriver: false, tension: 60, friction: 9 }).start()
  }

  const startSelectingFor = (type) => {
    setSelectingFor(type)
    Animated.timing(sheetAnim, { toValue: 0.15, duration: 250, useNativeDriver: false }).start()
  }

  const handleContinue = () => {
    if (!pickup || !dropoff) {
      Alert.alert('Kulang!', 'Pumili ng pickup at dropoff location sa mapa.')
      return
    }
    navigation.navigate('PasakayTripDetails', {
      pickup: pickupAddress,
      dropoff: dropoffAddress,
      pickupCoords: pickup,
      dropoffCoords: dropoff,
    })
  }

  const sheetHeight = sheetAnim.interpolate({
    inputRange: [0.15, 1],
    outputRange: [SCREEN_H * 0.1, SHEET_H],
  })

  const isReady = pickup && dropoff

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* ── MAP ── */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        region={region}
        onPress={handleMapPress}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {pickup && (
          <Marker coordinate={pickup} anchor={{ x: 0.5, y: 1 }}>
            <View style={styles.markerPickup}>
              <Text style={{ fontSize: 22 }}>📍</Text>
            </View>
          </Marker>
        )}
        {dropoff && (
          <Marker coordinate={dropoff} anchor={{ x: 0.5, y: 1 }}>
            <View style={styles.markerDropoff}>
              <Text style={{ fontSize: 22 }}>🚩</Text>
            </View>
          </Marker>
        )}
        {routeCoords.length > 0 && (
          <Polyline coordinates={routeCoords} strokeColor="#0F766E" strokeWidth={3} />
        )}
      </MapView>

      {/* ── FLOATING BACK ── */}
      <SafeAreaView style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.topTitle}>
          <Text style={styles.topTitleText}>🛵 Pasakay</Text>
        </View>
        <TouchableOpacity style={styles.locBtn} onPress={initLocation}>
          <Text style={{ fontSize: 18 }}>◎</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* ── MAP HINT ── */}
      {selectingFor && (
        <View style={styles.mapHint}>
          <Text style={styles.mapHintText}>
            {selectingFor === 'pickup' ? '📍 I-tap ang mapa para sa Pickup' : '🚩 I-tap ang mapa para sa Dropoff'}
          </Text>
          <TouchableOpacity onPress={() => {
            setSelectingFor(null)
            Animated.spring(sheetAnim, { toValue: 1, useNativeDriver: false, tension: 60, friction: 9 }).start()
          }}>
            <Text style={styles.mapHintCancel}>Kanselahin</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── BOTTOM SHEET ── */}
      <Animated.View style={[styles.sheet, { height: sheetHeight }]}>
        <View style={styles.sheetHandle} />

        {locating ? (
          <View style={styles.locatingRow}>
            <ActivityIndicator size="small" color="#0F766E" />
            <Text style={styles.locatingText}>Kinahanap ang iyong location...</Text>
          </View>
        ) : (
          <>
            {/* PICKUP ROW */}
            <TouchableOpacity
              style={[styles.locationRow, selectingFor === 'pickup' && styles.locationRowActive]}
              onPress={() => startSelectingFor('pickup')}
              activeOpacity={0.7}
            >
              <View style={[styles.locDot, { backgroundColor: '#0F766E' }]} />
              <View style={styles.locInfo}>
                <Text style={styles.locLabel}>PICKUP</Text>
                <Text style={[styles.locAddr, !pickupAddress && styles.locPlaceholder]} numberOfLines={1}>
                  {pickupAddress || 'I-tap para pumili sa mapa'}
                </Text>
              </View>
              <View style={styles.editChip}>
                <Text style={styles.editChipText}>Baguhin</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.connector}>
              <View style={styles.connectorLine} />
            </View>

            {/* DROPOFF ROW */}
            <TouchableOpacity
              style={[styles.locationRow, selectingFor === 'dropoff' && styles.locationRowActive]}
              onPress={() => startSelectingFor('dropoff')}
              activeOpacity={0.7}
            >
              <View style={[styles.locDot, { backgroundColor: '#EF4444' }]} />
              <View style={styles.locInfo}>
                <Text style={styles.locLabel}>DROPOFF</Text>
                <Text style={[styles.locAddr, !dropoffAddress && styles.locPlaceholder]} numberOfLines={1}>
                  {dropoffAddress || 'I-tap para pumili sa mapa'}
                </Text>
              </View>
              <View style={[styles.editChip, dropoff && { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                <Text style={[styles.editChipText, dropoff && { color: '#EF4444' }]}>
                  {dropoff ? 'Baguhin' : 'Pumili'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* CONTINUE BUTTON */}
            <TouchableOpacity
              style={[styles.continueBtn, !isReady && styles.continueBtnDisabled]}
              onPress={handleContinue}
              disabled={!isReady}
              activeOpacity={0.85}
            >
              <Text style={styles.continueBtnText}>
                {isReady ? 'Ituloy →' : 'Pumili ng Lokasyon'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 48 : 8,
    paddingBottom: 8,
    gap: 8,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6,
  },
  backIcon: { fontSize: 24, color: '#134E4A', fontWeight: '700', lineHeight: 30 },
  topTitle: {
    flex: 1, backgroundColor: '#fff', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4,
  },
  topTitleText: { fontSize: 15, fontWeight: '700', color: '#134E4A', textAlign: 'center' },
  locBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6,
  },

  markerPickup: { alignItems: 'center' },
  markerDropoff: { alignItems: 'center' },

  mapHint: {
    position: 'absolute', top: 110, left: 20, right: 20,
    backgroundColor: '#0F766E', borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    elevation: 6,
  },
  mapHintText: { color: '#fff', fontSize: 13, fontWeight: '600', flex: 1 },
  mapHintCancel: { color: '#CCFBF1', fontSize: 12, fontWeight: '700', marginLeft: 8 },

  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32,
    elevation: 16,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 16,
    overflow: 'hidden',
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 16,
  },

  locatingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8 },
  locatingText: { fontSize: 13, color: '#64748B' },

  locationRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F0FDFA', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 13,
    borderWidth: 1.5, borderColor: '#CCFBF1',
    gap: 12,
  },
  locationRowActive: { borderColor: '#0F766E', backgroundColor: '#E6FBF7' },
  locDot: { width: 12, height: 12, borderRadius: 6, flexShrink: 0 },
  locInfo: { flex: 1 },
  locLabel: { fontSize: 10, fontWeight: '700', color: '#0F766E', letterSpacing: 1, marginBottom: 2 },
  locAddr: { fontSize: 13, color: '#134E4A', fontWeight: '500' },
  locPlaceholder: { color: '#94A3B8' },
  editChip: {
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: '#CCFBF1', borderWidth: 1, borderColor: '#99F6E4',
  },
  editChipText: { fontSize: 11, fontWeight: '700', color: '#0F766E' },

  connector: { paddingLeft: 19, paddingVertical: 4 },
  connectorLine: { width: 2, height: 12, backgroundColor: '#CCFBF1', borderRadius: 1 },

  continueBtn: {
    backgroundColor: '#0F766E', borderRadius: 14,
    paddingVertical: 15, alignItems: 'center', marginTop: 16,
  },
  continueBtnDisabled: { backgroundColor: '#99F6E4' },
  continueBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
})