import React, { useRef, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, ScrollView, Animated,
  ActivityIndicator, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import API from '../../services/api'
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
  red: theme.colors.danger,
}

const DELIVERY_FEE = 30

const Row = ({ icon, label, value }) => (
  <View style={s.summaryRow}>
    <View style={s.summaryLeft}>
      <Text style={s.summaryIcon}>{icon}</Text>
      <Text style={s.summaryLabel}>{label}</Text>
    </View>
    <Text style={s.summaryValue}>{value}</Text>
  </View>
)

export default function PasabuyReviewScreen({ navigation, route }) {
  const {
    deliveryAddress, coordinates,
    itemName, quantity, store, budget, notes,
  } = route.params || {}

  const [submitting, setSubmitting] = useState(false)
  const btnScale = useRef(new Animated.Value(1)).current

  const budgetNum   = Number(budget)
  const totalAmount = budgetNum + DELIVERY_FEE

  const handleConfirm = async () => {
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1,    duration: 80, useNativeDriver: true }),
    ]).start()

    try {
      setSubmitting(true)
      const res = await API.post('/pasabuy/orders', {
        delivery_address: deliveryAddress,
        latitude:  coordinates?.latitude,
        longitude: coordinates?.longitude,
        items: [{ item_name: itemName, quantity, price: budgetNum }],
        preferred_store: store,
        budget,
        notes,
        delivery_fee: DELIVERY_FEE,
        total_amount: totalAmount,
      })

      const orderId = res.data?.order?.id || res.data?.id || null

      navigation.replace('PasabuyMatching', {
        deliveryAddress, itemName, quantity,
        store, budget, notes,
        deliveryFee: DELIVERY_FEE,
        totalAmount,
        orderId,
      })
    } catch (err) {
      const msg = err?.response?.data?.message
               || err?.response?.data?.error
               || err?.message
               || 'Unable to submit order. Please try again.'
      Alert.alert('Error', msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={s.safe}>

      {/* Nav bar */}
      <View style={s.navBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Delivery location */}
        <View style={s.card}>
          <Text style={s.cardTitle}>📍 Delivery Location</Text>
          <View style={s.divider} />
          <Text style={s.addressText}>{deliveryAddress}</Text>
        </View>

        {/* Order details */}
        <View style={s.card}>
          <Text style={s.cardTitle}>🛒 Order Details</Text>
          <View style={s.divider} />
          <Row icon="📦" label="Item"     value={itemName} />
          <Row icon="🔢" label="Quantity" value={`x${quantity}`} />
          <Row icon="🏪" label="Store"    value={store !== 'Not specified' ? store : '—'} />
          {!!notes && (
            <>
              <View style={s.divider} />
              <Text style={s.notesTitle}>📝 Notes</Text>
              <Text style={s.notesText}>{notes}</Text>
            </>
          )}
        </View>

        {/* Payment breakdown */}
        <View style={s.card}>
          <Text style={s.cardTitle}>💳 Payment Breakdown</Text>
          <View style={s.divider} />

          <View style={s.breakdownRow}>
            <Text style={s.breakdownLabel}>Item Budget</Text>
            <Text style={s.breakdownValue}>
              ₱{budgetNum.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={s.breakdownRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.breakdownLabel}>Delivery Fee</Text>
              <Text style={s.breakdownSub}>Fixed rate for provider</Text>
            </View>
            <Text style={s.breakdownValue}>₱{DELIVERY_FEE.toFixed(2)}</Text>
          </View>

          <View style={s.totalDivider} />

          <View style={s.breakdownRow}>
            <Text style={s.totalLabel}>TOTAL AMOUNT</Text>
            <Text style={s.totalValue}>
              ₱{totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Budget note */}
        <View style={s.infoNote}>
          <Text style={s.infoIcon}>💡</Text>
          <Text style={s.infoText}>
            <Text style={{ fontWeight: '700' }}>₱{budgetNum.toLocaleString()}</Text> is the spending limit for your shopper.{' '}
            <Text style={{ fontWeight: '700' }}>₱{DELIVERY_FEE}</Text> is the delivery fee paid directly to the provider.
          </Text>
        </View>

        {/* COD reminder */}
        <View style={s.codNote}>
          <Text style={s.codIcon}>💳</Text>
          <Text style={s.codText}>
            The total of{' '}
            <Text style={{ fontWeight: '700' }}>
              ₱{totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </Text>{' '}
            will be collected upon delivery.{' '}
            <Text style={{ fontWeight: '700' }}>Cash on Delivery only.</Text>
          </Text>
        </View>

        <View style={{ height: 12 }} />
      </ScrollView>

      {/* Footer */}
      <View style={s.footer}>
        <Animated.View style={[{ width: '100%' }, { transform: [{ scale: btnScale }] }]}>
          <TouchableOpacity
            style={[s.confirmBtn, submitting && s.confirmBtnLoading]}
            onPress={handleConfirm}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={s.confirmBtnText}>✅ Submit Request</Text>
            }
          </TouchableOpacity>
        </Animated.View>
      </View>

    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  navBar:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: Platform.OS === 'android' ? 8 : 4, paddingBottom: 6, backgroundColor: C.white },
  backBtn:       { width: 36, height: 36, borderRadius: 10, backgroundColor: C.primaryLt, alignItems: 'center', justifyContent: 'center' },
  backIcon:      { fontSize: 22, color: C.primary, fontWeight: '600', lineHeight: 28 },

  scrollContent: { padding: 16, gap: 12 },

  card:        { backgroundColor: C.white, borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: C.border },
  cardTitle:   { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 8 },
  divider:     { height: 0.5, backgroundColor: C.border, marginBottom: 12 },
  addressText: { fontSize: 14, color: C.text, fontWeight: '600', lineHeight: 20 },

  summaryRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  summaryLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryIcon:  { fontSize: 14 },
  summaryLabel: { fontSize: 13, color: C.textSub },
  summaryValue: { fontSize: 13, fontWeight: '600', color: C.text, flex: 1, textAlign: 'right' },

  notesTitle: { fontSize: 12, fontWeight: '700', color: C.textSub, marginBottom: 6 },
  notesText:  { fontSize: 13, color: C.text, lineHeight: 20 },

  breakdownRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  breakdownLabel: { fontSize: 13, color: C.textSub, fontWeight: '600' },
  breakdownSub:   { fontSize: 11, color: C.textHint, marginTop: 1 },
  breakdownValue: { fontSize: 14, fontWeight: '700', color: C.text },
  totalDivider:   { height: 1, backgroundColor: C.border, marginVertical: 8 },
  totalLabel:     { fontSize: 14, fontWeight: '800', color: C.text },
  totalValue:     { fontSize: 18, fontWeight: '800', color: C.primary },

  infoNote: { flexDirection: 'row', gap: 10, backgroundColor: '#FFF8E8', borderRadius: 12, padding: 13, borderWidth: 0.5, borderColor: C.primaryMd },
  infoIcon: { fontSize: 16 },
  infoText: { flex: 1, fontSize: 12, color: C.textSub, lineHeight: 18 },

  codNote: { flexDirection: 'row', gap: 10, backgroundColor: C.primaryLt, borderRadius: 12, padding: 13, borderWidth: 0.5, borderColor: C.primaryMd },
  codIcon: { fontSize: 16 },
  codText: { flex: 1, fontSize: 12, color: C.text, lineHeight: 18 },

  footer:             { paddingHorizontal: 16, paddingBottom: Platform.OS === 'android' ? 20 : 32, paddingTop: 12, backgroundColor: C.white, borderTopWidth: 0.5, borderTopColor: C.border },
  confirmBtn:         { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  confirmBtnLoading:  { opacity: 0.7 },
  confirmBtnText:     { color: C.white, fontSize: 14, fontWeight: '700' },
})
