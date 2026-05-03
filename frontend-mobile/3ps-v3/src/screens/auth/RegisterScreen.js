// 📁 src/screens/auth/RegisterScreen.js
// Register Screen 1 — Name, Email, Birthday

import React, { useState, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Platform,
  StatusBar, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import API from '../../services/api'
import { theme } from '../../theme/padulongTheme'

const C = {
  primary: theme.colors.primary,
  primaryLt: theme.colors.primarySoft,
  text: theme.colors.text,
  textSub: theme.colors.textSub,
  textHint: theme.colors.textHint,
  border: theme.colors.border,
  error: theme.colors.danger,
  errorLt: '#FFF2F2',
  success: '#f0fdf4',
}

const formatBday = (raw, prev) => {
  if (raw.length < prev.length) return raw
  const d = raw.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0,2)}/${d.slice(2)}`
  return `${d.slice(0,2)}/${d.slice(2,4)}/${d.slice(4)}`
}

const computeAge = (str) => {
  if (!str || str.length < 10) return null
  const [m, d, y] = str.split('/').map(Number)
  if (!m || !d || !y || y < 1900) return null
  const birth = new Date(y, m - 1, d)
  if (isNaN(birth.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const mo = today.getMonth() - birth.getMonth()
  if (mo < 0 || (mo === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export default function RegisterScreen({ navigation }) {
  const [fullName, setFullName] = useState('')
  const [email,    setEmail]    = useState('')
  const [birthday, setBirthday] = useState('')
  const [role,     setRole]     = useState('resident')
  const [loading,  setLoading]  = useState(false)
  const [errors,   setErrors]   = useState({})

  const emailRef = useRef(null)
  const bdayRef  = useRef(null)

  const handleBday = (text) => {
    setBirthday(formatBday(text, birthday))
    setErrors(p => ({ ...p, birthday: undefined }))
  }

  const ageInfo = () => {
    if (birthday.length < 10) return null
    const age = computeAge(birthday)
    if (age === null) return { label: 'Invalid date', color: C.error }
    if (age < 15)    return { label: `${age} years old — Minimum age is 15`, color: C.error }
    return { label: `${age} years old ✓`, color: '#16A34A' }
  }

  const validate = () => {
    const e = {}
    if (!fullName.trim()) e.fullName = 'Please enter your full name.'
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      e.email = 'Please enter a valid email address.'
    if (!birthday.trim() || birthday.length < 10)
      e.birthday = 'Complete the date. Format: MM/DD/YYYY'
    else {
      const age = computeAge(birthday)
      if (!age || age < 15) e.birthday = 'Minimum age is 15 years.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = async () => {
    if (!validate()) return
    const baseParams = {
      fullName: fullName.trim(),
      email:    email.trim().toLowerCase(),
      birthday: birthday.trim(),
      role,
    }

    // Providers pick service type first, then OTP is sent from that screen
    if (role === 'provider') {
      navigation.navigate('RegisterServiceType', baseParams)
      return
    }

    try {
      setLoading(true)
      await API.post('/auth/send-otp', { email: baseParams.email })
      navigation.navigate('RegisterOTP', baseParams)
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send OTP. Please try again.'
      setErrors({ email: msg })
    } finally {
      setLoading(false)
    }
  }

  const age = ageInfo()

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={s.content}>
        <Text style={s.title}>Create Account</Text>
        <Text style={s.sub}>Enter your information</Text>

        <View style={s.fieldWrap}>
          <Text style={s.label}>FULL NAME</Text>
          <TextInput
            style={[s.input, errors.fullName && s.inputErr]}
            placeholder="Juan dela Cruz"
            placeholderTextColor={C.textHint}
            value={fullName}
            onChangeText={v => { setFullName(v); setErrors(p => ({ ...p, fullName: undefined })) }}
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
            autoCorrect={false}
          />
          {!!errors.fullName && <Text style={s.errMsg}>{errors.fullName}</Text>}
        </View>

        <View style={s.fieldWrap}>
          <Text style={s.label}>EMAIL ADDRESS</Text>
          <TextInput
            ref={emailRef}
            style={[s.input, errors.email && s.inputErr]}
            placeholder="juan@email.com"
            placeholderTextColor={C.textHint}
            value={email}
            onChangeText={v => { setEmail(v); setErrors(p => ({ ...p, email: undefined })) }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => bdayRef.current?.focus()}
          />
          {!!errors.email && <Text style={s.errMsg}>{errors.email}</Text>}
        </View>

        <View style={s.fieldWrap}>
          <Text style={s.label}>DATE OF BIRTH (MM/DD/YYYY)</Text>
          <TextInput
            ref={bdayRef}
            style={[s.input, errors.birthday && s.inputErr]}
            placeholder="MM/DD/YYYY"
            placeholderTextColor={C.textHint}
            value={birthday}
            onChangeText={handleBday}
            keyboardType="numeric"
            maxLength={10}
            returnKeyType="done"
          />
          {age && !errors.birthday && <Text style={[s.ageTxt, { color: age.color }]}>{age.label}</Text>}
          {!!errors.birthday && <Text style={s.errMsg}>{errors.birthday}</Text>}
        </View>

        <View style={s.fieldWrap}>
          <Text style={s.label}>REGISTER AS</Text>
          <View style={s.roleRow}>
            <TouchableOpacity
              style={[s.roleCard, role === 'resident' && s.roleCardActive]}
              onPress={() => setRole('resident')}
              activeOpacity={0.8}
            >
              <Text style={s.roleIcon}>🏠</Text>
              <Text style={[s.roleTitle, role === 'resident' && s.roleTitleActive]}>Resident</Text>
              <Text style={[s.roleSub, role === 'resident' && s.roleSubActive]}>Order services</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.roleCard, role === 'provider' && s.roleCardActive]}
              onPress={() => setRole('provider')}
              activeOpacity={0.8}
            >
              <Text style={s.roleIcon}>🛵</Text>
              <Text style={[s.roleTitle, role === 'provider' && s.roleTitleActive]}>Provider</Text>
              <Text style={[s.roleSub, role === 'provider' && s.roleSubActive]}>Offer services</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.btnNext, loading && s.btnDisabled]}
          onPress={handleNext}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={s.btnNextTxt}>Next</Text>
          }
        </TouchableOpacity>
        <TouchableOpacity style={s.loginRow} onPress={() => navigation.navigate('LoginWelcome')}>
          <Text style={s.loginTxt}>
            Already have an account?{' '}
            <Text style={{ color: C.primary, fontWeight: '700' }}>Log in</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.primaryLt },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 20 : 20 },
  title:   { fontSize: 22, fontWeight: '700', color: C.text, marginBottom: 4 },
  sub:     { fontSize: 14, color: C.textSub, marginBottom: 20 },
  fieldWrap: { marginBottom: 14 },
  label:     { fontSize: 10, fontWeight: '700', color: C.textHint, letterSpacing: 0.9, marginBottom: 7 },
  input:     { borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: C.text, backgroundColor: '#fff' },
  inputErr:  { borderColor: C.error, borderWidth: 1.5 },
  errMsg:    { fontSize: 11, color: C.error, marginTop: 5, fontWeight: '500' },
  ageTxt:    { fontSize: 12, fontWeight: '600', marginTop: 5 },
  footer:    { paddingHorizontal: 24, paddingBottom: Platform.OS === 'android' ? 28 : 44, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: C.border, gap: 12 },
  btnNext:   { backgroundColor: C.primary, borderRadius: 50, paddingVertical: 14, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnNextTxt:  { color: '#fff', fontSize: 15, fontWeight: '700' },
  loginRow:    { alignItems: 'center' },
  loginTxt:    { fontSize: 13, color: C.textSub },

  roleRow:         { flexDirection: 'row', gap: 10 },
  roleCard:        { flex: 1, borderWidth: 1.5, borderColor: C.border, borderRadius: 12, padding: 12, alignItems: 'center', backgroundColor: '#fff' },
  roleCardActive:  { borderColor: C.primary, backgroundColor: C.primaryLt },
  roleIcon:        { fontSize: 22, marginBottom: 4 },
  roleTitle:       { fontSize: 13, fontWeight: '700', color: C.textSub, marginBottom: 2 },
  roleTitleActive: { color: C.primary },
  roleSub:         { fontSize: 10, color: C.textHint, textAlign: 'center' },
  roleSubActive:   { color: C.primary },
})
