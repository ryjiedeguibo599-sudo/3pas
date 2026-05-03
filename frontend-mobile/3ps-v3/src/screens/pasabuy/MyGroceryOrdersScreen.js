import React, { useEffect, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, RefreshControl,
  Platform, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import API from '../../services/api'
import RatingModal from '../../components/RatingModal'

const C = {
  primary:   '#F08A24',
  primaryLt: '#FFF7ED',
  primaryMd: '#FED7AA',
  text:      '#0F172A',
  textSub:   '#64748B',
  textHint:  '#94A3B8',
  border:    '#E2E8F0',
  bg:        '#F8FAFF',
  white:     '#FFFFFF',
  orange:    '#F08A24',
  blue:      '#3B82F6',
  green:     '#16A34A',
  red:       '#EF4444',
}

const STATUS_COLOR = {
  pending:   C.orange,
  accepted:  C.blue,
  picked_up: C.blue,
  completed: C.green,
  cancelled: C.red,
}

const STATUS_BG = {
  pending:   '#FFF7ED',
  accepted:  '#EFF6FF',
  picked_up: '#EFF6FF',
  completed: '#F0FDF4',
  cancelled: '#FEF2F2',
}

const STATUS_STEPS = ['pending', 'accepted', 'picked_up', 'completed']

const STATUS_INFO = {
  pending:   { label: 'Pending',   emoji: '⏳', desc: 'Waiting for a shopper to accept.' },
  accepted:  { label: 'Accepted',  emoji: '🔵', desc: 'A shopper has accepted your order.' },
  picked_up: { label: 'Picked Up', emoji: '📦', desc: 'Your items are on the way!' },
  completed: { label: 'Completed', emoji: '✅', desc: 'Your order has been delivered.' },
  cancelled: { label: 'Cancelled', emoji: '❌', desc: 'This order was cancelled.' },
}

const TABS = ['All', 'Pending', 'On-going', 'Completed', 'Cancelled']

function ProgressBar({ status }) {
  if (status === 'cancelled') return null
  const idx      = STATUS_STEPS.indexOf(status)
  const progress = ((idx + 1) / STATUS_STEPS.length) * 100
  return (
    <View style={s.progressWrapper}>
      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: `${progress}%`, backgroundColor: STATUS_COLOR[status] || C.primary }]} />
      </View>
      <Text style={[s.progressLabel, { color: STATUS_COLOR[status] }]}>
        {STATUS_INFO[status]?.emoji} {STATUS_INFO[status]?.label}
      </Text>
    </View>
  )
}

function TrackingSteps({ status }) {
  if (status === 'cancelled') {
    return (
      <View style={s.cancelledBox}>
        <Text style={s.cancelledText}>❌  Order Cancelled</Text>
      </View>
    )
  }
  const currentIndex = STATUS_STEPS.indexOf(status)
  return (
    <View style={s.stepsContainer}>
      {STATUS_STEPS.map((step, index) => {
        const done    = index < currentIndex
        const current = index === currentIndex
        return (
          <View key={step} style={s.stepWrapper}>
            <View style={s.stepRow}>
              <View style={[
                s.stepDot,
                current && { backgroundColor: STATUS_COLOR[step], borderColor: STATUS_COLOR[step] },
                done    && { backgroundColor: C.green, borderColor: C.green },
              ]}>
                <Text style={s.stepDotText}>{done ? '✓' : STATUS_INFO[step].emoji}</Text>
              </View>
              <View style={s.stepInfo}>
                <Text style={[
                  s.stepLabel,
                  current && { color: STATUS_COLOR[step], fontWeight: '700' },
                  done    && { color: C.green, fontWeight: '700' },
                ]}>
                  {STATUS_INFO[step].label}
                </Text>
                {current && <Text style={s.stepDesc}>{STATUS_INFO[step].desc}</Text>}
              </View>
              {current && (
                <View style={[s.nowBadge, { backgroundColor: STATUS_COLOR[step] + '18' }]}>
                  <Text style={[s.nowBadgeText, { color: STATUS_COLOR[step] }]}>Now</Text>
                </View>
              )}
            </View>
            {index < STATUS_STEPS.length - 1 && (
              <View style={[s.stepLine, done && { backgroundColor: C.green }]} />
            )}
          </View>
        )
      })}
    </View>
  )
}

