import React, { useEffect, useRef, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, ScrollView, Animated,
  Linking, Alert, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import { io } from 'socket.io-client'
import * as SecureStore from 'expo-secure-store'
import API from '../../services/api'
import { API_URL } from '../../services/api'
import ConfirmationModal from '../../components/ConfirmationModal'

const C = {
  primary:   '#2563EB',
  primaryLt: '#EFF6FF',
  primaryMd: '#BFDBFE',
  text:      '#0F172A',
  textSub:   '#64748B',
  textHint:  '#94A3B8',
  border:    '#E2E8F0',
  bg:        '#F8FAFF',
  white:     '#FFFFFF',
  green:     '#16A34A',
  red:       '#EF4444',
}

const STATUS_INFO = {
  accepted:   { label: 'Driver Accepted', emoji: '🔵', color: C.primary,  bg: C.primaryLt, desc: 'Your driver is on the way to pickup.' },
  on_the_way: { label: 'On the Way',      emoji: '🛵', color: C.primary,  bg: C.primaryLt, desc: 'Your driver is nearby!' },
  completed:  { label: 'Completed',       emoji: '✅', color: C.green,    bg: '#F0FDF4',   desc: 'Your trip is complete.' },
  cancelled:  { label: 'Cancelled',       emoji: '❌', color: C.red,      bg: '#FEF2F2',   desc: 'Ride was cancelled.' },
}

export default function PasakayProviderScreen({ navigation, route }) {
  const {
    rideId, pickup, dropoff, fare, distanceKm,
    provider: initialProvider, vehicleName, vehicleEmoji
  } = route.params || {}

  const [rideStatus, setRideStatus]       = useState('accepted')
  const [provider, setProvider]           = useState(initialProvider || null)
  const [providerCoords, setProviderCoords] = useState(null)
  const [cancelling, setCancelling]       = useState(false)
  const [cancelModalVisible, setCancelModalVisible] = useState(false)
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
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])
    ).start()
    return () => { if (socketRef.current) socketRef.current.disconnect() }
  }, [])

  const connectSocket = async () => {
    const token = await SecureStore.getItemAsync('token')
    const socket = io(API_URL, { auth: { token }, transports: ['websocket'] })
    socketRef.current = socket
    socket.on('connect', () => socket.emit('join_ride_room', { rideId }))
    socket.on('ride_status_update', (data) => {
      setRideStatus(data.status)
      if (data.status === 'completed') {
        navigation.replace('WaitingPasakay', { rideId, pickup, dropoff, fare, distanceKm })
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

  const handleCancel = () => setCancelModalVisible(true)

  const executeCancel = async () => {
    setCancelModalVisible(false)
    try {
      setCancelling(true)
      await API.patch(`/pasakay/rides/${rideId}/cancel`)
      if (socketRef.current) socketRef.current.disconnect()
      navigation.replace('Home')
    } catch {
      Alert.alert('Error', 'Unable to cancel right now. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  const statusInfo = STATUS_INFO[rideStatus] || STATUS_INFO.accepted

  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0][0].toUpperCase()
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Map */}
      <View style={s.mapContainer}>
        <MapView
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_GOOGLE}
          initialRegion={DEFAULT_REGION}
          showsUserLocation
        >
          {providerCoords && (
            <Marker coordinate={providerCoords} anchor={{ x: 0.5, y: 0.5 }}>
              <Animated.View style={[s.driverMarker, { transform: [{ scale: pulseAnim }] }]}>
                <Text style={{ fontSize: 24 }}>{vehicleEmoji || '🛺'}</Text>
              </Animated.View>
            </Marker>
          )}
        </MapView>

        <TouchableOpacity style={s.homeBtn} onPress={() => navigation.navigate('Home')}>
          <Text style={s.homeBtnIcon}>🏠</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom sheet */}
      <ScrollView style={s.sheet} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Status */}
        <View style={[s.statusBanner, { backgroundColor: statusInfo.bg, borderColor: statusInfo.color + '30' }]}>
          <Text style={s.statusEmoji}>{statusInfo.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.statusLabel, { color: statusInfo.color }]}>{statusInfo.label}</Text>
            <Text style={s.statusDesc}>{statusInfo.desc}</Text>
          </View>
        </View>

        {/* Driver card */}
        {provider && (
          <View style={s.providerCard}>
            <View style={s.providerTop}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{getInitials(provider.name)}</Text>
              </View>
              <View style={s.providerInfo}>
                <Text style={s.providerName}>{provider.name || 'Driver'}</Text>
                <View style={s.providerMeta}>
                  <Text style={s.metaChip}>{vehicleEmoji} {vehicleName}</Text>
                  {provider.plate && <Text style={s.metaPlate}>{provider.plate}</Text>}
                </View>
                {provider.rating && (
                  <View style={s.ratingRow}>
                    <Text style={s.ratingStar}>⭐</Text>
                    <Text style={s.ratingText}>{Number(provider.rating).toFixed(1)}</Text>
                  </View>
                )}
              </View>
              <View style={s.etaBox}>
                <Text style={s.etaValue}>{provider.eta_minutes ? `${provider.eta_minutes}` : '~10'}</Text>
                <Text style={s.etaLabel}>min</Text>
              </View>
            </View>

            {provider.phone && (
              <TouchableOpacity style={s.callBtn} onPress={handleCall} activeOpacity={0.8}>
                <Text style={s.callBtnEmoji}>📞</Text>
                <Text style={s.callBtnText}>Call Driver</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Trip details */}
        <View style={s.tripCard}>
          <Text style={s.tripCardTitle}>📋 Trip Details</Text>
          <View style={s.tripItem}>
            <View style={[s.tripDot, { backgroundColor: C.green }]} />
            <View style={{ flex: 1 }}>
              <Text style={s.tripLabel}>PICKUP</Text>
              <Text style={s.tripValue} numberOfLines={2}>{pickup}</Text>
            </View>
          </View>
          <View style={s.tripConnector} />
          <View style={s.tripItem}>
            <View style={[s.tripDot, { backgroundColor: C.red }]} />
            <View style={{ flex: 1 }}>
              <Text style={s.tripLabel}>DROPOFF</Text>
              <Text style={s.tripValue} numberOfLines={2}>{dropoff}</Text>
            </View>
          </View>
          <View style={s.tripDivider} />
          <View style={s.fareRow}>
            <Text style={s.fareLabel}>💰 Fare</Text>
            <Text style={s.fareValue}>₱{fare}</Text>
          </View>
          <View style={s.payNote}>
            <Text style={s.payNoteText}>💳 Pay after ride · Cash or GCash</Text>
          </View>
        </View>

        {/* Cancel */}
        {rideStatus === 'accepted' && (
          <TouchableOpacity style={s.cancelBtn} onPress={handleCancel} disabled={cancelling} activeOpacity={0.8}>
            <Text style={s.cancelBtnText}>
              {cancelling ? 'Cancelling...' : '✕  Cancel Ride'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <ConfirmationModal
        visible={cancelModalVisible}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking? This action cannot be undone."
        icon="⚠️"
        confirmText="Yes, Cancel"
        confirmColor="#EF4444"
        onConfirm={executeCancel}
        onCancel={() => setCancelModalVisible(false)}
        critical={true}
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  mapContainer: { height: 240, overflow: 'hidden' },
  homeBtn:      { position: 'absolute', top: Platform.OS === 'android' ? 16 : 16, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6 },
  homeBtnIcon:  { fontSize: 18 },
  driverMarker: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.primary, elevation: 4 },

  sheet: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },

  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 12 },
  statusEmoji:  { fontSize: 24 },
  statusLabel:  { fontSize: 15, fontWeight: '700' },
  statusDesc:   { fontSize: 12, color: C.textSub, marginTop: 1 },

  providerCard: { backgroundColor: C.white, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 12 },
  providerTop:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatar:       { width: 54, height: 54, borderRadius: 27, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText:   { fontSize: 18, fontWeight: '700', color: C.white },
  providerInfo: { flex: 1 },
  providerName: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 4 },
  providerMeta: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 4 },
  metaChip:     { fontSize: 12, color: C.primary, fontWeight: '600', backgroundColor: C.primaryLt, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: C.primaryMd },
  metaPlate:    { fontSize: 12, color: C.textSub, fontWeight: '600' },
  ratingRow:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingStar:   { fontSize: 12 },
  ratingText:   { fontSize: 12, fontWeight: '700', color: '#D97706' },
  etaBox:       { alignItems: 'center', justifyContent: 'center', backgroundColor: C.primaryLt, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: C.primaryMd, minWidth: 56 },
  etaValue:     { fontSize: 22, fontWeight: '800', color: C.primary, lineHeight: 26 },
  etaLabel:     { fontSize: 10, color: C.primary, fontWeight: '600' },
  callBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primaryLt, borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: C.primaryMd },
  callBtnEmoji: { fontSize: 16 },
  callBtnText:  { fontSize: 14, fontWeight: '700', color: C.primary },

  tripCard:      { backgroundColor: C.white, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 12 },
  tripCardTitle: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 12 },
  tripItem:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tripDot:       { width: 10, height: 10, borderRadius: 5, marginTop: 4, flexShrink: 0 },
  tripLabel:     { fontSize: 10, color: C.textHint, fontWeight: '700', letterSpacing: 0.8, marginBottom: 1 },
  tripValue:     { fontSize: 13, color: C.text, fontWeight: '500', lineHeight: 18 },
  tripConnector: { width: 2, height: 10, backgroundColor: C.border, marginLeft: 4, marginVertical: 3 },
  tripDivider:   { height: 1, backgroundColor: C.border, marginVertical: 12 },
  fareRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  fareLabel:     { fontSize: 13, color: C.textSub },
  fareValue:     { fontSize: 20, fontWeight: '800', color: C.primary },
  payNote:       { backgroundColor: C.primaryLt, borderRadius: 10, padding: 10 },
  payNoteText:   { fontSize: 12, color: C.primary },

  cancelBtn:     { borderWidth: 1.5, borderColor: '#FECACA', borderRadius: 14, paddingVertical: 13, alignItems: 'center', backgroundColor: '#FEF2F2', marginBottom: 8 },
  cancelBtnText: { color: C.red, fontSize: 14, fontWeight: '700' },
})
