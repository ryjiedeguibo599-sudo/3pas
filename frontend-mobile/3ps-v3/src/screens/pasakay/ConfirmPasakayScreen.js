import React, { useState, useRef } from 'react'
import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, Animated, PanResponder,
  TouchableOpacity, Platform, Dimensions,
  Alert, ActivityIndicator
} from 'react-native'
import API from '../../services/api'

const { width: SCREEN_W } = Dimensions.get('window')
const SLIDER_W  = SCREEN_W - 64
const THUMB_W   = 56
const MAX_SLIDE = SLIDER_W - THUMB_W - 4
const GREEN = '#16a34a'
const RED   = '#ef4444'

export default function ConfirmPasakayScreen({ navigation, route }) {
  const { pickup, dropoff, fare, distanceKm, pickupCoords, dropoffCoords } = route.params || {}
  const [loading, setLoading]     = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const slideX                    = useRef(new Animated.Value(0)).current
  const slideProgress             = useRef(0)

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder:  () => true,
    onPanResponderMove: (_, { dx }) => {
      const clamped = Math.max(0, Math.min(dx, MAX_SLIDE))
      slideX.setValue(clamped)
      slideProgress.current = clamped / MAX_SLIDE
    },
    onPanResponderRelease: () => {
      if (slideProgress.current >= 0.85) {
        Animated.timing(slideX, { toValue: MAX_SLIDE, duration: 120, useNativeDriver: false }).start(() => handleConfirm())
      } else {
        Animated.spring(slideX, { toValue: 0, useNativeDriver: false, friction: 6 }).start()
        slideProgress.current = 0
      }
    },
  })).current

  const sliderBg     = slideX.interpolate({ inputRange: [0, MAX_SLIDE], outputRange: ['#16a34a', '#10b981'], extrapolate: 'clamp' })
  const thumbOpacity = slideX.interpolate({ inputRange: [MAX_SLIDE * 0.85, MAX_SLIDE], outputRange: [1, 0], extrapolate: 'clamp' })
  const textOpacity  = slideX.interpolate({ inputRange: [0, MAX_SLIDE * 0.4], outputRange: [1, 0], extrapolate: 'clamp' })

  const handleConfirm = async () => {
    if (confirmed) return
    setConfirmed(true)
    try {
      setLoading(true)
      const res = await API.post('/pasakay/book', {
        pickup_location:  pickup,
        dropoff_location: dropoff,
        pickup_lat:       pickupCoords?.latitude,
        pickup_lng:       pickupCoords?.longitude,
        dropoff_lat:      dropoffCoords?.latitude,
        dropoff_lng:      dropoffCoords?.longitude,
        fare:             fare,
      })
      navigation.replace('WaitingPasakay', {
        pickup, dropoff, fare, distanceKm,
        rideId: res.data.ride?.id,
      })
    } catch (err) {
      console.log('Book ride error:', err?.response?.data)
      Alert.alert('Error', 'Hindi na-book ang ride. Try again.')
      setConfirmed(false)
      Animated.spring(slideX, { toValue: 0, useNativeDriver: false }).start()
      slideProgress.current = 0
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>I-confirm ang Ride</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.iconRow}>
          <View style={styles.iconCircle}>
            <Text style={{ fontSize: 36 }}>🛵</Text>
          </View>
          <Text style={styles.iconLabel}>Pasakay Booking</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryHeaderText}>📋 Detalye ng Ride</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <View style={[styles.dotIndicator, { backgroundColor: GREEN }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>PICKUP</Text>
              <Text style={styles.detailValue}>{pickup || '—'}</Text>
            </View>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.detailRow}>
            <View style={[styles.dotIndicator, { backgroundColor: RED }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>DROPOFF</Text>
              <Text style={styles.detailValue}>{dropoff || '—'}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>📏</Text>
              <Text style={styles.infoLabel}>Distansya</Text>
              <Text style={styles.infoValue}>{distanceKm ? `${distanceKm.toFixed(1)} km` : '—'}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>⏱️</Text>
              <Text style={styles.infoLabel}>ETA</Text>
              <Text style={styles.infoValue}>10–15 min</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>💰</Text>
              <Text style={styles.infoLabel}>Fare</Text>
              <Text style={[styles.infoValue, { color: GREEN, fontSize: 18 }]}>₱{fare}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoCardRow}>
            <Text style={styles.infoCardIcon}>💳</Text>
            <Text style={styles.infoCardText}>Bayaran pagkatapos ng ride — Cash o GCash</Text>
          </View>
          <View style={styles.infoCardRow}>
            <Text style={styles.infoCardIcon}>⭐</Text>
            <Text style={styles.infoCardText}>I-rate ang rider pagkatapos ng serbisyo</Text>
          </View>
          <View style={styles.infoCardRow}>
            <Text style={styles.infoCardIcon}>🛡️</Text>
            <Text style={styles.infoCardText}>Ligtas at insured ang bawat biyahe</Text>
          </View>
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.sliderWrapper}>
        <Text style={styles.sliderHint}>I-slide para kumpirmahin ang booking</Text>
        <View style={styles.sliderTrack}>
          <Animated.View style={[styles.sliderFill, { width: Animated.add(slideX, THUMB_W + 4), backgroundColor: sliderBg }]} />
          <Animated.Text style={[styles.sliderText, { opacity: textOpacity }]}>Slide para i-confirm →</Animated.Text>
          <Animated.View style={[styles.sliderThumb, { transform: [{ translateX: slideX }] }]} {...panResponder.panHandlers}>
            <Animated.Text style={[{ fontSize: 22, color: GREEN }, { opacity: thumbOpacity }]}>{loading ? '' : '›'}</Animated.Text>
            {loading && <ActivityIndicator size="small" color={GREEN} />}
          </Animated.View>
          <Animated.Text style={[styles.checkmark, { opacity: slideX.interpolate({ inputRange: [MAX_SLIDE * 0.85, MAX_SLIDE], outputRange: [0, 1], extrapolate: 'clamp' }) }]}>✓</Animated.Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: '#f8fafc' },
  container:         { flex: 1 },
  header:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 48 : 12, paddingBottom: 14, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' },
  backBtn:           { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  backIcon:          { fontSize: 22, color: GREEN, fontWeight: '600', lineHeight: 28 },
  headerTitle:       { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  iconRow:           { alignItems: 'center', paddingVertical: 24 },
  iconCircle:        { width: 80, height: 80, borderRadius: 20, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#bbf7d0', marginBottom: 8 },
  iconLabel:         { fontSize: 14, fontWeight: '600', color: '#64748b' },
  summaryCard:       { backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 16, borderWidth: 0.5, borderColor: '#e2e8f0', overflow: 'hidden' },
  summaryHeader:     { padding: 14 },
  summaryHeaderText: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  divider:           { height: 0.5, backgroundColor: '#f1f5f9', marginHorizontal: 16 },
  detailRow:         { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  dotIndicator:      { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  detailLabel:       { fontSize: 10, color: '#94a3b8', fontWeight: '700', letterSpacing: 0.8, marginBottom: 2 },
  detailValue:       { fontSize: 13, color: '#0f172a', fontWeight: '500', lineHeight: 18 },
  routeLine:         { width: 1.5, height: 12, backgroundColor: '#e2e8f0', marginLeft: 22 },
  infoRow:           { flexDirection: 'row', paddingVertical: 14 },
  infoItem:          { flex: 1, alignItems: 'center', gap: 4 },
  infoIcon:          { fontSize: 18 },
  infoLabel:         { fontSize: 10, color: '#94a3b8', fontWeight: '600', letterSpacing: 0.5 },
  infoValue:         { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  infoDivider:       { width: 0.5, backgroundColor: '#e2e8f0' },
  infoCard:          { backgroundColor: '#f0fdf4', borderRadius: 16, marginHorizontal: 16, marginTop: 14, padding: 14, borderWidth: 0.5, borderColor: '#bbf7d0' },
  infoCardRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  infoCardIcon:      { fontSize: 14, lineHeight: 20 },
  infoCardText:      { flex: 1, fontSize: 12, color: '#166534', lineHeight: 18 },
  sliderWrapper:     { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', paddingHorizontal: 32, paddingTop: 16, paddingBottom: Platform.OS === 'android' ? 20 : 32, borderTopWidth: 0.5, borderTopColor: '#e2e8f0' },
  sliderHint:        { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginBottom: 10 },
  sliderTrack:       { height: 60, backgroundColor: '#e2e8f0', borderRadius: 30, overflow: 'hidden', justifyContent: 'center', position: 'relative' },
  sliderFill:        { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 30 },
  sliderText:        { position: 'absolute', alignSelf: 'center', fontSize: 14, fontWeight: '600', color: '#fff', letterSpacing: 0.3 },
  sliderThumb:       { position: 'absolute', left: 2, width: THUMB_W, height: 56, borderRadius: 28, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 },
  checkmark:         { position: 'absolute', right: 20, fontSize: 22, color: '#fff', fontWeight: '700' },
})