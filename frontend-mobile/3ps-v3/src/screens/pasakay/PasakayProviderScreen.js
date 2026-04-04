import React, { useEffect, useRef, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView, Animated,
  Linking, Alert, Platform
} from 'react-native'
import MapView, { Marker, Polyline } from 'react-native-maps'
import { io } from 'socket.io-client'
import AsyncStorage from '@react-native-async-storage/async-storage'
import API from '../../services/api'
import { API_URL } from '../../services/api'

const STATUS_INFO = {
  accepted:   { label: 'Driver Accepted',  emoji: '🔵', color: '#1D4ED8', bg: '#EFF6FF', desc: 'Papunta na ang driver sa iyong pickup.' },
  on_the_way: { label: 'On the Way',       emoji: '🛵', color: '#0F766E', bg: '#F0FDFA', desc: 'Malapit na ang driver!' },
  completed:  { label: 'Completed',        emoji: '✅', color: '#16A34A', bg: '#F0FDF4', desc: 'Tapos na ang iyong biyahe.' },
  cancelled:  { label: 'Cancelled',        emoji: '❌', color: '#EF4444', bg: '#FEF2F2', desc: 'Na-cancel ang ride.' },
}

export default function PasakayProviderScreen({ navigation, route }) {
  const {
    rideId, pickup, dropoff, fare, distanceKm,
    provider: initialProvider, vehicleName, vehicleEmoji
  } = route.params || {}

  const [rideStatus, setRideStatus]   = useState('accepted')
  const [provider, setProvider]       = useState(initialProvider || null)
  const [providerCoords, setProviderCoords] = useState(null)
  const [cancelling, setCancelling]   = useState(false)
  const pulseAnim = useRef(new Animated.Value(1)).current
  const socketRef = useRef(null)

  const DEFAULT_REGION = {
    latitude: provider?.latitude || 9.6301,
    longitude: provider?.longitude || 125.9701,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
  }

  useEffect(() => {
    connectSocket()
    startPulse()
    return () => { if (socketRef.current) socketRef.current.disconnect() }
  }, [])

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])
    ).start()
  }

  const connectSocket = async () => {
    const token = await AsyncStorage.getItem('token')
    const socket = io(API_URL, { auth: { token }, transports: ['websocket'] })
    socketRef.current = socket

    socket.on('connect', () => socket.emit('join_ride_room', { rideId }))

    socket.on('ride_status_update', (data) => {
      setRideStatus(data.status)
      if (data.status === 'completed') {
        navigation.replace('WaitingPasakay', {
          rideId, pickup, dropoff, fare, distanceKm
        })
      }
    })

    socket.on('provider_location', (data) => {
      setProviderCoords({ latitude: data.latitude, longitude: data.longitude })
    })
  }

  const handleCall = () => {
    if (!provider?.phone) return
    Linking.openURL(`tel:${provider.phone}`)
  }

  const handleCancel = () => {
    Alert.alert(
      'I-cancel ang Ride?',
      'Maaari kang ma-charge ng cancellation fee. Itutuloy?',
      [
        { text: 'Hindi', style: 'cancel' },
        {
          text: 'Oo, I-cancel', style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(true)
              await API.patch(`/pasakay/rides/${rideId}/cancel`)
              if (socketRef.current) socketRef.current.disconnect()
              navigation.replace('Home')
            } catch {
              Alert.alert('Error', 'Hindi ma-cancel ngayon. Subukan ulit.')
            } finally {
              setCancelling(false)
            }
          }
        }
      ]
    )
  }

  const statusInfo = STATUS_INFO[rideStatus] || STATUS_INFO.accepted

  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0][0].toUpperCase()
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0FDFA" />

      {/* MAP */}
      <View style={styles.mapContainer}>
        <MapView
          style={StyleSheet.absoluteFillObject}
          initialRegion={DEFAULT_REGION}
          showsUserLocation
        >
          {providerCoords && (
            <Marker coordinate={providerCoords} anchor={{ x: 0.5, y: 0.5 }}>
              <Animated.View style={[styles.driverMarker, { transform: [{ scale: pulseAnim }] }]}>
                <Text style={{ fontSize: 24 }}>{vehicleEmoji || '🛺'}</Text>
              </Animated.View>
            </Marker>
          )}
        </MapView>

        {/* BACK BUTTON */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.backIcon}>🏠</Text>
        </TouchableOpacity>
      </View>

      {/* BOTTOM SHEET */}
      <ScrollView style={styles.sheet} showsVerticalScrollIndicator={false}>

        {/* STATUS BANNER */}
        <View style={[styles.statusBanner, { backgroundColor: statusInfo.bg, borderColor: statusInfo.color + '30' }]}>
          <Text style={styles.statusEmoji}>{statusInfo.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusLabel, { color: statusInfo.color }]}>{statusInfo.label}</Text>
            <Text style={styles.statusDesc}>{statusInfo.desc}</Text>
          </View>
        </View>

        {/* PROVIDER CARD */}
        {provider && (
          <View style={styles.providerCard}>
            <View style={styles.providerTop}>
              {/* AVATAR */}
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(provider.name)}</Text>
              </View>

              {/* INFO */}
              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>{provider.name || 'Driver'}</Text>
                <View style={styles.providerMeta}>
                  <Text style={styles.metaChip}>{vehicleEmoji} {vehicleName}</Text>
                  {provider.plate && (
                    <Text style={styles.metaPlate}>{provider.plate}</Text>
                  )}
                </View>
                {provider.rating && (
                  <View style={styles.ratingRow}>
                    <Text style={styles.ratingStar}>⭐</Text>
                    <Text style={styles.ratingText}>{Number(provider.rating).toFixed(1)}</Text>
                  </View>
                )}
              </View>

              {/* ETA */}
              <View style={styles.etaBox}>
                <Text style={styles.etaValue}>
                  {provider.eta_minutes ? `${provider.eta_minutes}` : '~10'}
                </Text>
                <Text style={styles.etaLabel}>min</Text>
              </View>
            </View>

            {/* CONTACT BUTTON */}
            {provider.phone && (
              <TouchableOpacity style={styles.callBtn} onPress={handleCall} activeOpacity={0.8}>
                <Text style={styles.callBtnEmoji}>📞</Text>
                <Text style={styles.callBtnText}>Tawagan ang Driver</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* TRIP DETAILS */}
        <View style={styles.tripCard}>
          <Text style={styles.tripCardTitle}>📋 Detalye ng Biyahe</Text>
          <View style={styles.tripItem}>
            <View style={[styles.tripDot, { backgroundColor: '#0F766E' }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.tripLabel}>PICKUP</Text>
              <Text style={styles.tripValue} numberOfLines={2}>{pickup}</Text>
            </View>
          </View>
          <View style={styles.tripConnector} />
          <View style={styles.tripItem}>
            <View style={[styles.tripDot, { backgroundColor: '#EF4444' }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.tripLabel}>DROPOFF</Text>
              <Text style={styles.tripValue} numberOfLines={2}>{dropoff}</Text>
            </View>
          </View>
          <View style={styles.tripDivider} />
          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>💰 Fare</Text>
            <Text style={styles.fareValue}>₱{fare}</Text>
          </View>
          <View style={styles.payNote}>
            <Text style={styles.payNoteText}>💳 Bayaran pagkatapos ng ride · Cash o GCash</Text>
          </View>
        </View>

        {/* CANCEL */}
        {rideStatus === 'accepted' && (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancel}
            disabled={cancelling}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelBtnText}>
              {cancelling ? 'Kine-cancel...' : '✕  I-cancel ang Ride'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0FDFA' },

  mapContainer: {
    height: 240, overflow: 'hidden',
  },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 48 : 16,
    left: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    elevation: 5, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6,
  },
  backIcon: { fontSize: 18 },
  driverMarker: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#0F766E',
    elevation: 4,
  },

  sheet: {
    flex: 1, backgroundColor: '#F0FDFA',
    paddingHorizontal: 16, paddingTop: 12,
  },

  statusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, borderWidth: 1,
    padding: 14, marginBottom: 12,
  },
  statusEmoji: { fontSize: 24 },
  statusLabel: { fontSize: 15, fontWeight: '700' },
  statusDesc: { fontSize: 12, color: '#64748B', marginTop: 1 },

  providerCard: {
    backgroundColor: '#fff', borderRadius: 18,
    borderWidth: 1, borderColor: '#CCFBF1',
    padding: 16, marginBottom: 12,
  },
  providerTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatar: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: '#0F766E', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  providerInfo: { flex: 1 },
  providerName: { fontSize: 16, fontWeight: '700', color: '#134E4A', marginBottom: 4 },
  providerMeta: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 4 },
  metaChip: {
    fontSize: 12, color: '#0F766E', fontWeight: '600',
    backgroundColor: '#F0FDFA', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderColor: '#CCFBF1',
  },
  metaPlate: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingStar: { fontSize: 12 },
  ratingText: { fontSize: 12, fontWeight: '700', color: '#D97706' },
  etaBox: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F0FDFA', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: '#CCFBF1',
    minWidth: 56,
  },
  etaValue: { fontSize: 22, fontWeight: '800', color: '#0F766E', lineHeight: 26 },
  etaLabel: { fontSize: 10, color: '#0F766E', fontWeight: '600' },

  callBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#F0FDFA', borderRadius: 12,
    paddingVertical: 12, borderWidth: 1, borderColor: '#CCFBF1',
  },
  callBtnEmoji: { fontSize: 16 },
  callBtnText: { fontSize: 14, fontWeight: '700', color: '#0F766E' },

  tripCard: {
    backgroundColor: '#fff', borderRadius: 18,
    borderWidth: 1, borderColor: '#CCFBF1',
    padding: 16, marginBottom: 12,
  },
  tripCardTitle: { fontSize: 13, fontWeight: '700', color: '#134E4A', marginBottom: 12 },
  tripItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tripDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, flexShrink: 0 },
  tripLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '700', letterSpacing: 0.8, marginBottom: 1 },
  tripValue: { fontSize: 13, color: '#134E4A', fontWeight: '500', lineHeight: 18 },
  tripConnector: { width: 2, height: 10, backgroundColor: '#CCFBF1', marginLeft: 4, marginVertical: 3 },
  tripDivider: { height: 1, backgroundColor: '#F0FDFA', marginVertical: 12 },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  fareLabel: { fontSize: 13, color: '#64748B' },
  fareValue: { fontSize: 20, fontWeight: '800', color: '#0F766E' },
  payNote: { backgroundColor: '#F0FDFA', borderRadius: 10, padding: 10 },
  payNoteText: { fontSize: 12, color: '#0F766E' },

  cancelBtn: {
    borderWidth: 1.5, borderColor: '#FECACA',
    borderRadius: 14, paddingVertical: 13, alignItems: 'center',
    backgroundColor: '#FEF2F2', marginBottom: 8,
  },
  cancelBtnText: { color: '#EF4444', fontSize: 14, fontWeight: '700' },
})