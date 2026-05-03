import React, { useEffect, useRef, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, ScrollView, Animated, Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

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
  green:     '#16A34A',
}

const STATUS_STEPS = [
  { key: 'submitted',  label: 'Request Submitted',  emoji: '📤', desc: 'Your request has been received.' },
  { key: 'assigned',   label: 'Provider Assigned',  emoji: '👤', desc: 'A provider has accepted your order.' },
  { key: 'purchasing', label: 'Purchasing Items',   emoji: '🛒', desc: 'Provider is purchasing your items.' },
  { key: 'on_the_way', label: 'On the Way',         emoji: '🛵', desc: 'Provider is on the way!' },
  { key: 'delivered',  label: 'Delivered',          emoji: '✅', desc: 'Delivered! Please pay the provider.' },
]

const STEP_COLOR = {
  submitted:  C.orange,
  assigned:   C.primary,
  purchasing: '#8B5CF6',
  on_the_way: C.primary,
  delivered:  C.green,
}

function TrackingSteps({ currentKey }) {
  const currentIdx = STATUS_STEPS.findIndex(s => s.key === currentKey)
  return (
    <View style={s.stepsContainer}>
      {STATUS_STEPS.map((step, index) => {
        const done    = index < currentIdx
        const current = index === currentIdx
        const color   = STEP_COLOR[step.key] || C.textHint
        return (
          <View key={step.key}>
            <View style={s.stepRow}>
              <View style={[
                s.stepDot,
                done    && { backgroundColor: C.green,   borderColor: C.green },
                current && { backgroundColor: color,     borderColor: color },
              ]}>
                <Text style={s.stepDotText}>{done ? '✓' : step.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[
                  s.stepLabel,
                  done    && { color: C.green,  fontWeight: '700' },
                  current && { color: color,    fontWeight: '700' },
                ]}>
                  {step.label}
                </Text>
                {current && <Text style={s.stepDesc}>{step.desc}</Text>}
              </View>
              {current && (
                <View style={[s.nowBadge, { backgroundColor: color + '20' }]}>
                  <Text style={[s.nowBadgeText, { color }]}>Now</Text>
                </View>
              )}
            </View>
            {index < STATUS_STEPS.length - 1 && (
              <View style={[s.stepLine, done && { backgroundColor: C.green }]} />
            )}
          </View>
        )
      })}
    </View>
  )
}

