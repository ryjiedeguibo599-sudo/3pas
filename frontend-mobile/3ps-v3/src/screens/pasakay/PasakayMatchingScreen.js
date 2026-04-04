import React, { useEffect, useRef, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Animated, Easing,
  Modal, Alert, Platform
} from 'react-native'
import { io } from 'socket.io-client'
import AsyncStorage from '@react-native-async-storage/async-storage'
import API from '../../services/api'
import { API_URL } from '../../services/api'

const TIPS = [
  'Tip: Laging magbayad ng tamang fare sa iyong rider. 🙏',
  'Tip: I-rate ang iyong rider pagkatapos ng biyahe. ⭐',
  'Tip: Maging ligtas sa daan. Magsuot ng helmet! 🪖',
  'Tip: Huwag kalimutang i-confirm ang iyong pickup location. 📍',
]

export default function PasakayMatchingScreen({ navigation, route }) {
  const {
    pickup, dropoff, pickupCoords, dropoffCoords,
    passengers, cargo, vehicleType, vehicleName, vehicleEmoji, fare, distanceKm
  } = route.params || {}

  const [status,    setStatus]    = useState('booking')
  const [rideId,    setRideId]    = useState(null)
  const [tipIndex,  setTipIndex]  = useState(0)
  const [elapsed,   setElapsed]   = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [acceptedData, setAcceptedData] = useState(null)

  const socketRef  = useRef(null)
  const timerRef   = useRef(null)
  const tipTimer   = useRef(null)
  const pollingRef = useRef(null)
  const mountedRef = useRef(true)

  const pulseAnim = useRef(new Animated.Value(1)).current
  const ringAnim  = useRef(new Animated.Value(0)).current
  const fadeAnim  = useRef(new Animated.Value(0)).current
  const tipFade   = useRef(new Animated.Value(1)).current
  const modalScale = useRef(new Animated.Value(0.8)).current
  const modalOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    mountedRef.current = true
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start()
    bookRide()
    return () => { mountedRef.current = false; cleanup() }
  }, [])

  useEffect(() => {
    if (status !== 'searching') return

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start()

    Animated.loop(
      Animated.timing(ringAnim, { toValue: 1, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true })
    ).start()

    timerRef.current = setInterval(() => {
      if (mountedRef.current) setElapsed(e => e + 1)
    }, 1000)

    tipTimer.current = setInterval(() => {
      Animated.sequence([
        Animated.timing(tipFade, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(tipFade, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start()
      setTipIndex(i => (i + 1) % TIPS.length)
    }, 4000)

    return () => {
      clearInterval(timerRef.current)
      clearInterval(tipTimer.current)
    }
  }, [status])

  const cleanup = () => {
    if (socketRef.current)  { socketRef.current.disconnect(); socketRef.current = null }
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null }
    clearInterval(timerRef.current)
    clearInterval(tipTimer.current)
  }

  const bookRide = async () => {
    try {
      setStatus('booking')
      const res = await API.post('/pasakay/book', {
        pickup_location:  pickup,
        dropoff_location: dropoff,
        pickup_lat:       pickupCoords?.latitude,
        pickup_lng:       pickupCoords?.longitude,
        dropoff_lat:      dropoffCoords?.latitude,
        dropoff_lng:      dropoffCoords?.longitude,
        fare,
        vehicle_type: vehicleType,
        passengers,
        cargo,
      })
      const id = res.data.ride?.id
      setRideId(id)
      setStatus('searching')
      connectSocket(id)
    } catch {
      setStatus('error')
    }
  }

  const connectSocket = async (id) => {
    try {
      const token = await AsyncStorage.getItem('token')
      const socket = io(API_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
      })
      socketRef.current = socket

      socket.on('connect', () => {
        socket.emit('join_ride_room', { rideId: id })
        startPolling(id)
      })

      socket.on('ride_accepted', (data) => {
        if (!mountedRef.current) return
        cleanup()
        showAcceptedModal(data, id)
      })

      socket.on('connect_error', () => startPolling(id))
    } catch {
      startPolling(id)
    }
  }

  const startPolling = (id) => {
    if (pollingRef.current) return
    pollingRef.current = setInterval(async () => {
      if (!mountedRef.current) return
      try {
        const res = await API.get(`/pasakay/rides/${id}`)
        const ride = res.data?.ride
        if (!ride) return
        if (ride.status === 'accepted' && ride.provider) {
          cleanup()
          showAcceptedModal({ provider: ride.provider }, id)
        } else if (ride.status === 'cancelled') {
          cleanup()
          if (mountedRef.current) setStatus('error')
        }
      } catch {}
    }, 3000)
  }

  const showAcceptedModal = (data, id) => {
    if (!mountedRef.current) return
    setAcceptedData({ ...data, rideId: id })
    setShowModal(true)
    Animated.parallel([
      Animated.spring(modalScale,   { toValue: 1, useNativeDriver: true, tension: 60, friction: 7 }),
      Animated.timing(modalOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start()
  }

  const handleGoToProvider = () => {
    setShowModal(false)
    navigation.replace('PasakayProvider', {
      rideId:     acceptedData?.rideId,
      pickup, dropoff, fare, distanceKm,
      provider:   acceptedData?.provider,
      vehicleName, vehicleEmoji,
    })
  }

  const handleGoHome = () => {
    cleanup()
    navigation.navigate('Home')
  }

  const handleViewOrders = () => {
    cleanup()
    navigation.navigate('MyRides')
  }

  const ringScale   = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] })
  const ringOpacity = ringAnim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.4, 0.1, 0] })

  const formatElapsed = (s) => {
    const m = Math.floor(s / 60)
    return m > 0 ? `${m}m ${s % 60}s` : `${s}s`
  }

  // ── ERROR STATE ────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>😔</Text>
          <Text style={styles.errorTitle}>May problema</Text>
          <Text style={styles.errorDesc}>Hindi ma-book ang iyong ride. Subukan ulit.</Text>
          <TouchableOpacity style={styles.homeBtnSolid} onPress={bookRide}>
            <Text style={styles.homeBtnSolidTxt}>🔄  Subukan Ulit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.viewOrdersLink} onPress={() => navigation.goBack()}>
            <Text style={styles.viewOrdersLinkTxt}>Bumalik →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // ── MAIN STATE ─────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0FDFA" />

      {/* ── ACCEPTED MODAL ── */}
      <Modal visible={showModal} transparent animationType="none" statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalCard, { opacity: modalOpacity, transform: [{ scale: modalScale }] }]}>
            <View style={styles.modalIconWrap}>
              <Text style={styles.modalIcon}>🎉</Text>
            </View>
            <Text style={styles.modalTitle}>May Nag-accept!</Text>
            <Text style={styles.modalSub}>
              Si{' '}
              <Text style={{ fontWeight: '700', color: '#0F766E' }}>
                {acceptedData?.provider?.full_name || acceptedData?.provider?.name || 'Provider'}
              </Text>
              {' '}ay tatanggap ng iyong ride.
            </Text>

            <View style={styles.modalProviderRow}>
              <View style={styles.modalProviderAvatar}>
                <Text style={styles.modalProviderInitial}>
                  {(acceptedData?.provider?.full_name || acceptedData?.provider?.name || 'P')[0].toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalProviderName}>
                  {acceptedData?.provider?.full_name || acceptedData?.provider?.name || 'Provider'}
                </Text>
                {acceptedData?.provider?.phone && (
                  <Text style={styles.modalProviderPhone}>📱 {acceptedData.provider.phone}</Text>
                )}
              </View>
              <View style={styles.modalVehicleChip}>
                <Text style={styles.modalVehicleChipTxt}>{vehicleEmoji} {vehicleName}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.modalBtn} onPress={handleGoToProvider} activeOpacity={0.85}>
              <Text style={styles.modalBtnTxt}>Tingnan ang Provider →</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>

        {/* Vehicle + Searching */}
        <View style={styles.topSection}>
          <View style={styles.ringWrapper}>
            <Animated.View style={[styles.ring, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
            <Animated.View style={[styles.vehicleCircle, { transform: [{ scale: pulseAnim }] }]}>
              <Text style={styles.vehicleEmoji}>{vehicleEmoji || '🛺'}</Text>
            </Animated.View>
          </View>

          <Text style={styles.searchingTitle}>
            {status === 'booking' ? 'Inihahandog ang booking...' : `Naghahanap ng ${vehicleName}...`}
          </Text>
          <Text style={styles.searchingSubtitle}>
            {status === 'searching'
              ? `Hinahanap ang pinakamalapit na available na ${vehicleName} driver`
              : 'Pakihintay sandali'}
          </Text>

          {status === 'searching' && (
            <View style={styles.elapsedPill}>
              <Text style={styles.elapsedText}>⏱ {formatElapsed(elapsed)}</Text>
            </View>
          )}
        </View>

        {/* Dots loader */}
        {status === 'searching' && (
          <View style={styles.dotsRow}>
            {[0,1,2,3,4].map(i => <AnimDot key={i} delay={i * 150} color="#0F766E" />)}
          </View>
        )}

        {/* Route Summary */}
        <View style={styles.routeCard}>
          <View style={styles.vehicleRow}>
            <Text style={styles.vehicleRowEmoji}>{vehicleEmoji}</Text>
            <Text style={styles.vehicleRowName}>{vehicleName}</Text>
            <Text style={styles.vehicleRowFare}>₱{fare}</Text>
          </View>
          <View style={styles.routeDivider} />
          <View style={styles.routeItem}>
            <View style={[styles.routeDot, { backgroundColor: '#0F766E' }]} />
            <Text style={styles.routeText} numberOfLines={1}>{pickup}</Text>
          </View>
          <View style={styles.routeConnector} />
          <View style={styles.routeItem}>
            <View style={[styles.routeDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.routeText} numberOfLines={1}>{dropoff}</Text>
          </View>
        </View>

        {/* Tip */}
        <Animated.View style={[styles.tipCard, { opacity: tipFade }]}>
          <Text style={styles.tipText}>{TIPS[tipIndex]}</Text>
        </Animated.View>

        {/* Buttons — same as Image 3 */}
        <TouchableOpacity style={styles.homeBtnSolid} onPress={handleGoHome} activeOpacity={0.85}>
          <Text style={styles.homeBtnSolidTxt}>🏠  Bumalik sa Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.viewOrdersLink} onPress={handleViewOrders} activeOpacity={0.75}>
          <Text style={styles.viewOrdersLinkTxt}>Tingnan ang Aking Mga Orders →</Text>
        </TouchableOpacity>

      </Animated.View>
    </SafeAreaView>
  )
}

