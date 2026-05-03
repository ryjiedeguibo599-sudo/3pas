import React, { useEffect, useRef, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, ScrollView, Animated,
  Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import API from '../../services/api'

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
  orange:    '#F59E0B',
  purple:    '#8B5CF6',
  green:     '#10B981',
}

const STATUS_STEPS = [
  { key: 'submitted',  label: 'Request Submitted', emoji: '📤', desc: 'Your request has been received.' },
  { key: 'assigned',   label: 'Provider Assigned', emoji: '👤', desc: 'A provider has accepted your request.' },
  { key: 'on_the_way', label: 'On the Way',         emoji: '🛵', desc: 'Your provider is on the way!' },
  { key: 'delivered',  label: 'Delivered',          emoji: '✅', desc: 'Delivered successfully. Please pay.' },
]

const STEP_COLOR = {
  submitted:  C.orange,
  assigned:   C.primary,
  on_the_way: C.primary,
  delivered:  C.green,
}

function TrackingSteps({ currentKey }) {
  const currentIdx = STATUS_STEPS.findIndex(s => s.key === currentKey)
  return (
    <View style={styles.stepsContainer}>
      {STATUS_STEPS.map((step, index) => {
        const done    = index < currentIdx
        const current = index === currentIdx
        const color   = STEP_COLOR[step.key] || C.textHint
        return (
          <View key={step.key}>
            <View style={styles.stepRow}>
              <View style={[
                styles.stepDot,
                done    && { backgroundColor: C.primary, borderColor: C.primary },
                current && { backgroundColor: color,     borderColor: color },
              ]}>
                <Text style={styles.stepDotText}>{done ? '✓' : step.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[
                  styles.stepLabel,
                  done    && { color: C.primary, fontWeight: '700' },
                  current && { color: color,     fontWeight: '700' },
                ]}>
                  {step.label}
                </Text>
                {current && <Text style={styles.stepDesc}>{step.desc}</Text>}
              </View>
              {current && (
                <View style={[styles.nowBadge, { backgroundColor: color + '20' }]}>
                  <Text style={[styles.nowBadgeText, { color }]}>Now</Text>
                </View>
              )}
            </View>
            {index < STATUS_STEPS.length - 1 && (
              <View style={[styles.stepLine, done && { backgroundColor: C.primary }]} />
            )}
          </View>
        )
      })}
    </View>
  )
}

