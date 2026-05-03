import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, ScrollView, Platform, Alert,
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
  orange:    '#F59E0B',
  red:       theme.colors.danger,
}

const calcFare = (base, rate, distKm) => {
  if (!distKm) return base
  return Math.min(500, Math.max(base, Math.round(base + distKm * rate)))
}

const getVehicles = (passengers, cargo) => {
  const num     = Number(passengers)
  const isBulky = cargo === 'bulky'

  return [
    {
      key:      'motorcycle',
      name:     'Motorcycle',
      emoji:    '🏍️',
      tagline:  'Solo rides, fastest on the road',
      capacity: 1,
      features: ['1 passenger only', 'Light cargo', 'Quickest trips'],
      baseFare: 50,
      ratePerKm: 7,
      color:       '#16A34A',
      bgColor:     '#F0FDF4',
      borderColor: '#BBF7D0',
      disabled: num > 1 || isBulky,
      disabledReason:
        num > 1   ? `Fits only 1 passenger — you need ${num}`
        : isBulky ? 'Cannot carry large or bulky cargo'
        : null,
      recommended:      num === 1 && !isBulky,
      recommendedLabel: 'Fastest for solo',
    },
    {
      key:      'tricycle',
      name:     'Tricycle',
      emoji:    '🛺',
      tagline:  'Comfortable for small groups',
      capacity: 3,
      features: ['Up to 3 passengers', 'Small cargo OK', 'Best for local trips'],
      baseFare:  60,
      ratePerKm: 9,
      color:       '#D97706',
      bgColor:     C.primaryLt,
      borderColor: C.primaryMd,
      disabled: num > 3 || isBulky,
      disabledReason:
        num > 3   ? `Fits up to 3 passengers — you need ${num}`
        : isBulky ? 'Cannot carry large or bulky cargo'
        : null,
      recommended:      num >= 2 && num <= 3 && !isBulky,
      recommendedLabel: 'Best for your group',
    },
    {
      key:      'bao_bao',
      name:     'Bao-bao',
      emoji:    '🚐',
      tagline:  'Large groups & heavy cargo',
      capacity: 5,
      features: ['Up to 5 passengers', 'Any cargo size', 'Most spacious option'],
      baseFare:  80,
      ratePerKm: 12,
      color:       '#D97706',
      bgColor:     '#FFFBEB',
      borderColor: '#FDE68A',
      disabled:         false,
      disabledReason:   null,
      recommended:      num >= 4 || isBulky,
      recommendedLabel: num >= 4 ? 'Only option for your group' : 'Recommended for large cargo',
    },
  ]
}

