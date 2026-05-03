import React, { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity,
  StyleSheet, ScrollView, Alert,
  ActivityIndicator, RefreshControl, Image,
  Vibration, LayoutAnimation, UIManager, Platform, FlatList
} from 'react-native'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import * as SecureStore from 'expo-secure-store'
import useNotifications from '../../hooks/useNotifications'
import API from '../../services/api'
import ConfirmationModal from '../../components/ConfirmationModal'

// ── Unified Design System (matches resident screens) ──────────
const C = {
  primary:   '#F08A24',
  primaryLt: '#FFF7ED',
  blue:      '#3B82F6',
  green:     '#16A34A',
  red:       '#EF4444',
  bg:        '#F8FAFF',
  white:     '#FFFFFF',
  text:      '#0F172A',
  textSub:   '#475569',
  textHint:  '#64748B',
  border:    '#E2E8F0',
}

const SERVICE = {
  pasabuy:  { emoji: '🛒', title: 'Pasabuy Orders',     accent: C.primary },
  pasakay:  { emoji: '🛵', title: 'Pasakay Bookings',   accent: C.primary },
  parepair: { emoji: '📦', title: 'Padala Requests',    accent: C.primary },
}

const STATUS_STYLE = {
  pending:    { bg: '#FFF7ED', color: C.primary, label: 'Pending'      },
  accepted:   { bg: '#EFF6FF', color: C.blue,    label: 'Accepted'     },
  on_the_way: { bg: '#EFF6FF', color: C.blue,    label: 'On the Way'   },
  in_progress:{ bg: '#EFF6FF', color: C.blue,    label: 'In Progress'  },
  completed:  { bg: '#F0FDF4', color: C.green,   label: 'Completed'    },
  cancelled:  { bg: '#FEF2F2', color: C.red,     label: 'Cancelled'    },
}