export default function MyGroceryOrdersScreen({ navigation }) {
  const [orders,      setOrders]      = useState([])
  const [loading,     setLoading]     = useState(true)
  const [refreshing,  setRefreshing]  = useState(false)
  const [expanded,    setExpanded]    = useState(null)
  const [activeTab,   setActiveTab]   = useState('All')
  const [cancelling,  setCancelling]  = useState(null)
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
      'Cancel Order?',
      'Orders can only be cancelled while still pending. Are you sure?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(orderId)
              await API.patch(`/pasabuy/orders/${orderId}/cancel`)
              await fetchOrders()
            } catch (err) {
              const msg = err?.response?.data?.message || 'Unable to cancel. Please try again.'
              Alert.alert('Error', msg)
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
    if (activeTab === 'All')       return true
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
      <SafeAreaView style={s.safe}>
        <View style={s.centered}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={s.loadingText}>Loading your orders...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.safe}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={s.logoRow}>
          <Text style={{ fontSize: 18 }}>🛒</Text>
          <Text style={s.title}>My Grocery Orders</Text>
        </View>
        <TouchableOpacity style={s.refreshBtn} onPress={onRefresh}>
          <Text style={{ fontSize: 16, color: C.primary }}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Summary strip */}
      <View style={s.summaryRow}>
        <View style={[s.summaryChip, { backgroundColor: '#FFF7ED' }]}>
          <Text style={s.summaryCount}>{pendingCount}</Text>
          <Text style={[s.summaryLabel, { color: C.orange }]}>Pending</Text>
        </View>
        <View style={[s.summaryChip, { backgroundColor: '#EFF6FF' }]}>
          <Text style={s.summaryCount}>{ongoingCount}</Text>
          <Text style={[s.summaryLabel, { color: C.blue }]}>On-going</Text>
        </View>
        <View style={[s.summaryChip, { backgroundColor: '#F0FDF4' }]}>
          <Text style={s.summaryCount}>{completedCount}</Text>
          <Text style={[s.summaryLabel, { color: C.green }]}>Completed</Text>
        </View>
        <View style={[s.summaryChip, { backgroundColor: '#FEF2F2' }]}>
          <Text style={s.summaryCount}>{cancelledCount}</Text>
          <Text style={[s.summaryLabel, { color: C.red }]}>Cancelled</Text>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.tabsScroll}
        contentContainerStyle={s.tabsRow}
      >
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[s.tab, activeTab === tab && s.tabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={s.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
      >
        {filteredOrders.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>{activeTab === 'Cancelled' ? '❌' : '🛒'}</Text>
            <Text style={s.emptyTitle}>
              {activeTab === 'All' ? 'No orders yet' : `No ${activeTab.toLowerCase()} orders`}
            </Text>
            <Text style={s.emptySubtitle}>
              {activeTab === 'All'
                ? 'Send a request and a nearby shopper will pick up your groceries for you.'
                : activeTab === 'Cancelled'
                ? 'Cancelled orders will show up here.'
                : `Your ${activeTab.toLowerCase()} orders will appear here.`}
            </Text>
            {activeTab !== 'Cancelled' && (
              <TouchableOpacity style={s.newBtn} onPress={() => navigation.navigate('Pasabuy')}>
                <Text style={s.newBtnText}>+ Order Groceries</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredOrders.map((order) => {
            const isOpen    = expanded === order.id
            const sc        = STATUS_COLOR[order.status] || C.textHint
            const sb        = STATUS_BG[order.status]   || C.bg
            const isPending = order.status === 'pending'

            return (
              <View key={order.id} style={s.card}>
                <TouchableOpacity style={s.cardHeader} onPress={() => toggleExpand(order.id)} activeOpacity={0.7}>
                  <View style={{ flex: 1 }}>
                    <View style={s.cardTopRow}>
                      <Text style={s.cardId}>Order #{order.id}</Text>
                      <View style={[s.statusBadge, { backgroundColor: sb }]}>
                        <Text style={s.statusEmoji}>{STATUS_INFO[order.status]?.emoji}</Text>
                        <Text style={[s.statusText, { color: sc }]}>
                          {STATUS_INFO[order.status]?.label || order.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={s.dateText}>
                      🕐 {new Date(order.ordered_at).toLocaleDateString('en-PH', {
                        year: 'numeric', month: 'long', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <Text style={s.expandIcon}>⌄</Text>
                </TouchableOpacity>

                {isOpen && (
                  <View style={s.details}>
                    <ProgressBar status={order.status} />
                    <TrackingSteps status={order.status} />
                    <View style={s.divider} />
                    <Text style={s.itemsTitle}>📦 Items</Text>
                    {order.items && order.items[0] !== null
                      ? order.items.map((item, index) => (
                          <View key={index} style={s.itemRow}>
                            <Text style={s.itemName}>• {item.item_name}</Text>
                            <Text style={s.itemQty}>x{item.quantity}</Text>
                            <Text style={s.itemPrice}>
                              {item.price > 0 ? `₱${item.price}` : '—'}
                            </Text>
                          </View>
                        ))
                      : <Text style={s.noItems}>No items listed.</Text>
                    }

                    {order.total_amount === 0 && order.status !== 'cancelled' && (
                      <View style={s.priceNote}>
                        <Text style={s.priceNoteText}>
                          💡 Price will be updated after the shopper purchases the items.
                        </Text>
                      </View>
                    )}

                    <View style={s.divider} />

                    <View style={s.totalRow}>
                      <Text style={s.totalLabel}>Total</Text>
                      <Text style={s.totalValue}>
                        {order.total_amount > 0 ? `₱${order.total_amount}` : 'TBD'}
                      </Text>
                    </View>

                    {order.status !== 'cancelled' && (
                      <View style={s.codRow}>
                        <Text style={s.codText}>💳 Cash on Delivery — pay upon delivery</Text>
                      </View>
                    )}

                    {isPending && (
                      <TouchableOpacity
                        style={s.cancelBtn}
                        onPress={() => handleCancel(order.id)}
                        disabled={cancelling === order.id}
                        activeOpacity={0.8}
                      >
                        {cancelling === order.id
                          ? <ActivityIndicator size="small" color={C.red} />
                          : <Text style={s.cancelBtnText}>✕  Cancel Order</Text>
                        }
                      </TouchableOpacity>
                    )}

                    {order.status === 'completed' && (
                      reviewedIds.includes(order.id) ? (
                        <View style={s.ratedBadge}>
                          <Text style={s.ratedText}>⭐  Already Rated</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={s.rateBtn}
                          onPress={() => setRatingModal({ visible: true, orderId: order.id })}
                          activeOpacity={0.8}
                        >
                          <Text style={s.rateBtnText}>⭐  Rate this Order</Text>
                        </TouchableOpacity>
                      )
                    )}

                    {order.status === 'cancelled' && (
                      <TouchableOpacity
                        style={s.reorderBtn}
                        onPress={() => navigation.navigate('Pasabuy')}
                        activeOpacity={0.8}
                      >
                        <Text style={s.reorderBtnText}>🛒  Order Again</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            )
          })
        )}

        {filteredOrders.length > 0 && activeTab !== 'Cancelled' && (
          <TouchableOpacity style={s.fabRow} onPress={() => navigation.navigate('Pasabuy')} activeOpacity={0.85}>
            <Text style={s.fabText}>+ New Order</Text>
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

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.bg },
  centered:    { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 13, color: C.textSub },

  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 8 : 4, paddingBottom: 12, backgroundColor: C.white, borderBottomWidth: 0.5, borderBottomColor: C.border },
  backBtn:    { width: 36, height: 36, borderRadius: 10, backgroundColor: C.primaryLt, alignItems: 'center', justifyContent: 'center' },
  backIcon:   { fontSize: 22, color: C.primary, fontWeight: '600', lineHeight: 28 },
  logoRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title:      { fontSize: 17, fontWeight: '700', color: C.text },
  refreshBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.primaryLt, alignItems: 'center', justifyContent: 'center' },

  summaryRow:   { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 6, backgroundColor: C.white, borderBottomWidth: 0.5, borderBottomColor: C.border },
  summaryChip:  { flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  summaryCount: { fontSize: 16, fontWeight: '700', color: C.text },
  summaryLabel: { fontSize: 9, fontWeight: '600', marginTop: 1 },

  tabsScroll:    { backgroundColor: C.white, borderBottomWidth: 0.5, borderBottomColor: C.border, maxHeight: 48 },
  tabsRow:       { paddingHorizontal: 12, paddingVertical: 8, gap: 6, flexDirection: 'row', alignItems: 'center' },
  tab:           { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, backgroundColor: '#F1F5F9', borderWidth: 0.5, borderColor: C.border },
  tabActive:     { backgroundColor: C.primary, borderColor: C.primary },
  tabText:       { fontSize: 12, fontWeight: '600', color: C.textSub },
  tabTextActive: { color: C.white },

  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },

  card:       { backgroundColor: C.white, borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 0.5, borderColor: C.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardId:     { fontSize: 14, fontWeight: '700', color: C.text },
  statusBadge:{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusEmoji:{ fontSize: 11 },
  statusText: { fontSize: 11, fontWeight: '700' },
  expandIcon: { fontSize: 18, color: C.textHint, marginLeft: 8 },
  dateText:   { fontSize: 11, color: C.textHint },

  progressWrapper: { marginBottom: 10 },
  progressTrack:   { height: 5, backgroundColor: '#F1F5F9', borderRadius: 10, overflow: 'hidden', marginBottom: 5 },
  progressFill:    { height: '100%', borderRadius: 10 },
  progressLabel:   { fontSize: 11, fontWeight: '700' },

  stepsContainer: { paddingLeft: 2, marginBottom: 4 },
  stepWrapper:    {},
  stepRow:        { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  stepDot:        { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F1F5F9', borderWidth: 1.5, borderColor: C.border, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  stepDotText:    { fontSize: 12 },
  stepInfo:       { flex: 1 },
  stepLabel:      { fontSize: 13, color: C.textHint, fontWeight: '500' },
  stepDesc:       { fontSize: 11, color: C.textSub, marginTop: 1, lineHeight: 16 },
  stepLine:       { width: 2, height: 14, backgroundColor: C.border, marginLeft: 14, marginVertical: 1 },
  nowBadge:       { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  nowBadgeText:   { fontSize: 10, fontWeight: '700' },
  cancelledBox:   { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 10, alignItems: 'center' },
  cancelledText:  { color: C.red, fontWeight: '700', fontSize: 13 },

  details:    { marginTop: 6 },
  divider:    { height: 0.5, backgroundColor: '#F1F5F9', marginVertical: 10 },
  itemsTitle: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 8 },
  itemRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  itemName:   { flex: 1, fontSize: 13, color: C.text },
  itemQty:    { fontSize: 13, color: C.textSub, marginHorizontal: 8 },
  itemPrice:  { fontSize: 13, color: C.primary, fontWeight: '700', minWidth: 32, textAlign: 'right' },
  noItems:    { fontSize: 13, color: C.textHint, fontStyle: 'italic' },

  priceNote:     { backgroundColor: '#FEFCE8', borderRadius: 8, padding: 10, marginTop: 6, borderWidth: 0.5, borderColor: '#FDE68A' },
  priceNoteText: { fontSize: 12, color: '#92400E', lineHeight: 17 },

  totalRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  totalLabel: { fontSize: 14, fontWeight: '700', color: C.text },
  totalValue: { fontSize: 16, fontWeight: '700', color: C.primary },

  codRow:  { backgroundColor: C.primaryLt, borderRadius: 8, padding: 10, marginBottom: 10 },
  codText: { fontSize: 12, color: C.text },

  cancelBtn:     { borderWidth: 1.5, borderColor: C.red, borderRadius: 12, padding: 12, alignItems: 'center', marginBottom: 8 },
  cancelBtnText: { color: C.red, fontWeight: '700', fontSize: 14 },

  rateBtn:        { backgroundColor: C.orange, borderRadius: 12, padding: 12, alignItems: 'center', marginTop: 4 },
  rateBtnText:    { color: C.white, fontWeight: '700', fontSize: 14 },
  ratedBadge:     { backgroundColor: '#FEFCE8', borderRadius: 12, padding: 10, alignItems: 'center', marginTop: 4, borderWidth: 0.5, borderColor: '#FDE68A' },
  ratedText:      { color: '#B45309', fontWeight: '700', fontSize: 13 },

  reorderBtn:     { backgroundColor: C.primary, borderRadius: 12, padding: 12, alignItems: 'center', marginTop: 4 },
  reorderBtnText: { color: C.white, fontWeight: '700', fontSize: 14 },

  empty:        { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji:   { fontSize: 48, marginBottom: 12 },
  emptyTitle:   { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 6 },
  emptySubtitle:{ fontSize: 13, color: C.textSub, textAlign: 'center', lineHeight: 20, marginBottom: 20, paddingHorizontal: 20 },
  newBtn:       { backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 12 },
  newBtnText:   { color: C.white, fontWeight: '700', fontSize: 14 },

  fabRow:  { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  fabText: { color: C.white, fontSize: 15, fontWeight: '700' },
})
