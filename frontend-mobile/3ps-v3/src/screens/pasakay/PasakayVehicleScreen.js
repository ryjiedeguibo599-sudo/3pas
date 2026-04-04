import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView, Platform, Alert
} from 'react-native'
import API from '../../services/api'

const getVehicles = (passengers, cargo) => {
  const isBulky   = cargo === 'bulky'
  const isGroup   = passengers === '2-3'

  return [
    {
      key: 'motorcycle',
      name: 'Motorsiklo',
      emoji: '🏍️',
      tagline: 'Pinakamabilis na pagpipilian',
      features: ['1 pasahero', 'Maliit o walang karga', 'Best para sa mabilis na biyahe'],
      baseFare: 50,
      ratePerKm: 7,
      color: '#0F766E',
      bgColor: '#F0FDFA',
      borderColor: '#CCFBF1',
      disabled: isGroup || isBulky,
      disabledReason: isGroup
        ? 'Hindi angkop para sa 2–3 pasahero'
        : isBulky
        ? 'Hindi angkop para sa mabigat na karga'
        : null,
      recommended: !isGroup && !isBulky,
      recommendedLabel: 'Pinakamabilis',
    },
    {
      key: 'tricycle',
      name: 'Trisiklo',
      emoji: '🛺',
      tagline: 'Komportable para sa grupo',
      features: ['1–3 pasahero', 'Katamtamang karga', 'Angkop sa lokal na biyahe'],
      baseFare: 60,
      ratePerKm: 9,
      color: '#1D4ED8',
      bgColor: '#EFF6FF',
      borderColor: '#BFDBFE',
      disabled: isBulky,
      disabledReason: isBulky ? 'Hindi angkop para sa mabigat/malaking karga' : null,
      recommended: isGroup && !isBulky,
      recommendedLabel: 'Inirerekomenda para sa iyong biyahe',
    },
    {
      key: 'bao_bao',
      name: 'Bao-bao',
      emoji: '🚐',
      tagline: 'Para sa mabigat na karga',
      features: ['1–5 pasahero', 'Malaking karga', 'Pinaka-maluwag na sasakyan'],
      baseFare: 80,
      ratePerKm: 12,
      color: '#D97706',
      bgColor: '#FFFBEB',
      borderColor: '#FDE68A',
      disabled: false,
      disabledReason: null,
      recommended: isBulky,
      recommendedLabel: isBulky ? 'Inirerekomenda para sa iyong karga' : 'Para sa malaking grupo',
    },
  ]
}

const calcFare = (base, rate, distKm) => {
  if (!distKm) return base
  return Math.min(500, Math.max(base, Math.round(base + distKm * rate)))
}

