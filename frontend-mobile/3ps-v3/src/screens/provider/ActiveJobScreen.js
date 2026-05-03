import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert, Linking, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import API from '../../services/api'

const C = {
  primary:   '#2563EB',
  primaryLt: '#EFF6FF',
  text:      '#0F172A',
  textSub:   '#475569',
  textHint:  '#94A3B8',
  border:    '#E2E8F0',
  bg:        '#F1F5F9',
  white:     '#FFFFFF',
  green:     '#10B981',
  red:       '#EF4444',
}

const FLOWS = {
  pasabuy: {
    label:    'Pasabuy Order',
    emoji:    '🛒',
    accent:   '#EA580C',
    endpoint: (id) => `/pasabuy/orders/${id}/status`,
    next: {
      accepted:    { to: 'in_progress', label: 'Start Shopping' },
      in_progress: { to: 'completed',   label: 'Mark as Delivered' },
    },
  },
  pasakay: {
    label:    'Pasakay Trip',
    emoji:    '🛵',
    accent:   '#059669',
    endpoint: (id) => `/pasakay/rides/${id}/status`,
    next: {
      accepted:   { to: 'on_the_way', label: "I'm On the Way" },
      on_the_way: { to: 'completed',  label: 'Mark Trip Complete' },
    },
  },
  parepair: {
    label:    'Padala Delivery',
    emoji:    '📦',
    accent:   '#4F46E5',
    endpoint: (id) => `/parepair/requests/${id}/status`,
    next: {
      accepted:    { to: 'in_progress', label: 'Picked Up' },
      in_progress: { to: 'completed',   label: 'Mark as Delivered' },
    },
  },
}

const STATUS_LABEL = {
  accepted:    'Accepted',
  on_the_way:  'On the Way',
  in_progress: 'In Progress',
  completed:   'Completed',
  cancelled:   'Cancelled',
}

export default function ActiveJobScreen({ navigation, route }) {
  const { request: initial, type } = route.params || {}
  const flow = FLOWS[type] || FLOWS.parepair

  const [request, setRequest] = useState(initial || {})
  const [updating, setUpdating] = useState(false)

  const action = flow.next[request.status]
  const customerName  = request.customer_name || request.user_name || 'Customer'
  const customerPhone = request.customer_phone || request.user_phone || request.phone
  const address       = request.address || request.delivery_address || request.pickup_location || '—'
  const itemDesc      = request.item_title || request.description || request.item_description

  const handleUpdate = async () => {
    if (!action) return
    Alert.alert(
      'Update Status',
      `Mark this job as "${action.label}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              setUpdating(true)
              await API.patch(flow.endpoint(request.id), { status: action.to })
              setRequest(p => ({ ...p, status: action.to }))
              if (action.to === 'completed') {
                Alert.alert('🎉 Completed!', 'Job marked as completed.', [
                  { text: 'OK', onPress: () => navigation.navigate('Home') },
                ])
              }
            } catch {
              Alert.alert('Error', 'Could not update. Try again.')
            } finally {
              setUpdating(false)
            }
          },
        },
      ]
    )
  }

  const callCustomer = () => {
    if (!customerPhone) return Alert.alert('No phone number available.')
    Linking.openURL(`tel:${customerPhone}`)
  }

  const openMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    Linking.openURL(url).catch(() => Alert.alert('Maps unavailable'))
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: flow.accent }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerLabel}>{flow.emoji} {flow.label}</Text>
          <Text style={s.headerId}>Request #{request.id} · {STATUS_LABEL[request.status] || request.status}</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll}>

        {/* Customer */}
        <View style={s.card}>
          <Text style={s.cardLabel}>CUSTOMER</Text>
          <View style={s.row}>
            <View style={[s.avatar, { backgroundColor: flow.accent + '20' }]}>
              <Text style={[s.avatarText, { color: flow.accent }]}>
                {customerName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{customerName}</Text>
              {customerPhone && <Text style={s.phone}>📱 {customerPhone}</Text>}
            </View>
            <TouchableOpacity style={s.callBtn} onPress={callCustomer} activeOpacity={0.85}>
              <Ionicons name="call" size={16} color="#fff" />
              <Text style={s.callBtnText}>Call</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Address */}
        <View style={s.card}>
          <Text style={s.cardLabel}>LOCATION</Text>
          <Text style={s.addressText}>📍 {address}</Text>
          <TouchableOpacity style={s.mapsBtn} onPress={openMaps} activeOpacity={0.8}>
            <Ionicons name="navigate" size={14} color={C.primary} />
            <Text style={s.mapsBtnText}>Open in Maps</Text>
          </TouchableOpacity>
        </View>

        {/* Item */}
        {itemDesc && (
          <View style={s.card}>
            <Text style={s.cardLabel}>{type === 'pasabuy' ? 'ORDER' : 'ITEM'}</Text>
            <Text style={s.itemText}>{itemDesc}</Text>
          </View>
        )}
      </ScrollView>

      {/* Sticky action footer */}
      <View style={s.footer}>
        {action ? (
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: flow.accent }, updating && { opacity: 0.7 }]}
            onPress={handleUpdate}
            disabled={updating}
            activeOpacity={0.85}
          >
            {updating
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.actionBtnText}>{action.label} →</Text>}
          </TouchableOpacity>
        ) : request.status === 'completed' ? (
          <View style={s.completedBanner}>
            <Text style={s.completedEmoji}>✅</Text>
            <Text style={s.completedText}>Job Completed!</Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: C.bg },

  header:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 14 },
  backBtn:     { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerLabel: { fontSize: 13, color: '#fff', fontWeight: '600' },
  headerId:    { fontSize: 14, color: '#fff', fontWeight: '700', marginTop: 2 },

  scroll: { padding: 14, gap: 12 },

  card:      { backgroundColor: C.white, borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: C.border, gap: 10 },
  cardLabel: { fontSize: 10, fontWeight: '700', color: C.textHint, letterSpacing: 0.8 },

  row:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:     { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 17, fontWeight: '800' },
  name:       { fontSize: 15, fontWeight: '700', color: C.text },
  phone:      { fontSize: 12, color: C.textSub, marginTop: 2 },
  callBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.green, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  callBtnText:{ color: '#fff', fontSize: 12, fontWeight: '700' },

  addressText: { fontSize: 14, color: C.text, lineHeight: 20 },
  mapsBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: C.primaryLt, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  mapsBtnText: { fontSize: 12, color: C.primary, fontWeight: '700' },

  itemText: { fontSize: 14, color: C.text, lineHeight: 20 },

  footer:        { paddingHorizontal: 14, paddingTop: 10, paddingBottom: Platform.OS === 'android' ? 18 : 28, backgroundColor: C.white, borderTopWidth: 0.5, borderTopColor: C.border },
  actionBtn:     { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  completedBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#ECFDF5', borderRadius: 14, paddingVertical: 16, borderWidth: 1, borderColor: '#86EFAC' },
  completedEmoji:  { fontSize: 22 },
  completedText:   { fontSize: 15, fontWeight: '800', color: C.green },
})
