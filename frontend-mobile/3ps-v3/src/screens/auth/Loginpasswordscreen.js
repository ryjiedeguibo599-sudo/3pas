// 📁 src/screens/auth/LoginPasswordScreen.js

import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Platform, Alert,
  StatusBar, ActivityIndicator, Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as SecureStore from 'expo-secure-store'
import API from '../../services/api'
import { theme } from '../../theme/padulongTheme'

const C = theme.colors

export default function LoginPasswordScreen({ navigation, route }) {
  const { identifier } = route.params || {}

  const [password,     setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')

  const inputRef = useRef(null)
  const fade = useRef(new Animated.Value(0)).current
  const slide = useRef(new Animated.Value(12)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start()
  }, [fade, slide])

  const handleLogin = async () => {
    if (!password.trim()) {
      setError('Please enter your password.')
      return
    }
    try {
      setLoading(true)
      setError('')
      const res = await API.post('/auth/login', {
        login:    identifier,
        password: password.trim(),
      })
      const { token, user } = res.data
      await SecureStore.setItemAsync('token', token)
      await SecureStore.setItemAsync('user', JSON.stringify(user))

      if (user.role === 'provider') {
        await SecureStore.deleteItemAsync('token')
        await SecureStore.deleteItemAsync('user')
        setError('This is a provider account. Please use the Padulong Provider App.')
        return
      }

      if (user.role === 'admin') {
        navigation.replace('AdminHome')
      } else {
        navigation.replace('Home')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Incorrect password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <Animated.View style={[s.content, { opacity: fade, transform: [{ translateY: slide }] }]}>
        <Text style={s.title}>Enter your password</Text>
        <View style={s.identifierChip}>
          <Text style={s.identifierTxt}>{identifier}</Text>
        </View>

        {!!error && (
          <View style={s.errBanner}>
            <Text style={s.errTxt}>⚠ {error}</Text>
          </View>
        )}

        <View style={s.inputShell}>
          <TextInput
            ref={inputRef}
            style={s.input}
            placeholder="Password"
            placeholderTextColor={C.textHint}
            value={password}
            onChangeText={v => { setPassword(v); setError('') }}
            secureTextEntry={!showPassword}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />
          <TouchableOpacity onPress={() => setShowPassword(p => !p)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={s.toggle}>{showPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={s.forgotRow}
          onPress={() => Alert.alert(
            'Forgot Password?',
            'To reset your password, please contact the 3PS admin at support@3ps.app or message us on the official Facebook page.',
            [{ text: 'OK' }]
          )}
        >
          <Text style={s.forgotTxt}>Forgot password?</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[s.footer, { opacity: fade }]}>
        <TouchableOpacity
          style={[s.btnLogin, (!password.trim() || loading) && s.btnDisabled]}
          onPress={handleLogin}
          disabled={!password.trim() || loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={s.btnLoginTxt}>Log In</Text>
          }
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },

  content: { flex: 1, paddingHorizontal: 28, paddingTop: Platform.OS === 'android' ? 30 : 24 },
  title:   { fontSize: 24, fontWeight: '700', color: C.text, marginBottom: 14 },

  identifierChip: {
    backgroundColor: C.primarySoft, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
    alignSelf: 'flex-start', marginBottom: 24,
  },
  identifierTxt: { fontSize: 13, color: C.secondary, fontWeight: '600' },

  errBanner: {
    backgroundColor: '#FFF2F2', borderRadius: 10,
    padding: 12, marginBottom: 16,
    borderLeftWidth: 3, borderLeftColor: C.danger,
  },
  errTxt: { fontSize: 13, color: C.danger, fontWeight: '500' },

  inputShell: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
    borderRadius: 12, paddingHorizontal: 16, backgroundColor: C.surface,
  },
  input:  { flex: 1, fontSize: 16, color: C.text, paddingVertical: 14 },
  toggle: { fontSize: 13, color: C.primary, fontWeight: '600' },

  forgotRow: { alignItems: 'flex-start', marginTop: 12 },
  forgotTxt: { fontSize: 13, color: C.primary, fontWeight: '600' },

  footer: {
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === 'android' ? 28 : 44,
    paddingTop: 12,
    borderTopWidth: 0.5, borderTopColor: C.border,
  },
  btnLogin:    { backgroundColor: C.primary, borderRadius: 50, paddingVertical: 14, alignItems: 'center' },
  btnDisabled: { opacity: 0.4 },
  btnLoginTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
})
