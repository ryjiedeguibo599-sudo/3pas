import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, ScrollView, Platform,
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
  green:     '#16A34A',
  red:       '#DC2626',
  orange:    '#F59E0B',
}

const CARGO = [
  {
    key: 'none',  emoji: '🚫', label: 'No Cargo',
    note: 'Nothing extra to bring',
    color: C.textSub, activeBg: '#F1F5F9', activeBorder: C.textSub,
  },
  {
    key: 'small', emoji: '🎒', label: 'Small Bag',
    note: 'Backpack, small parcel',
    color: C.primary, activeBg: C.primaryLt, activeBorder: C.primary,
  },
  {
    key: 'bulky', emoji: '📦', label: 'Large / Bulky',
    note: 'Heavy or oversized item',
    color: '#D97706', activeBg: '#FFFBEB', activeBorder: '#D97706',
  },
]

const PAX_HINT = {
  1: { text: 'Solo ride — all vehicles available', warn: false },
  2: { text: 'Pair — Tricycle or Bao-bao recommended', warn: false },
  3: { text: 'Group of 3 — Tricycle or Bao-bao', warn: false },
  4: { text: 'Group of 4 — Bao-bao only', warn: true },
  5: { text: 'Group of 5 — Bao-bao only', warn: true },
}

export default function PasakayTripDetails({ navigation, route }) {
  const { pickup, dropoff, pickupCoords, dropoffCoords } = route.params || {}
  const [passengers, setPassengers] = useState(1)
  const [cargo,      setCargo]      = useState('none')

  const hint = PAX_HINT[passengers]

  const handleContinue = () => {
    navigation.navigate('PasakayVehicle', {
      pickup, dropoff, pickupCoords, dropoffCoords,
      passengers, cargo,
    })
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      {/* Nav bar */}
      <View style={s.navBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Route card */}
        <View style={s.routeCard}>
          <View style={s.routeRow}>
            <View style={s.dotGreen} />
            <View style={{ flex: 1 }}>
              <Text style={s.routeRowTag}>PICKUP</Text>
              <Text style={s.routeAddr} numberOfLines={1}>{pickup || '—'}</Text>
            </View>
          </View>
          <View style={s.routeLineWrap}>
            <View style={s.routeVLine} />
          </View>
          <View style={s.routeRow}>
            <View style={s.dotRed} />
            <View style={{ flex: 1 }}>
              <Text style={s.routeRowTag}>DROPOFF</Text>
              <Text style={s.routeAddr} numberOfLines={1}>{dropoff || '—'}</Text>
            </View>
          </View>
        </View>

        {/* ── Passengers ── */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <View>
              <Text style={s.cardTitle}>Passengers</Text>
              <Text style={s.cardSub}>How many people are riding?</Text>
            </View>
            <View style={s.paxChip}>
              <Text style={s.paxChipText}>
                {passengers} {passengers === 1 ? 'person' : 'people'}
              </Text>
            </View>
          </View>

          {/* Number selector */}
          <View style={s.paxRow}>
            {[1, 2, 3, 4, 5].map(n => {
              const active = passengers === n
              return (
                <TouchableOpacity
                  key={n}
                  style={[s.paxBtn, active && s.paxBtnActive]}
                  onPress={() => setPassengers(n)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.paxBtnNum, active && s.paxBtnNumActive]}>{n}</Text>
                  <Text style={s.paxBtnIcon}>
                    {n === 1 ? '🧍' : n <= 3 ? '👥' : '👨‍👩‍👧'}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Capacity bar */}
          <View style={s.capacityBar}>
            {[1, 2, 3, 4, 5].map(n => (
              <View
                key={n}
                style={[
                  s.capacitySegment,
                  n <= passengers && {
                    backgroundColor: passengers >= 4 ? C.orange : C.primary,
                  },
                ]}
              />
            ))}
          </View>

          {/* Hint */}
          <View style={[s.hintBox, hint.warn && s.hintBoxWarn]}>
            <Text style={[s.hintText, hint.warn && s.hintTextWarn]}>
              {hint.warn ? '⚠️  ' : 'ℹ️  '}{hint.text}
            </Text>
          </View>
        </View>

        {/* ── Cargo ── */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <View>
              <Text style={s.cardTitle}>Cargo</Text>
              <Text style={s.cardSub}>Are you bringing anything along?</Text>
            </View>
          </View>

          {CARGO.map(c => {
            const active = cargo === c.key
            return (
              <TouchableOpacity
                key={c.key}
                style={[
                  s.cargoItem,
                  active && { borderColor: c.activeBorder, backgroundColor: c.activeBg },
                ]}
                onPress={() => setCargo(c.key)}
                activeOpacity={0.75}
              >
                <Text style={s.cargoEmoji}>{c.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.cargoLabel, active && { color: c.color }]}>{c.label}</Text>
                  <Text style={s.cargoNote}>{c.note}</Text>
                </View>
                <View style={[s.radio, active && { borderColor: c.color }]}>
                  {active && <View style={[s.radioDot, { backgroundColor: c.color }]} />}
                </View>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Cargo warning for bulky */}
        {cargo === 'bulky' && (
          <View style={s.bulkyWarn}>
            <Text style={s.bulkyWarnText}>
              ⚠️  Large cargo requires a Bao-bao. Motorcycle and Tricycle will be unavailable.
            </Text>
          </View>
        )}

        <View style={{ height: 12 }} />
      </ScrollView>

      {/* Footer */}
      <View style={s.footer}>
        <View style={s.footerSummary}>
          <Text style={s.footerSummaryText}>
            {passengers} {passengers === 1 ? 'passenger' : 'passengers'}
            {cargo !== 'none' ? ` · ${CARGO.find(c => c.key === cargo)?.label}` : ''}
          </Text>
        </View>
        <TouchableOpacity style={s.continueBtn} onPress={handleContinue} activeOpacity={0.85}>
          <Text style={s.continueBtnText}>Select Vehicle →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  navBar:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: Platform.OS === 'android' ? 8 : 4, paddingBottom: 8, backgroundColor: C.white },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.primaryLt, alignItems: 'center', justifyContent: 'center' },
  backIcon:{ fontSize: 22, color: C.primary, fontWeight: '700', lineHeight: 28 },

  scroll: { paddingHorizontal: 16, paddingTop: 14 },

  routeCard:    { backgroundColor: C.white, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  routeRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dotGreen:     { width: 12, height: 12, borderRadius: 6, backgroundColor: C.green },
  dotRed:       { width: 12, height: 12, borderRadius: 6, backgroundColor: C.red },
  routeRowTag:  { fontSize: 9, fontWeight: '700', color: C.textHint, letterSpacing: 0.8, marginBottom: 1 },
  routeAddr:    { fontSize: 13, color: C.text, fontWeight: '600' },
  routeLineWrap:{ paddingLeft: 5, paddingVertical: 5 },
  routeVLine:   { width: 2, height: 14, backgroundColor: C.border, borderRadius: 1 },

  card:       { backgroundColor: C.white, borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 },
  cardTitle:  { fontSize: 15, fontWeight: '800', color: C.text },
  cardSub:    { fontSize: 12, color: C.textSub, marginTop: 2 },

  paxChip:     { backgroundColor: C.primaryLt, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 0.5, borderColor: C.primaryMd },
  paxChipText: { fontSize: 12, fontWeight: '700', color: C.primary },

  paxRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  paxBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 14,
    backgroundColor: '#F1F5F9', borderRadius: 14,
    borderWidth: 1.5, borderColor: C.border,
    gap: 4,
  },
  paxBtnActive:    { backgroundColor: C.primary, borderColor: C.primary },
  paxBtnNum:       { fontSize: 20, fontWeight: '800', color: C.textSub },
  paxBtnNumActive: { color: C.white },
  paxBtnIcon:      { fontSize: 13 },

  capacityBar: { flexDirection: 'row', gap: 4, marginBottom: 12 },
  capacitySegment: {
    flex: 1, height: 5, borderRadius: 3,
    backgroundColor: '#E2E8F0',
  },

  hintBox:      { backgroundColor: C.primaryLt, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 0.5, borderColor: C.primaryMd },
  hintBoxWarn:  { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  hintText:     { fontSize: 12, color: C.primary, fontWeight: '500', lineHeight: 18 },
  hintTextWarn: { color: '#92400E' },

  cargoItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#F8FAFF', borderRadius: 14,
    padding: 14, borderWidth: 1.5, borderColor: C.border,
    marginBottom: 10,
  },
  cargoEmoji: { fontSize: 26 },
  cargoLabel: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 2 },
  cargoNote:  { fontSize: 12, color: C.textSub },
  radio:      { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  radioDot:   { width: 10, height: 10, borderRadius: 5 },

  bulkyWarn:     { backgroundColor: '#FFF7ED', borderRadius: 12, padding: 13, borderWidth: 0.5, borderColor: '#FDBA74', marginBottom: 14 },
  bulkyWarnText: { fontSize: 12, color: '#92400E', lineHeight: 18 },

  footer:            { paddingHorizontal: 16, paddingBottom: Platform.OS === 'android' ? 20 : 32, paddingTop: 12, backgroundColor: C.white, borderTopWidth: 0.5, borderTopColor: C.border, gap: 8 },
  footerSummary:     { alignItems: 'center' },
  footerSummaryText: { fontSize: 12, color: C.textSub, fontWeight: '600' },
  continueBtn:       { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  continueBtnText:   { color: C.white, fontSize: 16, fontWeight: '700' },
})
