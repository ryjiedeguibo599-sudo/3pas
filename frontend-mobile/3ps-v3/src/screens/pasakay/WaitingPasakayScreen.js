import React, { useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet,
  TouchableOpacity, Platform, Animated, Easing
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const C = {
  primary:   '#2563EB',
  primaryLt: '#EFF6FF',
  text:      '#0F172A',
  textSub:   '#64748B',
  border:    '#E2E8F0',
  bg:        '#F8FAFF',
  white:     '#FFFFFF',
}

export default function WaitingPasakayScreen({ navigation, route }) {
  const { pickup, dropoff, fare, distanceKm, rideId } = route.params || {}

  const checkScale     = useRef(new Animated.Value(0)).current
  const checkOpacity   = useRef(new Animated.Value(0)).current
  const titleY         = useRef(new Animated.Value(20)).current
  const titleOpacity   = useRef(new Animated.Value(0)).current
  const cardY          = useRef(new Animated.Value(30)).current
  const cardOpacity    = useRef(new Animated.Value(0)).current
  const scooterX       = useRef(new Animated.Value(-60)).current
  const scooterOpacity = useRef(new Animated.Value(0)).current
  const dot1Opacity    = useRef(new Animated.Value(0.3)).current
  const dot2Opacity    = useRef(new Animated.Value(0.3)).current
  const dot3Opacity    = useRef(new Animated.Value(0.3)).current
  const pulseScale     = useRef(new Animated.Value(1)).current

  const [rideNum] = useState(rideId || Math.floor(Math.random() * 900) + 100)

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(checkScale,   { toValue: 1, friction: 5, useNativeDriver: true }),
        Animated.timing(checkOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(titleY,       { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(titleOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardY,        { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.timing(cardOpacity,  { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(scooterX,       { toValue: 0, friction: 6, useNativeDriver: true }),
        Animated.timing(scooterOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
    ]).start()

    const dotLoop = () => {
      Animated.sequence([
        Animated.timing(dot1Opacity, { toValue: 1,   duration: 400, useNativeDriver: true }),
        Animated.timing(dot2Opacity, { toValue: 1,   duration: 400, useNativeDriver: true }),
        Animated.timing(dot3Opacity, { toValue: 1,   duration: 400, useNativeDriver: true }),
        Animated.delay(300),
        Animated.parallel([
          Animated.timing(dot1Opacity, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.timing(dot2Opacity, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.timing(dot3Opacity, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        ]),
      ]).start(() => dotLoop())
    }
    const dotTimer = setTimeout(dotLoop, 1200)

    const pulseLoop = () => {
      Animated.sequence([
        Animated.timing(pulseScale, { toValue: 1.06, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseScale, { toValue: 1,    duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]).start(() => pulseLoop())
    }
    const pulseTimer = setTimeout(pulseLoop, 800)

    const bounceLoop = () => {
      Animated.sequence([
        Animated.timing(scooterX, { toValue: 6,  duration: 300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scooterX, { toValue: -6, duration: 300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]).start(() => bounceLoop())
    }
    const bounceTimer = setTimeout(bounceLoop, 1500)

    return () => {
      clearTimeout(dotTimer)
      clearTimeout(pulseTimer)
      clearTimeout(bounceTimer)
    }
  }, [])

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        <Animated.View style={[
          styles.checkWrapper,
          { opacity: checkOpacity, transform: [{ scale: Animated.multiply(checkScale, pulseScale) }] }
        ]}>
          <View style={styles.checkCircle}>
            <Text style={styles.checkText}>✓</Text>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: titleOpacity, transform: [{ translateY: titleY }], alignItems: 'center' }}>
          <Text style={styles.title}>Ride Booked!</Text>
          <Text style={styles.rideNum}>Booking #{rideNum}</Text>
        </Animated.View>

        <Animated.View style={[styles.detailCard, { opacity: cardOpacity, transform: [{ translateY: cardY }] }]}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailHeaderIcon}>🗺️</Text>
            <Text style={styles.detailHeaderText}>Trip Details</Text>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.routeContainer}>
            <View style={styles.routeRow}>
              <View style={[styles.routeDot, { backgroundColor: C.primary }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.routeLabel}>PICKUP</Text>
                <Text style={styles.routeValue} numberOfLines={2}>{pickup || '—'}</Text>
              </View>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routeRow}>
              <View style={[styles.routeDot, { backgroundColor: '#ef4444' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.routeLabel}>DROPOFF</Text>
                <Text style={styles.routeValue} numberOfLines={2}>{dropoff || '—'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>📏</Text>
              <Text style={styles.statValue}>{distanceKm ? `${distanceKm.toFixed(1)} km` : '—'}</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>⏱️</Text>
              <Text style={styles.statValue}>10–15 min</Text>
              <Text style={styles.statLabel}>ETA</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>💰</Text>
              <Text style={[styles.statValue, { color: C.primary }]}>₱{fare}</Text>
              <Text style={styles.statLabel}>Fare</Text>
            </View>
          </View>

          <View style={styles.detailDivider} />

          <View style={[styles.statsRow, { paddingVertical: 10 }]}>
            <Text style={styles.paymentNote}>💳 Pay after ride · Cash or GCash</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.waitCard, { opacity: cardOpacity, transform: [{ translateY: cardY }] }]}>
          <Animated.Text style={[styles.scooterEmoji, { opacity: scooterOpacity, transform: [{ translateX: scooterX }] }]}>
            🛵
          </Animated.Text>
          <Text style={styles.waitTitle}>Waiting for a Rider...</Text>
          <Text style={styles.waitDesc}>
            A rider will find you at your pickup point.{'\n'}
            Arriving in{' '}
            <Text style={{ fontWeight: '700', color: C.primary }}>10–15 minutes</Text>.
          </Text>
          <View style={styles.dotsRow}>
            <Animated.View style={[styles.dot, { opacity: dot1Opacity, backgroundColor: C.primary }]} />
            <Animated.View style={[styles.dot, { opacity: dot2Opacity, backgroundColor: C.primary }]} />
            <Animated.View style={[styles.dot, { opacity: dot3Opacity, backgroundColor: C.primary }]} />
          </View>
        </Animated.View>

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.85}
        >
          <Text style={styles.homeBtnIcon}>🏠</Text>
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.viewBtn}
          onPress={() => navigation.navigate('MyRides')}
          activeOpacity={0.8}
        >
          <Text style={styles.viewBtnText}>View My Rides →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.homeBtn, { backgroundColor: '#10B981', marginTop: -5 }]}
          onPress={() => navigation.navigate('ResidentLiveMap', { rideId: rideNum })}
          activeOpacity={0.85}
        >
          <Text style={styles.homeBtnIcon}>📍</Text>
          <Text style={styles.homeBtnText}>Track Provider on Map</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.homeBtn, { backgroundColor: '#3B82F6', marginTop: 10 }]}
          onPress={() => navigation.navigate('ChatScreen', { serviceType: 'pasakay', serviceId: rideNum, receiverId: null, title: 'Chat with Provider' })}
          activeOpacity={0.85}
        >
          <Text style={styles.homeBtnIcon}>💬</Text>
          <Text style={styles.homeBtnText}>Chat with Provider</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, gap: 14, paddingTop: Platform.OS === 'android' ? 32 : 0 },

  checkWrapper: { marginBottom: 4 },
  checkCircle:  { width: 80, height: 80, borderRadius: 20, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  checkText:    { fontSize: 40, color: '#fff', fontWeight: '700', lineHeight: 50 },

  title:   { fontSize: 24, fontWeight: '800', color: C.primary, textAlign: 'center', marginBottom: 2 },
  rideNum: { fontSize: 13, color: '#64748b', textAlign: 'center' },

  detailCard:       { width: '100%', backgroundColor: '#fff', borderRadius: 16, borderWidth: 0.5, borderColor: '#e2e8f0', overflow: 'hidden' },
  detailHeader:     { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14 },
  detailHeaderIcon: { fontSize: 16 },
  detailHeaderText: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  detailDivider:    { height: 0.5, backgroundColor: '#f1f5f9' },

  routeContainer: { paddingHorizontal: 16, paddingVertical: 10 },
  routeRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  routeDot:       { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  routeLabel:     { fontSize: 9, color: '#94a3b8', fontWeight: '700', letterSpacing: 0.8 },
  routeValue:     { fontSize: 12, color: '#0f172a', fontWeight: '500', lineHeight: 16 },
  routeLine:      { width: 1.5, height: 10, backgroundColor: '#e2e8f0', marginLeft: 4, marginVertical: 2 },

  statsRow:    { flexDirection: 'row', paddingVertical: 12 },
  statItem:    { flex: 1, alignItems: 'center', gap: 2 },
  statIcon:    { fontSize: 16 },
  statValue:   { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  statLabel:   { fontSize: 10, color: '#94a3b8', fontWeight: '600' },
  statDivider: { width: 0.5, backgroundColor: '#e2e8f0' },
  paymentNote: { flex: 1, textAlign: 'center', fontSize: 12, color: '#64748b' },

  waitCard:     { width: '100%', backgroundColor: '#fff', borderRadius: 16, borderWidth: 0.5, borderColor: '#e2e8f0', padding: 20, alignItems: 'center', gap: 6 },
  scooterEmoji: { fontSize: 48, marginBottom: 4 },
  waitTitle:    { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  waitDesc:     { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20 },
  dotsRow:      { flexDirection: 'row', gap: 8, marginTop: 6 },
  dot:          { width: 10, height: 10, borderRadius: 5 },

  homeBtn:     { width: '100%', backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  homeBtnIcon: { fontSize: 18 },
  homeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  viewBtn:     { paddingVertical: 8 },
  viewBtnText: { fontSize: 13, color: C.primary, fontWeight: '600' },
})
