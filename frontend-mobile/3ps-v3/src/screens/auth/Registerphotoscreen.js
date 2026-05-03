// 📁 src/screens/auth/RegisterPhotoScreen.js
// Register Screen 3 — Profile Photo (optional) + Additional Info
// Final registration step

import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, StatusBar,
  ActivityIndicator, Alert, ScrollView, TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
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

export default function RegisterPhotoScreen({ navigation, route }) {
  const { fullName, email, birthday, password, role, serviceType } = route.params || {}

  const [photo,    setPhoto]    = useState(null)
  const [phone,    setPhone]    = useState('')
  const [barangay, setBarangay] = useState('')
  const [loading,  setLoading]  = useState(false)

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Permission is needed to access your photos.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    })
    if (!result.canceled) {
      setPhoto(result.assets[0])
    }
  }

  const handleFinish = async () => {
    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('full_name', fullName)
      formData.append('email',     email)
      formData.append('birthday',  birthday)
      formData.append('password',  password)
      formData.append('role',      role)
      if (serviceType) formData.append('service_type', serviceType)
      if (phone.trim()) formData.append('phone', phone.trim())
      if (barangay.trim()) formData.append('barangay', barangay.trim())
      if (photo) {
        formData.append('profile_photo', {
          uri:  photo.uri,
          type: 'image/jpeg',
          name: 'profile.jpg',
        })
      }

      await API.post('/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      Alert.alert('Success! 🎉', 'Your account has been successfully registered!', [
        { text: 'Log In', onPress: () => navigation.navigate('LoginWelcome') },
      ])
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const initials = fullName
    ? fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <Text style={s.title}>Almost done!</Text>
        <Text style={s.sub}>The following are optional. You can skip them.</Text>

        <View style={s.photoSection}>
          <Text style={s.sectionLabel}>PROFILE PHOTO — OPTIONAL</Text>
          <TouchableOpacity style={s.photoCircle} onPress={pickPhoto} activeOpacity={0.8}>
            {photo
              ? <Text style={s.photoEmoji}>✓</Text>
              : <Text style={s.initialsText}>{initials}</Text>
            }
            <View style={s.photoBadge}>
              <Text style={s.photoBadgeTxt}>+</Text>
            </View>
          </TouchableOpacity>
          {photo
            ? <Text style={[s.photoHint, { color: C.success }]}>✓ Photo uploaded</Text>
            : <Text style={s.photoHint}>Tap to choose a photo</Text>
          }
        </View>

        <View style={s.additionalSection}>
          <Text style={s.sectionLabel}>ADDITIONAL INFORMATION — OPTIONAL</Text>

          <View style={s.fieldWrap}>
            <Text style={s.label}>CONTACT NUMBER</Text>
            <TextInput
              style={s.input}
              placeholder="09XXXXXXXXX"
              placeholderTextColor={C.textHint}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={11}
            />
          </View>

          <View style={s.fieldWrap}>
            <Text style={s.label}>BARANGAY</Text>
            <TextInput
              style={s.input}
              placeholder="Enter your barangay"
              placeholderTextColor={C.textHint}
              value={barangay}
              onChangeText={setBarangay}
              autoCorrect={false}
            />
          </View>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity
          style={s.btnSkip}
          onPress={handleFinish}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Text style={s.btnSkipTxt}>Skip & Finish</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.btnFinish, loading && s.btnDisabled]}
          onPress={handleFinish}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={s.btnFinishTxt}>Complete Registration ✓</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.primaryLt },
  content: { paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 36 : 24, paddingBottom: 16 },
  title:   { fontSize: 22, fontWeight: '700', color: C.text, marginBottom: 4 },
  sub:     { fontSize: 14, color: C.textSub, marginBottom: 28, lineHeight: 20 },

  photoSection:  { alignItems: 'center', marginBottom: 28 },
  sectionLabel:  { fontSize: 10, fontWeight: '700', color: C.textHint, letterSpacing: 0.9, marginBottom: 14, alignSelf: 'flex-start' },
  photoCircle:   { width: 90, height: 90, borderRadius: 45, backgroundColor: C.primaryLt, borderWidth: 2, borderColor: C.primary, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  initialsText:  { fontSize: 28, fontWeight: '700', color: C.primary },
  photoEmoji:    { fontSize: 32, color: C.success },
  photoBadge:    { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  photoBadgeTxt: { fontSize: 16, color: '#fff', fontWeight: '700', lineHeight: 20 },
  photoHint:     { fontSize: 12, color: C.textSub, marginTop: 10 },

  additionalSection: { width: '100%' },
  fieldWrap: { marginBottom: 14 },
  label:     { fontSize: 10, fontWeight: '700', color: C.textHint, letterSpacing: 0.9, marginBottom: 7 },
  input:     { borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: C.text, backgroundColor: '#fff' },

  footer:     { paddingHorizontal: 24, paddingBottom: Platform.OS === 'android' ? 28 : 44, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: C.border, gap: 10 },
  btnSkip:    { borderRadius: 50, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  btnSkipTxt: { fontSize: 14, fontWeight: '600', color: C.textSub },
  btnFinish:  { backgroundColor: C.primary, borderRadius: 50, paddingVertical: 14, alignItems: 'center' },
  btnDisabled:   { opacity: 0.6 },
  btnFinishTxt:  { color: '#fff', fontSize: 15, fontWeight: '700' },
})
