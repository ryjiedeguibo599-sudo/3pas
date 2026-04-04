// 📁 frontend-mobile/3ps-v3/src/screens/auth/LoginScreen.js

import React, { useState, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
  StatusBar, Animated,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import API from '../../services/api'

// ── Design Tokens ─────────────────────────────────────────────────
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
  borderFoc: '#0D6B63',
  error:     '#DC2626',
  errorLt:   '#FEF2F2',
}

// ── Reusable Field Component ──────────────────────────────────────
function Field({ label, icon, error, children }) {
  return (
    <View style={fs.fieldWrap}>
      <Text style={fs.label}>{label}</Text>
      <View style={[fs.inputShell, error && fs.inputShellErr]}>
        <Text style={fs.fieldIcon}>{icon}</Text>
        {children}
      </View>
      {error ? <Text style={fs.errTxt}>{error}</Text> : null}
    </View>
  )
}

export default function LoginScreen({ navigation }) {
  const [login,        setLogin]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [errors,       setErrors]       = useState({})

  const passwordRef = useRef(null)

  // ── Auto-detect input type ────────────────────────────────────
  const isPhone      = /^0\d*$/.test(login)
  const keyboardType = isPhone ? 'phone-pad' : 'email-address'
  const fieldIcon    = isPhone ? '📱' : '✉️'
  const placeholder  = isPhone ? '09XXXXXXXXX' : 'email@example.com'

  // ── Validation ────────────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!login.trim())    e.login    = 'Ilagay ang email o contact number.'
    if (!password.trim()) e.password = 'Ilagay ang password.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Submit ────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!validate()) return
    try {
      setLoading(true)
      setErrors({})
      const res = await API.post('/auth/login', {
        login:    login.trim().toLowerCase(),
        password: password.trim(),
      })
      const { token, user } = res.data
      console.log('USER ROLE:', user.role)  // ← idagdag ito
      console.log('USER DATA:', user)       // ← para makita lahat
      await AsyncStorage.multiSet([
        ['token', token],
        ['user',  JSON.stringify(user)],
      ])
      if (user.role === 'provider') {
        await AsyncStorage.setItem('service_type', user.service_type ?? '')
        navigation.replace('ProviderHome')
      } else if (user.role === 'admin') {
        navigation.replace('AdminHome')
      } else {
        navigation.replace('Home')
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Mali ang email/contact number o password.'
      setErrors({ general: msg })
    } finally {
      setLoading(false)
    }
  }

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
          <Text style={fs.heroTitle}>3PS App</Text>
          <Text style={fs.heroSub}>Municipal Service App</Text>
          <View style={fs.heroWave} />
        </View>

        {/* ── CARD ── */}
        <View style={fs.card}>
          <Text style={fs.cardTitle}>Welcome back 👋</Text>
          <Text style={fs.cardSub}>Mag-login gamit ang iyong email o contact number</Text>

          {/* General error banner */}
          {errors.general ? (
            <View style={fs.errBanner}>
              <Text style={fs.errBannerTxt}>⚠ {errors.general}</Text>
            </View>
          ) : null}

          {/* Email / Phone */}
          <Field label="EMAIL O CONTACT NUMBER" icon={fieldIcon} error={errors.login}>
            <TextInput
              style={fs.input}
              placeholder={placeholder}
              placeholderTextColor={C.textHint}
              value={login}
              onChangeText={v => { setLogin(v); setErrors(p => ({ ...p, login: undefined })) }}
              keyboardType={keyboardType}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
          </Field>

          {/* Password */}
          <Field label="PASSWORD" icon="🔒" error={errors.password}>
            <TextInput
              ref={passwordRef}
              style={fs.input}
              placeholder="Ilagay ang password"
              placeholderTextColor={C.textHint}
              value={password}
              onChangeText={v => { setPassword(v); setErrors(p => ({ ...p, password: undefined })) }}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity onPress={() => setShowPassword(p => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={fs.toggleTxt}>{showPassword ? 'Itago' : 'Ipakita'}</Text>
            </TouchableOpacity>
          </Field>

          {/* Forgot */}
          <TouchableOpacity
            style={fs.forgotRow}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={fs.forgotTxt}>Nakalimutang password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[fs.btnPrimary, loading && fs.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={C.white} size="small" />
              : <Text style={fs.btnPrimaryTxt}>Mag-login</Text>
            }
          </TouchableOpacity>

          {/* Divider */}
          <View style={fs.divider}>
            <View style={fs.divLine} />
            <Text style={fs.divTxt}>o</Text>
            <View style={fs.divLine} />
          </View>

          {/* Register */}
          <TouchableOpacity
            style={fs.btnOutline}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.8}
          >
            <Text style={fs.btnOutlineTxt}>Gumawa ng Account</Text>
          </TouchableOpacity>

          <Text style={fs.footer}>© 2025 3PS Municipal Service App</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const fs = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: C.bg },

  // Hero
  hero: {
    backgroundColor: C.primary,
    paddingTop: 60, paddingBottom: 56,
    alignItems: 'center', position: 'relative',
  },
  logoBadge: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.32)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  logoTxt:   { fontSize: 26, fontWeight: '800', color: C.white, letterSpacing: -1 },
  heroTitle: { fontSize: 22, fontWeight: '700', color: C.white, letterSpacing: -0.4 },
  heroSub:   { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  heroWave: {
    position: 'absolute', bottom: -1, left: 0, right: 0,
    height: 30, backgroundColor: C.bg,
    borderTopLeftRadius: 30, borderTopRightRadius: 30,
  },

  // Card
  card: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40 },
  cardTitle: { fontSize: 22, fontWeight: '700', color: C.text, marginBottom: 4 },
  cardSub:   { fontSize: 13, color: C.textSub, marginBottom: 24, lineHeight: 20 },

  // Error banner
  errBanner: {
    backgroundColor: C.errorLt, borderRadius: 10,
    padding: 12, marginBottom: 18,
    borderLeftWidth: 3, borderLeftColor: C.error,
  },
  errBannerTxt: { fontSize: 13, color: C.error, fontWeight: '500' },

  // Field
  fieldWrap:    { marginBottom: 16 },
  label: {
    fontSize: 10, fontWeight: '700', color: C.textHint,
    letterSpacing: 0.9, marginBottom: 7,
  },
  inputShell: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.white,
    borderWidth: 1, borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    gap: 10,
  },
  inputShellErr: { borderColor: C.error, borderWidth: 1.5 },
  fieldIcon: { fontSize: 15 },
  input: { flex: 1, fontSize: 14, color: C.text, padding: 0 },
  toggleTxt: { fontSize: 12, color: C.primary, fontWeight: '600' },
  errTxt: { fontSize: 11, color: C.error, marginTop: 5, fontWeight: '500' },

  // Forgot
  forgotRow: { alignItems: 'flex-end', marginTop: -4, marginBottom: 22 },
  forgotTxt: { fontSize: 12, color: C.primary, fontWeight: '600' },

  // Buttons
  btnPrimary: {
    backgroundColor: C.primary, borderRadius: 13,
    paddingVertical: 15, alignItems: 'center',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  btnDisabled:    { opacity: 0.65 },
  btnPrimaryTxt:  { color: C.white, fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 10 },
  divLine: { flex: 1, height: 1, backgroundColor: C.border },
  divTxt:  { fontSize: 12, color: C.textHint },

  btnOutline: {
    borderRadius: 13, paddingVertical: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: C.primary,
    backgroundColor: C.primaryLt,
  },
  btnOutlineTxt: { color: C.primary, fontSize: 14, fontWeight: '700' },

  footer: { textAlign: 'center', fontSize: 11, color: C.textHint, marginTop: 32 },
})