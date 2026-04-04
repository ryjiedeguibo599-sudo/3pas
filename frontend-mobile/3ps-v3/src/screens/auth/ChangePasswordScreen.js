// 📁 frontend-mobile/3ps-v3/src/screens/auth/ChangePasswordScreen.js
// BAGONG FILE — ilagay sa screens/auth/ folder

import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  ScrollView, KeyboardAvoidingView, Platform,
  SafeAreaView, StatusBar
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import API from '../../services/api'

const PRIMARY = '#0F766E'
const BG      = '#F0FDFA'

export default function ChangePasswordScreen({ navigation }) {
  const [current,  setCurrent]  = useState('')
  const [newPw,    setNewPw]    = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [shows,    setShows]    = useState({ current: false, new: false, confirm: false })
  const [loading,  setLoading]  = useState(false)

  const toggle = (key) => setShows(p => ({ ...p, [key]: !p[key] }))

  const pwStrength = () => {
    if (!newPw) return null
    if (newPw.length < 6)  return { label: 'Mahina',     color: '#EF4444', bars: 1 }
    if (newPw.length < 10) return { label: 'Katamtaman', color: '#F59E0B', bars: 2 }
    return                        { label: 'Malakas',    color: '#16A34A', bars: 3 }
  }

  const handleChange = async () => {
    if (!current || !newPw || !confirm) return Alert.alert('Error', 'Punan ang lahat ng fields.')
    if (newPw.length < 8)               return Alert.alert('Error', 'Password ay minimum 8 characters.')
    if (newPw !== confirm)              return Alert.alert('Error', 'Hindi magkatugma ang bagong passwords.')
    if (current === newPw)              return Alert.alert('Error', 'Ang bago ay hindi dapat kapareho ng luma.')

    try {
      setLoading(true)
      const token = await AsyncStorage.getItem('token')
      await API.put('/auth/change-password', {
        current_password: current,
        new_password: newPw,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      Alert.alert('Tagumpay! 🔐', 'Napalitan na ang iyong password.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ])
    } catch (err) {
      const msg = err.response?.data?.message || 'Mali ang kasalukuyang password.'
      Alert.alert('Error', msg)
    } finally {
      setLoading(false)
    }
  }

  const strength = pwStrength()
  const pwMatch   = confirm !== '' && newPw === confirm
  const pwNoMatch = confirm !== '' && newPw !== confirm

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* TOP BAR */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Palitan ang Password</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* INFO NOTICE */}
          <View style={styles.noticeBox}>
            <Text style={styles.noticeIcon}>ℹ️</Text>
            <Text style={styles.noticeTxt}>
              Para sa iyong seguridad, ilagay muna ang iyong kasalukuyang password bago maglagay ng bago.
            </Text>
          </View>

          {/* CURRENT PASSWORD */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>KASALUKUYANG PASSWORD</Text>
            <View style={styles.inputRow}>
              <Text style={styles.icon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="Kasalukuyang password"
                placeholderTextColor="#94A3B8"
                value={current}
                onChangeText={setCurrent}
                secureTextEntry={!shows.current}
              />
              <TouchableOpacity onPress={() => toggle('current')}>
                <Text style={styles.toggle}>{shows.current ? 'Itago' : 'Ipakita'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.separator} />

          {/* NEW PASSWORD */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>BAGONG PASSWORD</Text>
            <View style={styles.inputRow}>
              <Text style={styles.icon}>🔑</Text>
              <TextInput
                style={styles.input}
                placeholder="Minimum 8 characters"
                placeholderTextColor="#94A3B8"
                value={newPw}
                onChangeText={setNewPw}
                secureTextEntry={!shows.new}
              />
              <TouchableOpacity onPress={() => toggle('new')}>
                <Text style={styles.toggle}>{shows.new ? 'Itago' : 'Ipakita'}</Text>
              </TouchableOpacity>
            </View>

            {/* Strength Indicator */}
            {strength && (
              <View style={styles.strengthRow}>
                <View style={styles.strengthBars}>
                  {[1, 2, 3].map(i => (
                    <View
                      key={i}
                      style={[
                        styles.strengthBar,
                        { backgroundColor: i <= strength.bars ? strength.color : '#E2E8F0' }
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
              </View>
            )}
          </View>

          {/* CONFIRM NEW PASSWORD */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>KUMPIRMAHIN ANG BAGONG PASSWORD</Text>
            <View style={[styles.inputRow, pwNoMatch && styles.inputError]}>
              <Text style={styles.icon}>🔐</Text>
              <TextInput
                style={styles.input}
                placeholder="Ulitin ang bagong password"
                placeholderTextColor="#94A3B8"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry={!shows.confirm}
              />
              <TouchableOpacity onPress={() => toggle('confirm')}>
                <Text style={styles.toggle}>{shows.confirm ? 'Itago' : 'Ipakita'}</Text>
              </TouchableOpacity>
            </View>
            {pwNoMatch && <Text style={styles.hintError}>✗ Hindi magkatugma</Text>}
            {pwMatch   && <Text style={styles.hintSuccess}>✓ Magkatugma ang passwords</Text>}
          </View>

          {/* SAVE */}
          <TouchableOpacity
            style={[styles.btnSave, loading && { opacity: 0.7 }]}
            onPress={handleChange}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnSaveTxt}>I-save ang Bagong Password</Text>
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

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: BG },
  topBar:  {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: PRIMARY, paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn:     { padding: 4 },
  backIcon:    { fontSize: 30, color: '#fff', fontWeight: '300', lineHeight: 32 },
  topBarTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },

  scroll: { padding: 20, paddingBottom: 40 },

  noticeBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#EFF6FF', borderRadius: 12,
    padding: 14, marginBottom: 24, gap: 10,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  noticeIcon: { fontSize: 16 },
  noticeTxt:  { flex: 1, fontSize: 12, color: '#1E40AF', lineHeight: 18 },

  separator: { height: 1, backgroundColor: '#E2E8F0', marginBottom: 16 },

  fieldWrap:  { marginBottom: 16 },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, marginBottom: 6 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, gap: 10,
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
  },
  inputError: { borderColor: '#EF4444', borderWidth: 1.5 },
  icon:   { fontSize: 16 },
  input:  { flex: 1, fontSize: 14, color: '#1E293B', padding: 0 },
  toggle: { fontSize: 12, color: PRIMARY, fontWeight: '600' },

  strengthRow:  { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 10 },
  strengthBars: { flexDirection: 'row', gap: 4, flex: 1 },
  strengthBar:  { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel:{ fontSize: 11, fontWeight: '700', minWidth: 80 },

  hintError:   { fontSize: 11, color: '#EF4444', marginTop: 4 },
  hintSuccess: { fontSize: 11, color: '#16A34A', marginTop: 4, fontWeight: '600' },

  btnSave: {
    backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 15,
    alignItems: 'center', marginTop: 8,
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnSaveTxt:   { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnCancel:    { marginTop: 12, alignItems: 'center', paddingVertical: 10 },
  btnCancelTxt: { color: '#64748B', fontSize: 13, fontWeight: '500' },
})