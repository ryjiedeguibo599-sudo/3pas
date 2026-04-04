import React, { useState, useRef } from 'react'
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  Animated, PanResponder, TouchableOpacity,
  Platform, Dimensions, Alert, ActivityIndicator
} from 'react-native'
import API from '../../services/api'

const { width: SCREEN_W } = Dimensions.get('window')
const SLIDER_W  = SCREEN_W - 64
const THUMB_W   = 56
const MAX_SLIDE = SLIDER_W - THUMB_W - 4

const GREEN    = '#059669'
const GREEN_BG = '#ecfdf5'

export default function ConfirmPasaBUYScreen({ navigation, route }) {
  const { trip, items = [], note } = route.params || {}

  const [loading, setLoading]     = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const slideX                    = useRef(new Animated.Value(0)).current
  const slideProgress             = useRef(0)

  const panResponder = useRef(
    PanResponder.create({
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
    })
  ).current

  const sliderBg     = slideX.interpolate({ inputRange: [0, MAX_SLIDE], outputRange: ['#2563eb', GREEN], extrapolate: 'clamp' })
  const thumbOpacity = slideX.interpolate({ inputRange: [MAX_SLIDE * 0.85, MAX_SLIDE], outputRange: [1, 0], extrapolate: 'clamp' })
  const textOpacity  = slideX.interpolate({ inputRange: [0, MAX_SLIDE * 0.4], outputRange: [1, 0], extrapolate: 'clamp' })

  const resetSlider = () => {
    setConfirmed(false)
    setLoading(false)
    Animated.spring(slideX, { toValue: 0, useNativeDriver: false }).start()
    slideProgress.current = 0
  }

  const handleConfirm = async () => {
    if (confirmed) return
    setConfirmed(true)
    try {
      setLoading(true)

      const payload = {
        trip_id:      trip?.id,
        total_amount: 0,
        items: items.map(i => ({
          item_name: i.name,
          quantity:  parseInt(i.qty) || 1,
          price:     0,
        })),
        note: note || '',
      }

      console.log('=== PasaBUY Payload ===', JSON.stringify(payload, null, 2))

      const res = await API.post('/pasabuy/orders', payload)

      console.log('=== PasaBUY Response ===', JSON.stringify(res.data, null, 2))

      navigation.replace('WaitingPasaBUY', { trip, items, note })

    } catch (err) {
      const status  = err?.response?.status
      const message = err?.response?.data?.message
                   || err?.response?.data?.error
                   || err?.message
                   || 'Unknown error'

      console.log('=== PasaBUY ERROR ===')
      console.log('Status:', status)
      console.log('Message:', message)
      console.log('Response data:', JSON.stringify(err?.response?.data, null, 2))

      Alert.alert(
        `Error ${status ? `(${status})` : ''}`,
        `Hindi na-send ang order.\n\n${message}`,
        [{ text: 'OK', onPress: resetSlider }]
      )
    }
  }

  const TRIP_ICONS = { 'Palengke': '🛒', 'Burgeran': '🍔', 'Botika': '💊', 'Merkado': '🥬', 'Tindahan': '🏪' }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>I-confirm ang Order</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.tripCard}>
          <View style={styles.tripCardLeft}>
            <Text style={styles.tripIcon}>{TRIP_ICONS[trip?.destination] || '🏪'}</Text>
            <View>
              <Text style={styles.tripDest}>{trip?.destination}</Text>
              <Text style={styles.tripMeta}>🕐 {trip?.departure_time}  •  👤 {trip?.rider_name}</Text>
            </View>
          </View>
          <View style={styles.openBadge}>
            <Text style={styles.openBadgeText}>Bukas</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryHeaderIcon}>📦</Text>
            <Text style={styles.summaryHeaderText}>Mga Ipapasabuy</Text>
          </View>
          <View style={styles.divider} />
          {items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemBullet}>•</Text>
              <Text style={styles.itemName}>{item.name}</Text>
              {item.qty ? <Text style={styles.itemQty}>{item.qty} pcs</Text> : null}
            </View>
          ))}
          {note ? (
            <>
              <View style={styles.divider} />
              <View style={styles.noteRow}>
                <Text style={styles.noteLabel}>📝 Tagubilin:</Text>
                <Text style={styles.noteText}>{note}</Text>
              </View>
            </>
          ) : null}
        </View>

        <View style={styles.codCard}>
          <View style={styles.codRow}>
            <Text style={styles.codIcon}>💳</Text>
            <View>
              <Text style={styles.codLabel}>Paraan ng Bayad</Text>
              <Text style={styles.codValue}>Cash on Delivery</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.codRow}>
            <Text style={styles.codIcon}>⏱️</Text>
            <View>
              <Text style={styles.codLabel}>Oras ng Pag-alis</Text>
              <Text style={styles.codValue}>{trip?.departure_time}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.sliderWrapper}>
        <Text style={styles.sliderHint}>I-slide para kumpirmahin ang order</Text>
        <View style={styles.sliderTrack}>
          <Animated.View style={[styles.sliderFill, { width: Animated.add(slideX, THUMB_W + 4), backgroundColor: sliderBg }]} />
          <Animated.Text style={[styles.sliderText, { opacity: textOpacity }]}>
            Slide para i-confirm →
          </Animated.Text>
          <Animated.View
            style={[styles.sliderThumb, { transform: [{ translateX: slideX }] }]}
            {...panResponder.panHandlers}
          >
            {loading
              ? <ActivityIndicator size="small" color={GREEN} />
              : <Animated.Text style={[{ fontSize: 22, color: GREEN }, { opacity: thumbOpacity }]}>›</Animated.Text>
            }
          </Animated.View>
          <Animated.Text style={[styles.checkmark, {
            opacity: slideX.interpolate({ inputRange: [MAX_SLIDE * 0.85, MAX_SLIDE], outputRange: [0, 1], extrapolate: 'clamp' })
          }]}>✓</Animated.Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: '#f0fdf8' },
  container:         { flex: 1 },
  header:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 48 : 12, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#d1fae5' },
  backBtn:           { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' },
  backIcon:          { fontSize: 22, color: GREEN, fontWeight: '600', lineHeight: 28 },
  headerTitle:       { fontSize: 16, fontWeight: '700', color: '#064e3b' },
  tripCard:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 16, marginTop: 16, padding: 14, borderWidth: 0.5, borderColor: '#d1fae5' },
  tripCardLeft:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tripIcon:          { fontSize: 32 },
  tripDest:          { fontSize: 16, fontWeight: '700', color: '#064e3b', marginBottom: 3 },
  tripMeta:          { fontSize: 11, color: '#64748b' },
  openBadge:         { backgroundColor: '#dcfce7', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  openBadgeText:     { color: GREEN, fontWeight: '700', fontSize: 12 },
  summaryCard:       { backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 16, marginTop: 12, borderWidth: 0.5, borderColor: '#d1fae5', overflow: 'hidden' },
  summaryHeader:     { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14 },
  summaryHeaderIcon: { fontSize: 16 },
  summaryHeaderText: { fontSize: 14, fontWeight: '700', color: '#064e3b' },
  divider:           { height: 0.5, backgroundColor: '#f0fdf4', marginHorizontal: 14 },
  itemRow:           { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10 },
  itemBullet:        { color: GREEN, fontWeight: '700', fontSize: 16 },
  itemName:          { flex: 1, fontSize: 14, color: '#0f172a', fontWeight: '500' },
  itemQty:           { fontSize: 13, color: '#64748b', fontWeight: '600' },
  noteRow:           { padding: 14 },
  noteLabel:         { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 4 },
  noteText:          { fontSize: 13, color: '#0f172a', lineHeight: 18 },
  codCard:           { backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 16, marginTop: 12, borderWidth: 0.5, borderColor: '#d1fae5', overflow: 'hidden' },
  codRow:            { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  codIcon:           { fontSize: 20 },
  codLabel:          { fontSize: 11, color: '#94a3b8', marginBottom: 2, fontWeight: '600' },
  codValue:          { fontSize: 14, fontWeight: '700', color: '#064e3b' },
  sliderWrapper:     { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', paddingHorizontal: 32, paddingTop: 16, paddingBottom: Platform.OS === 'android' ? 20 : 32, borderTopWidth: 0.5, borderTopColor: '#d1fae5' },
  sliderHint:        { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginBottom: 10 },
  sliderTrack:       { height: 60, backgroundColor: '#e2e8f0', borderRadius: 30, overflow: 'hidden', justifyContent: 'center', position: 'relative' },
  sliderFill:        { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 30 },
  sliderText:        { position: 'absolute', alignSelf: 'center', fontSize: 14, fontWeight: '600', color: '#fff', letterSpacing: 0.3 },
  sliderThumb:       { position: 'absolute', left: 2, width: THUMB_W, height: 56, borderRadius: 28, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 },
  checkmark:         { position: 'absolute', right: 20, fontSize: 22, color: '#fff', fontWeight: '700' },
})