import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  ScrollView, KeyboardAvoidingView, Platform,
  SafeAreaView, StatusBar
} from 'react-native'
import * as SecureStore from 'expo-secure-store'
import API from '../../services/api'

const PRIMARY = '#2563EB'
const BG      = '#F8FAFF'

export default function ChangePasswordScreen({ navigation }) {
  const [current, setCurrent] = useState('')
  const [newPw,   setNewPw]   = useState('')
  const [confirm, setConfirm] = useState('')
  const [shows,   setShows]   = useState({ current: false, new: false, confirm: false })
  const [loading, setLoading] = useState(false)

  const toggle = (key) => setShows(p => ({ ...p, [key]: !p[key] }))

  const pwStrength = () => {
    if (!newPw) return null
    if (newPw.length < 6)  return { label: 'Weak',   color: '#EF4444', bars: 1 }
    if (newPw.length < 10) return { label: 'Fair',   color: '#F59E0B', bars: 2 }
    return                        { label: 'Strong', color: '#16A34A', bars: 3 }
  }

  const handleChange = async () => {
    if (!current || !newPw || !confirm) return Alert.alert('Error', 'Please fill in all fields.')
    if (newPw.length < 8)               return Alert.alert('Error', 'Password must be at least 8 characters.')
    if (newPw !== confirm)              return Alert.alert('Error', 'New passwords do not match.')
    if (current === newPw)              return Alert.alert('Error', 'New password must be different from current.')
    try {
      setLoading(true)
      const token = await SecureStore.getItemAsync('token')
      await API.put('/auth/change-password', {
        current_password: current,
        new_password: newPw,
      }, { headers: { Authorization: `Bearer ${token}` } })
      Alert.alert('Password Changed 🔐', 'Your password has been updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ])
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Incorrect current password.')
    } finally {
      setLoading(false)
    }
  }

  const strength  = pwStrength()
  const pwMatch   = confirm !== '' && newPw === confirm
  const pwNoMatch = confirm !== '' && newPw !== confirm

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        <View style={s.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={s.topBarTitle}>Change Password</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={s.noticeBox}>
            <Text style={s.noticeIcon}>ℹ️</Text>
            <Text style={s.noticeTxt}>Enter your current password first, then choose a new secure password.</Text>
          </View>

          <PwField label="CURRENT PASSWORD" icon="🔒" placeholder="Current password"
            value={current} onChange={setCurrent} show={shows.current} onToggle={() => toggle('current')} />

          <View style={s.separator} />

          <PwField label="NEW PASSWORD" icon="🔑" placeholder="Minimum 8 characters"
            value={newPw} onChange={setNewPw} show={shows.new} onToggle={() => toggle('new')} />
          {strength && (
            <View style={s.strengthRow}>
              <View style={s.strengthBars}>
                {[1, 2, 3].map(i => (
                  <View key={i} style={[s.strengthBar, { backgroundColor: i <= strength.bars ? strength.color : '#E2E8F0' }]} />
                ))}
              </View>
              <Text style={[s.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
            </View>
          )}

          <View style={{ height: 16 }} />

          <PwField label="CONFIRM NEW PASSWORD" icon="🔐" placeholder="Repeat new password"
            value={confirm} onChange={setConfirm} show={shows.confirm} onToggle={() => toggle('confirm')} error={pwNoMatch} />
          {pwNoMatch && <Text style={s.hintError}>✗ Passwords don't match</Text>}
          {pwMatch   && <Text style={s.hintSuccess}>✓ Passwords match</Text>}

          <TouchableOpacity style={[s.btnSave, loading && { opacity: 0.7 }]} onPress={handleChange} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnSaveTxt}>Save New Password</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={s.btnCancel} onPress={() => navigation.goBack()}>
            <Text style={s.btnCancelTxt}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function PwField({ label, icon, placeholder, value, onChange, show, onToggle, error }) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={[s.inputRow, error && s.inputError]}>
        <Text style={s.icon}>{icon}</Text>
        <TextInput style={s.input} placeholder={placeholder} placeholderTextColor="#94A3B8"
          value={value} onChangeText={onChange} secureTextEntry={!show} />
        <TouchableOpacity onPress={onToggle}>
          <Text style={s.toggle}>{show ? 'Hide' : 'Show'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: BG },
  topBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: PRIMARY, paddingHorizontal: 16, paddingVertical: 14 },
  backBtn:     { padding: 4 },
  backIcon:    { fontSize: 30, color: '#fff', fontWeight: '300', lineHeight: 32 },
  topBarTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  scroll:      { padding: 20, paddingBottom: 40 },
  noticeBox:   { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#EFF6FF', borderRadius: 12, padding: 14, marginBottom: 24, gap: 10, borderWidth: 1, borderColor: '#BFDBFE' },
  noticeIcon:  { fontSize: 16 },
  noticeTxt:   { flex: 1, fontSize: 12, color: '#1E40AF', lineHeight: 18 },
  separator:   { height: 1, backgroundColor: '#E2E8F0', marginBottom: 16 },
  fieldWrap:   { marginBottom: 8 },
  fieldLabel:  { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, marginBottom: 6 },
  inputRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  inputError:  { borderColor: '#EF4444', borderWidth: 1.5 },
  icon:        { fontSize: 16 },
  input:       { flex: 1, fontSize: 14, color: '#1E293B', padding: 0 },
  toggle:      { fontSize: 12, color: PRIMARY, fontWeight: '600' },
  strengthRow:  { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 10 },
  strengthBars: { flexDirection: 'row', gap: 4, flex: 1 },
  strengthBar:  { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel:{ fontSize: 11, fontWeight: '700', minWidth: 50 },
  hintError:   { fontSize: 11, color: '#EF4444', marginTop: 4, marginBottom: 8 },
  hintSuccess: { fontSize: 11, color: '#16A34A', marginTop: 4, marginBottom: 8, fontWeight: '600' },
  btnSave:     { backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 16, shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  btnSaveTxt:  { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnCancel:   { marginTop: 12, alignItems: 'center', paddingVertical: 10 },
  btnCancelTxt:{ color: '#64748B', fontSize: 13, fontWeight: '500' },
})
