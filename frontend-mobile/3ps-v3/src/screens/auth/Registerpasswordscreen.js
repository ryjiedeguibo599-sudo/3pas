// 📁 src/screens/auth/RegisterPasswordScreen.js
// Register Screen 2 — Password

import React, { useState, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Platform, StatusBar,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { theme } from '../../theme/padulongTheme'

const C = {
  primary: theme.colors.primary,
  primaryLt: theme.colors.primarySoft,
  text: theme.colors.text,
  textSub: theme.colors.textSub,
  textHint: theme.colors.textHint,
  border: theme.colors.border,
  error: theme.colors.danger,
  success: theme.colors.success,
}

export default function RegisterPasswordScreen({ navigation, route }) {
  const params = route.params || {}

  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword,    setShowPassword]    = useState(false)
  const [showConfirm,     setShowConfirm]     = useState(false)
  const [errors,          setErrors]          = useState({})

  const confirmRef = useRef(null)

  const pwStrength = () => {
    if (password.length === 0) return null
    if (password.length < 6)   return { label: 'Weak',      color: C.error,   width: '25%' }
    if (password.length < 8)   return { label: 'Fair',      color: '#f59e0b', width: '55%' }
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password))
      return { label: 'Strong',    color: '#3b82f6', width: '75%' }
    return { label: 'Very Strong', color: C.success, width: '100%' }
  }

  const validate = () => {
    const e = {}
    if (password.length < 8) e.password = 'Password must be at least 8 characters.'
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => {
    if (!validate()) return
    navigation.navigate('RegisterPhoto', { ...params, password })
  }

  const strength = pwStrength()
  const pwMatch  = confirmPassword !== '' && password === confirmPassword

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={s.content}>
        <Text style={s.title}>Create Password</Text>
        <Text style={s.sub}>Minimum 8 characters. Stronger with numbers and uppercase.</Text>

        <View style={s.fieldWrap}>
          <Text style={s.label}>PASSWORD</Text>
          <View style={[s.inputShell, errors.password && s.inputErr]}>
            <TextInput
              style={s.input}
              placeholder="Minimum 8 characters"
              placeholderTextColor={C.textHint}
              value={password}
              onChangeText={v => { setPassword(v); setErrors(p => ({ ...p, password: undefined })) }}
              secureTextEntry={!showPassword}
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
              autoFocus
            />
            <TouchableOpacity onPress={() => setShowPassword(p => !p)}>
              <Text style={s.toggle}>{showPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
          {strength && (
            <View style={s.strengthWrap}>
              <View style={s.strengthTrack}>
                <View style={[s.strengthFill, { width: strength.width, backgroundColor: strength.color }]} />
              </View>
              <Text style={[s.strengthTxt, { color: strength.color }]}>{strength.label}</Text>
            </View>
          )}
          {!!errors.password && <Text style={s.errMsg}>{errors.password}</Text>}
        </View>

        <View style={s.fieldWrap}>
          <Text style={s.label}>CONFIRM PASSWORD</Text>
          <View style={[s.inputShell, errors.confirmPassword && s.inputErr]}>
            <TextInput
              ref={confirmRef}
              style={s.input}
              placeholder="Repeat your password"
              placeholderTextColor={C.textHint}
              value={confirmPassword}
              onChangeText={v => { setConfirmPassword(v); setErrors(p => ({ ...p, confirmPassword: undefined })) }}
              secureTextEntry={!showConfirm}
              returnKeyType="done"
              onSubmitEditing={handleNext}
            />
            <TouchableOpacity onPress={() => setShowConfirm(p => !p)}>
              <Text style={s.toggle}>{showConfirm ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
          {pwMatch && <Text style={[s.matchTxt, { color: C.success }]}>✓ Passwords match</Text>}
          {!!errors.confirmPassword && <Text style={s.errMsg}>{errors.confirmPassword}</Text>}
        </View>
      </View>

      <View style={s.footer}>
        <TouchableOpacity style={s.btnNext} onPress={handleNext} activeOpacity={0.85}>
          <Text style={s.btnNextTxt}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.primaryLt },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 36 : 24 },
  title:   { fontSize: 22, fontWeight: '700', color: C.text, marginBottom: 4 },
  sub:     { fontSize: 14, color: C.textSub, marginBottom: 24, lineHeight: 20 },
  fieldWrap:  { marginBottom: 16 },
  label:      { fontSize: 10, fontWeight: '700', color: C.textHint, letterSpacing: 0.9, marginBottom: 7 },
  inputShell: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, backgroundColor: '#fff' },
  inputErr:   { borderColor: C.error, borderWidth: 1.5 },
  input:      { flex: 1, fontSize: 14, color: C.text, paddingVertical: 13 },
  toggle:     { fontSize: 12, color: C.primary, fontWeight: '600' },
  strengthWrap:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  strengthTrack: { flex: 1, height: 4, backgroundColor: '#f1f5f9', borderRadius: 2, overflow: 'hidden' },
  strengthFill:  { height: 4, borderRadius: 2 },
  strengthTxt:   { fontSize: 11, fontWeight: '600', minWidth: 70 },
  matchTxt: { fontSize: 12, fontWeight: '600', marginTop: 5 },
  errMsg:   { fontSize: 11, color: C.error, marginTop: 5, fontWeight: '500' },
  footer:   { paddingHorizontal: 24, paddingBottom: Platform.OS === 'android' ? 28 : 44, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: C.border },
  btnNext:    { backgroundColor: C.primary, borderRadius: 50, paddingVertical: 14, alignItems: 'center' },
  btnNextTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
})
