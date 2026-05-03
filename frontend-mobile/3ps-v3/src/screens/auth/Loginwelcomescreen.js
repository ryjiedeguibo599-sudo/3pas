// 📁 src/screens/auth/LoginWelcomeScreen.js

import React, { useEffect, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, StatusBar, Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { theme } from '../../theme/padulongTheme'

const C = theme.colors

export default function LoginWelcomeScreen({ navigation }) {
  const fade = useRef(new Animated.Value(0)).current
  const up = useRef(new Animated.Value(14)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(up, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start()
  }, [fade, up])

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={s.bgCircleTop} />
      <View style={s.bgCircleBottom} />

      <Animated.View style={[s.logoArea, { opacity: fade, transform: [{ translateY: up }] }]}>
        <View style={s.logoBadge}>
          <Text style={s.logoTxt}>3PS</Text>
        </View>
        <Text style={s.appName}>{theme.brand.name}</Text>
        <Text style={s.appSub}>{theme.brand.tagline}</Text>
      </Animated.View>

      <Animated.View style={[s.btnArea, { opacity: fade, transform: [{ translateY: up }] }]}>

        <TouchableOpacity
          style={s.btnGoogle}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={s.googleG}>@</Text>
          <Text style={s.btnGoogleTxt}>Continue with Email or Phone</Text>
        </TouchableOpacity>

        <View style={s.divider}>
          <View style={s.divLine} />
          <Text style={s.divTxt}>or</Text>
          <View style={s.divLine} />
        </View>

        <TouchableOpacity
          style={s.btnPrimary}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={s.btnPrimaryTxt}>Create Account</Text>
        </TouchableOpacity>

        <Text style={s.terms}>
          By signing up, you agree to our{' '}
          <Text style={s.termsLink}>Terms</Text>,{' '}
          <Text style={s.termsLink}>Privacy Policy</Text>, and{' '}
          <Text style={s.termsLink}>Cookie Use</Text>.
        </Text>

        <TouchableOpacity
          style={s.loginRow}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.7}
        >
          <Text style={s.loginRowTxt}>
            Already have an account?{' '}
            <Text style={s.loginLink}>Log in</Text>
          </Text>
        </TouchableOpacity>

      </Animated.View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  bgCircleTop: {
    position: 'absolute',
    top: -90,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: C.primarySoft,
  },
  bgCircleBottom: {
    position: 'absolute',
    bottom: -120,
    left: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#FFE7D1',
  },

  logoArea: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingTop: Platform.OS === 'android' ? 48 : 0,
  },
  logoBadge: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    shadowColor: C.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  logoTxt:  { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  appName:  { fontSize: 26, fontWeight: '700', color: C.text, marginBottom: 6 },
  appSub:   { fontSize: 14, color: C.textSub },

  btnArea: { paddingHorizontal: 28, paddingBottom: Platform.OS === 'android' ? 32 : 48 },

  btnGoogle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 50, borderWidth: 1, borderColor: C.border,
    paddingVertical: 13, gap: 10, marginBottom: 12,
    backgroundColor: '#fff',
  },
  googleG:      { fontSize: 16, fontWeight: '700', color: '#4285F4' },
  btnGoogleTxt: { fontSize: 15, fontWeight: '600', color: C.text },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  divLine: { flex: 1, height: 1, backgroundColor: C.border },
  divTxt:  { fontSize: 13, color: C.textSub },

  btnPrimary: {
    backgroundColor: C.primary, borderRadius: 50,
    paddingVertical: 13, alignItems: 'center', marginBottom: 14,
  },
  btnPrimaryTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },

  terms:     { fontSize: 11, color: C.textSub, textAlign: 'center', lineHeight: 17, marginBottom: 24 },
  termsLink: { color: C.primary, fontWeight: '600' },

  loginRow:    { alignItems: 'center' },
  loginRowTxt: { fontSize: 14, color: C.textSub },
  loginLink:   { color: C.primary, fontWeight: '700' },
})