export default function PasabuyProviderScreen({ navigation, route }) {
  const {
    providerName, providerContact, providerStatus, eta,
    deliveryAddress, itemName, quantity, store, budget, notes,
  } = route.params || {}

  const [trackingKey] = useState('assigned')

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

  const handleCall = () => {
    if (!providerContact) return
    Linking.openURL(`tel:${providerContact}`)
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success badge */}
        <Animated.View style={[s.successBadge, { transform: [{ scale: checkScale }] }]}>
          <View style={s.checkCircle}>
            <Text style={s.checkText}>✓</Text>
          </View>
          <View>
            <Text style={s.successTitle}>Provider Assigned!</Text>
            <Text style={s.successSub}>Your request has been accepted.</Text>
          </View>
        </Animated.View>

        {/* Provider card */}
        <Animated.View style={[s.card, { opacity: cardOpacity, transform: [{ translateY: cardY }] }]}>
          <Text style={s.cardTitle}>👤  Provider Info</Text>
          <View style={s.divider} />
          <View style={s.providerRow}>
            <View style={s.avatarCircle}>
              <Text style={s.avatarText}>
                {providerName ? providerName[0].toUpperCase() : '?'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.providerName}>{providerName || 'Provider'}</Text>
              <Text style={s.providerStatus}>{providerStatus || 'Accepted your request'}</Text>
              {!!eta && <Text style={s.etaText}>⏱  ETA: {eta}</Text>}
            </View>
            {!!providerContact && (
              <TouchableOpacity style={s.callBtn} onPress={handleCall} activeOpacity={0.8}>
                <Text style={s.callIcon}>📞</Text>
                <Text style={s.callText}>Call</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Order summary chip */}
        <Animated.View style={[s.orderChip, { opacity: cardOpacity }]}>
          <Text style={s.orderChipText}>
            📦  {itemName} × {quantity}  ·  ₱{Number(budget).toLocaleString()}  ·  {store}
          </Text>
        </Animated.View>

        {/* Tracking */}
        <Animated.View style={[s.card, { opacity: cardOpacity, transform: [{ translateY: cardY }] }]}>
          <Text style={s.cardTitle}>🗺  Order Status</Text>
          <View style={s.divider} />
          <TrackingSteps currentKey={trackingKey} />
        </Animated.View>

        {/* COD reminder */}
        <View style={s.codNote}>
          <Text style={s.codIcon}>💳</Text>
          <Text style={s.codText}>
            Pay upon delivery — <Text style={{ fontWeight: '700' }}>Cash on Delivery.</Text>
            {'\n'}Please have the exact change ready for your provider.
          </Text>
        </View>

        {/* Action buttons */}
        <View style={s.actions}>
          <TouchableOpacity style={s.homeBtn} onPress={() => navigation.navigate('Home')} activeOpacity={0.85}>
            <Text style={s.homeBtnIcon}>🏠</Text>
            <Text style={s.homeBtnText}>Back to Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.ordersBtn} onPress={() => navigation.navigate('MyGroceryOrders')} activeOpacity={0.8}>
            <Text style={s.ordersBtnText}>📋  View My Orders  →</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 16 : 20, gap: 14 },

  successBadge: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.white, borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: C.primaryMd },
  checkCircle:  { width: 52, height: 52, borderRadius: 16, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  checkText:    { fontSize: 28, color: C.white, fontWeight: '700', lineHeight: 36 },
  successTitle: { fontSize: 17, fontWeight: '800', color: C.text },
  successSub:   { fontSize: 12, color: C.textSub, marginTop: 2 },

  card:      { backgroundColor: C.white, borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: C.border },
  cardTitle: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 8 },
  divider:   { height: 0.5, backgroundColor: '#F1F5F9', marginBottom: 12 },

  providerRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle:   { width: 50, height: 50, borderRadius: 25, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText:     { fontSize: 22, fontWeight: '700', color: C.white },
  providerName:   { fontSize: 15, fontWeight: '700', color: C.text },
  providerStatus: { fontSize: 12, color: C.textSub, marginTop: 2 },
  etaText:        { fontSize: 12, color: C.primary, fontWeight: '700', marginTop: 3 },
  callBtn:        { alignItems: 'center', backgroundColor: C.primaryLt, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 0.5, borderColor: C.primaryMd },
  callIcon:       { fontSize: 18 },
  callText:       { fontSize: 10, color: C.primary, fontWeight: '700', marginTop: 2 },

  orderChip:     { backgroundColor: C.primaryLt, borderRadius: 12, padding: 12, borderWidth: 0.5, borderColor: C.primaryMd },
  orderChipText: { fontSize: 13, color: C.text, fontWeight: '600', textAlign: 'center' },

  stepsContainer: { paddingLeft: 2 },
  stepRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  stepDot:        { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  stepDotText:    { fontSize: 14 },
  stepLabel:      { fontSize: 13, color: C.textHint, fontWeight: '500' },
  stepDesc:       { fontSize: 11, color: C.textSub, marginTop: 2, lineHeight: 16 },
  stepLine:       { width: 2, height: 14, backgroundColor: C.border, marginLeft: 15, marginVertical: 3 },
  nowBadge:       { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  nowBadgeText:   { fontSize: 10, fontWeight: '700' },

  codNote: { flexDirection: 'row', gap: 10, backgroundColor: '#FEFCE8', borderRadius: 12, padding: 13, borderWidth: 0.5, borderColor: '#FDE68A' },
  codIcon: { fontSize: 16 },
  codText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 },

  actions:      { gap: 10 },
  homeBtn:      { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  homeBtnIcon:  { fontSize: 18 },
  homeBtnText:  { color: C.white, fontSize: 15, fontWeight: '700' },
  ordersBtn:    { alignItems: 'center', paddingVertical: 8 },
  ordersBtnText:{ fontSize: 13, color: C.primary, fontWeight: '600' },
})
