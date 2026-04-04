// Screen 5: PasabuyProviderScreen.js — Assigned Provider
// Shows provider details + tracking status flow

import React, { useEffect, useRef, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Platform, ScrollView, Animated,
  Linking, Alert,
} from 'react-native'
import API from '../../services/api'

const GREEN    = '#059669'
const GREEN_BG = '#ecfdf5'
const GREEN_DK = '#064e3b'
const BLUE     = '#2563eb'
const ORANGE   = '#f59e0b'
const PURPLE   = '#8b5cf6'
const RED      = '#ef4444'

const STATUS_STEPS = [
  { key: 'submitted',  label: 'Request Submitted',  emoji: '📤', desc: 'Natanggap na ang iyong request.' },
  { key: 'assigned',   label: 'Provider Assigned',  emoji: '👤', desc: 'May provider nang nag-accept.' },
  { key: 'purchasing', label: 'Purchasing Item',     emoji: '🛒', desc: 'Binibili na ng provider ang items mo.' },
  { key: 'on_the_way', label: 'On the Way',          emoji: '🛵', desc: 'Papunta na sa iyo ang provider!' },
  { key: 'delivered',  label: 'Delivered',           emoji: '✅', desc: 'Natanggap na. Bayad na!' },
]

const STEP_COLOR = {
  submitted:  ORANGE,
  assigned:   BLUE,
  purchasing: PURPLE,
  on_the_way: GREEN,
  delivered:  GREEN,
}

