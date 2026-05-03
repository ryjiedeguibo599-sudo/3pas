import React, { useEffect, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, RefreshControl,
  Platform, Alert, Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import API from '../../services/api'
import RatingModal from '../../components/RatingModal'

const BLUE    = '#3B82F6'
const BLUE_BG = '#EFF6FF'
const GREEN   = '#16A34A'
const ORANGE  = '#F08A24'
const PURPLE  = '#8B5CF6'
const RED     = '#EF4444'

const STATUS_COLOR = {
  pending:     ORANGE,
  accepted:    BLUE,
  in_progress: BLUE,
  completed:   GREEN,
  cancelled:   RED,
}

const STATUS_BG = {
  pending:     '#FFF7ED',
  accepted:    '#EFF6FF',
  in_progress: '#EFF6FF',
  completed:   '#F0FDF4',
  cancelled:   '#FEF2F2',
}

const STATUS_STEPS = ['pending', 'accepted', 'in_progress', 'completed']

const STATUS_INFO = {
  pending:     { label: 'Pending',     emoji: '⏳', desc: 'Waiting for a provider to accept your request.' },
  accepted:    { label: 'Accepted',    emoji: '🔵', desc: 'A provider has accepted your delivery request.' },
  in_progress: { label: 'In Progress', emoji: '📦', desc: 'Your package is on its way.' },
  completed:   { label: 'Completed',   emoji: '✅', desc: 'Delivery completed!' },
  cancelled:   { label: 'Cancelled',   emoji: '❌', desc: 'Your delivery request was cancelled.' },
}

const TABS = ['All', 'Pending', 'On-going', 'Completed', 'Cancelled']

function TrackingSteps({ status }) {
  if (status === 'cancelled') {
    return (
      <View style={styles.cancelledBox}>
        <Text style={styles.cancelledText}>❌  Request Cancelled</Text>
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
                <Text style={styles.stepDotText}>{done ? '✓' : STATUS_INFO[step].emoji}</Text>
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
                <View style={[styles.nowBadge, { backgroundColor: STATUS_COLOR[step] + '20' }]}>
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

function DetailModal({ item, visible, onClose, onCancel, cancelling, setRatingModal, reviewedIds, navigation }) {
  if (!item) return null
  const sc        = STATUS_COLOR[item.status] || '#94a3b8'
  const sb        = STATUS_BG[item.status]    || '#f8fafc'
  const isPending = item.status === 'pending'
  const isOngoing = ['accepted', 'in_progress'].includes(item.status)
  const isReviewed = reviewedIds.includes(item.id)

  const goToWaiting = () => {
    onClose()
    navigation.navigate('WaitingDelivery', {
      description:   item.description,
      address:       item.address,
      deliveryType:  item.delivery_type,
      itemTitle:     item.item_title,
      schedule:      item.schedule,
      requestId:     item.id,
    })
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modal.overlay}>
        <View style={modal.sheet}>
          <View style={modal.handle} />
          <View style={modal.header}>
            <View style={{ flex: 1 }}>
              <Text style={modal.reqId}>📦 Request #{item.id}</Text>
              <Text style={modal.dateText}>
                {new Date(item.requested_at).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </Text>
            </View>
            <View style={[modal.statusBadge, { backgroundColor: sb }]}>
              <Text style={[modal.statusText, { color: sc }]}>
                {STATUS_INFO[item.status]?.emoji} {STATUS_INFO[item.status]?.label}
              </Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {item.status !== 'cancelled' && (
              <View style={modal.section}>
                <View style={modal.progressTrack}>
                  <View style={[modal.progressFill, {
                    width: `${((STATUS_STEPS.indexOf(item.status) + 1) / STATUS_STEPS.length) * 100}%`,
                    backgroundColor: sc,
                  }]} />
                </View>
              </View>
            )}
            <View style={modal.section}>
              <Text style={modal.sectionTitle}>📍 Request Status</Text>
              <TrackingSteps status={item.status} />
            </View>
            <View style={modal.section}>
              <Text style={modal.sectionTitle}>📋 Details</Text>
              <View style={modal.infoCard}>
                <View style={modal.infoRow}>
                  <Text style={modal.infoLabel}>Delivery Type</Text>
                  <Text style={modal.infoValue}>{item.delivery_type || '—'}</Text>
                </View>
                <View style={modal.infoRow}>
                  <Text style={modal.infoLabel}>Item</Text>
                  <Text style={[modal.infoValue, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
                    {item.item_title || item.description || '—'}
                  </Text>
                </View>
                <View style={modal.infoRow}>
                  <Text style={modal.infoLabel}>Address</Text>
                  <Text style={[modal.infoValue, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
                    {item.address || '—'}
                  </Text>
                </View>
                {item.schedule && (
                  <View style={modal.infoRow}>
                    <Text style={modal.infoLabel}>Schedule</Text>
                    <Text style={[modal.infoValue, { color: GREEN }]}>{item.schedule}</Text>
                  </View>
                )}
                <View style={modal.codRow}>
                  <Text style={modal.codText}>💳 Payment collected after delivery — Cash or GCash</Text>
                </View>
              </View>
            </View>
            <View style={modal.section}>
              {(isPending || isOngoing) && (
                <TouchableOpacity style={modal.trackBtn} onPress={goToWaiting} activeOpacity={0.85}>
                  <Text style={modal.trackBtnText}>
                    {isPending ? '🔍  Track Request' : '📦  View Status'}
                  </Text>
                </TouchableOpacity>
              )}
              {isPending && (
                <TouchableOpacity style={modal.cancelBtn} onPress={() => onCancel(item.id)} disabled={cancelling === item.id} activeOpacity={0.8}>
                  {cancelling === item.id
                    ? <ActivityIndicator size="small" color={RED} />
                    : <Text style={modal.cancelBtnText}>✕  Cancel Request</Text>
                  }
                </TouchableOpacity>
              )}
              {item.status === 'completed' && (
                isReviewed ? (
                  <View style={modal.ratedBadge}><Text style={modal.ratedText}>⭐  Already Rated</Text></View>
                ) : (
                  <TouchableOpacity style={modal.rateBtn} onPress={() => { onClose(); setRatingModal({ visible: true, requestId: item.id }) }} activeOpacity={0.8}>
                    <Text style={modal.rateBtnText}>⭐  Rate this Delivery</Text>
                  </TouchableOpacity>
                )
              )}
              {item.status === 'cancelled' && (
                <TouchableOpacity style={modal.reorderBtn} onPress={() => { onClose(); navigation.navigate('Padala') }} activeOpacity={0.8}>
                  <Text style={modal.reorderBtnText}>📦  Request Again</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={{ height: 24 }} />
          </ScrollView>

          <TouchableOpacity style={modal.closeBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={modal.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

export default function MyDeliveryRequestsScreen({ navigation }) {
  const [requests,      setRequests]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [refreshing,    setRefreshing]    = useState(false)
  const [activeTab,     setActiveTab]     = useState('All')
  const [cancelling,    setCancelling]    = useState(null)
  const [ratingModal,   setRatingModal]   = useState({ visible: false, requestId: null })
  const [reviewedIds,   setReviewedIds]   = useState([])
  const [detailItem,    setDetailItem]    = useState(null)
  const [detailVisible, setDetailVisible] = useState(false)

  useEffect(() => { fetchRequests() }, [])

  const fetchRequests = async () => {
    try {
      const res = await API.get('/parepair/requests')
      setRequests(res.data.requests)
      const completed = res.data.requests.filter(r => r.status === 'completed')
      const reviewed  = []
      for (const req of completed) {
        try {
          const r = await API.get(`/reviews/padala/${req.id}`)
          if (r.data.review) reviewed.push(req.id)
        } catch {}
      }
      setReviewedIds(reviewed)
    } catch (err) {
      console.log('Error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleCancel = (requestId) => {
    Alert.alert('Cancel Request?', 'Are you sure you want to cancel this request?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel', style: 'destructive',
        onPress: async () => {
          try {
            setCancelling(requestId)
            await API.patch(`/parepair/requests/${requestId}/cancel`)
            setDetailVisible(false)
            await fetchRequests()
          } catch (err) {
            Alert.alert('Error', err?.response?.data?.message || 'Could not cancel. Please try again.')
          } finally { setCancelling(null) }
        },
      },
    ])
  }

  const onRefresh   = () => { setRefreshing(true); fetchRequests() }
  const openDetail  = (item) => { setDetailItem(item); setDetailVisible(true) }
  const closeDetail = () => { setDetailVisible(false); setDetailItem(null) }

  const filteredRequests = requests.filter(r => {
    if (activeTab === 'All')       return true
    if (activeTab === 'Pending')   return r.status === 'pending'
    if (activeTab === 'On-going')  return ['accepted', 'in_progress'].includes(r.status)
    if (activeTab === 'Completed') return r.status === 'completed'
    if (activeTab === 'Cancelled') return r.status === 'cancelled'
    return true
  })

  const pendingCount   = requests.filter(r => r.status === 'pending').length
  const ongoingCount   = requests.filter(r => ['accepted', 'in_progress'].includes(r.status)).length
  const completedCount = requests.filter(r => r.status === 'completed').length
  const cancelledCount = requests.filter(r => r.status === 'cancelled').length

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={styles.loadingText}>Loading your requests...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}><Text style={{ fontSize: 16 }}>📦</Text></View>
          <Text style={styles.title}>My Delivery Requests</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Text style={{ fontSize: 16 }}>↻</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        {[
          { label: 'Pending',   count: pendingCount,   color: ORANGE, bg: '#fff7ed' },
          { label: 'On-going',  count: ongoingCount,   color: BLUE,   bg: '#eff6ff' },
          { label: 'Done',      count: completedCount, color: GREEN,  bg: '#f0fdf4' },
          { label: 'Cancelled', count: cancelledCount, color: RED,    bg: '#fef2f2' },
        ].map(s => (
          <View key={s.label} style={[styles.summaryChip, { backgroundColor: s.bg }]}>
            <Text style={[styles.summaryCount, { color: s.color }]}>{s.count}</Text>
            <Text style={[styles.summaryLabel, { color: s.color }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsRow}>
        {TABS.map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)} activeOpacity={0.7}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />}
      >
        {filteredRequests.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>{activeTab === 'Cancelled' ? '❌' : '📦'}</Text>
            <Text style={styles.emptyTitle}>
              {activeTab === 'All' ? 'No requests yet' : `No ${activeTab.toLowerCase()} requests`}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'All'
                ? 'Send a package and we\'ll match you with a nearby delivery rider.'
                : activeTab === 'Cancelled'
                ? 'Cancelled requests will show up here.'
                : `Your ${activeTab.toLowerCase()} requests will appear here.`}
            </Text>
            {activeTab !== 'Cancelled' && (
              <TouchableOpacity style={styles.newBtn} onPress={() => navigation.navigate('Padala')}>
                <Text style={styles.newBtnText}>+ Submit a Delivery</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredRequests.map((item) => {
            const sc        = STATUS_COLOR[item.status] || '#94a3b8'
            const sb        = STATUS_BG[item.status]    || '#f8fafc'
            const isPending = item.status === 'pending'
            const isOngoing = ['accepted', 'in_progress'].includes(item.status)

            const goToWaiting = () => navigation.navigate('WaitingDelivery', {
              description:  item.description,
              address:      item.address,
              deliveryType: item.delivery_type,
              itemTitle:    item.item_title,
              schedule:     item.schedule,
              requestId:    item.id,
            })

            return (
              <View key={item.id} style={[styles.card, { borderLeftColor: sc, borderLeftWidth: 4 }]}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardId}>📦 Request #{item.id}</Text>
                    <Text style={styles.dateText}>
                      {new Date(item.requested_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: sb }]}>
                    <Text style={[styles.statusText, { color: sc }]}>
                      {STATUS_INFO[item.status]?.emoji} {STATUS_INFO[item.status]?.label}
                    </Text>
                  </View>
                </View>

                {item.status !== 'cancelled' && (
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, {
                      width: `${((STATUS_STEPS.indexOf(item.status) + 1) / STATUS_STEPS.length) * 100}%`,
                      backgroundColor: sc,
                    }]} />
                  </View>
                )}

                <View style={styles.previewBlock}>
                  {item.item_title ? <Text style={styles.previewTitle} numberOfLines={1}>📋 {item.item_title}</Text> : null}
                  {item.address ? <Text style={styles.previewAddr} numberOfLines={1}>📍 {item.address}</Text> : null}
                </View>

                <View style={styles.actionRow}>
                  {isPending && (
                    <>
                      <TouchableOpacity style={styles.btnTrack} onPress={goToWaiting} activeOpacity={0.85}>
                        <Text style={styles.btnTrackText}>🔍  Track</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.btnCancel}
                        onPress={() => handleCancel(item.id)}
                        disabled={cancelling === item.id}
                        activeOpacity={0.8}
                      >
                        {cancelling === item.id
                          ? <ActivityIndicator size="small" color={RED} />
                          : <Text style={styles.btnCancelText}>✕  Cancel</Text>
                        }
                      </TouchableOpacity>
                    </>
                  )}
                  {isOngoing && (
                    <TouchableOpacity style={[styles.btnTrack, { flex: 1 }]} onPress={goToWaiting} activeOpacity={0.85}>
                      <Text style={styles.btnTrackText}>📦  View Status</Text>
                    </TouchableOpacity>
                  )}
                  {item.status === 'completed' && (
                    <TouchableOpacity style={[styles.btnTrack, { flex: 1 }]} onPress={() => openDetail(item)} activeOpacity={0.85}>
                      <Text style={styles.btnTrackText}>📋  View Details</Text>
                    </TouchableOpacity>
                  )}
                  {item.status === 'cancelled' && (
                    <TouchableOpacity style={[styles.btnTrack, { flex: 1, backgroundColor: '#64748b' }]} onPress={() => navigation.navigate('Padala')} activeOpacity={0.8}>
                      <Text style={styles.btnTrackText}>📦  Request Again</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )
          })
        )}

        <TouchableOpacity style={styles.fabRow} onPress={() => navigation.navigate('Padala')} activeOpacity={0.85}>
          <Text style={styles.fabText}>+ New Delivery Request</Text>
        </TouchableOpacity>
        <View style={{ height: 32 }} />
      </ScrollView>

      <DetailModal
        item={detailItem} visible={detailVisible} onClose={closeDetail}
        onCancel={handleCancel} cancelling={cancelling}
        setRatingModal={setRatingModal} reviewedIds={reviewedIds} navigation={navigation}
      />

      <RatingModal
        visible={ratingModal.visible}
        onClose={() => setRatingModal({ visible: false, requestId: null })}
        serviceType="padala" serviceId={ratingModal.requestId} onSuccess={fetchRequests}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#f8fafc' },
  centered:     { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText:  { fontSize: 13, color: '#64748b' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 8 : 4, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' },
  backBtn:      { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  backIcon:     { fontSize: 22, color: BLUE, fontWeight: '600', lineHeight: 28 },
  logoRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon:     { width: 32, height: 32, borderRadius: 8, backgroundColor: BLUE_BG, alignItems: 'center', justifyContent: 'center' },
  title:        { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  refreshBtn:   { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  summaryRow:   { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 6, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' },
  summaryChip:  { flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  summaryCount: { fontSize: 16, fontWeight: '800' },
  summaryLabel: { fontSize: 9, fontWeight: '600', marginTop: 1 },
  tabsScroll:   { backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0', maxHeight: 48 },
  tabsRow:      { paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  tab:          { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, backgroundColor: '#f1f5f9', borderWidth: 0.5, borderColor: '#e2e8f0' },
  tabActive:    { backgroundColor: ORANGE, borderColor: ORANGE },
  tabText:      { fontSize: 12, fontWeight: '600', color: '#64748b' },
  tabTextActive:{ color: '#fff' },
  container:    { flex: 1, paddingHorizontal: 14, paddingTop: 12 },
  card:         { backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardTop:      { flexDirection: 'row', alignItems: 'flex-start', padding: 14, paddingBottom: 10 },
  cardId:       { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 3 },
  dateText:     { fontSize: 11, color: '#94a3b8' },
  statusBadge:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText:   { fontSize: 11, fontWeight: '700' },
  progressTrack:{ height: 4, backgroundColor: '#f1f5f9', marginHorizontal: 14, borderRadius: 10, overflow: 'hidden', marginBottom: 10 },
  progressFill: { height: '100%', borderRadius: 10 },
  previewBlock: { paddingHorizontal: 14, marginBottom: 12 },
  previewTitle: { fontSize: 13, fontWeight: '600', color: '#0f172a', marginBottom: 3 },
  previewAddr:  { fontSize: 12, color: '#64748b' },
  actionRow:    { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 14 },
  btnTrack:     { flex: 1, backgroundColor: BLUE, borderRadius: 12, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', shadowColor: BLUE, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  btnTrackText: { color: '#fff', fontWeight: '700', fontSize: 13, textAlign: 'center' },
  btnCancel:    { flex: 1, backgroundColor: '#fef2f2', borderWidth: 1.5, borderColor: '#fca5a5', borderRadius: 12, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  btnCancelText:{ color: RED, fontWeight: '700', fontSize: 13, textAlign: 'center' },
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
  empty:        { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji:   { fontSize: 48, marginBottom: 12 },
  emptyTitle:   { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  emptySubtitle:{ fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20, marginBottom: 20, paddingHorizontal: 20 },
  newBtn:       { backgroundColor: ORANGE, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 12 },
  newBtnText:   { color: '#fff', fontWeight: '700', fontSize: 14 },
  fabRow:       { backgroundColor: ORANGE, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4, shadowColor: ORANGE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  fabText:      { color: '#fff', fontSize: 15, fontWeight: '700' },
})

const modal = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, paddingHorizontal: 20, maxHeight: '90%' },
  handle:       { width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  header:       { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  reqId:        { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  dateText:     { fontSize: 12, color: '#94a3b8' },
  statusBadge:  { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  statusText:   { fontSize: 12, fontWeight: '700' },
  section:      { marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#64748b', marginBottom: 10 },
  progressTrack:{ height: 5, backgroundColor: '#f1f5f9', borderRadius: 10, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 10 },
  infoCard:     { backgroundColor: '#f8fafc', borderRadius: 12, padding: 14, borderWidth: 0.5, borderColor: '#e2e8f0', gap: 10 },
  infoRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel:    { fontSize: 13, color: '#64748b' },
  infoValue:    { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  codRow:       { backgroundColor: '#f0fdf4', borderRadius: 8, padding: 10, marginTop: 4 },
  codText:      { fontSize: 12, color: '#166534' },
  trackBtn:     { backgroundColor: BLUE, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 8 },
  trackBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  cancelBtn:    { borderWidth: 1.5, borderColor: RED, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 8 },
  cancelBtnText:{ color: RED, fontWeight: '700', fontSize: 14 },
  rateBtn:      { backgroundColor: ORANGE, borderRadius: 12, padding: 14, alignItems: 'center' },
  rateBtnText:  { color: '#fff', fontWeight: '700', fontSize: 14 },
  ratedBadge:   { backgroundColor: '#fefce8', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 0.5, borderColor: '#fde68a' },
  ratedText:    { color: '#b45309', fontWeight: '700', fontSize: 13 },
  reorderBtn:   { backgroundColor: BLUE, borderRadius: 12, padding: 14, alignItems: 'center' },
  reorderBtnText:{ color: '#fff', fontWeight: '700', fontSize: 14 },
  closeBtn:     { backgroundColor: BLUE, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8, marginBottom: Platform.OS === 'android' ? 20 : 32 },
  closeBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
})
