import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView, Platform
} from 'react-native'

const PASSENGERS = [
  { key: '1', label: '1 tao', emoji: '🧍', note: 'Solo' },
  { key: '2-3', label: '2–3 tao', emoji: '👥', note: 'Grupo' },
]

const CARGO = [
  { key: 'none', label: 'Walang karga', emoji: '🚫', note: '' },
  { key: 'small', label: 'Maliit', emoji: '🎒', note: 'Bag o maliit na pakete' },
  { key: 'bulky', label: 'Malaki / Bulky', emoji: '📦', note: 'Mabigat o malaking bagahe' },
]

export default function PasakayTripDetails({ navigation, route }) {
  const { pickup, dropoff, pickupCoords, dropoffCoords } = route.params || {}
  const [passengers, setPassengers] = useState('1')
  const [cargo, setCargo]           = useState('none')

  const handleContinue = () => {
    navigation.navigate('PasakayVehicle', {
      pickup, dropoff, pickupCoords, dropoffCoords,
      passengers, cargo,
    })
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0FDFA" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalye ng Biyahe</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* PROGRESS */}
      <View style={styles.progressBar}>
        <View style={[styles.progressStep, styles.progressDone]}>
          <Text style={styles.progressStepText}>✓</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={[styles.progressStep, styles.progressActive]}>
          <Text style={styles.progressStepText}>2</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressStep}>
          <Text style={[styles.progressStepText, { color: '#94A3B8' }]}>3</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressStep}>
          <Text style={[styles.progressStepText, { color: '#94A3B8' }]}>4</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ROUTE SUMMARY */}
        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: '#0F766E' }]} />
            <Text style={styles.routeText} numberOfLines={1}>{pickup}</Text>
          </View>
          <View style={styles.routeConnector} />
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.routeText} numberOfLines={1}>{dropoff}</Text>
          </View>
        </View>

        {/* PASSENGERS */}
        <Text style={styles.sectionTitle}>Ilan ang sasakay?</Text>
        <View style={styles.chipsRow}>
          {PASSENGERS.map(p => (
            <TouchableOpacity
              key={p.key}
              style={[styles.chip, passengers === p.key && styles.chipActive]}
              onPress={() => setPassengers(p.key)}
              activeOpacity={0.75}
            >
              <Text style={styles.chipEmoji}>{p.emoji}</Text>
              <View>
                <Text style={[styles.chipLabel, passengers === p.key && styles.chipLabelActive]}>
                  {p.label}
                </Text>
                {p.note ? (
                  <Text style={[styles.chipNote, passengers === p.key && styles.chipNoteActive]}>
                    {p.note}
                  </Text>
                ) : null}
              </View>
              {passengers === p.key && (
                <View style={styles.checkBadge}>
                  <Text style={styles.checkBadgeText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* CARGO */}
        <Text style={styles.sectionTitle}>May dala bang karga?</Text>
        <View style={styles.chipsCol}>
          {CARGO.map(c => (
            <TouchableOpacity
              key={c.key}
              style={[styles.chipWide, cargo === c.key && styles.chipActive]}
              onPress={() => setCargo(c.key)}
              activeOpacity={0.75}
            >
              <Text style={styles.chipEmoji}>{c.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.chipLabel, cargo === c.key && styles.chipLabelActive]}>
                  {c.label}
                </Text>
                {c.note ? (
                  <Text style={[styles.chipNote, cargo === c.key && styles.chipNoteActive]}>
                    {c.note}
                  </Text>
                ) : null}
              </View>
              {cargo === c.key && (
                <View style={styles.checkBadge}>
                  <Text style={styles.checkBadgeText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* CONTINUE */}
        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.85}>
          <Text style={styles.continueBtnText}>Piliin ang Sasakyan →</Text>
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
    backgroundColor: '#F0FDFA',
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
  progressActive: { backgroundColor: '#0F766E' },
  progressStepText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  progressLine: { flex: 1, height: 2, backgroundColor: '#CCFBF1' },

  scroll: { paddingHorizontal: 20, paddingTop: 4 },

  routeCard: {
    backgroundColor: '#fff', borderRadius: 16,
    padding: 16, marginBottom: 24,
    borderWidth: 1, borderColor: '#CCFBF1',
  },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  routeText: { fontSize: 13, color: '#134E4A', fontWeight: '500', flex: 1 },
  routeConnector: { width: 2, height: 10, backgroundColor: '#CCFBF1', marginLeft: 4, marginVertical: 4 },

  sectionTitle: {
    fontSize: 15, fontWeight: '700', color: '#134E4A',
    marginBottom: 12,
  },

  chipsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  chipsCol: { gap: 10, marginBottom: 28 },

  chip: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14,
    padding: 14, gap: 10,
    borderWidth: 1.5, borderColor: '#CCFBF1',
  },
  chipWide: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14,
    padding: 14, gap: 12,
    borderWidth: 1.5, borderColor: '#CCFBF1',
  },
  chipActive: {
    borderColor: '#0F766E',
    backgroundColor: '#F0FDFA',
  },
  chipEmoji: { fontSize: 22 },
  chipLabel: { fontSize: 14, fontWeight: '600', color: '#134E4A' },
  chipLabelActive: { color: '#0F766E' },
  chipNote: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  chipNoteActive: { color: '#0F766E' },
  checkBadge: {
    marginLeft: 'auto',
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#0F766E', alignItems: 'center', justifyContent: 'center',
  },
  checkBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  continueBtn: {
    backgroundColor: '#0F766E', borderRadius: 14,
    paddingVertical: 15, alignItems: 'center',
  },
  continueBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
})