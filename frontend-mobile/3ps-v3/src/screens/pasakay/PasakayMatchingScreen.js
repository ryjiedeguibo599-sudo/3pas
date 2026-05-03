import React, { useEffect, useRef, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Animated, Easing,
  Modal, Alert, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { io } from 'socket.io-client'
import * as SecureStore from 'expo-secure-store'
import API from '../../services/api'
import { API_URL } from '../../services/api'
import { theme } from '../../theme/padulongTheme'

const C = {
  primary: theme.colors.primary,
  primaryLt: theme.colors.primarySoft,
  primaryMd: '#FFD4AE',
  text: theme.colors.text,
  textSub: theme.colors.textSub,
  textHint: theme.colors.textHint,
  border: theme.colors.border,
  bg: theme.colors.background,
  white: theme.colors.surface,
  green:     '#16A34A',
  red:       theme.colors.danger,
}

const TIPS = [
  'Tip: Always pay the correct fare to your rider. 🙏',
  'Tip: Rate your rider after the trip. ⭐',
  'Tip: Stay safe — wear your helmet! 🪖',
  'Tip: Confirm your pickup location before booking. 📍',
]

export default function PasakayMatchingScreen({ navigation, route }) {
  const {
    pickup, dropoff, pickupCoords, dropoffCoords,
    passengers, cargo, vehicleType, vehicleName, vehicleEmoji, fare, distanceKm
  } = route.params || {}

  const [status,      setStatus]      = useState('booking')
  const [rideId,      setRideId]      = useState(null)
  const [tipIndex,    setTipIndex]    = useState(0)
  const [elapsed,     setElapsed]     = useState(0)
  const [showModal,   setShowModal]   = useState(false)
  const [acceptedData, setAcceptedData] = useState(null)

  const socketRef   = useRef(null)
  const timerRef    = useRef(null)
  const tipTimer    = useRef(null)
  const pollingRef  = useRef(null)
  const mountedRef  = useRef(true)

  const pulseAnim   = useRef(new Animated.Value(1)).current
  const ringAnim    = useRef(new Animated.Value(0)).current
  const fadeAnim    = useRef(new Animated.Value(0)).current
  const tipFade     = useRef(new Animated.Value(1)).current
  const modalScale  = useRef(new Animated.Value(0.8)).current
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
      const token = await SecureStore.getItemAsync('token')
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

  const ringScale   = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] })
  const ringOpacity = ringAnim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.4, 0.1, 0] })
  const formatElapsed = (s) => { const m = Math.floor(s / 60); return m > 0 ? `${m}m ${s % 60}s` : `${s}s` }

  if (status === 'error') {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.errorContainer}>
          <Text style={s.errorEmoji}>😔</Text>
          <Text style={s.errorTitle}>Something went wrong</Text>
          <Text style={s.errorDesc}>We couldn't book your ride. Please try again.</Text>
          <TouchableOpacity style={s.primaryBtn} onPress={bookRide}>
            <Text style={s.primaryBtnTxt}>🔄  Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.linkBtn} onPress={() => navigation.goBack()}>
            <Text style={s.linkBtnTxt}>Go Back →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Accepted Modal */}
      <Modal visible={showModal} transparent animationType="none" statusBarTranslucent>
        <View style={s.modalOverlay}>
          <Animated.View style={[s.modalCard, { opacity: modalOpacity, transform: [{ scale: modalScale }] }]}>
            <View style={s.modalIconWrap}>
              <Text style={{ fontSize: 36 }}>🎉</Text>
            </View>
            <Text style={s.modalTitle}>Driver Found!</Text>
            <Text style={s.modalSub}>
              <Text style={{ fontWeight: '700', color: C.primary }}>
                {acceptedData?.provider?.full_name || acceptedData?.provider?.name || 'Provider'}
              </Text>
              {' '}has accepted your ride.
            </Text>

            <View style={s.modalProviderRow}>
              <View style={s.modalAvatar}>
                <Text style={s.modalAvatarTxt}>
                  {(acceptedData?.provider?.full_name || acceptedData?.provider?.name || 'P')[0].toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.modalProviderName}>
                  {acceptedData?.provider?.full_name || acceptedData?.provider?.name || 'Provider'}
                </Text>
                {acceptedData?.provider?.phone && (
                  <Text style={s.modalProviderPhone}>📱 {acceptedData.provider.phone}</Text>
                )}
              </View>
              <View style={s.modalVehicleChip}>
                <Text style={s.modalVehicleChipTxt}>{vehicleEmoji} {vehicleName}</Text>
              </View>
            </View>

            <TouchableOpacity style={s.primaryBtn} onPress={handleGoToProvider} activeOpacity={0.85}>
              <Text style={s.primaryBtnTxt}>Track Driver →</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      <Animated.View style={[s.container, { opacity: fadeAnim }]}>

        {/* Animated vehicle */}
        <View style={s.topSection}>
          <View style={s.ringWrapper}>
            <Animated.View style={[s.ring, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
            <Animated.View style={[s.vehicleCircle, { transform: [{ scale: pulseAnim }] }]}>
              <Text style={s.vehicleEmoji}>{vehicleEmoji || '🛺'}</Text>
            </Animated.View>
          </View>

          <Text style={s.searchingTitle}>
            {status === 'booking' ? 'Submitting booking...' : `Looking for a ${vehicleName}...`}
          </Text>
          <Text style={s.searchingSub}>
            {status === 'searching'
              ? `Finding the nearest available ${vehicleName} driver`
              : 'Please wait a moment'}
          </Text>

          {status === 'searching' && (
            <View style={s.elapsedPill}>
              <Text style={s.elapsedText}>⏱ {formatElapsed(elapsed)}</Text>
            </View>
          )}
        </View>

        {/* Dot loader */}
        {status === 'searching' && (
          <View style={s.dotsRow}>
            {[0,1,2,3,4].map(i => <AnimDot key={i} delay={i * 150} color={C.primary} />)}
          </View>
        )}

        {/* Route card */}
        <View style={s.routeCard}>
          <View style={s.vehicleRow}>
            <Text style={s.vehicleRowEmoji}>{vehicleEmoji}</Text>
            <Text style={s.vehicleRowName}>{vehicleName}</Text>
            <Text style={s.vehicleRowFare}>₱{fare}</Text>
          </View>
          <View style={s.routeDivider} />
          <View style={s.routeItem}>
            <View style={[s.routeDot, { backgroundColor: C.green }]} />
            <Text style={s.routeText} numberOfLines={1}>{pickup}</Text>
          </View>
          <View style={s.routeConnector} />
          <View style={s.routeItem}>
            <View style={[s.routeDot, { backgroundColor: C.red }]} />
            <Text style={s.routeText} numberOfLines={1}>{dropoff}</Text>
          </View>
        </View>

        {/* Rotating tip */}
        <Animated.View style={[s.tipCard, { opacity: tipFade }]}>
          <Text style={s.tipText}>{TIPS[tipIndex]}</Text>
        </Animated.View>

        <TouchableOpacity style={s.primaryBtn} onPress={() => navigation.navigate('Home')} activeOpacity={0.85}>
          <Text style={s.primaryBtnTxt}>🏠  Back to Home</Text>
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
    <Animated.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, opacity: anim, marginHorizontal: 3 }} />
  )
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 16 : 8, justifyContent: 'center', gap: 20 },

  topSection:    { alignItems: 'center', gap: 12 },
  ringWrapper:   { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  ring:          { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: C.primary },
  vehicleCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.primaryMd, elevation: 6, shadowColor: C.primary, shadowOpacity: 0.15, shadowRadius: 10 },
  vehicleEmoji:  { fontSize: 44 },
  searchingTitle:{ fontSize: 20, fontWeight: '800', color: C.text, textAlign: 'center' },
  searchingSub:  { fontSize: 13, color: C.textSub, textAlign: 'center', lineHeight: 20 },
  elapsedPill:   { backgroundColor: C.primaryLt, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, borderWidth: 0.5, borderColor: C.primaryMd },
  elapsedText:   { fontSize: 12, fontWeight: '700', color: C.primary },

  dotsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },

  routeCard:       { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16 },
  vehicleRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  vehicleRowEmoji: { fontSize: 20 },
  vehicleRowName:  { fontSize: 15, fontWeight: '700', color: C.text, flex: 1 },
  vehicleRowFare:  { fontSize: 18, fontWeight: '800', color: C.primary },
  routeDivider:    { height: 1, backgroundColor: C.border, marginBottom: 12 },
  routeItem:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeDot:        { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  routeText:       { fontSize: 13, color: C.text, fontWeight: '500', flex: 1 },
  routeConnector:  { width: 2, height: 10, backgroundColor: C.border, marginLeft: 4, marginVertical: 3 },

  tipCard: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingVertical: 12, paddingHorizontal: 16 },
  tipText: { fontSize: 13, color: C.primary, fontWeight: '500', textAlign: 'center' },

  primaryBtn:    { width: '100%', backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  primaryBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  modalCard:     { width: '100%', backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center', gap: 12 },
  modalIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.primaryLt, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  modalTitle:    { fontSize: 20, fontWeight: '800', color: C.text },
  modalSub:      { fontSize: 13, color: C.textSub, textAlign: 'center', lineHeight: 20 },
  modalProviderRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', backgroundColor: C.primaryLt, borderRadius: 14, padding: 14 },
  modalAvatar:       { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  modalAvatarTxt:    { fontSize: 18, fontWeight: '700', color: '#fff' },
  modalProviderName: { fontSize: 14, fontWeight: '700', color: C.text },
  modalProviderPhone:{ fontSize: 12, color: C.textSub, marginTop: 2 },
  modalVehicleChip:  { backgroundColor: C.primaryMd, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  modalVehicleChipTxt: { fontSize: 12, fontWeight: '700', color: C.primary },

  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  errorEmoji:     { fontSize: 56, marginBottom: 8 },
  errorTitle:     { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  errorDesc:      { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20 },
})