export default function AssignedProviderScreen({ navigation, route }) {
  const {
    providerName, providerContact, eta,
    deliveryAddress, packageDesc, orderId,
  } = route.params || {}

  const [trackingKey, setTrackingKey] = useState('assigned')

  const cardOpacity = useRef(new Animated.Value(0)).current
  const cardY       = useRef(new Animated.Value(24)).current
  const checkScale  = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.sequence([
      Animated.spring(checkScale,  { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(cardY,       { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start()
  }, [])

  useEffect(() => {
    if (!orderId) return

    const poll = setInterval(async () => {
      try {
        const res    = await API.get(`/padala/orders/${orderId}`)
        const status = res.data?.order?.status || res.data?.status

        const keyMap = {
          pending:    'submitted',
          accepted:   'assigned',
          on_the_way: 'on_the_way',
          completed:  'delivered',
        }
        if (status && keyMap[status]) {
          setTrackingKey(keyMap[status])
        }

        if (status === 'completed' || status === 'cancelled') {
          clearInterval(poll)
        }
      } catch (err) {
        console.log('Padala polling error:', err?.message)
      }
    }, 5000)

    return () => clearInterval(poll)
  }, [orderId])

  const handleCall = () => {
    if (!providerContact) return
    Linking.openURL(`tel:${providerContact}`)
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
        </View>

        {/* Success badge */}
        <Animated.View style={[styles.successBadge, { transform: [{ scale: checkScale }] }]}>
          <View style={styles.checkCircle}>
            <Text style={styles.checkText}>✓</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.successTitle}>Provider Assigned!</Text>
            <Text style={styles.successSub}>Your delivery request has been accepted.</Text>
          </View>
        </Animated.View>

        {/* Provider card */}
        <Animated.View style={[styles.card, { opacity: cardOpacity, transform: [{ translateY: cardY }] }]}>
          <Text style={styles.cardTitle}>👤  Provider Info</Text>
          <View style={styles.divider} />
          <View style={styles.providerRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {providerName ? providerName[0].toUpperCase() : '?'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.providerName}>{providerName || 'Provider'}</Text>
              {eta && <Text style={styles.etaText}>⏱  ETA: {eta}</Text>}
            </View>
            {providerContact && (
              <TouchableOpacity style={styles.callBtn} onPress={handleCall} activeOpacity={0.8}>
                <Text style={styles.callIcon}>📞</Text>
                <Text style={styles.callText}>Call</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Package info */}
        {packageDesc && (
          <Animated.View style={[styles.chipCard, { opacity: cardOpacity }]}>
            <Text style={styles.chipText}>📦  {packageDesc}</Text>
          </Animated.View>
        )}

        {/* Tracking */}
        <Animated.View style={[styles.card, { opacity: cardOpacity, transform: [{ translateY: cardY }] }]}>
          <Text style={styles.cardTitle}>🗺  Delivery Status</Text>
          <View style={styles.divider} />
          <TrackingSteps currentKey={trackingKey} />
        </Animated.View>

        {/* COD reminder */}
        <View style={styles.codNote}>
          <Text style={styles.codIcon}>💳</Text>
          <Text style={styles.codText}>
            Pay on delivery — <Text style={{ fontWeight: '700' }}>Cash on Delivery.</Text>
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.85}
          >
            <Text style={styles.homeBtnIcon}>🏠</Text>
            <Text style={styles.homeBtnText}>Back to Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ordersBtn}
            onPress={() => navigation.navigate('MyDeliveryRequests')}
            activeOpacity={0.8}
          >
            <Text style={styles.ordersBtnText}>📋  View Deliveries  →</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 20 },

  header:      { flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS === 'android' ? 8 : 4, paddingBottom: 12 },
  backBtn:     { width: 36, height: 36, borderRadius: 10, backgroundColor: C.primaryLt, alignItems: 'center', justifyContent: 'center' },
  backIcon:    { fontSize: 22, color: C.primary, fontWeight: '600', lineHeight: 28 },

  successBadge:  { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.white, borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: C.primaryMd, marginBottom: 14 },
  checkCircle:   { width: 52, height: 52, borderRadius: 16, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  checkText:     { fontSize: 28, color: C.white, fontWeight: '700', lineHeight: 36 },
  successTitle:  { fontSize: 17, fontWeight: '800', color: C.text },
  successSub:    { fontSize: 12, color: C.textSub, marginTop: 2 },

  card:      { backgroundColor: C.white, borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: C.border, marginBottom: 14 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 8 },
  divider:   { height: 0.5, backgroundColor: '#F1F5F9', marginBottom: 12 },

  providerRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText:   { fontSize: 22, fontWeight: '700', color: C.white },
  providerName: { fontSize: 15, fontWeight: '700', color: C.text },
  etaText:      { fontSize: 12, color: C.primary, fontWeight: '700', marginTop: 3 },
  callBtn:      { alignItems: 'center', backgroundColor: C.primaryLt, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 0.5, borderColor: C.primaryMd },
  callIcon:     { fontSize: 18 },
  callText:     { fontSize: 10, color: C.primary, fontWeight: '700', marginTop: 2 },

  chipCard:  { backgroundColor: C.primaryLt, borderRadius: 12, padding: 12, borderWidth: 0.5, borderColor: C.primaryMd, marginBottom: 14 },
  chipText:  { fontSize: 13, color: C.primary, fontWeight: '600', textAlign: 'center' },

  stepsContainer: { paddingLeft: 2 },
  stepRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  stepDot:        { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  stepDotText:    { fontSize: 14 },
  stepLabel:      { fontSize: 13, color: C.textHint, fontWeight: '500' },
  stepDesc:       { fontSize: 11, color: C.textSub, marginTop: 2, lineHeight: 16 },
  stepLine:       { width: 2, height: 14, backgroundColor: C.border, marginLeft: 15, marginVertical: 3 },
  nowBadge:       { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  nowBadgeText:   { fontSize: 10, fontWeight: '700' },

  codNote:  { flexDirection: 'row', gap: 10, backgroundColor: '#FEFCE8', borderRadius: 12, padding: 13, borderWidth: 0.5, borderColor: '#FDE68A', marginBottom: 14 },
  codIcon:  { fontSize: 16 },
  codText:  { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 },

  actions:       { gap: 10 },
  homeBtn:       { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  homeBtnIcon:   { fontSize: 18 },
  homeBtnText:   { color: C.white, fontSize: 15, fontWeight: '700' },
  ordersBtn:     { alignItems: 'center', paddingVertical: 8 },
  ordersBtnText: { fontSize: 13, color: C.primary, fontWeight: '600' },
})
