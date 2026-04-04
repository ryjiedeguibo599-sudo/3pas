// 📁 frontend-mobile/3ps-v3/src/screens/auth/RegisterScreen.js

import React, { useState, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  ScrollView, KeyboardAvoidingView, Platform,
  StatusBar, Switch,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import API from '../../services/api'

// ── Design Tokens (shared with LoginScreen) ───────────────────────
const C = {
  primary:   '#0D6B63',
  primaryLt: '#E6F4F2',
  primaryMd: '#A7D9D5',
  bg:        '#F7FAFA',
  white:     '#FFFFFF',
  text:      '#111827',
  textSub:   '#6B7280',
  textHint:  '#9CA3AF',
  border:    '#E5E7EB',
  error:     '#DC2626',
  errorLt:   '#FEF2F2',
  success:   '#16A34A',
  warning:   '#D97706',
}

const SERVICES = [
  { key: 'pasakay',  label: 'Pasakay',  emoji: '🛵', desc: 'Rider' },
  { key: 'pasabuy',  label: 'Pasabuy',  emoji: '🛒', desc: 'Grocery' },
  { key: 'parepair', label: 'Pa-repair', emoji: '🔧', desc: 'Repair' },
]

// ── Age calculation ───────────────────────────────────────────────
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

// ── Birthday auto-formatter ───────────────────────────────────────
const formatBday = (raw, prev) => {
  if (raw.length < prev.length) return raw          // allow backspace freely
  const d = raw.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0,2)}/${d.slice(2)}`
  return `${d.slice(0,2)}/${d.slice(2,4)}/${d.slice(4)}`
}

// ── Reusable Field component ──────────────────────────────────────
function Field({ label, icon, optional, error, hint, children }) {
  return (
    <View style={fs.fieldWrap}>
      <Text style={fs.label}>
        {label}
        {optional && <Text style={fs.optTag}> (optional)</Text>}
      </Text>
      <View style={[fs.inputShell, error && fs.inputShellErr]}>
        <Text style={fs.fieldIcon}>{icon}</Text>
        {children}
      </View>
      {hint  && !error && <Text style={fs.hintTxt}>{hint}</Text>}
      {error && <Text style={fs.errTxt}>{error}</Text>}
    </View>
  )
}

// ── Section header ────────────────────────────────────────────────
function SectionHead({ title }) {
  return (
    <View style={fs.sectionHead}>
      <View style={fs.sectionLine} />
      <Text style={fs.sectionTxt}>{title}</Text>
      <View style={fs.sectionLine} />
    </View>
  )
}

export default function RegisterScreen({ navigation }) {
  const [fullName,        setFullName]        = useState('')
  const [email,           setEmail]           = useState('')
  const [phone,           setPhone]           = useState('')
  const [birthday,        setBirthday]        = useState('')
  const [barangay,        setBarangay]        = useState('')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword,    setShowPassword]    = useState(false)
  const [showConfirm,     setShowConfirm]     = useState(false)
  const [isProvider,      setIsProvider]      = useState(false)
  const [serviceType,     setServiceType]     = useState('pasakay')
  const [loading,         setLoading]         = useState(false)
  const [errors,          setErrors]          = useState({})

  // Refs for keyboard flow
  const emailRef    = useRef(null)
  const phoneRef    = useRef(null)
  const bdayRef     = useRef(null)
  const barangayRef = useRef(null)
  const passRef     = useRef(null)
  const confirmRef  = useRef(null)

  // ── Birthday handler ────────────────────────────────────────
  const handleBday = (text) => {
    const formatted = formatBday(text, birthday)
    setBirthday(formatted)
    setErrors(p => ({ ...p, birthday: undefined }))
  }

  // ── Age badge ───────────────────────────────────────────────
  const ageBadge = () => {
    if (birthday.length < 10) return null
    const age = computeAge(birthday)
    if (age === null) return { label: 'Invalid na petsa', color: C.error }
    if (age < 15)    return { label: `${age} taong gulang — Minimum 15 anyos`, color: C.error }
    return           { label: `${age} taong gulang ✓`, color: C.success }
  }

  // ── Validation ──────────────────────────────────────────────
  const validate = () => {
    const e = {}

    if (!fullName.trim())
      e.fullName = 'Ilagay ang buong pangalan.'

    if (!email.trim())
      e.email = 'Ilagay ang email address.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      e.email = 'Invalid na format ng email.'

    if (phone.trim() && !/^09\d{9}$/.test(phone.trim()))
      e.phone = 'Invalid. Format: 09XXXXXXXXX'

    if (!birthday.trim() || birthday.length < 10)
      e.birthday = 'Kumpleto ang petsa. Format: MM/DD/YYYY'
    else {
      const age = computeAge(birthday)
      if (age === null) e.birthday = 'Invalid na petsa ng kapanganakan.'
      else if (age < 15) e.birthday = `${age} taong gulang pa. Minimum 15 years old.`
    }

    if (!barangay.trim())
      e.barangay = 'Ilagay ang iyong barangay.'

    if (password.length < 8)
      e.password = 'Minimum 8 characters ang password.'

    if (password !== confirmPassword)
      e.confirmPassword = 'Hindi magkatugma ang passwords.'

    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Submit ──────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!validate()) return
    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('full_name',  fullName.trim())
      formData.append('email',      email.toLowerCase().trim())
      formData.append('barangay',   barangay.trim())
      formData.append('birthday',   birthday.trim())
      formData.append('password',   password)
      formData.append('role',       isProvider ? 'provider' : 'resident')
      if (phone.trim())    formData.append('phone', phone.trim())
      if (isProvider)      formData.append('service_type', serviceType)

      await API.post('/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      await AsyncStorage.removeItem('onboarded')
      Alert.alert('Tagumpay! 🎉', 'Matagumpay na nairehistro. Mag-login na.', [
        { text: 'Mag-login', onPress: () => navigation.navigate('Login') },
      ])
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Subukan muli.'
      setErrors({ general: msg })
    } finally {
      setLoading(false)
    }
  }

  const ageInfo  = ageBadge()
  const pwMatch  = confirmPassword !== '' && password === confirmPassword
  const pwBad    = confirmPassword !== '' && password !== confirmPassword

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />
      <ScrollView
        contentContainerStyle={fs.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO ── */}
        <View style={fs.hero}>
          <View style={fs.logoBadge}>
            <Text style={fs.logoTxt}>3PS</Text>
          </View>
          <Text style={fs.heroTitle}>Gumawa ng Account</Text>
          <Text style={fs.heroSub}>3PS Municipal Service App</Text>
          <View style={fs.heroWave} />
        </View>

        {/* ── FORM ── */}
        <View style={fs.card}>
          <Text style={fs.cardTitle}>Mag-register</Text>
          <Text style={fs.cardSub}>
            Ang may <Text style={{ color: C.error }}>*</Text> ay required • 15 years old and above
          </Text>

          {/* General error */}
          {errors.general ? (
            <View style={fs.errBanner}>
              <Text style={fs.errBannerTxt}>⚠ {errors.general}</Text>
            </View>
          ) : null}

          {/* ── PERSONAL INFO ── */}
          <SectionHead title="PERSONAL INFORMATION" />

          <Field label="BUONG PANGALAN *" icon="👤" error={errors.fullName}
            hint="⚠ Hindi na mababago pagkatapos ng registration">
            <TextInput
              style={fs.input}
              placeholder="Juan dela Cruz"
              placeholderTextColor={C.textHint}
              value={fullName}
              onChangeText={v => { setFullName(v); setErrors(p => ({ ...p, fullName: undefined })) }}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              autoCorrect={false}
            />
          </Field>

          <Field label="EMAIL ADDRESS *" icon="✉️" error={errors.email}>
            <TextInput
              ref={emailRef}
              style={fs.input}
              placeholder="juan@email.com"
              placeholderTextColor={C.textHint}
              value={email}
              onChangeText={v => { setEmail(v); setErrors(p => ({ ...p, email: undefined })) }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
            />
          </Field>

          <Field label="CONTACT NUMBER" icon="📱" optional error={errors.phone}>
            <TextInput
              ref={phoneRef}
              style={fs.input}
              placeholder="09XXXXXXXXX"
              placeholderTextColor={C.textHint}
              value={phone}
              onChangeText={v => { setPhone(v); setErrors(p => ({ ...p, phone: undefined })) }}
              keyboardType="phone-pad"
              maxLength={11}
              returnKeyType="next"
              onSubmitEditing={() => bdayRef.current?.focus()}
            />
          </Field>

          <Field label="PETSA NG KAPANGANAKAN * (15+ years old)" icon="🎂" error={errors.birthday}>
            <TextInput
              ref={bdayRef}
              style={fs.input}
              placeholder="MM/DD/YYYY"
              placeholderTextColor={C.textHint}
              value={birthday}
              onChangeText={handleBday}
              keyboardType="numeric"
              maxLength={10}
              returnKeyType="next"
              onSubmitEditing={() => barangayRef.current?.focus()}
            />
          </Field>
          {ageInfo && !errors.birthday && (
            <Text style={[fs.ageTxt, { color: ageInfo.color }]}>{ageInfo.label}</Text>
          )}

          <Field label="BARANGAY *" icon="📍" error={errors.barangay}
            hint="⚠ Hindi na mababago pagkatapos ng registration">
            <TextInput
              ref={barangayRef}
              style={fs.input}
              placeholder="Ilagay ang iyong barangay"
              placeholderTextColor={C.textHint}
              value={barangay}
              onChangeText={v => { setBarangay(v); setErrors(p => ({ ...p, barangay: undefined })) }}
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passRef.current?.focus()}
            />
          </Field>

          {/* ── SECURITY ── */}
          <SectionHead title="SEGURIDAD" />

          <Field label="PASSWORD *" icon="🔒" error={errors.password}>
            <TextInput
              ref={passRef}
              style={fs.input}
              placeholder="Minimum 8 characters"
              placeholderTextColor={C.textHint}
              value={password}
              onChangeText={v => { setPassword(v); setErrors(p => ({ ...p, password: undefined })) }}
              secureTextEntry={!showPassword}
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
            />
            <TouchableOpacity onPress={() => setShowPassword(p => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={fs.toggleTxt}>{showPassword ? 'Itago' : 'Ipakita'}</Text>
            </TouchableOpacity>
          </Field>

          <Field label="KUMPIRMAHIN ANG PASSWORD *" icon="🔐" error={errors.confirmPassword}>
            <TextInput
              ref={confirmRef}
              style={fs.input}
              placeholder="Ulitin ang password"
              placeholderTextColor={C.textHint}
              value={confirmPassword}
              onChangeText={v => { setConfirmPassword(v); setErrors(p => ({ ...p, confirmPassword: undefined })) }}
              secureTextEntry={!showConfirm}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />
            <TouchableOpacity onPress={() => setShowConfirm(p => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={fs.toggleTxt}>{showConfirm ? 'Itago' : 'Ipakita'}</Text>
            </TouchableOpacity>
          </Field>
          {pwMatch && (
            <Text style={[fs.ageTxt, { color: C.success, marginTop: -8, marginBottom: 8 }]}>
              ✓ Magkatugma ang passwords
            </Text>
          )}

          {/* ── ACCOUNT TYPE ── */}
          <SectionHead title="URI NG ACCOUNT" />

          <View style={fs.providerToggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={fs.providerToggleTitle}>Mag-register bilang Service Provider</Text>
              <Text style={fs.providerToggleSub}>Pasakay, Pasabuy, o Pa-repair</Text>
            </View>
            <Switch
              value={isProvider}
              onValueChange={setIsProvider}
              trackColor={{ false: C.border, true: C.primaryMd }}
              thumbColor={isProvider ? C.primary : C.textHint}
            />
          </View>

          {isProvider && (
            <View style={fs.serviceGrid}>
              {SERVICES.map(s => (
                <TouchableOpacity
                  key={s.key}
                  style={[fs.svcCard, serviceType === s.key && fs.svcCardActive]}
                  onPress={() => setServiceType(s.key)}
                  activeOpacity={0.8}
                >
                  <Text style={fs.svcEmoji}>{s.emoji}</Text>
                  <Text style={[fs.svcLabel, serviceType === s.key && fs.svcLabelActive]}>
                    {s.label}
                  </Text>
                  <Text style={fs.svcDesc}>{s.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ── SUBMIT ── */}
          <TouchableOpacity
            style={[fs.btnPrimary, loading && fs.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={C.white} size="small" />
              : <Text style={fs.btnPrimaryTxt}>Mag-Register</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={fs.btnBack}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={fs.btnBackTxt}>← Bumalik sa Login</Text>
          </TouchableOpacity>

          <Text style={fs.footer}>© 2025 3PS Municipal Service App</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const fs = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: C.bg },

  hero: {
    backgroundColor: C.primary,
    paddingTop: 56, paddingBottom: 52,
    alignItems: 'center', position: 'relative',
  },
  logoBadge: {
    width: 68, height: 68, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  logoTxt:   { fontSize: 24, fontWeight: '800', color: C.white, letterSpacing: -1 },
  heroTitle: { fontSize: 20, fontWeight: '700', color: C.white },
  heroSub:   { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3 },
  heroWave: {
    position: 'absolute', bottom: -1, left: 0, right: 0,
    height: 28, backgroundColor: C.bg,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
  },

  card:      { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: C.text, marginBottom: 4 },
  cardSub:   { fontSize: 13, color: C.textSub, marginBottom: 20, lineHeight: 19 },

  errBanner: {
    backgroundColor: C.errorLt, borderRadius: 10,
    padding: 12, marginBottom: 18,
    borderLeftWidth: 3, borderLeftColor: C.error,
  },
  errBannerTxt: { fontSize: 13, color: C.error, fontWeight: '500' },

  // Section head
  sectionHead: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, marginBottom: 16, marginTop: 8,
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: C.border },
  sectionTxt:  { fontSize: 10, fontWeight: '700', color: C.textHint, letterSpacing: 1 },

  // Field
  fieldWrap:    { marginBottom: 14 },
  label: {
    fontSize: 10, fontWeight: '700', color: C.textHint,
    letterSpacing: 0.9, marginBottom: 7,
  },
  optTag:    { fontSize: 10, color: '#CBD5E1', fontWeight: '400' },
  inputShell: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.white,
    borderWidth: 1, borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13, gap: 10,
  },
  inputShellErr: { borderColor: C.error, borderWidth: 1.5 },
  fieldIcon:  { fontSize: 15 },
  input:      { flex: 1, fontSize: 14, color: C.text, padding: 0 },
  toggleTxt:  { fontSize: 12, color: C.primary, fontWeight: '600' },
  hintTxt:    { fontSize: 11, color: C.warning, marginTop: 5, fontWeight: '500' },
  errTxt:     { fontSize: 11, color: C.error, marginTop: 5, fontWeight: '500' },
  ageTxt:     { fontSize: 12, fontWeight: '600', marginTop: -6, marginBottom: 10 },

  // Provider toggle
  providerToggleRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.white, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    padding: 14, marginBottom: 14, gap: 12,
  },
  providerToggleTitle: { fontSize: 14, fontWeight: '600', color: C.text },
  providerToggleSub:   { fontSize: 12, color: C.textSub, marginTop: 2 },

  // Service cards
  serviceGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  svcCard: {
    flex: 1, alignItems: 'center', paddingVertical: 14,
    borderRadius: 12, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.white,
  },
  svcCardActive: { borderColor: C.primary, backgroundColor: C.primaryLt },
  svcEmoji:      { fontSize: 22, marginBottom: 6 },
  svcLabel:      { fontSize: 12, fontWeight: '700', color: C.textHint },
  svcLabelActive:{ color: C.primary },
  svcDesc:       { fontSize: 10, color: C.textHint, marginTop: 2 },

  // Buttons
  btnPrimary: {
    backgroundColor: C.primary, borderRadius: 13,
    paddingVertical: 15, alignItems: 'center', marginTop: 8,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  btnDisabled:   { opacity: 0.65 },
  btnPrimaryTxt: { color: C.white, fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },

  btnBack:    { marginTop: 14, alignItems: 'center' },
  btnBackTxt: { color: C.primary, fontSize: 13, fontWeight: '600' },

  footer: { textAlign: 'center', fontSize: 11, color: C.textHint, marginTop: 32 },
})