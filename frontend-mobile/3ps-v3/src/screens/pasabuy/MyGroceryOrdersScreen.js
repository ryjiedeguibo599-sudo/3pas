import React, { useEffect, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, RefreshControl,
  SafeAreaView, Platform, Alert
} from 'react-native'
import API from '../../services/api'
import RatingModal from '../../components/RatingModal'

const GREEN  = '#059669'
const BLUE   = '#2563eb'
const ORANGE = '#f59e0b'
const PURPLE = '#8b5cf6'
const RED    = '#ef4444'

const STATUS_COLOR = {
  pending:   ORANGE,
  accepted:  BLUE,
  picked_up: PURPLE,
  completed: GREEN,
  cancelled: RED,
}

const STATUS_BG = {
  pending:   '#fefce8',
  accepted:  '#eff6ff',
  picked_up: '#f5f3ff',
  completed: '#f0fdf4',
  cancelled: '#fef2f2',
}

const STATUS_STEPS = ['pending', 'accepted', 'picked_up', 'completed']

const STATUS_INFO = {
  pending:   { label: 'Pending',   emoji: '⏳', desc: 'Naghihintay ng shopper na mag-accept.' },
  accepted:  { label: 'Accepted',  emoji: '🔵', desc: 'May shopper nang nag-accept ng order mo.' },
  picked_up: { label: 'Picked Up', emoji: '📦', desc: 'Papunta na sa iyo ang iyong mga items!' },
  completed: { label: 'Completed', emoji: '✅', desc: 'Nai-deliver na ang order mo.' },
  cancelled: { label: 'Cancelled', emoji: '❌', desc: 'Na-cancel ang order.' },
}

const TABS = ['Lahat', 'Pending', 'On-going', 'Completed', 'Cancelled']

// ── Progress Bar ─────────────────────────────────────────────
function ProgressBar({ status }) {
  if (status === 'cancelled') return null
  const idx      = STATUS_STEPS.indexOf(status)
  const progress = ((idx + 1) / STATUS_STEPS.length) * 100
  return (
    <View style={styles.progressWrapper}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, {
          width: `${progress}%`,
          backgroundColor: STATUS_COLOR[status] || GREEN,
        }]} />
      </View>
      <Text style={[styles.progressLabel, { color: STATUS_COLOR[status] }]}>
        {STATUS_INFO[status]?.emoji} {STATUS_INFO[status]?.label}
      </Text>
    </View>
  )
}

// ── Tracking Steps ───────────────────────────────────────────
function TrackingSteps({ status }) {
  if (status === 'cancelled') {
    return (
      <View style={styles.cancelledBox}>
        <Text style={styles.cancelledText}>❌  Order Cancelled</Text>
      </View>
    )
  }
  const currentIndex = STATUS_STEPS.indexOf(status)
  return (
    <View style={styles.stepsContainer}>
      {STATUS_STEPS.map((step, index) => {
        const done    = index < currentIndex
        const current = index === currentIndex
        return (
          <View key={step} style={styles.stepWrapper}>
            <View style={styles.stepRow}>
              <View style={[
                styles.stepDot,
                current && { backgroundColor: STATUS_COLOR[step], borderColor: STATUS_COLOR[step] },
                done    && { backgroundColor: GREEN, borderColor: GREEN },
              ]}>
                <Text style={styles.stepDotText}>
                  {done ? '✓' : STATUS_INFO[step].emoji}
                </Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={[
                  styles.stepLabel,
                  current && { color: STATUS_COLOR[step], fontWeight: '700' },
                  done    && { color: GREEN, fontWeight: '700' },
                ]}>
                  {STATUS_INFO[step].label}
                </Text>
                {current && <Text style={styles.stepDesc}>{STATUS_INFO[step].desc}</Text>}
              </View>
              {current && (
                <View style={[styles.nowBadge, { backgroundColor: STATUS_COLOR[step] + '18' }]}>
                  <Text style={[styles.nowBadgeText, { color: STATUS_COLOR[step] }]}>Now</Text>
                </View>
              )}
            </View>
            {index < STATUS_STEPS.length - 1 && (
              <View style={[styles.stepLine, done && { backgroundColor: GREEN }]} />
            )}
          </View>
        )
      })}
    </View>
  )
}

