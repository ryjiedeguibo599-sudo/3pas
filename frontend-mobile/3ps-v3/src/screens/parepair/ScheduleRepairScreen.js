import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Platform, Alert
} from 'react-native'

const BLUE    = '#1d4ed8'
const BLUE_BG = '#eff6ff'

const TIME_SLOTS = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
]

const getNext7Days = () => {
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    days.push({
      label: i === 0 ? 'Ngayon' : i === 1 ? 'Bukas' : d.toLocaleDateString('fil-PH', { weekday: 'short', month: 'short', day: 'numeric' }),
      full:  d.toLocaleDateString('fil-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    })
  }
  return days
}

export default function ScheduleRepairScreen({ navigation, route }) {
  const params = route.params || {}

  const [asap, setAsap]                 = useState(true)
  const [selectedDay, setSelectedDay]   = useState(null)
  const [selectedTime, setSelectedTime] = useState('')

  const days = getNext7Days()

  const handleNext = () => {
    if (!asap && !selectedDay) {
      Alert.alert('Kulang', 'Pakiusap pumili ng araw.')
      return
    }
    if (!asap && !selectedTime) {
      Alert.alert('Kulang', 'Pakiusap pumili ng oras.')
      return
    }
    navigation.navigate('ConfirmRepair', {
      ...params,
      schedule:     asap ? 'As soon as possible' : `${selectedDay?.full} ${selectedTime}`,
      scheduleAsap: asap,
    })
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Text style={{ fontSize: 16 }}>🔧</Text>
            </View>
            <Text style={styles.title}>Pa-Repair</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* ── Steps ── */}
        <View style={styles.stepsRow}>
          {['Lokasyon', 'Uri', 'Detalye', 'Iskedyul', 'Review'].map((s, i) => (
            <View key={s} style={styles.stepItem}>
              <View style={[styles.stepDot, i < 4 && styles.stepDotActive]}>
                <Text style={[styles.stepNum, i < 4 && styles.stepNumActive]}>{i + 1}</Text>
              </View>
              <Text style={[styles.stepLabel, i < 4 && styles.stepLabelActive]}>{s}</Text>
            </View>
          ))}
        </View>

        {/* ── Page heading ── */}
        <View style={styles.pageHeading}>
          <Text style={styles.pageTitle}>Kailan mo kailangan?</Text>
          <Text style={styles.pageSubtitle}>Pumili ng schedule para sa iyong repair service.</Text>
        </View>

        {/* ── ASAP Option ── */}
        <TouchableOpacity
          style={[styles.optionCard, asap && styles.optionCardActive]}
          onPress={() => setAsap(true)}
          activeOpacity={0.8}
        >
          <View style={styles.optionLeft}>
            <View style={[styles.optionRadio, asap && styles.optionRadioActive]}>
              {asap && <View style={styles.optionRadioDot} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.optionTitle, asap && styles.optionTitleActive]}>
                ⚡ As soon as possible
              </Text>
              <Text style={styles.optionDesc}>
                Magpadala ng technician sa lalong madaling panahon
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* ── Scheduled Option ── */}
        <TouchableOpacity
          style={[styles.optionCard, !asap && styles.optionCardActive]}
          onPress={() => setAsap(false)}
          activeOpacity={0.8}
        >
          <View style={styles.optionLeft}>
            <View style={[styles.optionRadio, !asap && styles.optionRadioActive]}>
              {!asap && <View style={styles.optionRadioDot} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.optionTitle, !asap && styles.optionTitleActive]}>
                📅 Pumili ng Petsa at Oras
              </Text>
              <Text style={styles.optionDesc}>
                I-schedule ang repair sa iyong preferred na oras
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* ── Day & Time (shown if not ASAP) ── */}
        {!asap && (
          <View style={styles.scheduleCard}>

            <Text style={styles.label}>Pumili ng Araw</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {days.map((day, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.dayChip, selectedDay?.full === day.full && styles.dayChipActive]}
                  onPress={() => setSelectedDay(day)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dayChipText, selectedDay?.full === day.full && styles.dayChipTextActive]}>
                    {day.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedDay && (
              <View style={styles.selectedDayPreview}>
                <Text style={styles.selectedDayText}>📅 {selectedDay.full}</Text>
              </View>
            )}

            <Text style={[styles.label, { marginTop: 16 }]}>Pumili ng Oras</Text>
            <View style={styles.timeGrid}>
              {TIME_SLOTS.map(slot => (
                <TouchableOpacity
                  key={slot}
                  style={[styles.timeSlot, selectedTime === slot && styles.timeSlotActive]}
                  onPress={() => setSelectedTime(slot)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.timeSlotText, selectedTime === slot && styles.timeSlotTextActive]}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Preview ── */}
        <View style={styles.previewCard}>
          <Text style={styles.previewIcon}>🗓️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.previewLabel}>Napiling Schedule</Text>
            <Text style={styles.previewValue}>
              {asap
                ? '⚡ As soon as possible'
                : selectedDay && selectedTime
                  ? `${selectedDay.full}\n${selectedTime}`
                  : selectedDay
                    ? `${selectedDay.full}\nWalang oras pa`
                    : 'Walang napili pa'
              }
            </Text>
          </View>
        </View>

        {/* ── Next ── */}
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.nextBtnText}>Susunod: I-review →</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: '#f8fafc' },
  container:         { flex: 1 },

  header:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 48 : 12, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' },
  backBtn:           { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  backIcon:          { fontSize: 22, color: BLUE, fontWeight: '600', lineHeight: 28 },
  logoRow:           { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon:          { width: 32, height: 32, borderRadius: 8, backgroundColor: BLUE_BG, alignItems: 'center', justifyContent: 'center' },
  title:             { fontSize: 18, fontWeight: '700', color: '#0f172a' },

  stepsRow:          { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' },
  stepItem:          { alignItems: 'center', gap: 3 },
  stepDot:           { width: 24, height: 24, borderRadius: 12, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  stepDotActive:     { backgroundColor: BLUE, borderColor: BLUE, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepNum:           { fontSize: 11, fontWeight: '700', color: '#94a3b8' },
  stepNumActive:     { fontSize: 11, fontWeight: '700', color: '#fff' },
  stepLabel:         { fontSize: 9, color: '#94a3b8', fontWeight: '600' },
  stepLabelActive:   { fontSize: 9, color: BLUE, fontWeight: '600' },

  pageHeading:       { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 4 },
  pageTitle:         { fontSize: 22, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  pageSubtitle:      { fontSize: 13, color: '#64748b', lineHeight: 18 },

  optionCard:        { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginHorizontal: 16, marginTop: 12, borderWidth: 1.5, borderColor: '#e2e8f0' },
  optionCardActive:  { borderColor: BLUE, backgroundColor: BLUE_BG },
  optionLeft:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionRadio:       { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
  optionRadioActive: { borderColor: BLUE },
  optionRadioDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: BLUE },
  optionTitle:       { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  optionTitleActive: { color: BLUE },
  optionDesc:        { fontSize: 12, color: '#64748b', lineHeight: 17 },

  scheduleCard:      { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginHorizontal: 16, marginTop: 12, borderWidth: 0.5, borderColor: '#e2e8f0' },
  label:             { fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 8 },

  dayChip:           { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#f8fafc', borderWidth: 0.5, borderColor: '#e2e8f0', marginRight: 8 },
  dayChipActive:     { backgroundColor: BLUE, borderColor: BLUE },
  dayChipText:       { fontSize: 12, fontWeight: '600', color: '#64748b' },
  dayChipTextActive: { color: '#fff' },

  selectedDayPreview: { backgroundColor: BLUE_BG, borderRadius: 10, padding: 10, marginBottom: 4, borderWidth: 0.5, borderColor: '#bfdbfe' },
  selectedDayText:    { fontSize: 13, fontWeight: '600', color: BLUE },

  timeGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeSlot:          { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: '#f8fafc', borderWidth: 0.5, borderColor: '#e2e8f0' },
  timeSlotActive:    { backgroundColor: BLUE, borderColor: BLUE },
  timeSlotText:      { fontSize: 13, fontWeight: '600', color: '#64748b' },
  timeSlotTextActive:{ color: '#fff' },

  previewCard:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: BLUE_BG, borderRadius: 16, padding: 14, marginHorizontal: 16, marginTop: 14, borderWidth: 0.5, borderColor: '#bfdbfe' },
  previewIcon:       { fontSize: 28 },
  previewLabel:      { fontSize: 11, color: '#3b82f6', fontWeight: '700', marginBottom: 3 },
  previewValue:      { fontSize: 13, color: '#1e40af', fontWeight: '600', lineHeight: 18 },

  nextBtn:           { backgroundColor: BLUE, marginHorizontal: 16, marginTop: 20, borderRadius: 14, paddingVertical: 16, alignItems: 'center', shadowColor: BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  nextBtnText:       { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
})