export default function PasakayVehicleScreen({ navigation, route }) {
  const {
    pickup, dropoff, pickupCoords, dropoffCoords,
    passengers, cargo, distanceKm,
  } = route.params || {}

  const [selected, setSelected] = useState(null)
  const [loading]  = useState(false)

  const paxNum   = Number(passengers)
  const vehicles = getVehicles(paxNum, cargo)

  React.useEffect(() => {
    const rec = vehicles.find(v => v.recommended && !v.disabled)
    if (rec) setSelected(rec.key)
  }, [])

  const selectedVehicle = vehicles.find(v => v.key === selected)
  const selectedFare    = selectedVehicle
    ? calcFare(selectedVehicle.baseFare, selectedVehicle.ratePerKm, distanceKm)
    : 0

  const handleBook = async () => {
    if (!selected) {
      Alert.alert('Select a Vehicle', 'Please choose a vehicle type to continue.')
      return
    }
    navigation.navigate('PasakayReview', {
      pickup, dropoff, pickupCoords, dropoffCoords,
      passengers: paxNum, cargo,
      vehicleType:  selected,
      vehicleName:  selectedVehicle.name,
      vehicleEmoji: selectedVehicle.emoji,
      fare:         selectedFare,
      distanceKm,
    })
  }

  const paxLabel   = paxNum === 1 ? '🧍 1 passenger' : `👥 ${paxNum} passengers`
  const cargoLabel = cargo === 'none' ? '' : cargo === 'small' ? ' · 🎒 Small cargo' : ' · 📦 Large cargo'
  const distLabel  = distanceKm ? ` · 📍 ~${distanceKm.toFixed(1)} km` : ''

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

      {/* Trip summary bar */}
      <View style={s.summaryBar}>
        <Text style={s.summaryText}>{paxLabel}{cargoLabel}{distLabel}</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <Text style={s.heading}>Choose your vehicle</Text>

        {vehicles.map((v) => {
          const fare       = calcFare(v.baseFare, v.ratePerKm, distanceKm)
          const isSelected = selected === v.key
          const isDisabled = v.disabled

          return (
            <TouchableOpacity
              key={v.key}
              style={[
                s.vehicleCard,
                { borderColor: v.borderColor },
                isSelected && { borderColor: v.color, borderWidth: 2 },
                isDisabled  && s.vehicleCardDisabled,
              ]}
              onPress={() => !isDisabled && setSelected(v.key)}
              activeOpacity={isDisabled ? 1 : 0.75}
            >
              {/* Recommended badge */}
              {v.recommended && !isDisabled && (
                <View style={[s.recBadge, { backgroundColor: v.color }]}>
                  <Text style={s.recBadgeText}>⭐ {v.recommendedLabel}</Text>
                </View>
              )}

              {/* Card body */}
              <View style={[s.cardBody, { backgroundColor: v.bgColor }]}>
                {/* Left: emoji + info */}
                <View style={[s.vehicleLeft, isDisabled && { opacity: 0.45 }]}>
                  <Text style={s.vehicleEmoji}>{v.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.vehicleName, { color: v.color }]}>{v.name}</Text>
                    <Text style={s.vehicleTagline}>{v.tagline}</Text>
                  </View>
                </View>

                {/* Right: fare + selector */}
                <View style={s.vehicleRight}>
                  <Text style={[s.vehicleFare, { color: isDisabled ? C.textHint : v.color }]}>
                    ₱{fare}
                  </Text>
                  {!isDisabled && (
                    <View style={[
                      s.selectCircle,
                      isSelected && { backgroundColor: v.color, borderColor: v.color },
                    ]}>
                      {isSelected && <Text style={s.selectCheck}>✓</Text>}
                    </View>
                  )}
                </View>
              </View>

              {/* Capacity row */}
              <View style={s.capacityRow}>
                <View style={s.capacityDots}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <View
                      key={n}
                      style={[
                        s.capDot,
                        n <= v.capacity     && { backgroundColor: isDisabled ? C.textHint : v.color },
                        n <= v.capacity && n <= paxNum && !isDisabled && { opacity: 1 },
                        n <= v.capacity && n > paxNum  && !isDisabled && { opacity: 0.3 },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[s.capacityLabel, { color: isDisabled ? C.textHint : v.color }]}>
                  Max {v.capacity} pax
                </Text>
              </View>

              {/* Features or disabled reason */}
              {!isDisabled ? (
                <View style={s.featuresRow}>
                  {v.features.map((f, i) => (
                    <View key={i} style={[s.featureChip, { borderColor: v.borderColor, backgroundColor: 'rgba(255,255,255,0.8)' }]}>
                      <Text style={[s.featureText, { color: v.color }]}>{f}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={s.disabledBox}>
                  <Text style={s.disabledText}>🚫  {v.disabledReason}</Text>
                </View>
              )}
            </TouchableOpacity>
          )
        })}

        <View style={{ height: 12 }} />
      </ScrollView>

      {/* Footer */}
      <View style={s.footer}>
        {selectedVehicle && (
          <View style={s.fareRow}>
            <Text style={s.fareLabel}>{selectedVehicle.emoji} {selectedVehicle.name}</Text>
            <Text style={s.fareAmount}>₱{selectedFare}</Text>
          </View>
        )}
        <TouchableOpacity
          style={[s.bookBtn, !selected && s.bookBtnDisabled]}
          onPress={handleBook}
          disabled={!selected || loading}
          activeOpacity={0.85}
        >
          <Text style={s.bookBtnText}>
            {selected ? `Find a ${selectedVehicle?.name} →` : 'Select a Vehicle to Continue'}
          </Text>
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

  summaryBar:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: C.primaryLt, borderBottomWidth: 0.5, borderBottomColor: C.primaryMd },
  summaryText: { fontSize: 13, color: C.primary, fontWeight: '600' },

  scroll:   { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  heading:  { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 14 },

  vehicleCard:         { borderRadius: 18, borderWidth: 1.5, marginBottom: 14, overflow: 'hidden' },
  vehicleCardDisabled: { opacity: 0.6 },

  recBadge:     { paddingHorizontal: 12, paddingVertical: 5 },
  recBadgeText: { color: C.white, fontSize: 11, fontWeight: '700' },

  cardBody:    { flexDirection: 'row', alignItems: 'center', padding: 14, paddingBottom: 10 },
  vehicleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  vehicleEmoji:  { fontSize: 38 },
  vehicleName:   { fontSize: 17, fontWeight: '800', marginBottom: 2 },
  vehicleTagline:{ fontSize: 12, color: C.textSub },
  vehicleRight:  { alignItems: 'flex-end', gap: 8 },
  vehicleFare:   { fontSize: 22, fontWeight: '800' },
  selectCircle:  { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center', backgroundColor: C.white },
  selectCheck:   { color: C.white, fontSize: 13, fontWeight: '800' },

  capacityRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingBottom: 10 },
  capacityDots:  { flexDirection: 'row', gap: 4 },
  capDot:        { width: 14, height: 14, borderRadius: 7, backgroundColor: C.border },
  capacityLabel: { fontSize: 11, fontWeight: '700' },

  featuresRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 14, paddingBottom: 14 },
  featureChip: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  featureText: { fontSize: 11, fontWeight: '600' },

  disabledBox:  { marginHorizontal: 14, marginBottom: 14, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 10, padding: 10 },
  disabledText: { fontSize: 12, color: C.textHint, fontStyle: 'italic' },

  footer:      { paddingHorizontal: 16, paddingBottom: Platform.OS === 'android' ? 20 : 32, paddingTop: 12, backgroundColor: C.white, borderTopWidth: 0.5, borderTopColor: C.border, gap: 8 },
  fareRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  fareLabel:   { fontSize: 14, fontWeight: '600', color: C.textSub },
  fareAmount:  { fontSize: 20, fontWeight: '800', color: C.primary },

  bookBtn:         { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  bookBtnDisabled: { backgroundColor: C.primaryMd, elevation: 0, shadowOpacity: 0 },
  bookBtnText:     { color: C.white, fontSize: 16, fontWeight: '700' },
})