export default function PasakayVehicleScreen({ navigation, route }) {
  const { pickup, dropoff, pickupCoords, dropoffCoords, passengers, cargo, distanceKm } = route.params || {}
  const [selected, setSelected] = useState(null)
  const [loading, setLoading]   = useState(false)

  const vehicles = getVehicles(passengers, cargo)

  // Auto-select recommended vehicle
  React.useEffect(() => {
    const rec = vehicles.find(v => v.recommended && !v.disabled)
    if (rec) setSelected(rec.key)
  }, [])

  const handleBook = async () => {
    if (!selected) {
      Alert.alert('Pumili ng Sasakyan', 'Mangyaring pumili ng uri ng sasakyan.')
      return
    }
    const vehicle = vehicles.find(v => v.key === selected)
    const fare    = calcFare(vehicle.baseFare, vehicle.ratePerKm, distanceKm)

    navigation.navigate('PasakayMatching', {
      pickup, dropoff, pickupCoords, dropoffCoords,
      passengers, cargo,
      vehicleType: selected,
      vehicleName: vehicle.name,
      vehicleEmoji: vehicle.emoji,
      fare,
      distanceKm,
    })
  }

  const selectedVehicle = vehicles.find(v => v.key === selected)

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0FDFA" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Piliin ang Sasakyan</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* PROGRESS */}
      <View style={styles.progressBar}>
        {[1,2,3,4].map((step, i) => (
          <React.Fragment key={step}>
            <View style={[styles.progressStep, step <= 3 && styles.progressDone]}>
              <Text style={styles.progressStepText}>{step <= 2 ? '✓' : step}</Text>
            </View>
            {i < 3 && <View style={[styles.progressLine, step < 3 && { backgroundColor: '#0F766E' }]} />}
          </React.Fragment>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* TRIP SUMMARY PILL */}
        <View style={styles.summaryPill}>
          <Text style={styles.summaryText}>
            {passengers === '1' ? '🧍 1 tao' : '👥 2–3 tao'}
            {'  ·  '}
            {cargo === 'none' ? '🚫 Walang karga' : cargo === 'small' ? '🎒 Maliit na karga' : '📦 Bulky na karga'}
          </Text>
        </View>

        {/* VEHICLES */}
        {vehicles.map((v) => {
          const fare       = calcFare(v.baseFare, v.ratePerKm, distanceKm)
          const isSelected = selected === v.key

          return (
            <TouchableOpacity
              key={v.key}
              style={[
                styles.vehicleCard,
                { borderColor: v.borderColor, backgroundColor: v.bgColor },
                isSelected && { borderColor: v.color, borderWidth: 2 },
                v.disabled && styles.vehicleDisabled,
              ]}
              onPress={() => !v.disabled && setSelected(v.key)}
              activeOpacity={v.disabled ? 1 : 0.75}
            >
              {/* RECOMMENDED BADGE */}
              {v.recommended && !v.disabled && (
                <View style={[styles.recBadge, { backgroundColor: v.color }]}>
                  <Text style={styles.recBadgeText}>⭐ {v.recommendedLabel}</Text>
                </View>
              )}

              <View style={styles.vehicleTop}>
                {/* EMOJI + NAME */}
                <View style={styles.vehicleLeft}>
                  <Text style={[styles.vehicleEmoji, v.disabled && { opacity: 0.4 }]}>{v.emoji}</Text>
                  <View>
                    <Text style={[styles.vehicleName, v.disabled && { color: '#94A3B8' }]}>
                      {v.name}
                    </Text>
                    <Text style={[styles.vehicleTagline, v.disabled && { color: '#CBD5E1' }]}>
                      {v.tagline}
                    </Text>
                  </View>
                </View>

                {/* FARE + SELECT */}
                <View style={styles.vehicleRight}>
                  <Text style={[styles.vehicleFare, { color: v.disabled ? '#CBD5E1' : v.color }]}>
                    ₱{fare}
                  </Text>
                  {!v.disabled && (
                    <View style={[
                      styles.selectCircle,
                      isSelected && { backgroundColor: v.color, borderColor: v.color }
                    ]}>
                      {isSelected && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✓</Text>}
                    </View>
                  )}
                </View>
              </View>

              {/* FEATURES */}
              {!v.disabled && (
                <View style={styles.featuresRow}>
                  {v.features.map((f, i) => (
                    <View key={i} style={[styles.featureChip, { borderColor: v.borderColor }]}>
                      <Text style={[styles.featureText, { color: v.color }]}>{f}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* DISABLED REASON */}
              {v.disabled && (
                <View style={styles.disabledNote}>
                  <Text style={styles.disabledNoteText}>⚠️ {v.disabledReason}</Text>
                </View>
              )}
            </TouchableOpacity>
          )
        })}

        {/* BOOK BUTTON */}
        <TouchableOpacity
          style={[styles.bookBtn, !selected && styles.bookBtnDisabled]}
          onPress={handleBook}
          disabled={!selected || loading}
          activeOpacity={0.85}
        >
          <Text style={styles.bookBtnText}>
            {selected
              ? `Hanapin ang ${selectedVehicle?.name} →`
              : 'Pumili ng Sasakyan'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0FDFA' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 8 : 4,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#CCFBF1', alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { fontSize: 22, color: '#0F766E', fontWeight: '700', lineHeight: 28 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#134E4A' },

  progressBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 32, paddingBottom: 16,
  },
  progressStep: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center',
  },
  progressDone: { backgroundColor: '#0F766E' },
  progressStepText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  progressLine: { flex: 1, height: 2, backgroundColor: '#CCFBF1' },

  scroll: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 20 },

  summaryPill: {
    backgroundColor: '#fff', borderRadius: 20, borderWidth: 1,
    borderColor: '#CCFBF1', paddingVertical: 8, paddingHorizontal: 16,
    alignSelf: 'flex-start', marginBottom: 20,
  },
  summaryText: { fontSize: 12, color: '#0F766E', fontWeight: '600' },

  vehicleCard: {
    borderRadius: 18, borderWidth: 1.5,
    marginBottom: 14, padding: 16,
    overflow: 'hidden',
  },
  vehicleDisabled: { opacity: 0.55 },

  recBadge: {
    alignSelf: 'flex-start', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    marginBottom: 12,
  },
  recBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  vehicleTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  vehicleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  vehicleEmoji: { fontSize: 36 },
  vehicleName: { fontSize: 16, fontWeight: '700', color: '#134E4A', marginBottom: 2 },
  vehicleTagline: { fontSize: 12, color: '#64748B' },
  vehicleRight: { alignItems: 'flex-end', gap: 8 },
  vehicleFare: { fontSize: 20, fontWeight: '800' },
  selectCircle: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: '#CCFBF1',
    alignItems: 'center', justifyContent: 'center',
  },

  featuresRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  featureChip: {
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.7)',
  },
  featureText: { fontSize: 11, fontWeight: '600' },

  disabledNote: {
    backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 10,
    padding: 8, marginTop: 4,
  },
  disabledNoteText: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic' },

  bookBtn: {
    backgroundColor: '#0F766E', borderRadius: 14,
    paddingVertical: 15, alignItems: 'center', marginTop: 8,
  },
  bookBtnDisabled: { backgroundColor: '#99F6E4' },
  bookBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
})