export default function ProviderRequestsScreen({ navigation, route }) {
  const { type } = route.params || {}
  const svc = SERVICE[type] || SERVICE.parepair
  const accent = svc.accent

  const [activeTab, setActiveTab] = useState('new')
  const [declinedIds, setDeclinedIds] = useState([])
  const [userId, setUserId] = useState(null)
  const [declineModal, setDeclineModal] = useState({ visible: false, id: null })
  const [completeModal, setCompleteModal] = useState({ visible: false, id: null })
  const queryClient = useQueryClient()

  useEffect(() => {
    SecureStore.getItemAsync('user').then(raw => {
      if (raw) setUserId(JSON.parse(raw).id)
    }).catch(() => {})
  }, [])

  const socket = useNotifications(userId)

  useEffect(() => {
    if (!socket) return

    const handleNewRequest = () => {
      queryClient.invalidateQueries({ queryKey: ['providerRequests', type] })
    }

    socket.on('new_request', handleNewRequest)
    socket.on('job_updated', handleNewRequest)

    return () => {
      socket.off('new_request', handleNewRequest)
      socket.off('job_updated', handleNewRequest)
    }
  }, [socket, queryClient, type])

  const { data: requests = [], isLoading: loading, isRefetching: refreshing, refetch } = useQuery({
    queryKey: ['providerRequests', type],
    queryFn: async () => {
      let res
      if (type === 'pasabuy')  res = await API.get('/pasabuy/orders/provider/all')
      if (type === 'pasakay')  res = await API.get('/pasakay/rides/available/all')
      if (type === 'parepair') res = await API.get('/parepair/requests/provider/all')
      return res?.data?.orders || res?.data?.rides || res?.data?.requests || []
    },
  })

  const onRefresh = async () => { await refetch() }

  const handleAccept = async (id) => {
    try {
      Vibration.vibrate(40)
      const ep = type === 'pasabuy'
        ? `/pasabuy/orders/${id}/status`
        : type === 'pasakay'
          ? `/pasakay/rides/${id}/status`
          : `/parepair/requests/${id}/status`
      await API.patch(ep, { status: 'accepted' })
      Alert.alert('Success', 'Request accepted!')
      queryClient.invalidateQueries({ queryKey: ['providerRequests', type] })
    } catch {
      Alert.alert('Error', 'Could not accept. Please try again.')
    }
  }

  const requestComplete = (id) => {
    setCompleteModal({ visible: true, id })
  }

  const executeComplete = async () => {
    const id = completeModal.id
    setCompleteModal({ visible: false, id: null })
    if (!id) return
    try {
      Vibration.vibrate(40)
      const ep = type === 'pasabuy'
        ? `/pasabuy/orders/${id}/status`
        : type === 'pasakay'
          ? `/pasakay/rides/${id}/status`
          : `/parepair/requests/${id}/status`
      await API.patch(ep, { status: 'completed' })
      queryClient.invalidateQueries({ queryKey: ['providerRequests', type] })
    } catch {
      Alert.alert('Error', 'Could not complete. Please try again.')
    }
  }

  const requestDecline = (id) => {
    setDeclineModal({ visible: true, id })
  }

  const executeDecline = () => {
    const id = declineModal.id
    setDeclineModal({ visible: false, id: null })
    if (!id) return
    Vibration.vibrate(40)
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setDeclinedIds(prev => [...prev, id])
  }

  const filteredRequests = requests
    .filter(r => !declinedIds.includes(r.id))
    .filter(r => {
      if (activeTab === 'new')     return r.status === 'pending'
      if (activeTab === 'active')  return ['accepted','in_progress','on_the_way'].includes(r.status)
      if (activeTab === 'history') return ['completed','cancelled'].includes(r.status)
      return true
    })
    .sort((a, b) => new Date(b.created_at || b.requested_at || 0) - new Date(a.created_at || a.requested_at || 0))

  const pendingCount   = requests.filter(r => r.status === 'pending' && !declinedIds.includes(r.id)).length
  const ongoingCount   = requests.filter(r => ['accepted','in_progress','on_the_way'].includes(r.status)).length
  const completedCount = requests.filter(r => ['completed','cancelled'].includes(r.status)).length

  const todaysEarnings = requests
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + Number(r.fare || r.total_amount || r.price || 0), 0)

  const dailyGoal = 1000
  const progressPercent = Math.min((todaysEarnings / dailyGoal) * 100, 100)

  const renderRequest = (item) => {
    const st = STATUS_STYLE[item.status] || STATUS_STYLE.pending
    return (
      <View key={item.id} style={[s.card, { borderLeftColor: accent, borderLeftWidth: 3 }]}>

        {/* Header */}
        <View style={s.cardHeader}>
          <View style={s.idRow}>
            <Text style={s.emoji}>{svc.emoji}</Text>
            <Text style={[s.requestId, { color: accent }]}>Request #{item.id}</Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: st.bg }]}>
            <Text style={[s.statusText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>

        {/* Pasabuy */}
        {type === 'pasabuy' && (
          <View style={s.detailBlock}>
            <DetailRow icon="👤" label="Customer" value={item.customer_name} />
            <DetailRow icon="📱" label="Phone"    value={item.customer_phone} />
            <DetailRow icon="💰" label="Total"    value={`₱${item.total_amount || 0}`} />
            {item.items && item.items[0] !== null && (
              <View style={s.itemsBox}>
                <Text style={s.itemsTitle}>📦 Items</Text>
                {item.items.map((i, idx) => (
                  <Text key={idx} style={s.itemText}>
                    • {i.item_name} × {i.quantity} — ₱{i.price}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Pasakay */}
        {type === 'pasakay' && (
          <View style={s.detailBlock}>
            <DetailRow icon="👤" label="Customer" value={item.customer_name} />
            <DetailRow icon="📍" label="Pickup"   value={item.pickup_location} />
            <DetailRow icon="🏁" label="Dropoff"  value={item.dropoff_location} />
            <DetailRow icon="💰" label="Fare"     value={`₱${item.fare || 0}`} />
          </View>
        )}

        {/* Padala */}
        {type === 'parepair' && (
          <View style={s.detailBlock}>
            <DetailRow icon="👤" label="Customer" value={item.customer_name} />
            <DetailRow icon="📱" label="Phone"    value={item.customer_phone} />
            <DetailRow icon="📦" label="Item"     value={item.item_title || item.description} />
            <DetailRow icon="📍" label="Address"  value={item.address} />
            {item.photos && item.photos[0] !== null && (
              <View>
                <Text style={s.photosTitle}>📷 Photos</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={s.photosRow}>
                    {item.photos.map((url, idx) =>
                      url ? <Image key={idx} source={{ uri: url }} style={s.photo} resizeMode="cover" /> : null
                    )}
                  </View>
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={s.buttonRow}>
          {item.status === 'pending' && (
            <>
              <TouchableOpacity
                style={[s.actionBtn, { backgroundColor: '#FEE2E2', marginRight: 8 }]}
                onPress={() => requestDecline(item.id)}
                activeOpacity={0.85}
              >
                <Text style={[s.btnText, { color: C.red }]}>✕ Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.actionBtn, { backgroundColor: accent }]}
                onPress={() => handleAccept(item.id)}
                activeOpacity={0.85}
              >
                <Text style={s.btnText}>✅ Accept</Text>
              </TouchableOpacity>
            </>
          )}
          {['accepted', 'in_progress', 'on_the_way'].includes(item.status) && (
            <>
              <TouchableOpacity
                style={[s.actionBtn, { backgroundColor: C.blue, marginRight: 6, flex: 1 }]}
                onPress={() => navigation.navigate('ActiveJob', { request: item, type })}
                activeOpacity={0.85}
              >
                <Text style={s.btnText}>📍 Manage</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.actionBtn, { backgroundColor: '#10B981' }]}
                onPress={() => requestComplete(item.id)}
                activeOpacity={0.85}
              >
                <Text style={s.btnText}>🏁 Complete</Text>
              </TouchableOpacity>
            </>
          )}
          {['completed', 'cancelled'].includes(item.status) && (
            <View style={[s.doneTag, { backgroundColor: item.status === 'completed' ? '#DCFCE7' : '#FEE2E2' }]}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: item.status === 'completed' ? '#15803D' : '#B91C1C' }}>
                {item.status === 'completed' ? '✅ Completed' : '❌ Cancelled'}
              </Text>
            </View>
          )}
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={s.safe}>

      {/* Top Bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={[s.backTxt, { color: accent }]}>‹  Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>{svc.emoji}  {svc.title}</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Earnings Summary Card */}
      <View style={s.earningsCard}>
        <View style={s.earningsHeader}>
          <Text style={s.earningsLabel}>Daily Earnings</Text>
          <Text style={s.earningsAmount}>₱{todaysEarnings.toFixed(2)}</Text>
        </View>
        <Text style={s.earningsGoal}>Goal: ₱{dailyGoal}</Text>
        <View style={s.progressBarBg}>
          <View style={[s.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
      </View>

      {/* Tab Container */}
      <View style={s.tabContainer}>
        <TouchableOpacity
          style={[s.mainTab, activeTab === 'new' && s.mainTabActive]}
          onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setActiveTab('new') }}
          activeOpacity={0.8}
        >
          <Text style={[s.mainTabTxt, activeTab === 'new' && s.mainTabTxtActive]}>New Requests</Text>
          {pendingCount > 0 && <View style={s.redBadge}><Text style={s.badgeTxt}>{pendingCount}</Text></View>}
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.mainTab, activeTab === 'active' && s.mainTabActive]}
          onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setActiveTab('active') }}
          activeOpacity={0.8}
        >
          <Text style={[s.mainTabTxt, activeTab === 'active' && s.mainTabTxtActive]}>Active Jobs</Text>
          {ongoingCount > 0 && <View style={s.greenIndicator} />}
        </TouchableOpacity>
      </View>

      {/* History Shortcut */}
      {activeTab === 'active' && completedCount > 0 && (
        <TouchableOpacity style={s.historyBtn} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setActiveTab('history') }}>
          <Text style={s.historyBtnTxt}>⏱ View Job History ({completedCount})</Text>
        </TouchableOpacity>
      )}

      {/* Content */}
      {loading ? (
        <ActivityIndicator size="large" color={accent} style={s.loader} />
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={item => item.id?.toString()}
          contentContainerStyle={s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyContainer}>
              <Text style={s.emptyEmoji}>{activeTab === 'new' ? '🛵' : '📭'}</Text>
              <Text style={s.emptyText}>{activeTab === 'new' ? 'No new requests yet' : 'No active jobs right now'}</Text>
              <Text style={s.emptySubtext}>{activeTab === 'new' ? 'Hang tight, we will notify you when a booking arrives!' : "You're all caught up for now."}</Text>
            </View>
          }
          renderItem={({ item }) => renderRequest(item)}
        />
      )}

      <ConfirmationModal
        visible={declineModal.visible}
        title="Decline Request"
        message="Are you sure you want to decline this request?"
        icon="🙅"
        confirmText="Decline"
        onConfirm={executeDecline}
        onCancel={() => setDeclineModal({ visible: false, id: null })}
      />

      <ConfirmationModal
        visible={completeModal.visible}
        title="Mark as Done"
        message="Are you sure you want to mark this job as completed?"
        icon="✅"
        confirmText="Yes, Done"
        confirmColor="#16A34A"
        onConfirm={executeComplete}
        onCancel={() => setCompleteModal({ visible: false, id: null })}
      />
    </SafeAreaView>
  )
}

