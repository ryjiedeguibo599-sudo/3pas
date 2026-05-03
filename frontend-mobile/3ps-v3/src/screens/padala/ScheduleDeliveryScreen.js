import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Platform, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StepBar } from './PadalaScreen'
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
}

const TIME_SLOTS = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
]

const STEPS = ['Location', 'Sender', 'Item', 'Schedule', 'Review']

const getNext7Days = () => {
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    days.push({
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      full:  d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    })
  }
  return days
}

export default function ScheduleDeliveryScreen({ navigation, route }) {
  const params = route.params || {}

  const [asap, setAsap]                 = useState(true)
  const [selectedDay, setSelectedDay]   = useState(null)
  const [selectedTime, setSelectedTime] = useState('')

  const days = getNext7Days()

  const handleNext = () => {
    if (!asap && !selectedDay) {
      Alert.alert('Missing info', 'Please select a day.')
      return
    }
    if (!asap && !selectedTime) {
      Alert.alert('Missing info', 'Please select a time slot.')
      return
    }
    navigation.navigate('ConfirmDelivery', {
      ...params,
      schedule:     asap ? 'As soon as possible' : `${selectedDay?.full} ${selectedTime}`,
      scheduleAsap: asap,
    })
  }

  return (
    <SafeAreaView style={s.safe}>
      <StepBar current={3} />

      <View style={s.navBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backIcon}>‹</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.pageHeading}>
          <Text style={s.pageTitle}>When do you need it?</Text>
          <Text style={s.pageSubtitle}>Choose a schedule for your Padaya delivery.</Text>
        </View>

        {/* ASAP */}
        <TouchableOpacity
          style={[s.optionCard, asap && s.optionCardActive]}
          onPress={() => setAsap(true)}
          activeOpacity={0.8}
        >
          <View style={s.optionLeft}>
            <View style={[s.optionRadio, asap && s.optionRadioActive]}>
              {asap && <View style={s.optionRadioDot} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.optionTitle, asap && s.optionTitleActive]}>⚡ As soon as possible</Text>
              <Text style={s.optionDesc}>A provider will be dispatched right away</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Scheduled */}
        <TouchableOpacity
          style={[s.optionCard, !asap && s.optionCardActive]}
          onPress={() => setAsap(false)}
          activeOpacity={0.8}
        >
          <View style={s.optionLeft}>
            <View style={[s.optionRadio, !asap && s.optionRadioActive]}>
              {!asap && <View style={s.optionRadioDot} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.optionTitle, !asap && s.optionTitleActive]}>📅 Choose a Date & Time</Text>
              <Text style={s.optionDesc}>Schedule the delivery at your preferred time</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Day & Time picker */}
        {!asap && (
          <View style={s.scheduleCard}>
            <Text style={s.label}>Select a Day</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {days.map((day, i) => (
                <TouchableOpacity
                  key={i}
                  style={[s.dayChip, selectedDay?.full === day.full && s.dayChipActive]}
                  onPress={() => setSelectedDay(day)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.dayChipText, selectedDay?.full === day.full && s.dayChipTextActive]}>
                    {day.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedDay && (
              <View style={s.selectedDayPreview}>
                <Text style={s.selectedDayText}>📅 {selectedDay.full}</Text>
              </View>
            )}

            <Text style={[s.label, { marginTop: 16 }]}>Select a Time</Text>
            <View style={s.timeGrid}>
              {TIME_SLOTS.map(slot => (
                <TouchableOpacity
                  key={slot}
                  style={[s.timeSlot, selectedTime === slot && s.timeSlotActive]}
                  onPress={() => setSelectedTime(slot)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.timeSlotText, selectedTime === slot && s.timeSlotTextActive]}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Preview */}
        <View style={s.previewCard}>
          <Text style={s.previewIcon}>🗓️</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.previewLabel}>Selected Schedule</Text>
            <Text style={s.previewValue}>
              {asap
                ? '⚡ As soon as possible'
                : selectedDay && selectedTime
                  ? `${selectedDay.full}\n${selectedTime}`
                  : selectedDay
                    ? `${selectedDay.full}\nNo time selected yet`
                    : 'Nothing selected yet'
              }
            </Text>
          </View>
        </View>

        <TouchableOpacity style={s.nextBtn} onPress={handleNext} activeOpacity={0.85}>
          <Text style={s.nextBtnText}>Next: Padaya Review →</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.bg },
  scroll:  { flex: 1 },
  navBar:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: Platform.OS === 'android' ? 8 : 4, paddingBottom: 8, backgroundColor: C.white },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.primaryLt, alignItems: 'center', justifyContent: 'center' },
  backIcon:{ fontSize: 22, color: C.primary, fontWeight: '600', lineHeight: 28 },
  stepLabel:       { fontSize: 9, color: C.textHint, fontWeight: '600' },
  stepLabelActive: { color: C.primary },

  pageHeading:  { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 4 },
  pageTitle:    { fontSize: 22, fontWeight: '700', color: C.text, marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: C.textSub, lineHeight: 18 },

  optionCard:        { backgroundColor: C.white, borderRadius: 16, padding: 16, marginHorizontal: 16, marginTop: 12, borderWidth: 1.5, borderColor: C.border },
  optionCardActive:  { borderColor: C.primary, backgroundColor: C.primaryLt },
  optionLeft:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionRadio:       { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
  optionRadioActive: { borderColor: C.primary },
  optionRadioDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary },
  optionTitle:       { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 2 },
  optionTitleActive: { color: C.primary },
  optionDesc:        { fontSize: 12, color: C.textSub, lineHeight: 17 },

  scheduleCard:       { backgroundColor: C.white, borderRadius: 16, padding: 16, marginHorizontal: 16, marginTop: 12, borderWidth: 0.5, borderColor: C.border },
  label:              { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 8 },
  dayChip:            { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: C.bg, borderWidth: 0.5, borderColor: C.border, marginRight: 8 },
  dayChipActive:      { backgroundColor: C.primary, borderColor: C.primary },
  dayChipText:        { fontSize: 12, fontWeight: '600', color: C.textSub },
  dayChipTextActive:  { color: C.white },
  selectedDayPreview: { backgroundColor: C.primaryLt, borderRadius: 10, padding: 10, marginBottom: 4, borderWidth: 0.5, borderColor: C.primaryMd },
  selectedDayText:    { fontSize: 13, fontWeight: '600', color: C.primary },
  timeGrid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeSlot:           { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: C.bg, borderWidth: 0.5, borderColor: C.border },
  timeSlotActive:     { backgroundColor: C.primary, borderColor: C.primary },
  timeSlotText:       { fontSize: 13, fontWeight: '600', color: C.textSub },
  timeSlotTextActive: { color: C.white },

  previewCard:  { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.primaryLt, borderRadius: 16, padding: 14, marginHorizontal: 16, marginTop: 14, borderWidth: 0.5, borderColor: C.primaryMd },
  previewIcon:  { fontSize: 28 },
  previewLabel: { fontSize: 11, color: '#3B82F6', fontWeight: '700', marginBottom: 3 },
  previewValue: { fontSize: 13, color: '#1E40AF', fontWeight: '600', lineHeight: 18 },

  nextBtn:     { backgroundColor: C.primary, marginHorizontal: 16, marginTop: 20, borderRadius: 14, paddingVertical: 16, alignItems: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  nextBtnText: { color: C.white, fontSize: 16, fontWeight: '700' },
})
