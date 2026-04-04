// Screen 2: PasabuyRequestScreen.js — Item Request Details
// FIXED: keyboard auto-dismiss on Android
// ROOT CAUSE FIX: Moved <Field> component OUTSIDE the parent component
// so React doesn't treat it as a new component type on every render.

import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Platform, TextInput, ScrollView,
  Keyboard, BackHandler,
} from 'react-native'

const GREEN    = '#059669'
const GREEN_BG = '#ecfdf5'
const GREEN_DK = '#064e3b'
const RED      = '#ef4444'

// ✅ FIX: Field is defined OUTSIDE PasabuyRequestScreen.
// Previously it was inside the component, which caused React to treat it
// as a brand-new component type on every re-render (every keystroke),
// unmounting and remounting it — which dismissed the keyboard instantly.
const Field = ({ label, required, error, children }) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>
      {label}{required && <Text style={styles.required}> *</Text>}
    </Text>
    {children}
    {!!error && <Text style={styles.errorText}>{error}</Text>}
  </View>
)

export default function PasabuyRequestScreen({ navigation, route }) {
  const { deliveryAddress, coordinates } = route.params || {}

  const [itemName, setItemName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [store,    setStore]    = useState('')
  const [budget,   setBudget]   = useState('')
  const [notes,    setNotes]    = useState('')
  const [errors,   setErrors]   = useState({})
  const [keyboardVisible, setKeyboardVisible] = useState(false)

  const quantityRef = useRef(null)
  const storeRef    = useRef(null)
  const budgetRef   = useRef(null)
  const notesRef    = useRef(null)

  // Track keyboard visibility
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true))
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false))
    return () => { show.remove(); hide.remove() }
  }, [])

  // Android back button — dismiss keyboard first
  useEffect(() => {
    const onBack = () => {
      if (keyboardVisible) { Keyboard.dismiss(); return true }
      return false
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack)
    return () => sub.remove()
  }, [keyboardVisible])

  const validate = () => {
    const e = {}
    if (!itemName.trim())  e.itemName = 'Kinakailangan ang pangalan ng item.'
    if (!quantity.trim() || isNaN(Number(quantity)) || Number(quantity) < 1)
      e.quantity = 'Ilagay ang tamang dami.'
    if (!budget.trim() || isNaN(Number(budget)) || Number(budget) <= 0)
      e.budget = 'Ilagay ang tamang budget.'
    return e
  }

  const handleContinue = () => {
    Keyboard.dismiss()
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setErrors({})
    navigation.navigate('PasabuyReview', {
      deliveryAddress, coordinates,
      itemName: itemName.trim(),
      quantity: Number(quantity),
      store:    store.trim() || 'Hindi tinukoy',
      budget:   Number(budget),
      notes:    notes.trim(),
    })
  }

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => { Keyboard.dismiss(); setTimeout(() => navigation.goBack(), 50) }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}><Text style={{ fontSize: 16 }}>🛒</Text></View>
          <Text style={styles.title}>Detalye ng Order</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* ── Step indicator ── */}
      <View style={styles.stepRow}>
        {['Lokasyon', 'Detalye', 'Review', 'Kumpirma'].map((label, i) => (
          <View key={i} style={styles.stepItem}>
            <View style={[
              styles.stepDot,
              i < 1   && styles.stepDotDone,
              i === 1 && styles.stepDotActive,
            ]}>
              <Text style={[styles.stepNum, i <= 1 && styles.stepNumDone]}>
                {i < 1 ? '✓' : i + 1}
              </Text>
            </View>
            <Text style={[styles.stepLabel, i === 1 && styles.stepLabelActive]}>{label}</Text>
          </View>
        ))}
      </View>

      {/* ── Address chip ── */}
      <View style={styles.addressChip}>
        <Text style={styles.addressChipIcon}>📍</Text>
        <Text style={styles.addressChipText} numberOfLines={1}>{deliveryAddress}</Text>
      </View>

      {/* ── Form ──
          ✅ KEY FIX: NO KeyboardAvoidingView on Android
          It causes the auto-dismiss loop on Android.
          softwareKeyboardLayoutMode="pan" in app.json handles
          the layout shift instead. ScrollView lang. ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
      >
        <Field label="Pangalan ng Item" required error={errors.itemName}>
          <TextInput
            style={[styles.input, !!errors.itemName && styles.inputError]}
            placeholder="hal. Rice, Corned Beef, Noodles..."
            placeholderTextColor="#94a3b8"
            value={itemName}
            onChangeText={(v) => { setItemName(v); setErrors(p => ({ ...p, itemName: null })) }}
            returnKeyType="next"
            onSubmitEditing={() => quantityRef.current?.focus()}
            blurOnSubmit={false}
          />
        </Field>

        <Field label="Dami / Quantity" required error={errors.quantity}>
          <View style={styles.qtyRow}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity(q => String(Math.max(1, Number(q) - 1)))}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <TextInput
              ref={quantityRef}
              style={[styles.qtyInput, !!errors.quantity && styles.inputError]}
              value={quantity}
              onChangeText={(v) => { setQuantity(v); setErrors(p => ({ ...p, quantity: null })) }}
              keyboardType="numeric"
              textAlign="center"
              returnKeyType="next"
              onSubmitEditing={() => storeRef.current?.focus()}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity(q => String(Number(q) + 1))}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </Field>

        <Field label="Piniling Tindahan / Source">
          <TextInput
            ref={storeRef}
            style={styles.input}
            placeholder="hal. Palengke, 7-Eleven... (opsyonal)"
            placeholderTextColor="#94a3b8"
            value={store}
            onChangeText={setStore}
            returnKeyType="next"
            onSubmitEditing={() => budgetRef.current?.focus()}
            blurOnSubmit={false}
          />
        </Field>

        <Field label="Budget (₱)" required error={errors.budget}>
          <View style={[styles.budgetWrapper, !!errors.budget && styles.inputError]}>
            <Text style={styles.pesoSign}>₱</Text>
            <TextInput
              ref={budgetRef}
              style={styles.budgetInput}
              placeholder="0.00"
              placeholderTextColor="#94a3b8"
              value={budget}
              onChangeText={(v) => { setBudget(v); setErrors(p => ({ ...p, budget: null })) }}
              keyboardType="decimal-pad"
              returnKeyType="next"
              onSubmitEditing={() => notesRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>
          <Text style={styles.budgetHint}>Ito ang magiging spending limit ng provider mo.</Text>
        </Field>

        <Field label="Notes / Special Instructions">
          <TextInput
            ref={notesRef}
            style={[styles.input, styles.notesInput]}
            placeholder={'hal.\n"Pwede ibang brand kung wala"\n"Huwag masyadong malambot ang tinapay"'}
            placeholderTextColor="#94a3b8"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            returnKeyType="done"
            blurOnSubmit
          />
        </Field>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Continue button — absolute sa bottom para hindi ma-cover ng keyboard ── */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.85}>
          <Text style={styles.continueBtnText}>Susunod: I-review ang Order  →</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#fff' },

  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 48 : 12, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#d1fae5' },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: GREEN_BG, alignItems: 'center', justifyContent: 'center' },
  backIcon:{ fontSize: 22, color: GREEN, fontWeight: '600', lineHeight: 28 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon:{ width: 32, height: 32, borderRadius: 8, backgroundColor: GREEN_BG, alignItems: 'center', justifyContent: 'center' },
  title:   { fontSize: 17, fontWeight: '700', color: GREEN_DK },

  stepRow:        { flexDirection: 'row', justifyContent: 'center', paddingVertical: 10, backgroundColor: '#fff' },
  stepItem:       { alignItems: 'center', width: 72 },
  stepDot:        { width: 26, height: 26, borderRadius: 13, backgroundColor: '#f1f5f9', borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  stepDotDone:    { backgroundColor: GREEN_BG, borderColor: GREEN },
  stepDotActive:  { backgroundColor: GREEN, borderColor: GREEN },
  stepNum:        { fontSize: 11, fontWeight: '700', color: '#94a3b8' },
  stepNumDone:    { color: GREEN },
  stepLabel:      { fontSize: 9, color: '#94a3b8', fontWeight: '600' },
  stepLabelActive:{ color: GREEN },

  addressChip:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: GREEN_BG, marginHorizontal: 16, marginVertical: 8, borderRadius: 10, padding: 10, borderWidth: 0.5, borderColor: '#a7f3d0' },
  addressChipIcon: { fontSize: 13 },
  addressChipText: { flex: 1, fontSize: 12, color: GREEN_DK, fontWeight: '600' },

  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },

  fieldGroup: { marginBottom: 18 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 7 },
  required:   { color: RED },
  errorText:  { fontSize: 11, color: RED, marginTop: 5 },

  input:      { backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#0f172a' },
  inputError: { borderColor: RED },
  notesInput: { height: 100, paddingTop: 12 },

  qtyRow:    { flexDirection: 'row', alignItems: 'center' },
  qtyBtn:    { width: 44, height: 44, backgroundColor: GREEN_BG, borderWidth: 1, borderColor: '#a7f3d0', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText:{ fontSize: 22, color: GREEN, fontWeight: '700', lineHeight: 28 },
  qtyInput:  { flex: 1, marginHorizontal: 8, backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 18, fontWeight: '700', color: '#0f172a', paddingVertical: 10 },

  budgetWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 14 },
  pesoSign:      { fontSize: 16, fontWeight: '700', color: GREEN, marginRight: 6 },
  budgetInput:   { flex: 1, fontSize: 16, color: '#0f172a', paddingVertical: 12, fontWeight: '600' },
  budgetHint:    { fontSize: 11, color: '#64748b', marginTop: 5 },

  footer:          { paddingHorizontal: 20, paddingBottom: Platform.OS === 'android' ? 20 : 32, paddingTop: 12, backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: '#e2e8f0' },
  continueBtn:     { backgroundColor: GREEN, borderRadius: 14, paddingVertical: 15, alignItems: 'center', shadowColor: GREEN, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  continueBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
})