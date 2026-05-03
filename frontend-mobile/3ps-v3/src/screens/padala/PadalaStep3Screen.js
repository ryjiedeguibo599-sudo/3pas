import React, { useState, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StepBar } from './PadalaScreen'
import { theme } from '../../theme/padulongTheme'

const C = {
  primary: theme.colors.primary,
  primaryLt: theme.colors.primarySoft,
  primaryMd: '#FFD4AE',
  accent:      '#F97316',
  text: theme.colors.text,
  textSub: theme.colors.textSub,
  textHint: theme.colors.textHint,
  border: theme.colors.border,
  borderFocus: '#FBC28F',
  bg: theme.colors.background,
  white: theme.colors.surface,
  error: theme.colors.danger,
  purple:      '#7C3AED',
  green:       '#059669',
}

const SIZES     = ['Small', 'Medium', 'Large']
const MATERIALS = ['Paper', 'Plastic', 'Metal', 'Fabric', 'Glass']
const PACKAGING = ['Bag', 'Box', 'Envelope', 'Wrapped', 'No packaging']

export default function PadalaStep3Screen({ route, navigation }) {
  const prev = route.params || {}

  const [itemTitle,      setItemTitle]      = useState('')
  const [size,           setSize]           = useState('')
  const [sizeOther,      setSizeOther]      = useState('')
  const [material,       setMaterial]       = useState('')
  const [materialOther,  setMaterialOther]  = useState('')
  const [packaging,      setPackaging]      = useState('')
  const [packagingOther, setPackagingOther] = useState('')
  const [error,          setError]          = useState('')

  const itemRef = useRef()

  const resolvedSize     = size === 'Other'     ? sizeOther.trim()     : size
  const resolvedMaterial = material === 'Other' ? materialOther.trim() : material
  const resolvedPack     = packaging === 'Other'? packagingOther.trim(): packaging

  const summaryParts = [resolvedSize, resolvedMaterial, resolvedPack].filter(Boolean)

  const handleNext = () => {
    if (!itemTitle.trim()) {
      setError('Please describe what you are sending.')
      itemRef.current?.focus()
      return
    }
    setError('')
    const parts = [itemTitle.trim(), ...summaryParts]
    navigation.navigate('ScheduleDelivery', {
      ...prev,
      deliveryType: 'others',
      itemTitle:    itemTitle.trim(),
      description:  parts.join(' · '),
    })
  }

  return (
    <SafeAreaView style={s.safe}>
      <StepBar current={2} />

      <View style={s.navBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={s.navTitle}>Package Details</Text>
      </View>

      {/* ── Summary bar — always visible at top ── */}
      <View style={s.summaryBar}>
        <Text style={s.summaryLabel}>Selected:</Text>
        {summaryParts.length === 0 ? (
          <Text style={s.summaryEmpty}>None yet</Text>
        ) : (
          <View style={s.summaryPills}>
            {summaryParts.map((v, i) => (
              <View key={i} style={s.pill}>
                <Text style={s.pillText}>{v}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Item ── */}
        <Section title="Item *">
          <TextInput
            ref={itemRef}
            style={[s.input, error ? s.inputError : null]}
            placeholder="e.g. Medicine, Documents, Clothes…"
            placeholderTextColor={C.textHint}
            value={itemTitle}
            onChangeText={t => { setItemTitle(t); setError('') }}
            returnKeyType="done"
            blurOnSubmit
          />
          {!!error && <Text style={s.errorText}>⚠ {error}</Text>}
        </Section>

        {/* ── Size ── */}
        <Section title="Size">
          <ChipGroup
            options={SIZES}
            selected={size}
            onSelect={setSize}
            accentColor={C.primary}
          />
          {size === 'Other' && (
            <TextInput
              style={s.otherInput}
              placeholder="Describe the size…"
              placeholderTextColor={C.textHint}
              value={sizeOther}
              onChangeText={setSizeOther}
              returnKeyType="done"
              blurOnSubmit
              autoFocus
            />
          )}
        </Section>

        {/* ── Material ── */}
        <Section title="Material">
          <ChipGroup
            options={MATERIALS}
            selected={material}
            onSelect={setMaterial}
            accentColor={C.purple}
          />
          {material === 'Other' && (
            <TextInput
              style={s.otherInput}
              placeholder="Describe the material…"
              placeholderTextColor={C.textHint}
              value={materialOther}
              onChangeText={setMaterialOther}
              returnKeyType="done"
              blurOnSubmit
              autoFocus
            />
          )}
        </Section>

        {/* ── Packaging ── */}
        <Section title="Packaging">
          <ChipGroup
            options={PACKAGING}
            selected={packaging}
            onSelect={setPackaging}
            accentColor={C.green}
          />
          {packaging === 'Other' && (
            <TextInput
              style={s.otherInput}
              placeholder="Describe the packaging…"
              placeholderTextColor={C.textHint}
              value={packagingOther}
              onChangeText={setPackagingOther}
              returnKeyType="done"
              blurOnSubmit
              autoFocus
            />
          )}
        </Section>

        <View style={{ height: 16 }} />
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={s.nextBtn} onPress={handleNext} activeOpacity={0.85}>
          <Text style={s.nextBtnText}>Next: Padaya Schedule →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

function Section({ title, children }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

function ChipGroup({ options, selected, onSelect, accentColor }) {
  const all = [...options, 'Other']
  return (
    <View style={s.chips}>
      {all.map(v => {
        const active = selected === v
        const isOther = v === 'Other'
        return (
          <TouchableOpacity
            key={v}
            style={[
              s.chip,
              active && { backgroundColor: accentColor + '15', borderColor: accentColor, borderWidth: 1.5 },
              isOther && !active && s.chipOther,
            ]}
            onPress={() => onSelect(selected === v ? '' : v)}
            activeOpacity={0.7}
          >
            {isOther && !active && <Text style={s.chipOtherIcon}>✏ </Text>}
            <Text style={[s.chipText, active && { color: accentColor, fontWeight: '700' }]}>
              {isOther && !active ? 'Other…' : v}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  navBar:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingTop: Platform.OS === 'android' ? 6 : 2, paddingBottom: 10, backgroundColor: C.white, borderBottomWidth: 0.5, borderBottomColor: C.border },
  backBtn:  { width: 32, height: 32, borderRadius: 10, backgroundColor: C.primaryLt, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20, color: C.primary, fontWeight: '700', lineHeight: 26 },
  navTitle: { fontSize: 15, fontWeight: '700', color: C.text },

  summaryBar:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: C.primaryLt, borderBottomWidth: 1, borderBottomColor: C.primaryMd, flexWrap: 'wrap' },
  summaryLabel: { fontSize: 12, fontWeight: '700', color: C.primary },
  summaryEmpty: { fontSize: 12, color: C.textHint, fontStyle: 'italic' },
  summaryPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill:         { backgroundColor: C.white, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: C.primaryMd },
  pillText:     { fontSize: 12, color: C.primary, fontWeight: '600' },

  scroll:   { paddingHorizontal: 16, paddingTop: 14, gap: 12 },

  section:      { backgroundColor: C.white, borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: C.border, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: C.textSub, textTransform: 'uppercase', letterSpacing: 0.6 },

  input:      { backgroundColor: C.bg, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: C.text },
  inputError: { borderColor: C.error },
  errorText:  { fontSize: 12, color: C.error, fontWeight: '500' },

  otherInput: { backgroundColor: C.bg, borderRadius: 10, borderWidth: 1.5, borderColor: C.borderFocus, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: C.text, marginTop: 2 },

  chips:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:          { paddingHorizontal: 13, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg, flexDirection: 'row', alignItems: 'center' },
  chipOther:     { borderStyle: 'dashed', borderColor: C.textHint },
  chipOtherIcon: { fontSize: 11, color: C.textHint },
  chipText:      { fontSize: 13, color: C.textSub, fontWeight: '500' },

  footer:      { paddingHorizontal: 16, paddingBottom: Platform.OS === 'android' ? 20 : 32, paddingTop: 12, backgroundColor: C.white, borderTopWidth: 0.5, borderTopColor: C.border },
  nextBtn:     { backgroundColor: C.accent, borderRadius: 14, paddingVertical: 14, alignItems: 'center', shadowColor: C.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5 },
  nextBtnText: { color: C.white, fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
})
