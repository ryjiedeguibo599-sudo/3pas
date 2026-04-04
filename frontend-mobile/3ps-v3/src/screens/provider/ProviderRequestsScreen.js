import React, { useEffect, useState } from 'react'
import {
  View, Text, TouchableOpacity,
  StyleSheet, ScrollView, Alert,
  ActivityIndicator, RefreshControl, Image
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import API from '../../services/api'

// ── Design Tokens ─────────────────────────────────────────────
const C = {
  primary:   '#0D6B63',
  primaryLt: '#E6F4F2',
  bg:        '#F7F8FA',
  white:     '#FFFFFF',
  text:      '#111827',
  textSub:   '#6B7280',
  textHint:  '#9CA3AF',
  border:    '#EEEFF2',
}

const STATUS_STYLE = {
  pending:    { bg: '#FEF9C3', color: '#854D0E', label: 'Pending'      },
  accepted:   { bg: '#DBEAFE', color: '#1D4ED8', label: 'Accepted'     },
  on_the_way: { bg: '#F3E8FF', color: '#7E22CE', label: 'On the Way'   },
  in_progress:{ bg: '#FEF3C7', color: '#92400E', label: 'In Progress'  },
  completed:  { bg: '#DCFCE7', color: '#15803D', label: 'Completed'    },
  cancelled:  { bg: '#FEE2E2', color: '#B91C1C', label: 'Cancelled'    },
}

export default function ProviderRequestsScreen({ navigation, route }) {
  const { type } = route.params
  const [requests,   setRequests]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => { fetchRequests() }, [])

  // ── API ────────────────────────────────────────────────────
  const fetchRequests = async () => {
    try {
      setLoading(true)
      let res
      if (type === 'pasabuy')  res = await API.get('/pasabuy/orders/provider/all')
      if (type === 'pasakay')  res = await API.get('/pasakay/rides/available/all')
      if (type === 'parepair') res = await API.get('/parepair/requests/provider/all')

      const data =
        res?.data?.orders   ||
        res?.data?.rides    ||
        res?.data?.requests ||
        []
      setRequests(Array.isArray(data) ? data : [])
    } catch {
      Alert.alert('Error', 'Hindi ma-load ang requests')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => { setRefreshing(true); await fetchRequests(); setRefreshing(false) }

  const handleAccept = async (id) => {
    try {
      if (type === 'pasabuy')  await API.patch(`/pasabuy/orders/${id}/status`,   { status: 'accepted' })
      if (type === 'pasakay')  await API.patch(`/pasakay/rides/${id}/status`,    { status: 'accepted' })
      if (type === 'parepair') await API.patch(`/parepair/requests/${id}/status`,{ status: 'accepted' })
      Alert.alert('Success', 'Na-accept na ang request!')
      fetchRequests()
    } catch { Alert.alert('Error', 'Hindi na-accept. Try again.') }
  }

  const handleComplete = async (id) => {
    try {
      if (type === 'pasabuy')  await API.patch(`/pasabuy/orders/${id}/status`,   { status: 'completed' })
      if (type === 'pasakay')  await API.patch(`/pasakay/rides/${id}/status`,    { status: 'completed' })
      if (type === 'parepair') await API.patch(`/parepair/requests/${id}/status`,{ status: 'completed' })
      Alert.alert('Success', 'Na-complete na ang request!')
      fetchRequests()
    } catch { Alert.alert('Error', 'Hindi na-complete. Try again.') }
  }

  // ── Helpers ────────────────────────────────────────────────
  const getTitle = () => {
    if (type === 'pasabuy')  return '🛒 PasaBUY Orders'
    if (type === 'pasakay')  return '🛵 Pasakay Bookings'
    if (type === 'parepair') return '🔧 PaRepair Requests'
  }

  const getColor = () => {
    if (type === 'pasabuy')  return '#2563EB'
    if (type === 'pasakay')  return '#16A34A'
    if (type === 'parepair') return '#EA580C'
  }

  const color = getColor()

  const filteredRequests = requests.filter(r => {
    if (activeFilter === 'all')       return true
    if (activeFilter === 'pending')   return r.status === 'pending'
    if (activeFilter === 'ongoing')   return ['accepted','in_progress','on_the_way'].includes(r.status)
    if (activeFilter === 'completed') return r.status === 'completed'
    return true
  })

  const pendingCount   = requests.filter(r => r.status === 'pending').length
  const ongoingCount   = requests.filter(r => ['accepted','in_progress','on_the_way'].includes(r.status)).length
  const completedCount = requests.filter(r => r.status === 'completed').length

  // ── Request Card ───────────────────────────────────────────
  const renderRequest = (item) => {
    const st = STATUS_STYLE[item.status] || STATUS_STYLE.pending
    return (
      <View key={item.id} style={[styles.requestCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>

        {/* Header */}
        <View style={styles.requestHeader}>
          <View style={styles.reqIdRow}>
            <Text style={styles.reqEmoji}>
              {type === 'pasabuy' ? '🛒' : type === 'pasakay' ? '🛵' : '🔧'}
            </Text>
            <Text style={[styles.requestId, { color }]}>Request #{item.id}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
            <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>

        {/* PasaBUY */}
        {type === 'pasabuy' && (
          <View style={styles.detailBlock}>
            <DetailRow icon="👤" label="Customer" value={item.customer_name} />
            <DetailRow icon="📱" label="Phone"    value={item.customer_phone} />
            <DetailRow icon="💰" label="Total"    value={`₱${item.total_amount}`} />
            {item.items && item.items[0] !== null && (
              <View style={styles.itemsContainer}>
                <Text style={styles.itemsTitle}>📦 Mga Items:</Text>
                {item.items.map((i, idx) => (
                  <Text key={idx} style={styles.itemText}>
                    • {i.item_name} x{i.quantity} — ₱{i.price}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Pasakay */}
        {type === 'pasakay' && (
          <View style={styles.detailBlock}>
            <DetailRow icon="👤" label="Customer" value={item.customer_name} />
            <DetailRow icon="📍" label="Pickup"   value={item.pickup_location} />
            <DetailRow icon="🏁" label="Dropoff"  value={item.dropoff_location} />
            <DetailRow icon="💰" label="Fare"     value={`₱${item.fare}`} />
          </View>
        )}

        {/* PaRepair */}
        {type === 'parepair' && (
          <View style={styles.detailBlock}>
            <DetailRow icon="👤" label="Customer" value={item.customer_name} />
            <DetailRow icon="📱" label="Phone"    value={item.customer_phone} />
            <DetailRow icon="🔧" label="Problem"  value={item.description} />
            <DetailRow icon="📍" label="Address"  value={item.address} />
            {item.photos && item.photos[0] !== null && (
              <View>
                <Text style={styles.photosTitle}>📷 Mga Larawan:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.photosRow}>
                    {item.photos.map((url, idx) =>
                      url ? (
                        <Image key={idx} source={{ uri: url }} style={styles.photo} resizeMode="cover" />
                      ) : null
                    )}
                  </View>
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          {item.status === 'pending' && (
            <TouchableOpacity
              style={[styles.acceptBtn, { backgroundColor: color }]}
              onPress={() => handleAccept(item.id)}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>✅  Accept</Text>
            </TouchableOpacity>
          )}
          {item.status === 'accepted' && (
            <TouchableOpacity
              style={[styles.acceptBtn, { backgroundColor: '#16A34A' }]}
              onPress={() => handleComplete(item.id)}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>🏁  Mark as Complete</Text>
            </TouchableOpacity>
          )}
          {['completed','cancelled'].includes(item.status) && (
            <View style={[styles.doneTag, { backgroundColor: item.status === 'completed' ? '#DCFCE7' : '#FEE2E2' }]}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: item.status === 'completed' ? '#15803D' : '#B91C1C' }}>
                {item.status === 'completed' ? '✅ Completed na' : '❌ Cancelled'}
              </Text>
            </View>
          )}
        </View>
      </View>
    )
  }

  // ── Main Render ────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backTxt, { color }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{getTitle()}</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Summary Chips */}
      <View style={styles.summaryRow}>
        {[
          { key: 'all',       label: 'Lahat',     count: requests.length  },
          { key: 'pending',   label: 'Pending',   count: pendingCount     },
          { key: 'ongoing',   label: 'Ongoing',   count: ongoingCount     },
          { key: 'completed', label: 'Completed', count: completedCount   },
        ].map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, activeFilter === f.key && { backgroundColor: color, borderColor: color }]}
            onPress={() => setActiveFilter(f.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterTxt, activeFilter === f.key && { color: '#fff' }]}>
              {f.label}
            </Text>
            <View style={[styles.filterBadge, { backgroundColor: activeFilter === f.key ? 'rgba(255,255,255,0.25)' : '#F3F4F6' }]}>
              <Text style={[styles.filterBadgeTxt, activeFilter === f.key && { color: '#fff' }]}>
                {f.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator size="large" color={color} style={styles.loader} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color} />}
          showsVerticalScrollIndicator={false}
        >
          {filteredRequests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>Walang requests dito</Text>
              <Text style={styles.emptySubtext}>Pull down para i-refresh</Text>
            </View>
          ) : (
            filteredRequests.map(item => renderRequest(item))
          )}
        </ScrollView>
      )}

      {/* Bottom Nav — same as ProviderHomeScreen */}
      <View style={styles.bottomNav}>
        {[
          { key: 'Home',     emoji: '🏠', label: 'Home'     },
          { key: 'Bookings', emoji: '📋', label: 'Bookings' },
          { key: 'Profile',  emoji: '👤', label: 'Profile'  },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={styles.navTab}
            onPress={() => {
              if (tab.key === 'Home')     navigation.navigate('ProviderHome')
              if (tab.key === 'Bookings') { /* already here */ }
              if (tab.key === 'Profile')  navigation.navigate('ProviderHome', { tab: 'Profile' })
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.navIconWrap, tab.key === 'Bookings' && styles.navIconActive]}>
              <Text style={styles.navEmoji}>{tab.emoji}</Text>
            </View>
            <Text style={[styles.navLabel, tab.key === 'Bookings' && styles.navLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

    </SafeAreaView>
  )
}

// ── Detail Row Helper ──────────────────────────────────────────
function DetailRow({ icon, label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value || '—'}</Text>
      </View>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FA' },

  // Top bar
  topBar:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#EEEFF2' },
  backBtn: { width: 60 },
  backTxt: { fontSize: 18, fontWeight: '700' },
  title:   { fontSize: 17, fontWeight: '700', color: '#111827', textAlign: 'center', flex: 1 },

  // Filter chips
  summaryRow:     { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 12, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EEEFF2' },
  filterChip:     { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1.5, borderColor: '#E5E7EB', gap: 5 },
  filterTxt:      { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  filterBadge:    { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  filterBadgeTxt: { fontSize: 11, fontWeight: '700', color: '#6B7280' },

  loader:      { marginTop: 60 },
  listContent: { padding: 16, paddingBottom: 24 },

  // Request card
  requestCard:   { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  requestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  reqIdRow:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reqEmoji:      { fontSize: 16 },
  requestId:     { fontSize: 16, fontWeight: '700' },
  statusBadge:   { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText:    { fontSize: 12, fontWeight: '700' },

  // Detail block
  detailBlock: { marginBottom: 8 },
  detailRow:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, gap: 8 },
  detailIcon:  { fontSize: 14, width: 20 },
  detailLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600', marginBottom: 1 },
  detailValue: { fontSize: 13, color: '#374151', fontWeight: '500' },

  // Items
  itemsContainer: { marginTop: 8, backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10 },
  itemsTitle:     { fontSize: 12, fontWeight: '700', color: '#1e293b', marginBottom: 6 },
  itemText:       { fontSize: 12, color: '#666', marginBottom: 3 },

  // Photos
  photosTitle: { fontSize: 12, fontWeight: '700', color: '#EA580C', marginTop: 8, marginBottom: 6 },
  photosRow:   { flexDirection: 'row', gap: 8 },
  photo:       { width: 90, height: 90, borderRadius: 10 },

  // Buttons
  buttonRow: { flexDirection: 'row', marginTop: 12, gap: 8 },
  acceptBtn: { flex: 1, padding: 13, borderRadius: 10, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 3 },
  btnText:   { color: '#fff', fontWeight: '700', fontSize: 14 },
  doneTag:   { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },

  // Empty
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyEmoji:     { fontSize: 48, marginBottom: 12 },
  emptyText:      { fontSize: 17, fontWeight: '700', color: '#6B7280' },
  emptySubtext:   { fontSize: 13, color: '#9CA3AF', marginTop: 6 },

  // Bottom nav — same as ProviderHomeScreen
  bottomNav:     { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#EEEFF2', paddingTop: 8, paddingBottom: 8 },
  navTab:        { flex: 1, alignItems: 'center', gap: 4 },
  navIconWrap:   { width: 48, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  navIconActive: { backgroundColor: '#E6F4F2' },
  navEmoji:      { fontSize: 20 },
  navLabel:      { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  navLabelActive:{ color: '#0D6B63', fontWeight: '700' },
})