export default function MyGroceryOrdersScreen({ navigation }) {
  const [orders, setOrders]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)
  const [expanded, setExpanded]       = useState(null)
  const [activeTab, setActiveTab]     = useState('Lahat')
  const [cancelling, setCancelling]   = useState(null)
  const [ratingModal, setRatingModal] = useState({ visible: false, orderId: null })
  const [reviewedIds, setReviewedIds] = useState([])

  useEffect(() => { fetchOrders() }, [])

  const fetchOrders = async () => {
    try {
      const res = await API.get('/pasabuy/orders')
      setOrders(res.data.orders)
      const completed = res.data.orders.filter(o => o.status === 'completed')
      const reviewed  = []
      for (const order of completed) {
        try {
          const r = await API.get(`/reviews/pasabuy/${order.id}`)
          if (r.data.review) reviewed.push(order.id)
        } catch {}
      }
      setReviewedIds(reviewed)
    } catch (err) {
      console.log('Error fetching grocery orders:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleCancel = (orderId) => {
    Alert.alert(
      'I-cancel ang Order?',
      'Pwede lang i-cancel ang order habang pending pa. Sigurado ka ba?',
      [
        { text: 'Hindi', style: 'cancel' },
        {
          text: 'Oo, I-cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(orderId)
              await API.patch(`/pasabuy/orders/${orderId}/cancel`)
              await fetchOrders()
            } catch (err) {
              console.log('Cancel error:', JSON.stringify(err?.response?.data))
              console.log('Status code:', err?.response?.status)
              const msg = err?.response?.data?.message || 'Hindi na-cancel. Try again.'
              Alert.alert('Hindi Na-cancel', msg)
            } finally {
              setCancelling(null)
            }
          },
        },
      ]
    )
  }

  const onRefresh    = () => { setRefreshing(true); fetchOrders() }
  const toggleExpand = (id) => setExpanded(expanded === id ? null : id)

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'Lahat')     return true
    if (activeTab === 'Pending')   return o.status === 'pending'
    if (activeTab === 'On-going')  return ['accepted', 'picked_up'].includes(o.status)
    if (activeTab === 'Completed') return o.status === 'completed'
    if (activeTab === 'Cancelled') return o.status === 'cancelled'
    return true
  })

  const pendingCount   = orders.filter(o => o.status === 'pending').length
  const ongoingCount   = orders.filter(o => ['accepted', 'picked_up'].includes(o.status)).length
  const completedCount = orders.filter(o => o.status === 'completed').length
  const cancelledCount = orders.filter(o => o.status === 'cancelled').length

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={GREEN} />
          <Text style={styles.loadingText}>Kinukuha ang iyong orders...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.logoRow}>
          <Text style={{ fontSize: 18 }}>🛒</Text>
          <Text style={styles.title}>My Grocery Orders</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Text style={{ fontSize: 16 }}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* ── Summary strip ── */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryChip, { backgroundColor: '#fefce8' }]}>
          <Text style={styles.summaryCount}>{pendingCount}</Text>
          <Text style={[styles.summaryLabel, { color: ORANGE }]}>Pending</Text>
        </View>
        <View style={[styles.summaryChip, { backgroundColor: '#eff6ff' }]}>
          <Text style={styles.summaryCount}>{ongoingCount}</Text>
          <Text style={[styles.summaryLabel, { color: BLUE }]}>On-going</Text>
        </View>
        <View style={[styles.summaryChip, { backgroundColor: '#f0fdf4' }]}>
          <Text style={styles.summaryCount}>{completedCount}</Text>
          <Text style={[styles.summaryLabel, { color: GREEN }]}>Completed</Text>
        </View>
        <View style={[styles.summaryChip, { backgroundColor: '#fef2f2' }]}>
          <Text style={styles.summaryCount}>{cancelledCount}</Text>
          <Text style={[styles.summaryLabel, { color: RED }]}>Cancelled</Text>
        </View>
      </View>

      {/* ── Tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsRow}
      >
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} />}
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>
              {activeTab === 'Cancelled' ? '❌' : '🛒'}
            </Text>
            <Text style={styles.emptyTitle}>Wala pang orders</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'Lahat'
                ? 'Mag-order sa PasaBUY at hahanapan ka namin ng shopper.'
                : activeTab === 'Cancelled'
                ? 'Wala kang cancelled na orders.'
                : `Wala kang ${activeTab.toLowerCase()} na orders.`}
            </Text>
            {activeTab === 'Lahat' && (
              <TouchableOpacity style={styles.newBtn} onPress={() => navigation.navigate('PasaBUY')}>
                <Text style={styles.newBtnText}>Mag-order ng Grocery</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredOrders.map((order) => {
            const isOpen    = expanded === order.id
            const sc        = STATUS_COLOR[order.status] || '#94a3b8'
            const sb        = STATUS_BG[order.status]   || '#f8fafc'
            const isPending = order.status === 'pending'

            return (
              <View key={order.id} style={styles.card}>
                <TouchableOpacity style={styles.cardHeader} onPress={() => toggleExpand(order.id)} activeOpacity={0.7}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.cardTopRow}>
                      <Text style={styles.cardId}>Order #{order.id}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: sb }]}>
                        <Text style={styles.statusEmoji}>{STATUS_INFO[order.status]?.emoji}</Text>
                        <Text style={[styles.statusText, { color: sc }]}>
                          {STATUS_INFO[order.status]?.label || order.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.dateText}>
                      🕐 {new Date(order.ordered_at).toLocaleDateString('fil-PH', {
                        year: 'numeric', month: 'long', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <Text style={[styles.expandIcon, isOpen && { transform: [{ rotate: '180deg' }] }]}>⌄</Text>
                </TouchableOpacity>

                <ProgressBar status={order.status} />
                <TrackingSteps status={order.status} />

                {isOpen && (
                  <View style={styles.details}>
                    <View style={styles.divider} />

                    <Text style={styles.itemsTitle}>📦 Mga Items</Text>
                    {order.items && order.items[0] !== null
                      ? order.items.map((item, index) => (
                          <View key={index} style={styles.itemRow}>
                            <Text style={styles.itemName}>• {item.item_name}</Text>
                            <Text style={styles.itemQty}>x{item.quantity}</Text>
                            <Text style={styles.itemPrice}>
                              {item.price > 0 ? `₱${item.price}` : '—'}
                            </Text>
                          </View>
                        ))
                      : <Text style={styles.noItems}>Walang items na nakalista.</Text>
                    }

                    {order.total_amount === 0 && order.status !== 'cancelled' && (
                      <View style={styles.priceNote}>
                        <Text style={styles.priceNoteText}>
                          💡 Ang presyo ay ia-update pagkatapos mabili ng shopper.
                        </Text>
                      </View>
                    )}

                    <View style={styles.divider} />

                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Total</Text>
                      <Text style={styles.totalValue}>
                        {order.total_amount > 0 ? `₱${order.total_amount}` : 'TBD'}
                      </Text>
                    </View>

                    {order.status !== 'cancelled' && (
                      <View style={styles.codRow}>
                        <Text style={styles.codText}>💳 Cash on Delivery — bayad sa pagdating</Text>
                      </View>
                    )}

                    {isPending && (
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => handleCancel(order.id)}
                        disabled={cancelling === order.id}
                        activeOpacity={0.8}
                      >
                        {cancelling === order.id
                          ? <ActivityIndicator size="small" color={RED} />
                          : <Text style={styles.cancelBtnText}>✕  I-cancel ang Order</Text>
                        }
                      </TouchableOpacity>
                    )}

                    {order.status === 'completed' && (
                      reviewedIds.includes(order.id) ? (
                        <View style={styles.ratedBadge}>
                          <Text style={styles.ratedText}>⭐  Na-rate mo na ito</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.rateBtn}
                          onPress={() => setRatingModal({ visible: true, orderId: order.id })}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.rateBtnText}>⭐  I-rate ang Order</Text>
                        </TouchableOpacity>
                      )
                    )}

                    {order.status === 'cancelled' && (
                      <TouchableOpacity
                        style={styles.reorderBtn}
                        onPress={() => navigation.navigate('PasaBUY')}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.reorderBtnText}>🛒  Mag-order Ulit</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            )
          })
        )}

        {filteredOrders.length > 0 && activeTab !== 'Cancelled' && (
          <TouchableOpacity style={styles.fabRow} onPress={() => navigation.navigate('PasaBUY')} activeOpacity={0.85}>
            <Text style={styles.fabText}>+ Bagong Order</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      <RatingModal
        visible={ratingModal.visible}
        onClose={() => setRatingModal({ visible: false, orderId: null })}
        serviceType="pasabuy"
        serviceId={ratingModal.orderId}
        onSuccess={fetchOrders}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#f8fafc' },
  centered:     { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText:  { fontSize: 13, color: '#64748b' },

  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 48 : 12, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' },
  backBtn:      { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  backIcon:     { fontSize: 22, color: GREEN, fontWeight: '600', lineHeight: 28 },
  logoRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title:        { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  refreshBtn:   { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },

  // ✅ FIXED — View na lang, hindi ScrollView, flex row para equal size
  summaryRow:   { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 6, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' },
  summaryChip:  { flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  summaryCount: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  summaryLabel: { fontSize: 9, fontWeight: '600', marginTop: 1 },

  // ✅ FIXED — tabs scrollable, fixed height, hindi lumalaki
  tabsScroll:   { backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0', maxHeight: 48 },
  tabsRow:      { paddingHorizontal: 12, paddingVertical: 8, gap: 6, flexDirection: 'row', alignItems: 'center' },
  tab:          { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, backgroundColor: '#f1f5f9', borderWidth: 0.5, borderColor: '#e2e8f0' },
  tabActive:    { backgroundColor: GREEN, borderColor: GREEN },
  tabText:      { fontSize: 12, fontWeight: '600', color: '#64748b' },
  tabTextActive:{ color: '#fff' },

  container:    { flex: 1, paddingHorizontal: 16, paddingTop: 12 },

  card:         { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 0.5, borderColor: '#e2e8f0' },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardTopRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardId:       { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  statusBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusEmoji:  { fontSize: 11 },
  statusText:   { fontSize: 11, fontWeight: '700' },
  expandIcon:   { fontSize: 18, color: '#94a3b8', marginLeft: 8 },
  dateText:     { fontSize: 11, color: '#94a3b8' },

  progressWrapper: { marginBottom: 10 },
  progressTrack:   { height: 5, backgroundColor: '#f1f5f9', borderRadius: 10, overflow: 'hidden', marginBottom: 5 },
  progressFill:    { height: '100%', borderRadius: 10 },
  progressLabel:   { fontSize: 11, fontWeight: '700' },

  stepsContainer: { paddingLeft: 2, marginBottom: 4 },
  stepWrapper:    {},
  stepRow:        { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  stepDot:        { width: 30, height: 30, borderRadius: 15, backgroundColor: '#f1f5f9', borderWidth: 1.5, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  stepDotText:    { fontSize: 12 },
  stepInfo:       { flex: 1 },
  stepLabel:      { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  stepDesc:       { fontSize: 11, color: '#64748b', marginTop: 1, lineHeight: 16 },
  stepLine:       { width: 2, height: 14, backgroundColor: '#e2e8f0', marginLeft: 14, marginVertical: 1 },
  nowBadge:       { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  nowBadgeText:   { fontSize: 10, fontWeight: '700' },
  cancelledBox:   { backgroundColor: '#fef2f2', borderRadius: 10, padding: 10, alignItems: 'center' },
  cancelledText:  { color: RED, fontWeight: '700', fontSize: 13 },

  details:      { marginTop: 6 },
  divider:      { height: 0.5, backgroundColor: '#f1f5f9', marginVertical: 10 },
  itemsTitle:   { fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  itemRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  itemName:     { flex: 1, fontSize: 13, color: '#0f172a' },
  itemQty:      { fontSize: 13, color: '#64748b', marginHorizontal: 8 },
  itemPrice:    { fontSize: 13, color: BLUE, fontWeight: '700', minWidth: 32, textAlign: 'right' },
  noItems:      { fontSize: 13, color: '#94a3b8', fontStyle: 'italic' },

  priceNote:     { backgroundColor: '#fefce8', borderRadius: 8, padding: 10, marginTop: 6, borderWidth: 0.5, borderColor: '#fde68a' },
  priceNoteText: { fontSize: 12, color: '#92400e', lineHeight: 17 },

  totalRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  totalLabel:   { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  totalValue:   { fontSize: 16, fontWeight: '700', color: GREEN },

  codRow:        { backgroundColor: '#f0fdf4', borderRadius: 8, padding: 10, marginBottom: 10 },
  codText:       { fontSize: 12, color: '#166534' },

  cancelBtn:     { borderWidth: 1.5, borderColor: RED, borderRadius: 12, padding: 12, alignItems: 'center', marginBottom: 8 },
  cancelBtnText: { color: RED, fontWeight: '700', fontSize: 14 },

  rateBtn:       { backgroundColor: ORANGE, borderRadius: 12, padding: 12, alignItems: 'center', marginTop: 4 },
  rateBtnText:   { color: '#fff', fontWeight: '700', fontSize: 14 },
  ratedBadge:    { backgroundColor: '#fefce8', borderRadius: 12, padding: 10, alignItems: 'center', marginTop: 4, borderWidth: 0.5, borderColor: '#fde68a' },
  ratedText:     { color: '#b45309', fontWeight: '700', fontSize: 13 },

  reorderBtn:     { backgroundColor: GREEN, borderRadius: 12, padding: 12, alignItems: 'center', marginTop: 4 },
  reorderBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  empty:        { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji:   { fontSize: 48, marginBottom: 12 },
  emptyTitle:   { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  emptySubtitle:{ fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20, marginBottom: 20, paddingHorizontal: 20 },
  newBtn:       { backgroundColor: GREEN, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 12 },
  newBtnText:   { color: '#fff', fontWeight: '700', fontSize: 14 },

  fabRow:       { backgroundColor: GREEN, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4, shadowColor: GREEN, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  fabText:      { color: '#fff', fontSize: 15, fontWeight: '700' },
})