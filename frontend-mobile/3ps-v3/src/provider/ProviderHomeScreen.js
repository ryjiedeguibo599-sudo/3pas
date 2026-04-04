import React, { useState, useCallback, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, StatusBar,
  ActivityIndicator, RefreshControl, Alert, Image,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect } from '@react-navigation/native'
import API from '../../services/api'

const C = {
  primary:    '#0D6B63',
  primaryLt:  '#E6F4F2',
  primaryMd:  '#A7D9D5',
  bg:         '#F7F8FA',
  white:      '#FFFFFF',
  text:       '#111827',
  textSub:    '#6B7280',
  textHint:   '#9CA3AF',
  border:     '#EEEFF2',
  danger:     '#EF4444',
  warning:    '#F59E0B',
}

const PROVIDER_SERVICE = {
  pasabuy: {
    label: 'PasaBUY',
    emoji: '🛒',
    bg: '#EFF6FF',
    acc: '#2563EB',
    endpoint: '/pasabuy/orders/available/all',
    responseKey: 'orders',
  },
  pasakay: {
    label: 'Pasakay',
    emoji: '🛵',
    bg: '#F0FDF4',
    acc: '#16A34A',
    endpoint: '/pasakay/rides/available/all',
    responseKey: 'rides',
  },
  parepair: {
    label: 'PaRepair',
    emoji: '🔧',
    bg: '#FFF7ED',
    acc: '#EA580C',
    endpoint: '/parepair/requests/available/all',
    responseKey: 'requests',
  },
}

const STATUS_STYLE = {
  pending:    { bg: '#FEF9C3', color: '#854D0E', label: 'Pending'    },
  accepted:   { bg: '#DBEAFE', color: '#1D4ED8', label: 'Accepted'   },
  on_the_way: { bg: '#F3E8FF', color: '#7E22CE', label: 'On the Way' },
  in_progress:{ bg: '#FEF3C7', color: '#92400E', label: 'In Progress'},
  completed:  { bg: '#DCFCE7', color: '#15803D', label: 'Completed'  },
  cancelled:  { bg: '#FEE2E2', color: '#B91C1C', label: 'Cancelled'  },
}

const getInitials = (name) => {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0][0].toUpperCase()
}
const getFirstName = (name) => name?.trim().split(' ')[0] ?? 'User'
const getGreeting  = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Magandang umaga'
  if (h < 18) return 'Magandang hapon'
  return 'Magandang gabi'
}

function Avatar({ uri, name, size = 44 }) {
  const r = size / 2
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: r }} />
  return (
    <View style={[s.avatarFallback, { width: size, height: size, borderRadius: r }]}>
      <Text style={[s.avatarInitials, { fontSize: size * 0.36 }]}>{getInitials(name)}</Text>
    </View>
  )
}

function RequestCard({ request, svc, onPress }) {
  if (!request || !svc) return null
  const st = STATUS_STYLE[request.status] || STATUS_STYLE.pending
  return (
    <TouchableOpacity
      style={[s.reqCard, { backgroundColor: svc.bg, borderColor: svc.acc + '40' }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[s.reqDot, { backgroundColor: svc.acc }]} />
      <View style={[s.reqIconBox, { backgroundColor: svc.acc + '15' }]}>
        <Text style={s.reqEmoji}>{svc.emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.reqTitle, { color: svc.acc }]}>Request #{request.id}</Text>
        <Text style={s.reqSub} numberOfLines={1}>
          {request.pickup_location || request.delivery_address || request.address || 'Bagong request'}
        </Text>
      </View>
      <View style={[s.statusChip, { backgroundColor: st.bg }]}>
        <Text style={[s.statusTxt, { color: st.color }]}>{st.label}</Text>
      </View>
      <Text style={[s.reqArrow, { color: svc.acc }]}>›</Text>
    </TouchableOpacity>
  )
}

