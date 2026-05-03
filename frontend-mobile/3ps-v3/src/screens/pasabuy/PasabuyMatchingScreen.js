import React, { useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Easing, Alert,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import API from '../../services/api'
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
  orange: '#F59E0B',
  red: theme.colors.danger,
}

export default function PasabuyMatchingScreen({ navigation, route }) {
  const {
    deliveryAddress, itemName, quantity,
    store, budget, notes, orderId,
  } = route.params || {}

  const [elapsed,  setElapsed]  = useState(0)

  const dot1 = useRef(new Animated.Value(0.3)).current
  const dot2 = useRef(new Animated.Value(0.3)).current
  const dot3 = useRef(new Animated.Value(0.3)).current
  const ring  = useRef(new Animated.Value(0)).current
  const iconY = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const dotLoop = () => {
      Animated.sequence([
        Animated.timing(dot1, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(dot2, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(dot3, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.delay(300),
        Animated.parallel([
          Animated.timing(dot1, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.timing(dot2, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.timing(dot3, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        ]),
      ]).start(() => dotLoop())
    }
    dotLoop()

    const ringLoop = () => {
      ring.setValue(0)
      Animated.timing(ring, {
        toValue: 1, duration: 1800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => ringLoop())
    }
    ringLoop()

    const floatLoop = () => {
      Animated.sequence([
        Animated.timing(iconY, { toValue: -8, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(iconY, { toValue: 0,  duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]).start(() => floatLoop())
    }
    floatLoop()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!orderId) return
    const poll = async () => {
      try {
        const res = await API.get(`/pasabuy/orders/${orderId}`)
        const orderStatus = res.data?.order?.status || res.data?.status
        if (orderStatus && orderStatus !== 'pending') {
          if (orderStatus === 'accepted' || orderStatus === 'picked_up') {
            navigation.replace('MyGroceryOrders')
          } else if (orderStatus === 'cancelled') {
            Alert.alert(
              'Order Cancelled',
              'No shopper accepted your order.',
              [{ text: 'OK', onPress: () => navigation.replace('Pasabuy') }]
            )
          }
        }
      } catch (err) {
        console.log('Polling error:', err?.message)
      }
    }
    poll()
    const interval = setInterval(poll, 5000)
    return () => clearInterval(interval)
  }, [orderId])

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const ringScale   = ring.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] })
  const ringOpacity = ring.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 0.2, 0] })

  return (
    <SafeAreaView style={s.safe}>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Ripple + Icon */}
        <View style={s.iconWrapper}>
          <Animated.View style={[s.ring, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
          <Animated.View style={{ transform: [{ translateY: iconY }] }}>
            <View style={s.iconCircle}>
              <Text style={s.iconEmoji}>🛵</Text>
            </View>
          </Animated.View>
        </View>

        <Text style={s.mainTitle}>Looking for a Shopper...</Text>
        <Text style={s.mainSub}>
          We're finding the nearest shopper{'\n'}for your order.
        </Text>

        <View style={s.dotsRow}>
          <Animated.View style={[s.dot, { opacity: dot1 }]} />
          <Animated.View style={[s.dot, { opacity: dot2 }]} />
          <Animated.View style={[s.dot, { opacity: dot3 }]} />
        </View>

        <View style={s.timerChip}>
          <Text style={s.timerText}>⏱ {formatTime(elapsed)}</Text>
        </View>

        {/* Order Summary */}
        <View style={s.summaryCard}>
          <Text style={s.summaryTitle}>📦 Order Summary</Text>
          <View style={s.divider} />
          <View style={s.row}>
            <Text style={s.rowLabel}>Item</Text>
            <Text style={s.rowValue}>{itemName}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Quantity</Text>
            <Text style={s.rowValue}>x{quantity}</Text>
          </View>
          {store && store !== 'Not specified' && (
            <View style={s.row}>
              <Text style={s.rowLabel}>Store</Text>
              <Text style={s.rowValue}>{store}</Text>
            </View>
          )}
          <View style={s.row}>
            <Text style={s.rowLabel}>Budget</Text>
            <Text style={[s.rowValue, { color: C.primary, fontWeight: '700' }]}>
              ₱{Number(budget).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          {!!deliveryAddress && (
            <View style={s.row}>
              <Text style={s.rowLabel}>📍 Deliver to</Text>
              <Text style={[s.rowValue, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
                {deliveryAddress}
              </Text>
            </View>
          )}
        </View>

        {/* Status steps */}
        <View style={s.stepsCard}>
          {[
            { label: 'Order Submitted',  done: true },
            { label: 'Finding a Shopper', done: false, active: true },
            { label: 'Purchasing Items', done: false },
            { label: 'On the Way',       done: false },
          ].map((step, i) => (
            <View key={i} style={s.stepRow}>
              <View style={[
                s.stepDot,
                step.done   && { backgroundColor: C.primary, borderColor: C.primary },
                step.active && { backgroundColor: C.orange,  borderColor: C.orange  },
              ]}>
                <Text style={s.stepDotText}>
                  {step.done ? '✓' : step.active ? '⏳' : `${i + 1}`}
                </Text>
              </View>
              <Text style={[
                s.stepLabel,
                step.done   && { color: C.primary, fontWeight: '700' },
                step.active && { color: C.orange,  fontWeight: '700' },
              ]}>
                {step.label}
              </Text>
              {step.active && (
                <View style={s.nowBadge}>
                  <Text style={s.nowBadgeText}>Now</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Primary action */}
        <TouchableOpacity style={s.homeBtn} onPress={() => navigation.navigate('Home')} activeOpacity={0.85}>
          <Text style={s.homeBtnText}>🏠  Back to Home</Text>
        </TouchableOpacity>

        <Text style={s.hint}>
          You will be automatically redirected{'\n'}when a shopper accepts.
        </Text>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  timerChip: { backgroundColor: C.primaryLt, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 0.5, borderColor: C.primaryMd },
  timerText: { fontSize: 13, fontWeight: '700', color: C.primary },

  scrollContent: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 24, gap: 14 },

  iconWrapper: { alignItems: 'center', justifyContent: 'center', width: 100, height: 100, marginBottom: 4 },
  ring:        { position: 'absolute', width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: C.primary },
  iconCircle:  { width: 80, height: 80, borderRadius: 20, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  iconEmoji:   { fontSize: 38 },

  mainTitle: { fontSize: 20, fontWeight: '800', color: C.text, textAlign: 'center' },
  mainSub:   { fontSize: 13, color: C.textSub, textAlign: 'center', lineHeight: 20, marginTop: -6 },

  dotsRow: { flexDirection: 'row', gap: 8 },
  dot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary },

  summaryCard:  { width: '100%', backgroundColor: C.white, borderRadius: 16, padding: 14, borderWidth: 0.5, borderColor: C.border, gap: 8 },
  summaryTitle: { fontSize: 13, fontWeight: '700', color: C.text },
  divider:      { height: 0.5, backgroundColor: C.border },
  row:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel:     { fontSize: 12, color: C.textSub },
  rowValue:     { fontSize: 13, fontWeight: '600', color: C.text },

  stepsCard:   { width: '100%', backgroundColor: C.white, borderRadius: 16, padding: 14, borderWidth: 0.5, borderColor: C.border, gap: 10 },
  stepRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepDot:     { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F1F5F9', borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  stepDotText: { fontSize: 12 },
  stepLabel:   { flex: 1, fontSize: 12, color: C.textHint, fontWeight: '500' },
  nowBadge:    { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  nowBadgeText:{ fontSize: 10, fontWeight: '700', color: C.orange },

  homeBtn:     { width: '100%', backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  homeBtnText: { color: C.white, fontSize: 15, fontWeight: '700' },

  hint: { fontSize: 11, color: C.textHint, textAlign: 'center', lineHeight: 17, marginTop: -4 },
})
