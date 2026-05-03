// 📁 src/screens/auth/LoginIdentifierScreen.js

import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Platform,
  StatusBar, ActivityIndicator, Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { theme } from '../../theme/padulongTheme'

const C = theme.colors

export default function LoginIdentifierScreen({ navigation }) {
  const [identifier, setIdentifier] = useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  const inputRef = useRef(null)
  const fade = useRef(new Animated.Value(0)).current
  const slide = useRef(new Animated.Value(12)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start()
  }, [fade, slide])

  const handleNext = async () => {
    if (!identifier.trim()) {
      setError('Please enter your email, phone, or username.')
      return
    }
    navigation.navigate('LoginPassword', { identifier: identifier.trim().toLowerCase() })
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <Animated.View style={[s.content, { opacity: fade, transform: [{ translateY: slide }] }]}>
        <Text style={s.title}>Enter your account</Text>
        <Text style={s.sub}>Email, phone number, or username</Text>

        {!!error && (
          <View style={s.errBanner}>
            <Text style={s.errTxt}>⚠ {error}</Text>
          </View>
        )}

        <TextInput
          ref={inputRef}
          style={s.input}
          placeholder="Email, phone, or username"
          placeholderTextColor={C.textHint}
          value={identifier}
          onChangeText={v => { setIdentifier(v); setError('') }}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          returnKeyType="next"
          onSubmitEditing={handleNext}
        />

        <TouchableOpacity style={s.forgotRow}>
          <Text style={s.forgotTxt}>Forgot account?</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[s.footer, { opacity: fade }]}>
        <TouchableOpacity
          style={s.btnOutline}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.8}
        >
          <Text style={s.btnOutlineTxt}>Create new account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.btnNext, !identifier.trim() && s.btnDisabled]}
          onPress={handleNext}
          disabled={!identifier.trim() || loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={s.btnNextTxt}>Next</Text>
          }
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },

  content: { flex: 1, paddingHorizontal: 28, paddingTop: Platform.OS === 'android' ? 30 : 24 },
  title:   { fontSize: 24, fontWeight: '700', color: C.text, marginBottom: 6 },
  sub:     { fontSize: 14, color: C.textSub, marginBottom: 28 },

  errBanner: {
    backgroundColor: '#FFF2F2', borderRadius: 10,
    padding: 12, marginBottom: 16,
    borderLeftWidth: 3, borderLeftColor: C.danger,
  },
  errTxt: { fontSize: 13, color: C.danger, fontWeight: '500' },

  input: {
    borderWidth: 1, borderColor: C.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: C.text, backgroundColor: C.surface,
  },

  forgotRow: { alignItems: 'flex-start', marginTop: 12 },
  forgotTxt: { fontSize: 13, color: C.primary, fontWeight: '600' },

  footer: {
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === 'android' ? 28 : 44,
    paddingTop: 12,
    flexDirection: 'row', gap: 12,
    borderTopWidth: 0.5, borderTopColor: C.border,
  },
  btnOutline:    { flex: 1, borderRadius: 50, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  btnOutlineTxt: { fontSize: 13, fontWeight: '600', color: C.text },

  btnNext:    { flex: 1, backgroundColor: C.primary, borderRadius: 50, paddingVertical: 13, alignItems: 'center' },
  btnDisabled:{ opacity: 0.4 },
  btnNextTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
})
