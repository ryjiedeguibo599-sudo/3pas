// Screen 3: PasabuyReviewScreen.js — Order Review / Summary
// FIXED: passes real orderId to PasabuyMatching so socket/polling works

import React, { useRef, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, ScrollView, Animated,
  ActivityIndicator, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import API from '../../services/api'

const GREEN    = '#059669'
const GREEN_BG = '#ecfdf5'
const GREEN_DK = '#064e3b'

export default function PasabuyReviewScreen({ navigation, route }) {
  const {
    deliveryAddress, coordinates,
    itemName, quantity, store, budget, notes,
  } = route.params || {}

  const [submitting, setSubmitting] = useState(false)
  const btnScale = useRef(new Animated.Value(1)).current

  const handleConfirm = async () => {
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1,    duration: 80, useNativeDriver: true }),
    ]).start()

    try {
      setSubmitting(true)

      // ✅ POST to backend — get real orderId back
      const res = await API.post('/pasabuy/orders', {
        delivery_address: deliveryAddress,
        latitude:  coordinates?.latitude,
        longitude: coordinates?.longitude,
        items: [{
        item_name: itemName,
        quantity,
        price: Number(budget),   // ← budget ang gagamitin bilang estimated price
      }],
      preferred_store:  store,
      budget,
      notes,
      total_amount: Number(budget),  // ← total = budget
      })

      // ✅ Pass real orderId to matching screen
      const orderId = res.data?.order?.id || res.data?.id || null

      if (!orderId) {
        // Order created but no ID returned — still go to matching
        console.warn('No orderId returned from backend')
      }

      navigation.replace('PasabuyMatching', {
        deliveryAddress, itemName, quantity,
        store, budget, notes,
        orderId, // ← real ID para sa socket/polling
      })

    } catch (err) {
      const msg = err?.response?.data?.message
               || err?.response?.data?.error
               || err?.message
               || 'Hindi ma-send ang order. Subukan ulit.'
      Alert.alert('Error', msg)
    } finally {
      setSubmitting(false)
    }
  }

  const Row = ({ icon, label, value, highlight }) => (
    <View style={styles.summaryRow}>
      <View style={styles.summaryLeft}>
        <Text style={styles.summaryIcon}>{icon}</Text>
        <Text style={styles.summaryLabel}>{label}</Text>
      </View>
      <Text style={[styles.summaryValue, highlight && styles.summaryValueHighlight]}>
        {value}
      </Text>
    </View>
  )

  return (
    <SafeAreaView style={styles.safe}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}><Text style={{ fontSize: 16 }}>🛒</Text></View>
          <Text style={styles.title}>I-review ang Order</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Step indicator */}
      <View style={styles.stepRow}>
        {['Lokasyon', 'Detalye', 'Review', 'Kumpirma'].map((label, i) => (
          <View key={i} style={styles.stepItem}>
            <View style={[
              styles.stepDot,
              i < 2 && styles.stepDotDone,
              i === 2 && styles.stepDotActive,
            ]}>
              <Text style={[styles.stepNum, i <= 2 && styles.stepNumDone]}>
                {i < 2 ? '✓' : i + 1}
              </Text>
            </View>
            <Text style={[styles.stepLabel, i === 2 && styles.stepLabelActive]}>{label}</Text>
          </View>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Delivery location */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Delivery Location</Text>
          <View style={styles.divider} />
          <Text style={styles.addressText}>{deliveryAddress}</Text>
        </View>

        {/* Order details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🛒 Detalye ng Order</Text>
          <View style={styles.divider} />
          <Row icon="📦" label="Item"     value={itemName} />
          <Row icon="🔢" label="Dami"     value={`x${quantity}`} />
          <Row icon="🏪" label="Tindahan" value={store !== 'Hindi tinukoy' ? store : '—'} />
          <Row icon="💰" label="Budget"   value={`₱${Number(budget).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`} highlight />
          {notes ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.notesTitle}>📝 Notes</Text>
              <Text style={styles.notesText}>{notes}</Text>
            </>
          ) : null}
        </View>

        {/* Budget note */}
        <View style={styles.infoNote}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            Ang presyo ay ia-update pagkatapos mabili ng provider. Ang{' '}
            <Text style={{ fontWeight: '700' }}>budget (₱{Number(budget).toLocaleString()})</Text>{' '}
            ang magiging spending limit.
          </Text>
        </View>

        {/* COD reminder */}
        <View style={styles.codNote}>
          <Text style={styles.codIcon}>💳</Text>
          <Text style={styles.codText}>
            Ang bayad ay kokolektahin sa pagdating.{' '}
            <Text style={{ fontWeight: '700' }}>Cash on Delivery lamang.</Text>
          </Text>
        </View>

        <View style={{ height: 12 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}
        >
          <Text style={styles.editBtnText}>✎ I-edit</Text>
        </TouchableOpacity>

        <Animated.View style={[{ flex: 1 }, { transform: [{ scale: btnScale }] }]}>
          <TouchableOpacity
            style={[styles.confirmBtn, submitting && styles.confirmBtnLoading]}
            onPress={handleConfirm}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.confirmBtnText}>✅ Isumite ang Request</Text>
            }
          </TouchableOpacity>
        </Animated.View>
      </View>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#f8fafc' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 8 : 4, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#d1fae5' },
  backBtn:{ width: 36, height: 36, borderRadius: 10, backgroundColor: GREEN_BG, alignItems: 'center', justifyContent: 'center' },
  backIcon:{ fontSize: 22, color: GREEN, fontWeight: '600', lineHeight: 28 },
  logoRow:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon:{ width: 32, height: 32, borderRadius: 8, backgroundColor: GREEN_BG, alignItems: 'center', justifyContent: 'center' },
  title:  { fontSize: 17, fontWeight: '700', color: GREEN_DK },

  stepRow:        { flexDirection: 'row', justifyContent: 'center', paddingVertical: 10, backgroundColor: '#fff' },
  stepItem:       { alignItems: 'center', width: 72 },
  stepDot:        { width: 26, height: 26, borderRadius: 13, backgroundColor: '#f1f5f9', borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  stepDotDone:    { backgroundColor: GREEN_BG, borderColor: GREEN },
  stepDotActive:  { backgroundColor: GREEN, borderColor: GREEN },
  stepNum:        { fontSize: 11, fontWeight: '700', color: '#94a3b8' },
  stepNumDone:    { color: GREEN },
  stepLabel:      { fontSize: 9, color: '#94a3b8', fontWeight: '600' },
  stepLabelActive:{ color: GREEN },

  scrollContent: { padding: 16, gap: 12 },

  card:      { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: '#e2e8f0' },
  cardTitle: { fontSize: 13, fontWeight: '700', color: GREEN_DK, marginBottom: 8 },
  divider:   { height: 0.5, backgroundColor: '#f1f5f9', marginBottom: 12 },
  addressText: { fontSize: 14, color: '#0f172a', fontWeight: '600', lineHeight: 20 },

  summaryRow:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  summaryLeft:           { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryIcon:           { fontSize: 14 },
  summaryLabel:          { fontSize: 13, color: '#64748b' },
  summaryValue:          { fontSize: 13, fontWeight: '600', color: '#0f172a', flex: 1, textAlign: 'right' },
  summaryValueHighlight: { color: GREEN, fontSize: 15 },

  notesTitle: { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 6 },
  notesText:  { fontSize: 13, color: '#0f172a', lineHeight: 20 },

  infoNote: { flexDirection: 'row', gap: 10, backgroundColor: '#fefce8', borderRadius: 12, padding: 13, borderWidth: 0.5, borderColor: '#fde68a' },
  infoIcon: { fontSize: 16 },
  infoText: { flex: 1, fontSize: 12, color: '#92400e', lineHeight: 18 },

  codNote: { flexDirection: 'row', gap: 10, backgroundColor: GREEN_BG, borderRadius: 12, padding: 13, borderWidth: 0.5, borderColor: '#a7f3d0' },
  codIcon: { fontSize: 16 },
  codText: { flex: 1, fontSize: 12, color: GREEN_DK, lineHeight: 18 },

  footer:         { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: Platform.OS === 'android' ? 20 : 32, paddingTop: 12, backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: '#e2e8f0' },
  editBtn:        { backgroundColor: '#f1f5f9', borderRadius: 14, paddingVertical: 15, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  editBtnText:    { color: '#475569', fontSize: 14, fontWeight: '700' },
  confirmBtn:     { backgroundColor: GREEN, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  confirmBtnLoading: { opacity: 0.7 },
  confirmBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
})