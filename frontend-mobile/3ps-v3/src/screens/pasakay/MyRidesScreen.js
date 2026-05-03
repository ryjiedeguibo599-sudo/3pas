import React, { useEffect, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, RefreshControl,
  Platform, Alert, LayoutAnimation
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import API from '../../services/api'
import RatingModal from '../../components/RatingModal'
import { theme } from '../../theme/padulongTheme'
import ConfirmationModal from '../../components/ConfirmationModal'

const C = {
  primary:   '#F08A24',
  primaryLt: '#FFF7ED',
  primaryMd: '#FED7AA',
  text:      '#0F172A',
  textSub:   '#64748B',
  textHint:  '#64748B',
  border:    '#E2E8F0',
  bg:        '#F8FAFF',
  white:     '#FFFFFF',
  orange:    '#F08A24',
  blue:      '#3B82F6',
  red:       '#EF4444',
  green:     '#16A34A',
}

const STATUS_COLOR = {
  pending:    C.orange,
  accepted:   C.blue,
  on_the_way: C.blue,
  completed:  C.green,
  cancelled:  C.red,
}

const STATUS_BG = {
  pending:    '#FFF7ED',
  accepted:   '#EFF6FF',
  on_the_way: '#EFF6FF',
  completed:  '#F0FDF4',
  cancelled:  '#FEF2F2',
}

const STATUS_STEPS = ['pending', 'accepted', 'on_the_way', 'completed']

const STATUS_INFO = {
  pending:    { label: 'Pending',    emoji: '⏳', desc: 'Waiting for a rider to accept your booking.' },
  accepted:   { label: 'Accepted',   emoji: '🔵', desc: 'A rider has accepted your booking.' },
  on_the_way: { label: 'On the Way', emoji: '🛵', desc: 'Your rider is on the way to your pickup!' },
  completed:  { label: 'Completed',  emoji: '✅', desc: 'Your ride is complete!' },
  cancelled:  { label: 'Cancelled',  emoji: '❌', desc: 'This ride was cancelled.' },
}

const TABS = ['All', 'Pending', 'On-going', 'Completed', 'Cancelled']

function ProgressBar({ status }) {
  if (status === 'cancelled') return null
  const idx      = STATUS_STEPS.indexOf(status)
  const progress = ((idx + 1) / STATUS_STEPS.length) * 100
  return (
    <View style={styles.progressWrapper}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: STATUS_COLOR[status] || C.primary }]} />
      </View>
      <Text style={[styles.progressLabel, { color: STATUS_COLOR[status] }]}>
        {STATUS_INFO[status]?.emoji} {STATUS_INFO[status]?.label}
      </Text>
    </View>
  )
}

function TrackingSteps({ status }) {
  if (status === 'cancelled') {
    return (
      <View style={styles.cancelledBox}>
        <Text style={styles.cancelledText}>❌  Ride Cancelled</Text>
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
                done    && { backgroundColor: C.primary, borderColor: C.primary },
              ]}>
                <Text style={styles.stepDotText}>{done ? '✓' : STATUS_INFO[step].emoji}</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={[
                  styles.stepLabel,
                  current && { color: STATUS_COLOR[step], fontWeight: '700' },
                  done    && { color: C.primary, fontWeight: '700' },
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
              <View style={[styles.stepLine, done && { backgroundColor: C.primary }]} />
            )}
          </View>
        )
      })}
    </View>
  )
}