export default function ProviderHomeScreen({ navigation }) {
  const [user,     setUser]     = useState(null)
  const [requests, setRequests] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const pollingRef = useRef(null)
  const mountedRef = useRef(true)

  useFocusEffect(
    useCallback(() => {
      mountedRef.current = true
      loadAll()

      // ── Auto-polling every 8 seconds ──
      pollingRef.current = setInterval(() => {
        if (!mountedRef.current) return
        AsyncStorage.getItem('user').then(raw => {
          if (!raw || !mountedRef.current) return
          const u = JSON.parse(raw)
          fetchRequests(u.service_type?.toLowerCase())
        }).catch(() => {})
      }, 8000)

      return () => {
        mountedRef.current = false
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
      }
    }, [])
  )

  const loadAll = async () => {
    try {
      const raw = await AsyncStorage.getItem('user')
      if (raw) {
        const u = JSON.parse(raw)
        if (mountedRef.current) setUser(u)
        await fetchRequests(u.service_type?.toLowerCase())
      }
    } catch (e) {
      console.log('loadAll error:', e)
    } finally {
      if (mountedRef.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }

  const fetchRequests = async (serviceType) => {
    if (!serviceType) return
    const svc = PROVIDER_SERVICE[serviceType]
    if (!svc) return
    try {
      console.log('📡 Fetching:', svc.endpoint)
      const res = await API.get(svc.endpoint)
      console.log('📦 Response keys:', Object.keys(res.data || {}))

      const data =
        res.data?.[svc.responseKey] ||
        res.data?.orders   ||
        res.data?.rides    ||
        res.data?.requests ||
        res.data?.data     ||
        []

      console.log('✅ Fetched:', data.length, 'items')
      if (mountedRef.current) setRequests(Array.isArray(data) ? data : [])
    } catch (e) {
      console.log('❌ fetchRequests error:', e?.response?.status, e?.message)
      if (mountedRef.current) setRequests([])
    }
  }

  const onRefresh = () => { setRefreshing(true); loadAll() }

  const handleLogout = () =>
    Alert.alert('Mag-logout', 'Sigurado ka bang gusto mong mag-logout?', [
      { text: 'Kanselahin', style: 'cancel' },
      { text: 'Mag-logout', style: 'destructive', onPress: async () => {
        mountedRef.current = false
        if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null }
        await AsyncStorage.multiRemove(['token', 'user', 'service_type'])
        navigation.replace('Login')
      }},
    ])

  const serviceType = user?.service_type?.toLowerCase()
  const svc         = PROVIDER_SERVICE[serviceType]

  const pending   = requests.filter(r => r.status === 'pending')
  const ongoing   = requests.filter(r => ['accepted', 'in_progress', 'on_the_way'].includes(r.status))
  const completed = requests.filter(r => r.status === 'completed')

  if (loading) return (
    <View style={s.loadingWrap}>
      <ActivityIndicator size="large" color={C.primary} />
    </View>
  )

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      {/* Top Bar */}
      <View style={s.topBar}>
        <View style={s.topLogoRow}>
          <View style={s.topLogoBadge}>
            <Text style={s.topLogoTxt}>3PS</Text>
          </View>
          <View>
            <Text style={s.topBarTitle}>3PS App</Text>
            <Text style={s.topBarSub}>Bacuag, Surigao del Norte</Text>
          </View>
        </View>
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={s.logoutTxt}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
      >
        {/* Greeting */}
        <View style={s.greetRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.greetSub}>{getGreeting()},</Text>
            <Text style={s.greetName}>{getFirstName(user?.full_name)} 👋</Text>
            <View style={[s.locationChip, svc && { backgroundColor: svc.acc + '15', borderColor: svc.acc + '40' }]}>
              <Text style={[s.locationTxt, svc && { color: svc.acc }]}>
                {svc?.emoji} {svc?.label ?? 'Provider'} · ID: {user?.id}
              </Text>
            </View>
          </View>
          <View style={s.avatarRing}>
            <Avatar uri={user?.profile_image} name={user?.full_name} size={50} />
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={[s.statCard, { backgroundColor: '#FEF9C3', borderColor: '#FDE68A' }]}>
            <Text style={s.statNum}>{pending.length}</Text>
            <Text style={[s.statLbl, { color: '#854D0E' }]}>Pending</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: '#DBEAFE', borderColor: '#BFDBFE' }]}>
            <Text style={s.statNum}>{ongoing.length}</Text>
            <Text style={[s.statLbl, { color: '#1D4ED8' }]}>Ongoing</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0' }]}>
            <Text style={s.statNum}>{completed.length}</Text>
            <Text style={[s.statLbl, { color: '#15803D' }]}>Completed</Text>
          </View>
        </View>

        {/* Pending Requests */}
        {pending.length > 0 && (
          <>
            <Text style={s.sectionLabel}>BAGONG REQUESTS</Text>
            {pending.map(req => (
              <RequestCard
                key={req.id}
                request={req}
                svc={svc}
                onPress={() => navigation.navigate('ProviderRequests', { requestId: req.id, request: req })}
              />
            ))}
          </>
        )}

        {/* Ongoing */}
        {ongoing.length > 0 && (
          <>
            <Text style={s.sectionLabel}>KASALUKUYANG TINATRATAN</Text>
            {ongoing.map(req => (
              <RequestCard
                key={req.id}
                request={req}
                svc={svc}
                onPress={() => navigation.navigate('ProviderRequests', { requestId: req.id, request: req })}
              />
            ))}
          </>
        )}

        {/* Empty State */}
        {pending.length === 0 && ongoing.length === 0 && (
          <View style={s.emptyState}>
            <Text style={s.emptyEmoji}>{svc?.emoji ?? '📋'}</Text>
            <Text style={s.emptyTitle}>Wala pang bagong request</Text>
            <Text style={s.emptySub}>
              Hihintayin ang mga resident na mag-request ng {svc?.label ?? 'serbisyo'} sa iyong area.
            </Text>
          </View>
        )}

        {/* View All Button */}
        <TouchableOpacity
          style={[s.viewAllBtn, svc && { backgroundColor: svc.acc }]}
          onPress={() => navigation.navigate('ProviderRequests')}
          activeOpacity={0.85}
        >
          <Text style={s.viewAllTxt}>Tingnan ang Lahat ng Requests →</Text>
        </TouchableOpacity>

        <Text style={s.footer}>© 2025 3PS · Bacuag, Surigao del Norte</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.bg },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  scroll:      { flex: 1 },
  content:     { padding: 20, paddingBottom: 40 },

  topBar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  topLogoRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topLogoBadge: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  topLogoTxt:   { fontSize: 12, fontWeight: '800', color: C.white, letterSpacing: -0.5 },
  topBarTitle:  { fontSize: 15, fontWeight: '700', color: C.text, lineHeight: 20 },
  topBarSub:    { fontSize: 11, color: C.textSub, lineHeight: 16 },
  logoutBtn:    { backgroundColor: '#FEF2F2', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: '#FECACA' },
  logoutTxt:    { color: C.danger, fontSize: 13, fontWeight: '700' },

  greetRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  greetSub:     { fontSize: 13, color: C.textSub, marginBottom: 2 },
  greetName:    { fontSize: 22, fontWeight: '700', color: C.text, marginBottom: 8 },
  locationChip: { alignSelf: 'flex-start', backgroundColor: C.primaryLt, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: C.primaryMd },
  locationTxt:  { fontSize: 12, color: C.primary, fontWeight: '600' },
  avatarRing:   { borderWidth: 2, borderColor: C.primary, borderRadius: 30, padding: 2 },
  avatarFallback:  { backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  avatarInitials:  { fontWeight: '700', color: C.white },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1 },
  statNum:  { fontSize: 22, fontWeight: '800', color: C.text },
  statLbl:  { fontSize: 10, fontWeight: '700', marginTop: 2 },

  sectionLabel: { fontSize: 10, fontWeight: '700', color: C.textHint, letterSpacing: 1, marginBottom: 10, marginTop: 4 },

  reqCard:    { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 12, marginBottom: 10, borderWidth: 1, gap: 10, position: 'relative', overflow: 'hidden' },
  reqDot:     { width: 7, height: 7, borderRadius: 4, position: 'absolute', top: 8, right: 8 },
  reqIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  reqEmoji:   { fontSize: 18 },
  reqTitle:   { fontSize: 13, fontWeight: '700', marginBottom: 1 },
  reqSub:     { fontSize: 11, color: C.textSub },
  reqArrow:   { fontSize: 20, fontWeight: '600', marginLeft: 2 },

  statusChip: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3, alignSelf: 'center' },
  statusTxt:  { fontSize: 10, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48, marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  emptySub:   { fontSize: 13, color: C.textSub, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },

  viewAllBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 12, backgroundColor: C.primary },
  viewAllTxt: { color: C.white, fontSize: 14, fontWeight: '700' },

  footer: { textAlign: 'center', fontSize: 11, color: C.textHint, marginTop: 16 },
})