import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import API from '../../services/api'
import { StepBar } from './PadalaScreen'
import { theme } from '../../theme/padulongTheme'

const C = {
  primary: theme.colors.primary,
  primaryLt: theme.colors.primarySoft,
  primaryMd: '#FFD4AE',
  text: theme.colors.text,
  textSub: theme.colors.textSub,
  textHint: theme.colors.textHint,
  border: theme.colors.border,
  bg: theme.colors.background,
  white: theme.colors.surface,
  green:     '#16A34A',
  red:       theme.colors.danger,
  orange:    '#F59E0B',
}

const Row = ({ label, value, valueColor }) => (
  <View style={s.row}>
    <Text style={s.rowLabel}>{label}</Text>
    <Text style={[s.rowValue, valueColor && { color: valueColor }]} numberOfLines={2}>
      {value || '—'}
    </Text>
  </View>
)

export default function ConfirmDeliveryScreen({ navigation, route }) {
  const {
    myCoords, destCoords, destAddress, guide,
    senderName, senderPhone, receiverName, receiverNote,
    itemTitle, deliveryType, description,
    schedule, scheduleAsap,
  } = route.params || {}

  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      const res = await API.post('/parepair/requests', {
        address:       destAddress,
        description:   [itemTitle || description || 'Package', guide].filter(Boolean).join(' | '),
        item_title:    itemTitle || description || 'Package',
        delivery_type: deliveryType || 'others',
        schedule:      schedule || 'As soon as possible',
      })

      const requestId = res.data?.request?.id || null

      navigation.replace('WaitingDelivery', {
        description:  itemTitle || description || 'Package',
        address:      destAddress,
        deliveryType: deliveryType || 'others',
        itemTitle:    itemTitle || description || 'Package',
        schedule:     schedule || 'As soon as possible',
        requestId,
      })
    } catch (err) {
      const msg = err?.response?.data?.message
               || err?.response?.data?.error
               || err?.message
               || 'Unable to submit. Please try again.'
      Alert.alert('Error', msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={s.safe}>

      <StepBar current={4} />

      <View style={s.navBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backIcon}>‹</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.heading}>
          <Text style={s.headingTitle}>Review & Confirm</Text>
          <Text style={s.headingSub}>Check your Padaya delivery details before submitting.</Text>
        </View>

        {/* Delivery destination */}
        <View style={s.card}>
          <Text style={s.cardTitle}>📍 Delivery Destination</Text>
          <View style={s.divider} />
          <Text style={s.addressText}>{destAddress || '—'}</Text>
          {!!guide && (
            <View style={s.guideBox}>
              <Text style={s.guideText}>💬 {guide}</Text>
            </View>
          )}
        </View>

        {/* Sender & Recipient */}
        <View style={s.card}>
          <Text style={s.cardTitle}>👤 Sender & Recipient</Text>
          <View style={s.divider} />
          <Row label="Sender"          value={senderName} />
          <Row label="Contact"         value={senderPhone} />
          <View style={s.divider} />
          <Row label="Recipient"       value={receiverName} />
          {!!receiverNote && <Row label="Note" value={receiverNote} />}
        </View>

        {/* Item */}
        {(itemTitle || description) && (
          <View style={s.card}>
            <Text style={s.cardTitle}>📦 Item</Text>
            <View style={s.divider} />
            <Row label="Description" value={itemTitle || description} />
            {!!deliveryType && <Row label="Type" value={deliveryType} />}
          </View>
        )}

        {/* Schedule */}
        <View style={s.card}>
          <Text style={s.cardTitle}>🗓️ Schedule</Text>
          <View style={s.divider} />
          <Row
            label="Delivery Time"
            value={schedule || 'As soon as possible'}
            valueColor={scheduleAsap ? C.green : C.primary}
          />
        </View>

        {/* COD note */}
        <View style={s.codNote}>
          <Text style={s.codIcon}>💳</Text>
          <Text style={s.codText}>
            Payment will be collected upon delivery.{' '}
            <Text style={{ fontWeight: '700' }}>Cash on Delivery only.</Text>
          </Text>
        </View>

        <View style={{ height: 12 }} />
      </ScrollView>

      {/* Footer */}
      <View style={s.footer}>
        <TouchableOpacity style={s.editBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <Text style={s.editBtnText}>← Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.submitBtn, submitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting
            ? <ActivityIndicator size="small" color={C.white} />
            : <Text style={s.submitBtnText}>✅ Submit Padaya Request</Text>
          }
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  navBar:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: Platform.OS === 'android' ? 8 : 4, paddingBottom: 8, backgroundColor: C.white },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.primaryLt, alignItems: 'center', justifyContent: 'center' },
  backIcon:{ fontSize: 22, color: C.primary, fontWeight: '600', lineHeight: 28 },

  scroll: { padding: 16, gap: 12 },

  heading:     { marginBottom: 4 },
  headingTitle:{ fontSize: 20, fontWeight: '800', color: C.text },
  headingSub:  { fontSize: 13, color: C.textSub, marginTop: 3 },

  card:        { backgroundColor: C.white, borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: C.border, gap: 10 },
  cardTitle:   { fontSize: 13, fontWeight: '700', color: C.text },
  divider:     { height: 0.5, backgroundColor: C.border },
  addressText: { fontSize: 14, color: C.text, fontWeight: '600', lineHeight: 20 },

  guideBox:  { backgroundColor: C.bg, borderRadius: 10, padding: 10, borderWidth: 0.5, borderColor: C.border },
  guideText: { fontSize: 12, color: C.textSub, lineHeight: 18 },

  row:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  rowLabel:  { fontSize: 12, color: C.textSub, flex: 1 },
  rowValue:  { fontSize: 13, fontWeight: '600', color: C.text, flex: 1.5, textAlign: 'right' },

  codNote: { flexDirection: 'row', gap: 10, backgroundColor: C.primaryLt, borderRadius: 12, padding: 13, borderWidth: 0.5, borderColor: C.primaryMd },
  codIcon: { fontSize: 16 },
  codText: { flex: 1, fontSize: 12, color: C.text, lineHeight: 18 },

  footer:        { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: Platform.OS === 'android' ? 20 : 32, paddingTop: 12, backgroundColor: C.white, borderTopWidth: 0.5, borderTopColor: C.border },
  editBtn:       { backgroundColor: '#F1F5F9', borderRadius: 14, paddingVertical: 15, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  editBtnText:   { color: '#475569', fontSize: 14, fontWeight: '700' },
  submitBtn:     { flex: 1, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  submitBtnText: { color: C.white, fontSize: 14, fontWeight: '700' },
})
