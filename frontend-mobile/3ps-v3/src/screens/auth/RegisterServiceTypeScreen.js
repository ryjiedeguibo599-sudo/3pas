import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, StatusBar, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import API from '../../services/api'

const C = {
  primary:   '#2563EB',
  primaryLt: '#EFF6FF',
  primaryMd: '#BFDBFE',
  text:      '#0F172A',
  textSub:   '#475569',
  textHint:  '#94A3B8',
  border:    '#E2E8F0',
  bg:        '#F8FAFF',
  white:     '#FFFFFF',
  orange:    '#EA580C',
  green:     '#059669',
  purple:    '#4F46E5',
}

const SERVICES = [
  {
    type: 'pasabuy',
    label: 'Pasabuy',
    desc: 'Buy and deliver groceries for residents',
    emoji: '🛒',
    acc: C.orange,
    bg: '#FFF7ED',
    perks: ['Earn per order', 'Flexible hours', 'Choose your area'],
  },
  {
    type: 'pasakay',
    label: 'Pasakay',
    desc: 'Drive residents around Bacuag',
    emoji: '🛵',
    acc: C.green,
    bg: '#ECFDF5',
    perks: ['Per-trip earnings', 'Use your own bike', 'Set your schedule'],
  },
  {
    type: 'parepair',
    label: 'Padala',
    desc: 'Deliver packages, documents, and more',
    emoji: '📦',
    acc: C.purple,
    bg: '#EEF2FF',
    perks: ['Per-delivery earnings', 'No long shifts', 'Quick trips'],
  },
]

export default function RegisterServiceTypeScreen({ route, navigation }) {
  const params = route.params || {}
  const [selected, setSelected] = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleNext = async () => {
    if (!selected) {
      Alert.alert('Select a service', 'Please choose the service you want to provide.')
      return
    }
    try {
      setLoading(true)
      await API.post('/auth/send-otp', { email: params.email })
      navigation.navigate('RegisterOTP', { ...params, serviceType: selected })
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: '40%' }]} />
          </View>
          <Text style={s.progressText}>Step 1.5 of 3</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <View style={s.heading}>
          <Text style={s.title}>Choose Your Service</Text>
          <Text style={s.sub}>
            Pick one service you want to offer. You can only provide one service per account.
          </Text>
        </View>

        {SERVICES.map(svc => {
          const active = selected === svc.type
          return (
            <TouchableOpacity
              key={svc.type}
              style={[
                s.card,
                { backgroundColor: svc.bg },
                active && { borderColor: svc.acc, borderWidth: 2 },
              ]}
              onPress={() => setSelected(svc.type)}
              activeOpacity={0.8}
            >
              <View style={s.cardHeader}>
                <View style={[s.iconBox, { backgroundColor: svc.acc + '20' }]}>
                  <Text style={s.icon}>{svc.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.cardTitle, { color: svc.acc }]}>{svc.label}</Text>
                  <Text style={s.cardDesc}>{svc.desc}</Text>
                </View>
                <View style={[s.radio, active && { borderColor: svc.acc, backgroundColor: svc.acc }]}>
                  {active && <Text style={s.radioCheck}>✓</Text>}
                </View>
              </View>

              <View style={s.perksRow}>
                {svc.perks.map((p, i) => (
                  <View key={i} style={[s.perkChip, { borderColor: svc.acc + '40' }]}>
                    <Text style={[s.perkText, { color: svc.acc }]}>{p}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          )
        })}

        <View style={s.notice}>
          <Text style={s.noticeIcon}>ℹ️</Text>
          <Text style={s.noticeText}>
            Your service type cannot be changed later. If you want to offer multiple services, you'll need separate accounts.
          </Text>
        </View>

      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.btnNext, (!selected || loading) && s.btnDisabled]}
          onPress={handleNext}
          disabled={!selected || loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnNextText}>Continue →</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  topBar:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14, backgroundColor: C.white, borderBottomWidth: 0.5, borderBottomColor: C.border },
  backBtn:      { width: 36, height: 36, borderRadius: 10, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  backIcon:     { fontSize: 24, color: C.text, fontWeight: '600', lineHeight: 30 },
  progressBar:  { height: 5, borderRadius: 3, backgroundColor: C.border, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: '100%', backgroundColor: C.primary, borderRadius: 3 },
  progressText: { fontSize: 11, color: C.textSub, fontWeight: '600' },

  scroll:  { padding: 16, gap: 12 },
  heading: { gap: 4, marginBottom: 4 },
  title:   { fontSize: 22, fontWeight: '800', color: C.text },
  sub:     { fontSize: 13, color: C.textSub, lineHeight: 19 },

  card:       { borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox:    { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  icon:       { fontSize: 24 },
  cardTitle:  { fontSize: 16, fontWeight: '800' },
  cardDesc:   { fontSize: 12, color: C.textSub, marginTop: 2 },
  radio:      { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  radioCheck: { fontSize: 13, color: '#fff', fontWeight: '800' },

  perksRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  perkChip:  { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, borderWidth: 1, backgroundColor: '#fff' },
  perkText:  { fontSize: 10, fontWeight: '600' },

  notice:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FFFBEB', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#FDE68A', marginTop: 4 },
  noticeIcon: { fontSize: 14 },
  noticeText: { flex: 1, fontSize: 11, color: '#92400E', lineHeight: 16 },

  footer:      { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, backgroundColor: C.white, borderTopWidth: 0.5, borderTopColor: C.border },
  btnNext:     { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  btnDisabled: { backgroundColor: '#CBD5E1', shadowOpacity: 0 },
  btnNextText: { color: '#fff', fontSize: 15, fontWeight: '700' },
})
