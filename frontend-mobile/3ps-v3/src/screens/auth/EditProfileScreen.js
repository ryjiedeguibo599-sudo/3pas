// 📁 frontend-mobile/3ps-v3/src/screens/auth/EditProfileScreen.js
// BAGONG FILE — ilagay sa screens/auth/ folder

import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  ScrollView, KeyboardAvoidingView, Platform,
  SafeAreaView, StatusBar, Image
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as ImagePicker from 'expo-image-picker'
import API from '../../services/api'

const PRIMARY = '#0F766E'
const BG      = '#F0FDFA'

export default function EditProfileScreen({ route, navigation }) {
  const { user } = route.params

  const [contact,   setContact]   = useState(user?.phone ?? '')
  const [imgUri,    setImgUri]    = useState(user?.profile_image ?? null)
  const [newImg,    setNewImg]    = useState(null)
  const [loading,   setLoading]   = useState(false)

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') return Alert.alert('Permission', 'Kailangan ng access sa photos.')
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    })
    if (!result.canceled) {
      setImgUri(result.assets[0].uri)
      setNewImg(result.assets[0].uri)
    }
  }

  const handleSave = async () => {
    if (!/^09\d{9}$/.test(contact)) {
      return Alert.alert('Error', 'Invalid na contact number. Format: 09XXXXXXXXX')
    }
    try {
      setLoading(true)
      const token = await AsyncStorage.getItem('token')
      const formData = new FormData()
      formData.append('phone', contact)
      if (newImg) {
        formData.append('profile_image', { uri: newImg, name: 'profile.jpg', type: 'image/jpeg' })
      }

      const res = await API.put('/auth/profile', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      })

      await AsyncStorage.setItem('user', JSON.stringify(res.data.user))
      Alert.alert('Tagumpay! ✅', 'Na-update na ang iyong profile.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ])
    } catch (err) {
      const msg = err.response?.data?.message || 'Hindi na-update ang profile.'
      Alert.alert('Error', msg)
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return '?'
    const p = name.trim().split(' ')
    return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : p[0][0].toUpperCase()
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* TOP BAR */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>I-edit ang Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* AVATAR */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={pickImage} style={styles.avatarWrap} activeOpacity={0.8}>
              {imgUri
                ? <Image source={{ uri: imgUri }} style={styles.avatarImg} />
                : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitials}>{getInitials(user?.full_name)}</Text>
                  </View>
                )
              }
              <View style={styles.cameraOverlay}>
                <Text style={styles.cameraIcon}>📷</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>I-tap para palitan ang larawan</Text>
          </View>

          {/* WARNING NOTICE */}
          <View style={styles.noticeBox}>
            <Text style={styles.noticeIcon}>🔐</Text>
            <Text style={styles.noticeTxt}>
              Ang <Text style={{ fontWeight: '700' }}>Buong Pangalan</Text> at{' '}
              <Text style={{ fontWeight: '700' }}>Barangay</Text> ay hindi na mababago para sa integridad ng iyong account.
            </Text>
          </View>

          {/* NON-EDITABLE */}
          <Text style={styles.sectionLabel}>HINDI MABABAGO</Text>

          <ReadonlyField icon="👤" label="Buong Pangalan" value={user?.full_name ?? '—'} />
          <ReadonlyField icon="📍" label="Barangay"       value={user?.barangay ?? '—'} />

          {/* EDITABLE */}
          <Text style={[styles.sectionLabel, { marginTop: 20 }]}>MABABAGO</Text>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>CONTACT NUMBER</Text>
            <View style={styles.inputRow}>
              <Text style={styles.icon}>📱</Text>
              <TextInput
                style={styles.input}
                placeholder="09XXXXXXXXX"
                placeholderTextColor="#94A3B8"
                value={contact}
                onChangeText={setContact}
                keyboardType="phone-pad"
                maxLength={11}
              />
            </View>
          </View>

          {/* SAVE */}
          <TouchableOpacity
            style={[styles.btnSave, loading && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnSaveTxt}>I-save ang mga Pagbabago</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnCancel} onPress={() => navigation.goBack()}>
            <Text style={styles.btnCancelTxt}>Kanselahin</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function ReadonlyField({ icon, label, value }) {
  return (
    <View style={styles.readonlyWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.readonlyRow}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.readonlyValue}>{value}</Text>
        <Text style={{ fontSize: 14 }}>🔐</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: PRIMARY, paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn:      { padding: 4 },
  backIcon:     { fontSize: 30, color: '#fff', fontWeight: '300', lineHeight: 32 },
  topBarTitle:  { fontSize: 16, fontWeight: '700', color: '#fff' },

  scroll: { padding: 20, paddingBottom: 40 },

  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatarWrap: {
    width: 100, height: 100, borderRadius: 50,
    overflow: 'hidden', borderWidth: 3, borderColor: PRIMARY,
  },
  avatarImg:       { width: '100%', height: '100%' },
  avatarFallback:  { flex: 1, backgroundColor: '#CCFBF1', alignItems: 'center', justifyContent: 'center' },
  avatarInitials:  { fontSize: 32, fontWeight: '700', color: PRIMARY },
  cameraOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(15,118,110,0.78)',
    alignItems: 'center', paddingVertical: 6,
  },
  cameraIcon:  { fontSize: 16 },
  avatarHint:  { fontSize: 12, color: '#64748B', marginTop: 8 },

  noticeBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#FEF3C7', borderRadius: 12,
    padding: 14, marginBottom: 22, gap: 10,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  noticeIcon: { fontSize: 16, marginTop: 1 },
  noticeTxt:  { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 },

  sectionLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, marginBottom: 10 },

  readonlyWrap: { marginBottom: 12 },
  fieldLabel:   { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, marginBottom: 6 },
  readonlyRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, gap: 10,
  },
  readonlyValue: { flex: 1, fontSize: 14, color: '#64748B', fontWeight: '500' },

  fieldWrap: { marginBottom: 16 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, gap: 10,
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
  },
  icon:  { fontSize: 16 },
  input: { flex: 1, fontSize: 14, color: '#1E293B', padding: 0 },

  btnSave: {
    backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 15,
    alignItems: 'center', marginTop: 8,
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnSaveTxt:    { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnCancel:     { marginTop: 12, alignItems: 'center', paddingVertical: 10 },
  btnCancelTxt:  { color: '#64748B', fontSize: 13, fontWeight: '500' },
})