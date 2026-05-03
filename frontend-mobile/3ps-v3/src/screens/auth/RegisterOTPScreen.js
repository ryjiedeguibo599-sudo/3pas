// 📁 src/screens/auth/RegisterOTPScreen.js
// Register Screen 1.5 — Email OTP Verification

import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Platform,
  StatusBar, ActivityIndicator, Alert,
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
  success: theme.colors.success,
}

export default function RegisterOTPScreen({ navigation, route }) {
  const params = route.params || {}
  const { email } = params

  const [otp,       setOtp]       = useState(['', '', '', '', '', ''])
  const [loading,   setLoading]   = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [error,     setError]     = useState('')

  const inputs = useRef([])

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => setCountdown(c => c - 1), 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const handleChange = (text, index) => {
    const val = text.replace(/[^0-9]/g, '')
    const newOtp = [...otp]

    if (val.length === 6) {
      const pasted = val.split('')
      setOtp(pasted)
      inputs.current[5]?.focus()
      return
    }

    newOtp[index] = val
    setOtp(newOtp)
    setError('')

    if (val && index < 5) {
      inputs.current[index + 1]?.focus()
    }
  }

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  const handleVerify = async () => {
    const otpString = otp.join('')
    if (otpString.length < 6) {
      setError('Please enter the 6-digit OTP.')
      return
    }

    try {
      setLoading(true)
      setError('')
      await API.post('/auth/verify-otp', {
        email: email.toLowerCase().trim(),
        otp:   otpString,
      })
      navigation.navigate('RegisterPassword', params)
    } catch (err) {
      setError(err.response?.data?.message || 'Incorrect OTP. Please try again.')
      setOtp(['', '', '', '', '', ''])
      inputs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0) return
    try {
      setResending(true)
      setError('')
      await API.post('/auth/send-otp', { email: email.toLowerCase().trim() })
      setOtp(['', '', '', '', '', ''])
      setCountdown(60)
      inputs.current[0]?.focus()
      Alert.alert('Sent!', `A new OTP has been sent to ${email}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.')
    } finally {
      setResending(false)
    }
  }

  const otpString = otp.join('')

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={s.content}>
        <Text style={s.title}>Verify your Email</Text>
        <Text style={s.sub}>
          We sent a 6-digit code to{'\n'}
          <Text style={{ color: C.primary, fontWeight: '700' }}>{email}</Text>
        </Text>

        <View style={s.otpRow}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={r => inputs.current[index] = r}
              style={[
                s.otpBox,
                digit && s.otpBoxFilled,
                !!error && s.otpBoxError,
              ]}
              value={digit}
              onChangeText={text => handleChange(text, index)}
              onKeyPress={e => handleKeyPress(e, index)}
              keyboardType="numeric"
              maxLength={6}
              textAlign="center"
              autoFocus={index === 0}
              selectTextOnFocus
            />
          ))}
        </View>

        {!!error && <Text style={s.errMsg}>{error}</Text>}

        <Text style={s.expiryTxt}>Expires in 10 minutes</Text>

        <View style={s.resendRow}>
          <Text style={s.resendLabel}>Didn't receive it? </Text>
          {resending
            ? <ActivityIndicator size="small" color={C.primary} />
            : (
              <TouchableOpacity onPress={handleResend} disabled={countdown > 0}>
                <Text style={[s.resendBtn, countdown > 0 && s.resendDisabled]}>
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend'}
                </Text>
              </TouchableOpacity>
            )
          }
        </View>
      </View>

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.btnVerify, (loading || otpString.length < 6) && s.btnDisabled]}
          onPress={handleVerify}
          disabled={loading || otpString.length < 6}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={s.btnVerifyTxt}>Verify</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.primaryLt },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 36 : 32, alignItems: 'center' },
  title:   { fontSize: 22, fontWeight: '700', color: C.text, marginBottom: 10, alignSelf: 'flex-start' },
  sub:     { fontSize: 14, color: C.textSub, marginBottom: 36, lineHeight: 22, alignSelf: 'flex-start' },
  otpRow:  { flexDirection: 'row', gap: 10, marginBottom: 16 },
  otpBox:  {
    width: 48, height: 56, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.border,
    backgroundColor: '#fff',
    fontSize: 24, fontWeight: '700', color: C.text,
  },
  otpBoxFilled: { borderColor: C.primary, backgroundColor: C.primaryLt },
  otpBoxError:  { borderColor: C.error },
  errMsg:    { fontSize: 12, color: C.error, fontWeight: '500', marginBottom: 8 },
  expiryTxt: { fontSize: 12, color: C.textHint, marginBottom: 24 },
  resendRow: { flexDirection: 'row', alignItems: 'center' },
  resendLabel:    { fontSize: 13, color: C.textSub },
  resendBtn:      { fontSize: 13, color: C.primary, fontWeight: '700' },
  resendDisabled: { color: C.textHint },
  footer:    { paddingHorizontal: 24, paddingBottom: Platform.OS === 'android' ? 28 : 44, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: C.border },
  btnVerify:    { backgroundColor: C.primary, borderRadius: 50, paddingVertical: 14, alignItems: 'center' },
  btnDisabled:  { opacity: 0.5 },
  btnVerifyTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
})
