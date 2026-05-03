import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, TextInput, ScrollView,
  Keyboard, BackHandler,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const C = {
  primary:   '#2563EB',
  primaryLt: '#EFF6FF',
  primaryMd: '#BFDBFE',
  text:      '#0F172A',
  textSub:   '#64748B',
  textHint:  '#94A3B8',
  border:    '#E2E8F0',
  bg:        '#F8FAFF',
  white:     '#FFFFFF',
  red:       '#EF4444',
}

const STEPS = ['Location', 'Details', 'Review', 'Confirm']

// Field must be OUTSIDE the parent component — prevents keyboard dismiss on each keystroke
const Field = ({ label, required, error, children }) => (
  <View style={s.fieldGroup}>
    <Text style={s.fieldLabel}>
      {label}{required && <Text style={{ color: C.red }}> *</Text>}
    </Text>
    {children}
    {!!error && <Text style={s.errorText}>{error}</Text>}
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

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true))
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false))
    return () => { show.remove(); hide.remove() }
  }, [])

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
    if (!itemName.trim()) e.itemName = 'Item name is required.'
    if (!quantity.trim() || isNaN(Number(quantity)) || Number(quantity) < 1)
      e.quantity = 'Please enter a valid quantity.'
    if (!budget.trim() || isNaN(Number(budget)) || Number(budget) <= 0)
      e.budget = 'Please enter a valid budget.'
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
      store:    store.trim() || 'Not specified',
      budget:   Number(budget),
      notes:    notes.trim(),
    })
  }

  return (
    <SafeAreaView style={s.safe}>

      {/* Step bar */}
      <View style={s.stepBar}>
        {STEPS.map((label, i) => (
          <React.Fragment key={i}>
            <View style={s.stepItem}>
              <View style={[s.stepDot, i <= 1 && s.stepDotActive]}>
                <Text style={[s.stepNum, i <= 1 && s.stepNumActive]}>
                  {i < 1 ? '✓' : i + 1}
                </Text>
              </View>
              <Text style={[s.stepLabel, i === 1 && s.stepLabelActive]}>{label}</Text>
            </View>
            {i < STEPS.length - 1 && <View style={s.stepConnector} />}
          </React.Fragment>
        ))}
      </View>

      {/* Nav bar */}
      <View style={s.navBar}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => { Keyboard.dismiss(); setTimeout(() => navigation.goBack(), 50) }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={s.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
      </View>

      {/* Delivery address chip */}
      <View style={s.addressChip}>
        <Text style={s.addressChipIcon}>📍</Text>
        <Text style={s.addressChipText} numberOfLines={1}>{deliveryAddress}</Text>
      </View>

      {/* Form — no KeyboardAvoidingView on Android; softwareKeyboardLayoutMode="pan" in app.json handles it */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
      >
        <Field label="Item Name" required error={errors.itemName}>
          <TextInput
            style={[s.input, !!errors.itemName && s.inputError]}
            placeholder="e.g. Rice, Corned Beef, Noodles..."
            placeholderTextColor={C.textHint}
            value={itemName}
            onChangeText={(v) => { setItemName(v); setErrors(p => ({ ...p, itemName: null })) }}
            returnKeyType="next"
            onSubmitEditing={() => quantityRef.current?.focus()}
            blurOnSubmit={false}
          />
        </Field>

        <Field label="Quantity" required error={errors.quantity}>
          <View style={s.qtyRow}>
            <TouchableOpacity
              style={s.qtyBtn}
              onPress={() => setQuantity(q => String(Math.max(1, Number(q) - 1)))}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={s.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <TextInput
              ref={quantityRef}
              style={[s.qtyInput, !!errors.quantity && s.inputError]}
              value={quantity}
              onChangeText={(v) => { setQuantity(v); setErrors(p => ({ ...p, quantity: null })) }}
              keyboardType="numeric"
              textAlign="center"
              returnKeyType="next"
              onSubmitEditing={() => storeRef.current?.focus()}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={s.qtyBtn}
              onPress={() => setQuantity(q => String(Number(q) + 1))}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={s.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </Field>

        <Field label="Preferred Store (optional)">
          <TextInput
            ref={storeRef}
            style={s.input}
            placeholder="e.g. Palengke, 7-Eleven... (optional)"
            placeholderTextColor={C.textHint}
            value={store}
            onChangeText={setStore}
            returnKeyType="next"
            onSubmitEditing={() => budgetRef.current?.focus()}
            blurOnSubmit={false}
          />
        </Field>

        <Field label="Budget (₱)" required error={errors.budget}>
          <View style={[s.budgetWrapper, !!errors.budget && s.inputError]}>
            <Text style={s.pesoSign}>₱</Text>
            <TextInput
              ref={budgetRef}
              style={s.budgetInput}
              placeholder="0.00"
              placeholderTextColor={C.textHint}
              value={budget}
              onChangeText={(v) => { setBudget(v); setErrors(p => ({ ...p, budget: null })) }}
              keyboardType="decimal-pad"
              returnKeyType="next"
              onSubmitEditing={() => notesRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>
          <Text style={s.budgetHint}>This is the spending limit for your shopper.</Text>
        </Field>

        <Field label="Notes / Special Instructions (optional)">
          <TextInput
            ref={notesRef}
            style={[s.input, s.notesInput]}
            placeholder={'e.g.\n"Any brand is fine if unavailable"\n"Soft bread please"'}
            placeholderTextColor={C.textHint}
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

      {/* Footer */}
      <View style={s.footer}>
        <TouchableOpacity style={s.continueBtn} onPress={handleContinue} activeOpacity={0.85}>
          <Text style={s.continueBtnText}>Next: Review Order →</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.white },

  navBar:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: Platform.OS === 'android' ? 8 : 4, paddingBottom: 6, backgroundColor: C.white },
  backBtn:       { width: 36, height: 36, borderRadius: 10, backgroundColor: C.primaryLt, alignItems: 'center', justifyContent: 'center' },
  backIcon:      { fontSize: 22, color: C.primary, fontWeight: '600', lineHeight: 28 },

  stepBar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 8, backgroundColor: C.white, borderBottomWidth: 0.5, borderBottomColor: C.border },
  stepItem:      { alignItems: 'center' },
  stepConnector: { flex: 1, height: 1.5, backgroundColor: C.border, marginHorizontal: 4, marginBottom: 14 },
  stepDot:       { width: 22, height: 22, borderRadius: 11, backgroundColor: '#F1F5F9', borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  stepDotActive: { backgroundColor: C.primary, borderColor: C.primary },
  stepNum:       { fontSize: 10, fontWeight: '700', color: C.textHint },
  stepNumActive: { color: C.white },
  stepLabel:     { fontSize: 8, color: C.textHint, fontWeight: '600' },
  stepLabelActive:{ color: C.primary },

  addressChip:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primaryLt, marginHorizontal: 16, marginVertical: 8, borderRadius: 10, padding: 10, borderWidth: 0.5, borderColor: C.primaryMd },
  addressChipIcon: { fontSize: 13 },
  addressChipText: { flex: 1, fontSize: 12, color: C.text, fontWeight: '600' },

  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },

  fieldGroup: { marginBottom: 18 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 7 },
  errorText:  { fontSize: 11, color: C.red, marginTop: 5 },

  input:      { backgroundColor: C.bg, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.text },
  inputError: { borderColor: C.red },
  notesInput: { height: 100, paddingTop: 12, textAlignVertical: 'top' },

  qtyRow:    { flexDirection: 'row', alignItems: 'center' },
  qtyBtn:    { width: 44, height: 44, backgroundColor: C.primaryLt, borderWidth: 1, borderColor: C.primaryMd, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText:{ fontSize: 22, color: C.primary, fontWeight: '700', lineHeight: 28 },
  qtyInput:  { flex: 1, marginHorizontal: 8, backgroundColor: C.bg, borderRadius: 12, borderWidth: 1, borderColor: C.border, fontSize: 18, fontWeight: '700', color: C.text, paddingVertical: 10, textAlign: 'center' },

  budgetWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14 },
  pesoSign:      { fontSize: 16, fontWeight: '700', color: C.primary, marginRight: 6 },
  budgetInput:   { flex: 1, fontSize: 16, color: C.text, paddingVertical: 12, fontWeight: '600' },
  budgetHint:    { fontSize: 11, color: C.textSub, marginTop: 5 },

  footer:          { paddingHorizontal: 20, paddingBottom: Platform.OS === 'android' ? 20 : 32, paddingTop: 12, backgroundColor: C.white, borderTopWidth: 0.5, borderTopColor: C.border },
  continueBtn:     { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  continueBtnText: { color: C.white, fontSize: 15, fontWeight: '700' },
})