function TrackingSteps({ currentKey }) {
  const currentIdx = STATUS_STEPS.findIndex(s => s.key === currentKey)
  return (
    <View style={styles.stepsContainer}>
      {STATUS_STEPS.map((step, index) => {
        const done    = index < currentIdx
        const current = index === currentIdx
        const color   = STEP_COLOR[step.key] || '#94a3b8'
        return (
          <View key={step.key}>
            <View style={styles.stepRow}>
              <View style={[
                styles.stepDot,
                done    && { backgroundColor: GREEN, borderColor: GREEN },
                current && { backgroundColor: color,  borderColor: color  },
              ]}>
                <Text style={styles.stepDotText}>{done ? '✓' : step.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[
                  styles.stepLabel,
                  done    && { color: GREEN, fontWeight: '700' },
                  current && { color: color,  fontWeight: '700' },
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
              <View style={[styles.stepLine, done && { backgroundColor: GREEN }]} />
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

  // Start at "assigned" since provider just got matched
  const [trackingKey, setTrackingKey] = useState('assigned')

  const cardOpacity = useRef(new Animated.Value(0)).current
  const cardY       = useRef(new Animated.Value(24)).current
  const checkScale  = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(checkScale,  { toValue: 1, friction: 5, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(cardY,       { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start()

    // TODO: Replace with real socket listener for status updates
    // socket.on('order_status', (data) => setTrackingKey(data.status))
  }, [])

  const handleCall = () => {
    if (!providerContact) return
    Linking.openURL(`tel:${providerContact}`)
  }

  const handleViewOrders = () => {
    navigation.navigate('MyGroceryOrders')
  }

  const handleGoHome = () => {
    navigation.navigate('Home')
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Success badge ── */}
        <Animated.View style={[styles.successBadge, { transform: [{ scale: checkScale }] }]}>
          <View style={styles.checkCircle}>
            <Text style={styles.checkText}>✓</Text>
          </View>
          <View>
            <Text style={styles.successTitle}>Provider Assigned!</Text>
            <Text style={styles.successSub}>Ang iyong request ay tinanggap na.</Text>
          </View>
        </Animated.View>

        {/* ── Provider card ── */}
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
              <Text style={styles.providerStatus}>{providerStatus || 'Accepted your request'}</Text>
              {eta && <Text style={styles.etaText}>⏱  ETA: {eta}</Text>}
            </View>
            {providerContact && (
              <TouchableOpacity style={styles.callBtn} onPress={handleCall} activeOpacity={0.8}>
                <Text style={styles.callIcon}>📞</Text>
                <Text style={styles.callText}>Tawagan</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* ── Order summary chip ── */}
        <Animated.View style={[styles.orderChip, { opacity: cardOpacity }]}>
          <Text style={styles.orderChipText}>
            📦  {itemName} × {quantity}  ·  ₱{Number(budget).toLocaleString()}  ·  {store}
          </Text>
        </Animated.View>

        {/* ── Tracking ── */}
        <Animated.View style={[styles.card, { opacity: cardOpacity, transform: [{ translateY: cardY }] }]}>
          <Text style={styles.cardTitle}>🗺  Status ng Order</Text>
          <View style={styles.divider} />
          <TrackingSteps currentKey={trackingKey} />
        </Animated.View>

        {/* ── COD reminder ── */}
        <View style={styles.codNote}>
          <Text style={styles.codIcon}>💳</Text>
          <Text style={styles.codText}>
            Bayad sa pagdating — <Text style={{ fontWeight: '700' }}>Cash on Delivery.</Text>
            {'\n'}Handa ang tamang sukli para sa provider.
          </Text>
        </View>

        {/* ── Action buttons ── */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.homeBtn} onPress={handleGoHome} activeOpacity={0.85}>
            <Text style={styles.homeBtnIcon}>🏠</Text>
            <Text style={styles.homeBtnText}>Bumalik sa Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.ordersBtn} onPress={handleViewOrders} activeOpacity={0.8}>
            <Text style={styles.ordersBtnText}>📋  Tingnan ang Orders  →</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#f0fdf8' },
  scrollContent: { paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 56 : 20, gap: 14 },

  successBadge: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: '#d1fae5' },
  checkCircle:  { width: 52, height: 52, borderRadius: 16, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', shadowColor: GREEN, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  checkText:    { fontSize: 28, color: '#fff', fontWeight: '700', lineHeight: 36 },
  successTitle: { fontSize: 17, fontWeight: '800', color: GREEN_DK },
  successSub:   { fontSize: 12, color: '#64748b', marginTop: 2 },

  card:      { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: '#e2e8f0' },
  cardTitle: { fontSize: 13, fontWeight: '700', color: GREEN_DK, marginBottom: 8 },
  divider:   { height: 0.5, backgroundColor: '#f1f5f9', marginBottom: 12 },

  providerRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  avatarText:   { fontSize: 22, fontWeight: '700', color: '#fff' },
  providerName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  providerStatus: { fontSize: 12, color: '#64748b', marginTop: 2 },
  etaText:      { fontSize: 12, color: GREEN, fontWeight: '700', marginTop: 3 },
  callBtn:      { alignItems: 'center', backgroundColor: GREEN_BG, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 0.5, borderColor: '#a7f3d0' },
  callIcon:     { fontSize: 18 },
  callText:     { fontSize: 10, color: GREEN, fontWeight: '700', marginTop: 2 },

  orderChip:     { backgroundColor: GREEN_BG, borderRadius: 12, padding: 12, borderWidth: 0.5, borderColor: '#a7f3d0' },
  orderChipText: { fontSize: 13, color: GREEN_DK, fontWeight: '600', textAlign: 'center' },

  stepsContainer: { paddingLeft: 2 },
  stepRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  stepDot:        { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  stepDotText:    { fontSize: 14 },
  stepLabel:      { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  stepDesc:       { fontSize: 11, color: '#64748b', marginTop: 2, lineHeight: 16 },
  stepLine:       { width: 2, height: 14, backgroundColor: '#e2e8f0', marginLeft: 15, marginVertical: 3 },
  nowBadge:       { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  nowBadgeText:   { fontSize: 10, fontWeight: '700' },

  codNote: { flexDirection: 'row', gap: 10, backgroundColor: '#fefce8', borderRadius: 12, padding: 13, borderWidth: 0.5, borderColor: '#fde68a' },
  codIcon: { fontSize: 16 },
  codText: { flex: 1, fontSize: 12, color: '#92400e', lineHeight: 18 },

  actions:     { gap: 10 },
  homeBtn:     { backgroundColor: GREEN, borderRadius: 14, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: GREEN, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  homeBtnIcon: { fontSize: 18 },
  homeBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  ordersBtn:    { alignItems: 'center', paddingVertical: 8 },
  ordersBtnText:{ fontSize: 13, color: BLUE, fontWeight: '600' },
})