import React, { useState, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StepBar } from './PadalaScreen'

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
  red:       '#EF4444',
  green:     '#16A34A',
}

const Field = ({ label, required, error, children }) => (
  <View style={s.fieldWrap}>
    <Text style={s.fieldLabel}>
      {label}{required && <Text style={{ color: C.red }}> *</Text>}
    </Text>
    {children}
    {!!error && <Text style={s.fieldError}>{error}</Text>}
  </View>
)

export default function PadalaStep2Screen({ route, navigation }) {
  const prev = route.params || {}

  const [senderName,    setSenderName]    = useState('')
  const [senderPhone,   setSenderPhone]   = useState('')
  const [receiverName,  setReceiverName]  = useState('')
  const [receiverPhone, setReceiverPhone] = useState('')
  const [receiverNote,  setReceiverNote]  = useState('')
  const [errors,        setErrors]        = useState({})

  const senderPhoneRef   = useRef()
  const receiverNameRef  = useRef()
  const receiverPhoneRef = useRef()
  const receiverNoteRef  = useRef()

  const clr = (field) => setErrors(p => ({ ...p, [field]: null }))

  const handleNext = () => {
    const e = {}
    if (!senderName.trim())    e.senderName    = 'Required'
    if (!senderPhone.trim())   e.senderPhone   = 'Required'
    if (!receiverName.trim())  e.receiverName  = 'Required'
    if (!receiverPhone.trim()) e.receiverPhone = 'Required'
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setErrors({})
    navigation.navigate('PadalaStep3', {
      ...prev,
      senderName:    senderName.trim(),
      senderPhone:   senderPhone.trim(),
      receiverName:  receiverName.trim(),
      receiverPhone: receiverPhone.trim(),
      receiverNote:  receiverNote.trim(),
    })
  }

  return (
    <SafeAreaView style={s.safe}>
      <StepBar current={2} />

      <View style={s.navBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backIcon}>‹</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Sender ── */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <View style={[s.headerDot, { backgroundColor: C.green }]} />
            <Text style={s.cardTitle}>Sender</Text>
            <Text style={s.cardSub}>Your info</Text>
          </View>

          <Field label="Full Name" required error={errors.senderName}>
            <TextInput
              style={[s.input, errors.senderName && s.inputError]}
              placeholder="e.g. Juan dela Cruz"
              placeholderTextColor={C.textHint}
              value={senderName}
              onChangeText={v => { setSenderName(v); clr('senderName') }}
              returnKeyType="next"
              onSubmitEditing={() => senderPhoneRef.current?.focus()}
              blurOnSubmit={false}
            />
          </Field>

          <Field label="Contact Number" required error={errors.senderPhone}>
            <TextInput
              ref={senderPhoneRef}
              style={[s.input, errors.senderPhone && s.inputError]}
              placeholder="09XX XXX XXXX"
              placeholderTextColor={C.textHint}
              value={senderPhone}
              onChangeText={v => { setSenderPhone(v); clr('senderPhone') }}
              keyboardType="phone-pad"
              returnKeyType="next"
              onSubmitEditing={() => receiverNameRef.current?.focus()}
              blurOnSubmit={false}
            />
          </Field>
        </View>

        {/* ── Recipient ── */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <View style={[s.headerDot, { backgroundColor: C.primary }]} />
            <Text style={s.cardTitle}>Recipient</Text>
            <Text style={s.cardSub}>Who receives the package</Text>
          </View>

          <Field label="Full Name" required error={errors.receiverName}>
            <TextInput
              ref={receiverNameRef}
              style={[s.input, errors.receiverName && s.inputError]}
              placeholder="e.g. Maria Santos"
              placeholderTextColor={C.textHint}
              value={receiverName}
              onChangeText={v => { setReceiverName(v); clr('receiverName') }}
              returnKeyType="next"
              onSubmitEditing={() => receiverPhoneRef.current?.focus()}
              blurOnSubmit={false}
            />
          </Field>

          <Field label="Contact Number" required error={errors.receiverPhone}>
            <TextInput
              ref={receiverPhoneRef}
              style={[s.input, errors.receiverPhone && s.inputError]}
              placeholder="09XX XXX XXXX"
              placeholderTextColor={C.textHint}
              value={receiverPhone}
              onChangeText={v => { setReceiverPhone(v); clr('receiverPhone') }}
              keyboardType="phone-pad"
              returnKeyType="next"
              onSubmitEditing={() => receiverNoteRef.current?.focus()}
              blurOnSubmit={false}
            />
          </Field>

          <Field label="Note for Rider (optional)">
            <TextInput
              ref={receiverNoteRef}
              style={[s.input, s.textArea]}
              placeholder={"e.g. \"Text before arriving, she's at the gate\""}
              placeholderTextColor={C.textHint}
              value={receiverNote}
              onChangeText={setReceiverNote}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              returnKeyType="done"
              blurOnSubmit
            />
          </Field>
        </View>

        <View style={{ height: 12 }} />
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={s.nextBtn} onPress={handleNext} activeOpacity={0.85}>
          <Text style={s.nextBtnText}>Next: Item Details →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  navBar:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: Platform.OS === 'android' ? 6 : 2, paddingBottom: 6, backgroundColor: C.white },
  backBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.primaryLt, alignItems: 'center', justifyContent: 'center' },
  backIcon:{ fontSize: 22, color: C.primary, fontWeight: '600', lineHeight: 28 },

  scroll: { paddingHorizontal: 14, paddingTop: 12, gap: 12 },

  card:       { backgroundColor: C.white, borderRadius: 16, padding: 14, borderWidth: 0.5, borderColor: C.border, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  headerDot:  { width: 8, height: 8, borderRadius: 4 },
  cardTitle:  { fontSize: 14, fontWeight: '700', color: C.text },
  cardSub:    { fontSize: 11, color: C.textHint },

  fieldWrap:  { gap: 5 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: C.textSub },
  fieldError: { fontSize: 11, color: C.red },

  input:      { backgroundColor: C.bg, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: C.text },
  inputError: { borderColor: C.red },
  textArea:   { height: 72, paddingTop: 10, textAlignVertical: 'top' },

  footer:      { paddingHorizontal: 14, paddingBottom: Platform.OS === 'android' ? 18 : 30, paddingTop: 10, backgroundColor: C.white, borderTopWidth: 0.5, borderTopColor: C.border },
  nextBtn:     { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  nextBtnText: { color: C.white, fontSize: 15, fontWeight: '700' },
})
