// 📁 frontend-mobile/3ps-v3/src/screens/auth/LoginScreen.js

import React, { useState, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, StatusBar,
} from 'react-native'
import * as SecureStore from 'expo-secure-store'
import API from '../../services/api'
import { theme } from '../../theme/padulongTheme'

const C = theme.colors

export default function LoginScreen({ navigation }) {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const passwordRef = useRef(null)

  const isPhone = /^0\d*$/.test(login)
  const keyboardType = isPhone ? 'phone-pad' : 'email-address'
  const placeholder = isPhone ? '09XXXXXXXXX' : 'email@example.com'

  const validate = () => {
    const e = {}
    if (!login.trim()) e.login = 'Please enter your email, phone, or username.'
    if (!password.trim()) e.password = 'Please enter your password.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleLogin = async () => {
    if (!validate()) return
    try {
      setLoading(true)
      setErrors({})
      const res = await API.post('/auth/login', {
        login: login.trim().toLowerCase(),
        password: password.trim(),
      })
      const { token, user } = res.data

      await SecureStore.setItemAsync('token', token)
      await SecureStore.setItemAsync('user', JSON.stringify(user))

      if (user.role === 'provider') {
        navigation.replace('ProviderHome')
      } else if (user.role === 'admin') {
        navigation.replace('AdminHome')
      } else {
        navigation.replace('Home')
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Incorrect email/contact number or password.'
      setErrors({ general: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.content}>
          <Text style={s.title}>Enter your account</Text>
          <Text style={s.sub}>Email, phone number, or username</Text>

          {!!errors.general && (
            <View style={s.errBanner}>
              <Text style={s.errBannerTxt}>⚠ {errors.general}</Text>
            </View>
          )}

          <View style={[s.inputShell, errors.login && s.inputShellErr]}>
            <TextInput
              style={s.input}
              placeholder={placeholder}
              placeholderTextColor={C.textHint}
              value={login}
              onChangeText={(v) => {
                setLogin(v)
                setErrors((p) => ({ ...p, login: undefined }))
              }}
              keyboardType={keyboardType}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
          </View>
          {!!errors.login && <Text style={s.errTxt}>{errors.login}</Text>}

          <View style={[s.inputShell, errors.password && s.inputShellErr, { marginTop: 14 }]}>
            <TextInput
              ref={passwordRef}
              style={s.input}
              placeholder="Password"
              placeholderTextColor={C.textHint}
              value={password}
              onChangeText={(v) => {
                setPassword(v)
                setErrors((p) => ({ ...p, password: undefined }))
              }}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity
              onPress={() => setShowPassword((p) => !p)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={s.toggleTxt}>{showPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
          {!!errors.password && <Text style={s.errTxt}>{errors.password}</Text>}

          <TouchableOpacity style={s.forgotRow}>
            <Text style={s.forgotTxt}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        <View style={s.footer}>
          <TouchableOpacity
            style={s.btnOutline}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.8}
          >
            <Text style={s.btnOutlineTxt}>Create new account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.btnNext, (!login.trim() || !password.trim() || loading) && s.btnDisabled]}
            onPress={handleLogin}
            disabled={!login.trim() || !password.trim() || loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={s.btnNextTxt}>Log In</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: C.background },
  content: { flex: 1, paddingHorizontal: 28, paddingTop: Platform.OS === 'android' ? 72 : 60 },
  title: { fontSize: 24, fontWeight: '700', color: C.text, marginBottom: 6 },
  sub: { fontSize: 14, color: C.textSub, marginBottom: 28 },

  errBanner: {
    backgroundColor: '#FFF2F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: C.danger,
  },
  errBannerTxt: { fontSize: 13, color: C.danger, fontWeight: '500' },

  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: C.surface,
  },
  inputShellErr: { borderColor: C.danger },
  input: { flex: 1, fontSize: 16, color: C.text, paddingVertical: 14 },
  toggleTxt: { fontSize: 13, color: C.primary, fontWeight: '600' },
  errTxt: { fontSize: 12, color: C.danger, marginTop: 6, marginLeft: 2 },

  forgotRow: { alignItems: 'flex-start', marginTop: 12 },
  forgotTxt: { fontSize: 13, color: C.primary, fontWeight: '600' },

  footer: {
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === 'android' ? 28 : 44,
    paddingTop: 12,
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
  },
  btnOutline: {
    flex: 1,
    borderRadius: 50,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  btnOutlineTxt: { fontSize: 13, fontWeight: '600', color: C.text },

  btnNext: {
    flex: 1,
    backgroundColor: C.primary,
    borderRadius: 50,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  btnNextTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
})