import React, { useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions
} from 'react-native'

const { height } = Dimensions.get('window')

export default function BookingConfirmationScreen({ route, navigation }) {
  const { fare, pickup, dropoff, rideId } = route.params || {}

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 600, useNativeDriver: true
      }),
      Animated.spring(slideAnim, {
        toValue: 0, tension: 50, friction: 8, useNativeDriver: true
      })
    ]).start()
  }, [])

  return (
    <View style={styles.container}>

      {/* TOP SECTION */}
      <Animated.View style={[styles.topSection, { opacity: fadeAnim }]}>
        <Text style={styles.checkEmoji}>✅</Text>
        <Text style={styles.thankYou}>Salamat sa iyong booking!</Text>
        <Text style={styles.subTitle}>Ride #{rideId}</Text>
      </Animated.View>

      {/* DETAILS CARD */}
      <Animated.View style={[
        styles.card,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}>
        <Text style={styles.cardTitle}>📋 Detalye ng Ride</Text>

        <View style={styles.row}>
          <Text style={styles.label}>📍 Pickup</Text>
          <Text style={styles.value} numberOfLines={2}>{pickup}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>🚩 Dropoff</Text>
          <Text style={styles.value} numberOfLines={2}>{dropoff}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>💰 Fare</Text>
          <Text style={styles.fareValue}>₱{fare}</Text>
        </View>
      </Animated.View>

      {/* WAITING SECTION */}
      <Animated.View style={[styles.waitingCard, { opacity: fadeAnim }]}>
        <Text style={styles.waitingEmoji}>🛵</Text>
        <Text style={styles.waitingTitle}>Naghihintay ng Driver...</Text>
        <Text style={styles.waitingDesc}>
          Mangyaring manatili sa inyong pickup location.{'\n'}
          Makakarating ang driver sa loob ng 10-15 minuto.
        </Text>

        {/* Animated dots */}
        <View style={styles.dotsRow}>
          <LoadingDot delay={0} />
          <LoadingDot delay={200} />
          <LoadingDot delay={400} />
        </View>
      </Animated.View>

      {/* BACK TO HOME */}
      <TouchableOpacity
        style={styles.homeBtn}
        onPress={() => navigation.replace('Home')}
      >
        <Text style={styles.homeBtnText}>🏠 Bumalik sa Home</Text>
      </TouchableOpacity>

    </View>
  )
}

// Animated loading dot
function LoadingDot({ delay }) {
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  return (
    <Animated.View style={[styles.dot, { opacity: anim }]} />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#F0FDF4',
    paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40
  },

  topSection: { alignItems: 'center', marginBottom: 28 },
  checkEmoji: { fontSize: 72, marginBottom: 12 },
  thankYou: { fontSize: 26, fontWeight: 'bold', color: '#15803D', textAlign: 'center' },
  subTitle: { fontSize: 14, color: '#64748B', marginTop: 6 },

  card: {
    backgroundColor: '#fff', borderRadius: 16,
    padding: 20, marginBottom: 20,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8
  },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginBottom: 16, letterSpacing: 0.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  label: { fontSize: 13, color: '#64748B', fontWeight: '600', width: 80 },
  value: { fontSize: 13, color: '#1e293b', flex: 1, textAlign: 'right' },
  fareValue: { fontSize: 20, fontWeight: 'bold', color: '#16A34A' },
  divider: { borderTopWidth: 1, borderTopColor: '#F1F5F9', marginVertical: 12 },

  waitingCard: {
    backgroundColor: '#fff', borderRadius: 16,
    padding: 24, alignItems: 'center', marginBottom: 24,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8
  },
  waitingEmoji: { fontSize: 48, marginBottom: 12 },
  waitingTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  waitingDesc: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20 },

  dotsRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#16A34A' },

  homeBtn: {
    backgroundColor: '#16A34A', borderRadius: 14,
    paddingVertical: 15, alignItems: 'center'
  },
  homeBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
})