function AnimDot({ delay, color }) {
  const anim = useRef(new Animated.Value(0.3)).current
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1,   duration: 400, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [])
  return (
    <Animated.View style={{
      width: 8, height: 8, borderRadius: 4,
      backgroundColor: color, opacity: anim, marginHorizontal: 3,
    }} />
  )
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#F0FDFA' },
  container: {
    flex: 1, paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 32 : 16,
    justifyContent: 'center', gap: 20,
  },

  // ── Top section ──
  topSection:    { alignItems: 'center', gap: 12 },
  ringWrapper:   { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  ring:          { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: '#0F766E' },
  vehicleCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#CCFBF1',
    elevation: 6, shadowColor: '#0F766E', shadowOpacity: 0.15, shadowRadius: 10,
  },
  vehicleEmoji:       { fontSize: 44 },
  searchingTitle:     { fontSize: 20, fontWeight: '800', color: '#134E4A', textAlign: 'center' },
  searchingSubtitle:  { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20 },
  elapsedPill:        { backgroundColor: '#CCFBF1', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  elapsedText:        { fontSize: 12, fontWeight: '700', color: '#0F766E' },

  // ── Dots ──
  dotsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },

  // ── Route card ──
  routeCard:       { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#CCFBF1', padding: 16 },
  vehicleRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  vehicleRowEmoji: { fontSize: 20 },
  vehicleRowName:  { fontSize: 15, fontWeight: '700', color: '#134E4A', flex: 1 },
  vehicleRowFare:  { fontSize: 18, fontWeight: '800', color: '#0F766E' },
  routeDivider:    { height: 1, backgroundColor: '#F0FDFA', marginBottom: 12 },
  routeItem:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeDot:        { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  routeText:       { fontSize: 13, color: '#134E4A', fontWeight: '500', flex: 1 },
  routeConnector:  { width: 2, height: 10, backgroundColor: '#CCFBF1', marginLeft: 4, marginVertical: 3 },

  // ── Tip ──
  tipCard: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#CCFBF1', paddingVertical: 12, paddingHorizontal: 16 },
  tipText: { fontSize: 13, color: '#0F766E', fontWeight: '500', textAlign: 'center' },

  // ── Buttons (Image 3 style) ──
  homeBtnSolid: {
    width: '100%', backgroundColor: '#0F766E',
    borderRadius: 14, paddingVertical: 15, alignItems: 'center',
    shadowColor: '#0F766E', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  homeBtnSolidTxt:   { color: '#fff', fontSize: 15, fontWeight: '700' },
  viewOrdersLink:    { paddingVertical: 6, alignItems: 'center' },
  viewOrdersLinkTxt: { color: '#0F766E', fontSize: 13, fontWeight: '600' },

  // ── Modal ──
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 28,
  },
  modalCard: {
    width: '100%', backgroundColor: '#fff',
    borderRadius: 24, padding: 24, alignItems: 'center', gap: 12,
  },
  modalIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  modalIcon:          { fontSize: 36 },
  modalTitle:         { fontSize: 20, fontWeight: '800', color: '#134E4A' },
  modalSub:           { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20 },
  modalProviderRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', backgroundColor: '#F0FDFA', borderRadius: 14, padding: 14 },
  modalProviderAvatar:{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#0F766E', alignItems: 'center', justifyContent: 'center' },
  modalProviderInitial:{ fontSize: 18, fontWeight: '700', color: '#fff' },
  modalProviderName:  { fontSize: 14, fontWeight: '700', color: '#134E4A' },
  modalProviderPhone: { fontSize: 12, color: '#64748B', marginTop: 2 },
  modalVehicleChip:   { backgroundColor: '#CCFBF1', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  modalVehicleChipTxt:{ fontSize: 12, fontWeight: '700', color: '#0F766E' },
  modalBtn: {
    width: '100%', backgroundColor: '#0F766E',
    borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  modalBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // ── Error ──
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  errorEmoji:     { fontSize: 56, marginBottom: 8 },
  errorTitle:     { fontSize: 20, fontWeight: '700', color: '#134E4A' },
  errorDesc:      { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20 },
})