function DetailRow({ icon, label, value }) {
  return (
    <View style={s.detailRow}>
      <Text style={s.detailIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={s.detailLabel}>{label}</Text>
        <Text style={s.detailValue}>{value || '—'}</Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  topBar:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.white, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: C.border },
  backBtn: { width: 60 },
  backTxt: { fontSize: 15, fontWeight: '700' },
  title:   { fontSize: 16, fontWeight: '800', color: C.text, textAlign: 'center', flex: 1 },

  earningsCard:   { backgroundColor: C.white, borderRadius: 16, margin: 16, padding: 16, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  earningsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  earningsLabel:  { fontSize: 13, fontWeight: '700', color: C.textSub },
  earningsAmount: { fontSize: 20, fontWeight: '800', color: C.primary },
  earningsGoal:   { fontSize: 11, color: C.textHint, marginBottom: 8 },
  progressBarBg:  { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  progressBarFill:{ height: '100%', backgroundColor: C.primary, borderRadius: 3 },

  tabContainer:   { flexDirection: 'row', backgroundColor: C.white, padding: 8, marginHorizontal: 16, marginTop: 4, borderRadius: 12, borderWidth: 0.5, borderColor: C.border },
  mainTab:        { flex: 1, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 8, flexDirection: 'row', gap: 6 },
  mainTabActive:  { backgroundColor: C.primary },
  mainTabTxt:     { fontSize: 14, fontWeight: '700', color: C.textHint },
  mainTabTxtActive: { color: C.white },
  redBadge:       { backgroundColor: C.red, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  badgeTxt:       { color: C.white, fontSize: 10, fontWeight: '800' },
  greenIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.green },

  historyBtn:     { alignSelf: 'center', marginTop: 12, backgroundColor: C.white, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 0.5, borderColor: C.border },
  historyBtnTxt:  { fontSize: 12, fontWeight: '700', color: C.textSub },

  loader:      { marginTop: 60 },
  listContent: { padding: 14, paddingBottom: 24 },

  card: { backgroundColor: C.white, borderRadius: 16, marginBottom: 12, borderWidth: 0.5, borderColor: C.border, shadowColor: C.text, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 0.5, borderBottomColor: C.border },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  emoji: { fontSize: 16 },
  requestId: { fontSize: 14, fontWeight: '700' },

  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText:  { fontSize: 11, fontWeight: '700' },

  detailBlock: { padding: 14, paddingTop: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  detailIcon:{ fontSize: 16, marginRight: 10, width: 20, textAlign: 'center' },
  detailLabel:{ fontSize: 11, color: C.textHint, fontWeight: '600', marginBottom: 1 },
  detailValue:{ fontSize: 14, color: C.text, fontWeight: '700' },

  itemsBox:   { marginTop: 8, backgroundColor: C.bg, borderRadius: 8, padding: 10 },
  itemsTitle: { fontSize: 12, fontWeight: '700', color: C.text, marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' },
  itemText:   { fontSize: 12, color: C.textSub, marginBottom: 3 },

  photosTitle: { fontSize: 12, fontWeight: '700', color: C.textSub, marginTop: 8, marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' },
  photosRow:   { flexDirection: 'row', gap: 8 },
  photo:       { width: 80, height: 80, borderRadius: 10 },

  buttonRow: { flexDirection: 'row', marginTop: 12, gap: 8 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  btnText:   { color: '#fff', fontWeight: '700', fontSize: 13 },
  doneTag:   { flex: 1, padding: 11, borderRadius: 10, alignItems: 'center' },

  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyEmoji:     { fontSize: 48, marginBottom: 12 },
  emptyText:      { fontSize: 16, fontWeight: '700', color: C.textSub },
  emptySubtext:   { fontSize: 13, color: C.textHint, marginTop: 6 },
})