export default function MyRidesScreen({ navigation }) {
  const [expanded, setExpanded]       = useState(null)
  const [activeTab, setActiveTab]     = useState('All')
  const [cancelling, setCancelling]   = useState(null)
  const [cancelModal, setCancelModal] = useState({ visible: false, id: null })
  const [ratingModal, setRatingModal] = useState({ visible: false, rideId: null })
  const queryClient = useQueryClient()

  const { data: { rides = [], reviewedIds = [] } = {}, isLoading: loading, isRefetching: refreshing, refetch } = useQuery({
    queryKey: ['myRides'],
    queryFn: async () => {
      const res = await API.get('/pasakay/rides')
      const fetchedRides = res.data.rides || []
      const completed = fetchedRides.filter(r => r.status === 'completed')
      const reviewed  = []
      for (const ride of completed) {
        try {
          const r = await API.get(`/reviews/pasakay/${ride.id}`)
          if (r.data.review) reviewed.push(ride.id)
        } catch {}
      }
      return { rides: fetchedRides, reviewedIds: reviewed }
    }
  })

  const requestCancel = (rideId) => setCancelModal({ visible: true, id: rideId })

  const executeCancel = async () => {
    const rideId = cancelModal.id
    setCancelModal({ visible: false, id: null })
    if (!rideId) return
    try {
      setCancelling(rideId)
      await API.patch(`/pasakay/rides/${rideId}/cancel`)
      await queryClient.invalidateQueries({ queryKey: ['myRides'] })
    } catch (err) {
      const msg = err?.response?.data?.message || 'Could not cancel. Please try again.'
      Alert.alert('Error', msg)
    } finally {
      setCancelling(null)
    }
  }

  const onRefresh    = () => { refetch() }
  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setExpanded(expanded === id ? null : id)
  }

  const filteredRides = rides.filter(r => {
    if (activeTab === 'All')       return true
    if (activeTab === 'Pending')   return r.status === 'pending'
    if (activeTab === 'On-going')  return ['accepted', 'on_the_way'].includes(r.status)
    if (activeTab === 'Completed') return r.status === 'completed'
    if (activeTab === 'Cancelled') return r.status === 'cancelled'
    return true
  })

  const pendingCount   = rides.filter(r => r.status === 'pending').length
  const ongoingCount   = rides.filter(r => ['accepted', 'on_the_way'].includes(r.status)).length
  const completedCount = rides.filter(r => r.status === 'completed').length
  const cancelledCount = rides.filter(r => r.status === 'cancelled').length

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.loadingText}>Loading your rides...</Text>
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
          <Text style={{ fontSize: 18 }}>🛵</Text>
          <Text style={styles.title}>My Rides</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Text style={{ fontSize: 16 }}>↻</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryChip, { backgroundColor: '#FFF7ED' }]}>
          <Text style={styles.summaryCount}>{pendingCount}</Text>
          <Text style={[styles.summaryLabel, { color: C.orange }]}>Pending</Text>
        </View>
        <View style={[styles.summaryChip, { backgroundColor: '#EFF6FF' }]}>
          <Text style={styles.summaryCount}>{ongoingCount}</Text>
          <Text style={[styles.summaryLabel, { color: C.blue }]}>On-going</Text>
        </View>
        <View style={[styles.summaryChip, { backgroundColor: '#F0FDF4' }]}>
          <Text style={styles.summaryCount}>{completedCount}</Text>
          <Text style={[styles.summaryLabel, { color: C.green }]}>Completed</Text>
        </View>
        <View style={[styles.summaryChip, { backgroundColor: '#FEF2F2' }]}>
          <Text style={styles.summaryCount}>{cancelledCount}</Text>
          <Text style={[styles.summaryLabel, { color: C.red }]}>Cancelled</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
      >
        {filteredRides.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>{activeTab === 'Cancelled' ? '❌' : '🛵'}</Text>
            <Text style={styles.emptyTitle}>
              {activeTab === 'All' ? 'No rides yet' : `No ${activeTab.toLowerCase()} rides`}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'All'
                ? 'Book a ride with Pasakay and we\'ll match you with a nearby driver.'
                : activeTab === 'Cancelled'
                ? 'Cancelled rides will show up here.'
                : `Your ${activeTab.toLowerCase()} rides will appear here.`}
            </Text>
            {activeTab !== 'Cancelled' && (
              <TouchableOpacity style={styles.newBtn} onPress={() => navigation.navigate('Pasakay')}>
                <Text style={styles.newBtnText}>+ Book a Ride</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredRides.map((item) => {
            const isOpen    = expanded === item.id
            const sc        = STATUS_COLOR[item.status] || '#94A3B8'
            const sb        = STATUS_BG[item.status]   || C.bg
            const isPending = item.status === 'pending'

            return (
              <View key={item.id} style={styles.card}>

                <TouchableOpacity style={styles.cardHeader} onPress={() => toggleExpand(item.id)} activeOpacity={0.7}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.cardTopRow}>
                      <Text style={styles.cardId}>Ride #{item.id}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: sb }]}>
                        <Text style={styles.statusEmoji}>{STATUS_INFO[item.status]?.emoji}</Text>
                        <Text style={[styles.statusText, { color: sc }]}>
                          {STATUS_INFO[item.status]?.label || item.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.dateText}>
                      🕐 {new Date(item.booked_at).toLocaleDateString('en-PH', {
                        year: 'numeric', month: 'long', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <Text style={[styles.expandIcon, isOpen && { transform: [{ rotate: '180deg' }] }]}>⌄</Text>
                </TouchableOpacity>

                {isOpen && (
                  <View style={styles.details}>
                    <ProgressBar status={item.status} />
                    <TrackingSteps status={item.status} />

                    <View style={styles.divider} />

                    <View style={styles.routeRow}>
                      <View style={[styles.routeDot, { backgroundColor: C.primary }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.routeLabel}>PICKUP</Text>
                        <Text style={styles.routeValue}>{item.pickup_location}</Text>
                      </View>
                    </View>
                    <View style={styles.routeConnector} />
                    <View style={styles.routeRow}>
                      <View style={[styles.routeDot, { backgroundColor: C.red }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.routeLabel}>DROPOFF</Text>
                        <Text style={styles.routeValue}>{item.dropoff_location}</Text>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.fareRow}>
                      <Text style={styles.fareLabel}>💰 Fare</Text>
                      <Text style={styles.fareValue}>₱{item.fare}</Text>
                    </View>

                    {item.rider_name && (
                      <View style={styles.riderRow}>
                        <Text style={styles.riderLabel}>🛵 Rider</Text>
                        <Text style={styles.riderValue}>{item.rider_name}</Text>
                      </View>
                    )}

                    {item.status !== 'cancelled' && (
                      <View style={styles.codRow}>
                        <Text style={styles.codText}>💳 Cash or GCash — pay after the ride</Text>
                      </View>
                    )}

                    {isPending && (
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => requestCancel(item.id)}
                        disabled={cancelling === item.id}
                        activeOpacity={0.8}
                      >
                        {cancelling === item.id
                          ? <ActivityIndicator size="small" color={C.red} />
                          : <Text style={styles.cancelBtnText}>✕  Cancel Ride</Text>
                        }
                      </TouchableOpacity>
                    )}

                    {item.status === 'completed' && (
                      reviewedIds.includes(item.id) ? (
                        <View style={styles.ratedBadge}>
                          <Text style={styles.ratedText}>⭐  Already rated</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.rateBtn}
                          onPress={() => setRatingModal({ visible: true, rideId: item.id })}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.rateBtnText}>⭐  Rate this Ride</Text>
                        </TouchableOpacity>
                      )
                    )}

                    {item.status === 'cancelled' && (
                      <TouchableOpacity
                        style={styles.reorderBtn}
                        onPress={() => navigation.navigate('Pasakay')}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.reorderBtnText}>🛵  Book Again</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            )
          })
        )}

        {filteredRides.length > 0 && activeTab !== 'Cancelled' && (
          <TouchableOpacity style={styles.fabRow} onPress={() => navigation.navigate('Pasakay')} activeOpacity={0.85}>
            <Text style={styles.fabText}>+ New Ride</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      <RatingModal
        visible={ratingModal.visible}
        onClose={() => setRatingModal({ visible: false, rideId: null })}
        serviceType="pasakay"
        serviceId={ratingModal.rideId}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['myRides'] })}
      />
      <ConfirmationModal
        visible={cancelModal.visible}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking? This action cannot be undone."
        icon="⚠️"
        confirmText="Yes, Cancel"
        confirmColor="#EF4444"
        onConfirm={executeCancel}
        onCancel={() => setCancelModal({ visible: false, id: null })}
        critical={true}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
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
  summaryLabel: { fontSize: 12, fontWeight: '700', marginTop: 1, textTransform: 'uppercase', letterSpacing: 0.4 },

  tabsScroll: { backgroundColor: C.white, borderBottomWidth: 0.5, borderBottomColor: C.border, maxHeight: 48 },
  tabsRow:    { paddingHorizontal: 12, paddingVertical: 8, gap: 6, flexDirection: 'row', alignItems: 'center' },
  tab:        { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, backgroundColor: '#F1F5F9', borderWidth: 0.5, borderColor: C.border },
  tabActive:  { backgroundColor: C.primary, borderColor: C.primary },
  tabText:    { fontSize: 12, fontWeight: '600', color: C.textSub },
  tabTextActive: { color: C.white },

  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },

  card:       { backgroundColor: C.white, borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 0.5, borderColor: C.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardId:     { fontSize: 14, fontWeight: '700', color: C.text },
  statusBadge:{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusEmoji:{ fontSize: 12 },
  statusText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },
  expandIcon: { fontSize: 18, color: C.textHint, marginLeft: 8 },
  dateText:   { fontSize: 12, color: C.textHint },

  details: { marginTop: 6 },

  progressWrapper: { marginBottom: 10 },
  progressTrack:   { height: 5, backgroundColor: '#F1F5F9', borderRadius: 10, overflow: 'hidden', marginBottom: 5 },
  progressFill:    { height: '100%', borderRadius: 10 },
  progressLabel:   { fontSize: 12, fontWeight: '700' },

  stepsContainer: { paddingLeft: 2, marginBottom: 4 },
  stepWrapper:    {},
  stepRow:        { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  stepDot:        { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F1F5F9', borderWidth: 1.5, borderColor: C.border, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  stepDotText:    { fontSize: 12 },
  stepInfo:       { flex: 1 },
  stepLabel:      { fontSize: 13, color: C.textHint, fontWeight: '500' },
  stepDesc:       { fontSize: 12, color: C.textSub, marginTop: 1, lineHeight: 16 },
  stepLine:       { width: 2, height: 14, backgroundColor: C.border, marginLeft: 14, marginVertical: 1 },
  nowBadge:       { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  nowBadgeText:   { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  cancelledBox:   { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 10, alignItems: 'center' },
  cancelledText:  { color: C.red, fontWeight: '700', fontSize: 13 },

  divider: { height: 0.5, backgroundColor: '#F1F5F9', marginVertical: 10 },

  routeRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 2 },
  routeDot:       { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  routeLabel:     { fontSize: 12, color: C.textHint, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  routeValue:     { fontSize: 13, color: C.text, fontWeight: '500', lineHeight: 18 },
  routeConnector: { width: 1.5, height: 10, backgroundColor: C.border, marginLeft: 4, marginVertical: 2 },

  fareRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  fareLabel: { fontSize: 13, color: C.textSub },
  fareValue: { fontSize: 16, fontWeight: '700', color: C.primary },

  riderRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  riderLabel:{ fontSize: 13, color: C.textSub },
  riderValue:{ fontSize: 13, fontWeight: '600', color: C.text },

  codRow:  { backgroundColor: C.primaryLt, borderRadius: 8, padding: 10, marginBottom: 10 },
  codText: { fontSize: 12, color: C.primary },

  cancelBtn:     { borderWidth: 1.5, borderColor: C.red, borderRadius: 12, padding: 12, alignItems: 'center', marginBottom: 8 },
  cancelBtnText: { color: C.red, fontWeight: '700', fontSize: 14 },

  rateBtn:     { backgroundColor: C.orange, borderRadius: 12, padding: 12, alignItems: 'center', marginTop: 4 },
  rateBtnText: { color: C.white, fontWeight: '700', fontSize: 14 },
  ratedBadge:  { backgroundColor: '#FEFCE8', borderRadius: 12, padding: 10, alignItems: 'center', marginTop: 4, borderWidth: 0.5, borderColor: '#FDE68A' },
  ratedText:   { color: '#B45309', fontWeight: '700', fontSize: 13 },

  reorderBtn:     { backgroundColor: C.primary, borderRadius: 12, padding: 12, alignItems: 'center', marginTop: 4 },
  reorderBtnText: { color: C.white, fontWeight: '700', fontSize: 14 },

  empty:         { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji:    { fontSize: 48, marginBottom: 12 },
  emptyTitle:    { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: C.textSub, textAlign: 'center', lineHeight: 20, marginBottom: 20, paddingHorizontal: 20 },
  newBtn:        { backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 12 },
  newBtnText:    { color: C.white, fontWeight: '700', fontSize: 14 },

  fabRow:  { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  fabText: { color: C.white, fontSize: 15, fontWeight: '700' },
})
