// 📁 frontend-mobile/3ps-v3/src/screens/HomeScreen.js
// Resident → sees services + ongoing requests
// Provider → sees incoming requests for their service type

import React, { useState, useCallback, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar,
  Alert, Image, ActivityIndicator, RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect } from '@react-navigation/native'
import useNotifications from '../hooks/useNotifications'
import API from '../services/api'

// ── Design Tokens ──────────────────────────────────────────────────
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
  pasabuyBg:  '#EFF6FF',
  pasabuyAcc: '#2563EB',
  pasakayBg:  '#F0FDF4',
  pasakayAcc: '#16A34A',
  parepairBg: '#FFF7ED',
  parepairAcc:'#EA580C',
  danger:     '#EF4444',
  warning:    '#F59E0B',
}

const SERVICES = [
  { key: 'Pasabuy',  label: 'Pasabuy',  desc: 'I-order ang grocery at errands', emoji: '🛒', bg: C.pasabuyBg,  acc: C.pasabuyAcc,  route: 'Pasabuy'  },
  { key: 'Pasakay',  label: 'Pasakay',  desc: 'Mag-book ng local transport',     emoji: '🛵', bg: C.pasakayBg,  acc: C.pasakayAcc,  route: 'Pasakay'  },
  { key: 'PaRepair', label: 'PaRepair', desc: 'Humingi ng repair service',       emoji: '🔧', bg: C.parepairBg, acc: C.parepairAcc, route: 'PaRepair' },
]

const ORDER_ROUTES = [
  { key: 'MyGroceryOrders',  label: 'Grocery Orders',  emoji: '🛒', bg: C.pasabuyBg,  acc: C.pasabuyAcc  },
  { key: 'MyRides',          label: 'Rides',            emoji: '🛵', bg: C.pasakayBg,  acc: C.pasakayAcc  },
  { key: 'MyRepairRequests', label: 'Repair Requests',  emoji: '🔧', bg: C.parepairBg, acc: C.parepairAcc },
]

const STATUS_STYLE = {
  pending:    { bg: '#FEF9C3', color: '#854D0E', label: 'Pending'    },
  accepted:   { bg: '#DBEAFE', color: '#1D4ED8', label: 'Accepted'   },
  on_the_way: { bg: '#F3E8FF', color: '#7E22CE', label: 'On the Way' },
  in_progress:{ bg: '#FEF3C7', color: '#92400E', label: 'In Progress'},
  completed:  { bg: '#DCFCE7', color: '#15803D', label: 'Completed'  },
  cancelled:  { bg: '#FEE2E2', color: '#B91C1C', label: 'Cancelled'  },
}

const SERVICE_TYPES = [
  { type: 'pasabuy',  label: 'Pasabuy',  emoji: '🛒', bg: C.pasabuyBg,  acc: C.pasabuyAcc,  route: 'MyGroceryOrders'  },
  { type: 'pasakay',  label: 'Pasakay',  emoji: '🛵', bg: C.pasakayBg,  acc: C.pasakayAcc,  route: 'MyRides'          },
  { type: 'parepair', label: 'PaRepair', emoji: '🔧', bg: C.parepairBg, acc: C.parepairAcc, route: 'MyRepairRequests' },
]

// ── Provider service config ────────────────────────────────────────
const PROVIDER_SERVICE = {
  pasabuy: {
    label: 'PasaBUY',
    emoji: '🛒',
    bg: C.pasabuyBg,
    acc: C.pasabuyAcc,
    endpoint: '/pasabuy/orders/available/all',
    responseKey: 'orders',
    route: 'ProviderRequests',
  },
  pasakay: {
    label: 'Pasakay',
    emoji: '🛵',
    bg: C.pasakayBg,
    acc: C.pasakayAcc,
    endpoint: '/pasakay/rides/available/all',
    responseKey: 'rides',
    route: 'ProviderRequests',
  },
  parepair: {
    label: 'PaRepair',
    emoji: '🔧',
    bg: C.parepairBg,
    acc: C.parepairAcc,
    endpoint: '/parepair/requests/available/all',
    responseKey: 'requests',
    route: 'ProviderRequests',
  },
}

// ── Helpers ────────────────────────────────────────────────────────
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

// ── Sub-components ─────────────────────────────────────────────────
function Avatar({ uri, name, size = 44 }) {
  const r = size / 2
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: r }} />
  return (
    <View style={[hs.avatarFallback, { width: size, height: size, borderRadius: r }]}>
      <Text style={[hs.avatarInitials, { fontSize: size * 0.36 }]}>{getInitials(name)}</Text>
    </View>
  )
}

function SectionLabel({ title }) {
  return <Text style={hs.sectionLabel}>{title}</Text>
}

function InfoRow({ icon, label, value, capitalize }) {
  return (
    <View style={hs.infoRow}>
      <Text style={hs.rowIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={hs.rowLabel}>{label}</Text>
        <Text style={[hs.rowValue, capitalize && { textTransform: 'capitalize' }]}>{value || '—'}</Text>
      </View>
    </View>
  )
}

function LockedRow({ icon, label, value }) {
  return (
    <View style={hs.infoRow}>
      <Text style={hs.rowIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={hs.rowLabel}>{label}</Text>
        <Text style={hs.rowValue}>{value || '—'}</Text>
      </View>
      <View style={hs.lockedBadge}><Text style={hs.lockedTxt}>🔐 Fixed</Text></View>
    </View>
  )
}

function ActionBtn({ emoji, label, sub, onPress, danger }) {
  return (
    <TouchableOpacity style={hs.actionBtn} onPress={onPress} activeOpacity={0.7}>
      <View style={[hs.actionIconBox, danger && { backgroundColor: '#FEF2F2' }]}>
        <Text style={hs.actionEmoji}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[hs.actionLabel, danger && { color: C.danger }]}>{label}</Text>
        <Text style={hs.actionSub}>{sub}</Text>
      </View>
      <Text style={hs.actionArrow}>›</Text>
    </TouchableOpacity>
  )
}

// ── Resident: Ongoing request cards per service ────────────────────
function ActiveRequestCards({ requests, onPress }) {
  if (!requests || requests.length === 0) return null
  const active = requests.filter(r => !['completed', 'cancelled'].includes(r.status))
  if (active.length === 0) return null
  const visibleTypes = SERVICE_TYPES.filter(t => active.some(r => r.type === t.type))
  if (visibleTypes.length === 0) return null

  return (
    <>
      <SectionLabel title="ONGOING NA REQUESTS" />
      {visibleTypes.map(t => {
        const items  = active.filter(r => r.type === t.type)
        const latest = items[0]
        const st     = STATUS_STYLE[latest.status] || STATUS_STYLE.pending
        return (
          <TouchableOpacity
            key={t.type}
            style={[hs.compactCard, { backgroundColor: t.bg, borderColor: t.acc + '40' }]}
            onPress={() => onPress(t.route)}
            activeOpacity={0.8}
          >
            <View style={[hs.pulseDot, { backgroundColor: t.acc }]} />
            <View style={[hs.compactIconBox, { backgroundColor: t.acc + '15' }]}>
              <Text style={hs.compactEmoji}>{t.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[hs.compactName, { color: t.acc }]}>{t.label}</Text>
              <Text style={hs.compactSub}>
                {items.length > 1 ? `${items.length} ongoing na request` : `Request #${latest.id}`}
              </Text>
            </View>
            <View style={[hs.statusChip, { backgroundColor: st.bg }]}>
              <Text style={[hs.statusChipTxt, { color: st.color }]}>{st.label}</Text>
            </View>
            <Text style={[hs.compactArrow, { color: t.acc }]}>›</Text>
          </TouchableOpacity>
        )
      })}
      <View style={{ height: 6 }} />
    </>
  )
}

// ── Provider: Incoming request card ───────────────────────────────
function ProviderRequestCard({ request, serviceType, onPress }) {
  const svc = PROVIDER_SERVICE[serviceType?.toLowerCase()]
  if (!svc || !request) return null
  const st = STATUS_STYLE[request.status] || STATUS_STYLE.pending

  return (
    <TouchableOpacity
      style={[hs.providerReqCard, { backgroundColor: svc.bg, borderColor: svc.acc + '40' }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[hs.pulseDot, { backgroundColor: svc.acc }]} />
      <View style={[hs.compactIconBox, { backgroundColor: svc.acc + '15' }]}>
        <Text style={hs.compactEmoji}>{svc.emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[hs.compactName, { color: svc.acc }]}>Request #{request.id}</Text>
        <Text style={hs.compactSub} numberOfLines={1}>
          {request.pickup_location || request.delivery_address || request.address || 'Bagong request'}
        </Text>
      </View>
      <View style={[hs.statusChip, { backgroundColor: st.bg }]}>
        <Text style={[hs.statusChipTxt, { color: st.color }]}>{st.label}</Text>
      </View>
      <Text style={[hs.compactArrow, { color: svc.acc }]}>›</Text>
    </TouchableOpacity>
  )
}

// ── HOME TAB (Resident) ────────────────────────────────────────────
function HomeTab({ requests, user, refreshing, onRefresh, navigation, setActiveTab }) {
  return (
    <ScrollView
      style={hs.tabScroll}
      contentContainerStyle={hs.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
    >
      <View style={hs.greetRow}>
        <View style={{ flex: 1 }}>
          <Text style={hs.greetSub}>{getGreeting()},</Text>
          <Text style={hs.greetName}>{getFirstName(user?.full_name)} 👋</Text>
          <View style={hs.locationChip}>
            <Text style={hs.locationTxt}>📍 {user?.barangay ?? 'Barangay'}, Bacuag</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setActiveTab('Profile')} activeOpacity={0.85}>
          <View style={hs.avatarRing}>
            <Avatar uri={user?.profile_image} name={user?.full_name} size={50} />
          </View>
        </TouchableOpacity>
      </View>

      <ActiveRequestCards requests={requests} onPress={(route) => navigation.navigate(route)} />

      <SectionLabel title="MGA SERBISYO" />
      {SERVICES.map(s => (
        <TouchableOpacity
          key={s.key}
          style={[hs.serviceCard, { backgroundColor: s.bg }]}
          onPress={() => navigation.navigate(s.route)}
          activeOpacity={0.8}
        >
          <View style={[hs.svcIconBox, { backgroundColor: C.white }]}>
            <Text style={hs.svcEmoji}>{s.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[hs.svcName, { color: s.acc }]}>{s.label}</Text>
            <Text style={hs.svcDesc}>{s.desc}</Text>
          </View>
          <View style={[hs.svcArrowBox, { backgroundColor: s.acc + '18' }]}>
            <Text style={[hs.svcArrow, { color: s.acc }]}>›</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

// ── PROVIDER HOME TAB ──────────────────────────────────────────────
function ProviderHomeTab({ user, providerRequests, refreshing, onRefresh, navigation, setActiveTab }) {
  const serviceType = user?.service_type?.toLowerCase()
  const svc = PROVIDER_SERVICE[serviceType]

  const pending   = providerRequests.filter(r => r.status === 'pending')
  const ongoing   = providerRequests.filter(r => ['accepted', 'in_progress', 'on_the_way'].includes(r.status))
  const completed = providerRequests.filter(r => r.status === 'completed')

  return (
    <ScrollView
      style={hs.tabScroll}
      contentContainerStyle={hs.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
    >
      {/* Greeting */}
      <View style={hs.greetRow}>
        <View style={{ flex: 1 }}>
          <Text style={hs.greetSub}>{getGreeting()},</Text>
          <Text style={hs.greetName}>{getFirstName(user?.full_name)} 👋</Text>
          <View style={[hs.locationChip, svc && { backgroundColor: svc.acc + '15', borderColor: svc.acc + '40' }]}>
            <Text style={[hs.locationTxt, svc && { color: svc.acc }]}>
              {svc?.emoji} {svc?.label ?? 'Provider'} · Bacuag
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setActiveTab('Profile')} activeOpacity={0.85}>
          <View style={hs.avatarRing}>
            <Avatar uri={user?.profile_image} name={user?.full_name} size={50} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Stats row */}
      <View style={hs.statsRow}>
        <View style={[hs.statCard, { backgroundColor: '#FEF9C3', borderColor: '#FDE68A' }]}>
          <Text style={hs.statNum}>{pending.length}</Text>
          <Text style={[hs.statLbl, { color: '#854D0E' }]}>Pending</Text>
        </View>
        <View style={[hs.statCard, { backgroundColor: '#DBEAFE', borderColor: '#BFDBFE' }]}>
          <Text style={hs.statNum}>{ongoing.length}</Text>
          <Text style={[hs.statLbl, { color: '#1D4ED8' }]}>Ongoing</Text>
        </View>
        <View style={[hs.statCard, { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0' }]}>
          <Text style={hs.statNum}>{completed.length}</Text>
          <Text style={[hs.statLbl, { color: '#15803D' }]}>Completed</Text>
        </View>
      </View>

      {/* Pending requests */}
      {pending.length > 0 && (
        <>
          <SectionLabel title="BAGONG REQUESTS" />
          {pending.map(req => (
            <ProviderRequestCard
              key={req.id}
              request={req}
              serviceType={serviceType}
              onPress={() => navigation.navigate('ProviderRequests', { requestId: req.id, request: req })}
            />
          ))}
        </>
      )}

      {/* Ongoing */}
      {ongoing.length > 0 && (
        <>
          <SectionLabel title="KASALUKUYANG TINATRATAN" />
          {ongoing.map(req => (
            <ProviderRequestCard
              key={req.id}
              request={req}
              serviceType={serviceType}
              onPress={() => navigation.navigate('ProviderRequests', { requestId: req.id, request: req })}
            />
          ))}
        </>
      )}

      {/* Empty state */}
      {pending.length === 0 && ongoing.length === 0 && (
        <View style={hs.emptyState}>
          <Text style={hs.emptyEmoji}>{svc?.emoji ?? '📋'}</Text>
          <Text style={hs.emptyTitle}>Wala pang bagong request</Text>
          <Text style={hs.emptySub}>
            Hihintayin namin ang mga resident na mag-request ng {svc?.label ?? 'serbisyo'} sa iyong area.
          </Text>
        </View>
      )}

      {/* View all button */}
      <TouchableOpacity
        style={[hs.viewAllBtn, svc && { backgroundColor: svc.acc }]}
        onPress={() => navigation.navigate('ProviderRequests')}
        activeOpacity={0.85}
      >
        <Text style={hs.viewAllTxt}>Tingnan ang Lahat ng Requests →</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

// ── ACTIVITY TAB ───────────────────────────────────────────────────
function ActivityTab({ requests, refreshing, onRefresh, navigation }) {
  const ongoing = requests.filter(r => !['completed', 'cancelled'].includes(r.status))
  return (
    <ScrollView
      style={hs.tabScroll}
      contentContainerStyle={hs.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
    >
      {ongoing.length > 0 && (
        <>
          <SectionLabel title="ONGOING" />
          {ongoing.map((r, i) => {
            const st = STATUS_STYLE[r.status] || STATUS_STYLE.pending
            const t  = SERVICE_TYPES.find(s => s.type === r.type)
            return (
              <TouchableOpacity
                key={i}
                style={[hs.ongoingCard, { borderLeftWidth: 3, borderLeftColor: t?.acc || C.primary }]}
                onPress={() => navigation.navigate(t?.route || 'Home')}
                activeOpacity={0.8}
              >
                <Text style={hs.ongoingEmoji}>{t?.emoji || '📋'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[hs.ongoingType, { color: t?.acc || C.text }]}>{t?.label || r.type}</Text>
                  <Text style={hs.ongoingId}>Request #{r.id}</Text>
                </View>
                <View style={[hs.statusChip, { backgroundColor: st.bg }]}>
                  <Text style={[hs.statusChipTxt, { color: st.color }]}>{st.label}</Text>
                </View>
              </TouchableOpacity>
            )
          })}
          <View style={{ height: 8 }} />
        </>
      )}
      <SectionLabel title="LAHAT NG ORDERS" />
      {ORDER_ROUTES.map(o => (
        <TouchableOpacity
          key={o.key}
          style={[hs.serviceCard, { backgroundColor: o.bg }]}
          onPress={() => navigation.navigate(o.key)}
          activeOpacity={0.8}
        >
          <View style={[hs.svcIconBox, { backgroundColor: C.white }]}>
            <Text style={hs.svcEmoji}>{o.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[hs.svcName, { color: o.acc }]}>{o.label}</Text>
            <Text style={hs.svcDesc}>Tingnan ang iyong mga orders</Text>
          </View>
          <View style={[hs.svcArrowBox, { backgroundColor: o.acc + '18' }]}>
            <Text style={[hs.svcArrow, { color: o.acc }]}>›</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

// ── PROFILE TAB ────────────────────────────────────────────────────
function ProfileTab({ user, refreshing, onRefresh, navigation, handleLogout }) {
  return (
    <ScrollView
      style={hs.tabScroll}
      contentContainerStyle={hs.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
    >
      <View style={hs.profileHero}>
        <View style={hs.profileAvatarRing}>
          <Avatar uri={user?.profile_image} name={user?.full_name} size={80} />
        </View>
        <Text style={hs.profileName}>{user?.full_name ?? '—'}</Text>
        <Text style={hs.profileBarangay}>📍 {user?.barangay ?? '—'}, Bacuag</Text>
        <View style={hs.verifiedBadge}>
          <Text style={hs.verifiedTxt}>
            {user?.role === 'provider' ? '🔧 Verified Provider' : '⭐ Verified Resident'}
          </Text>
        </View>
      </View>
      <View style={hs.card}>
        <Text style={hs.cardLabel}>IMPORMASYON</Text>
        <InfoRow   icon="📱" label="Contact Number" value={user?.phone} />
        <InfoRow   icon="🏷️" label="Role"           value={user?.role} capitalize />
        {user?.role === 'provider' && (
          <InfoRow icon="⚙️" label="Service Type" value={user?.service_type} capitalize />
        )}
        <LockedRow icon="👤" label="Buong Pangalan" value={user?.full_name} />
        <LockedRow icon="📍" label="Barangay"       value={user?.barangay}  />
      </View>
      <View style={hs.card}>
        <Text style={hs.cardLabel}>MGA AKSYON</Text>
        <ActionBtn emoji="✏️" label="I-edit ang Profile"  sub="Baguhin ang larawan at contact" onPress={() => navigation.navigate('EditProfile', { user })} />
        <View style={hs.divider} />
        <ActionBtn emoji="🔑" label="Palitan ang Password" sub="Para sa iyong seguridad"        onPress={() => navigation.navigate('ChangePassword')} />
        <View style={hs.divider} />
        <ActionBtn emoji="🚪" label="Mag-logout"           sub="Lumabas sa account"             onPress={handleLogout} danger />
      </View>
      <Text style={hs.footer}>© 2025 3PS · Bacuag, Surigao del Norte</Text>
    </ScrollView>
  )
}

// ══════════════════════════════════════════════════════════════════
export default function HomeScreen({ navigation }) {
  const [user,             setUser]             = useState(null)
  const [activeTab,        setActiveTab]        = useState('Home')
  const [loading,          setLoading]          = useState(true)
  const [refreshing,       setRefreshing]       = useState(false)
  const [requests,         setRequests]         = useState([])
  const [providerRequests, setProviderRequests] = useState([])

  const pollingRef = useRef(null)
  const mountedRef = useRef(true)

  useNotifications(user?.id)

  useFocusEffect(
    useCallback(() => {
      mountedRef.current = true
      loadAll()

      // ── Auto-polling every 10s for provider ──
      pollingRef.current = setInterval(() => {
        if (!mountedRef.current) return
        AsyncStorage.getItem('user')
          .then(raw => {
            if (!raw || !mountedRef.current) return
            const u = JSON.parse(raw)
            if (u?.role === 'provider') {
              fetchProviderRequests(u.service_type?.toLowerCase())
            }
          })
          .catch(() => {})
      }, 10000)

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
  // ── DEBUG ──
  try {
    const rawDebug = await AsyncStorage.getItem('user')
    const stDebug  = await AsyncStorage.getItem('service_type')
    console.log('👤 USER:', rawDebug)
    console.log('⚙️ SERVICE TYPE:', stDebug)
  } catch {}
  // ── END DEBUG ──

  try {
    const raw = await AsyncStorage.getItem('user')
      if (raw) {
        const u = JSON.parse(raw)
        if (mountedRef.current) setUser(u)
        const svcType = u?.service_type?.toLowerCase()
        if (u.role === 'provider') {
          await fetchProviderRequests(svcType)
        } else {
          await fetchResidentRequests()
        }
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

  // ── Resident: fetch their own active orders ────────────────────
  const fetchResidentRequests = async () => {
    try {
      const activeStatuses = ['pending', 'accepted', 'in_progress', 'on_the_way']
      const [a, b, c] = await Promise.allSettled([
        API.get('/pasabuy/orders'),
        API.get('/pasakay/rides'),
        API.get('/parepair/requests'),
      ])
      const combined = []
      if (a.status === 'fulfilled')
        (a.value.data?.orders || [])
          .filter(o => activeStatuses.includes(o.status))
          .forEach(o => combined.push({ ...o, type: 'pasabuy' }))
      if (b.status === 'fulfilled')
        (b.value.data?.rides || [])
          .filter(r => activeStatuses.includes(r.status))
          .forEach(r => combined.push({ ...r, type: 'pasakay' }))
      if (c.status === 'fulfilled')
        (c.value.data?.requests || [])
          .filter(r => activeStatuses.includes(r.status))
          .forEach(r => combined.push({ ...r, type: 'parepair' }))
      if (mountedRef.current) setRequests(combined)
    } catch (e) {
      console.log('fetchResidentRequests error:', e)
    }
  }

  // ── Provider: fetch incoming requests ─────────────────────────
  const fetchProviderRequests = async (serviceType) => {
    if (!serviceType) {
      console.log('❌ fetchProviderRequests: walang serviceType')
      return
    }
    const svc = PROVIDER_SERVICE[serviceType]
    if (!svc) {
      console.log('❌ fetchProviderRequests: hindi nahanap ang svc para sa', serviceType)
      return
    }
    try {
      console.log('📡 Fetching provider requests:', svc.endpoint)
      const res = await API.get(svc.endpoint)
      console.log('📦 Raw response keys:', Object.keys(res.data || {}))

      const data =
        res.data?.[svc.responseKey] ||
        res.data?.orders   ||
        res.data?.rides    ||
        res.data?.requests ||
        res.data?.data     ||
        []

      console.log('✅ Provider requests fetched:', data.length, 'items')
      if (mountedRef.current) {
        setProviderRequests(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      console.log('❌ fetchProviderRequests error:',
        e?.response?.status,
        e?.response?.data,
        e?.message,
        svc.endpoint
      )
      if (mountedRef.current) setProviderRequests([])
    }
  }

  const onRefresh = () => { setRefreshing(true); loadAll() }

  const handleLogout = () =>
    Alert.alert('Mag-logout', 'Sigurado ka bang gusto mong mag-logout?', [
      { text: 'Kanselahin', style: 'cancel' },
      { text: 'Mag-logout', style: 'destructive', onPress: async () => {
        mountedRef.current = false
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
        await AsyncStorage.multiRemove(['token', 'user', 'service_type'])
        navigation.replace('Login')
      }},
    ])

  const isProvider = user?.role === 'provider'

  if (loading) return (
    <View style={hs.loadingWrap}>
      <ActivityIndicator size="large" color={C.primary} />
    </View>
  )

  return (
    <SafeAreaView style={hs.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      {/* Top bar */}
      <View style={hs.topBar}>
        <View style={hs.topLogoRow}>
          <View style={hs.topLogoBadge}>
            <Text style={hs.topLogoTxt}>3PS</Text>
          </View>
          <View>
            <Text style={hs.topBarTitle}>3PS App</Text>
            <Text style={hs.topBarSub}>Bacuag, Surigao del Norte</Text>
          </View>
        </View>
        <TouchableOpacity style={hs.notifBtn} activeOpacity={0.8}>
          <Text style={hs.notifIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, backgroundColor: C.bg }}>
        {activeTab === 'Home' && (
          isProvider ? (
            <ProviderHomeTab
              user={user}
              providerRequests={providerRequests}
              refreshing={refreshing}
              onRefresh={onRefresh}
              navigation={navigation}
              setActiveTab={setActiveTab}
            />
          ) : (
            <HomeTab
              requests={requests}
              user={user}
              refreshing={refreshing}
              onRefresh={onRefresh}
              navigation={navigation}
              setActiveTab={setActiveTab}
            />
          )
        )}
        {activeTab === 'Activity' && (
          <ActivityTab
            requests={isProvider ? providerRequests : requests}
            refreshing={refreshing}
            onRefresh={onRefresh}
            navigation={navigation}
          />
        )}
        {activeTab === 'Profile' && (
          <ProfileTab
            user={user}
            refreshing={refreshing}
            onRefresh={onRefresh}
            navigation={navigation}
            handleLogout={handleLogout}
          />
        )}
      </View>

      {/* Bottom nav */}
      <View style={hs.bottomNav}>
        {[
          { key: 'Home',     emoji: isProvider ? '📋' : '🏠', label: 'Home'     },
          { key: 'Activity', emoji: '📊',                      label: 'Activity' },
          { key: 'Profile',  emoji: '👤',                      label: 'Profile'  },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={hs.navTab}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <View style={[hs.navIconWrap, activeTab === tab.key && hs.navIconActive]}>
              <Text style={hs.navEmoji}>{tab.emoji}</Text>
            </View>
            <Text style={[hs.navLabel, activeTab === tab.key && hs.navLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  )
}

// ── Styles ─────────────────────────────────────────────────────────
const hs = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.bg },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },

  topBar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  topLogoRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topLogoBadge: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  topLogoTxt:   { fontSize: 12, fontWeight: '800', color: C.white, letterSpacing: -0.5 },
  topBarTitle:  { fontSize: 15, fontWeight: '700', color: C.text, lineHeight: 20 },
  topBarSub:    { fontSize: 11, color: C.textSub, lineHeight: 16 },
  notifBtn:     { width: 38, height: 38, borderRadius: 19, backgroundColor: C.primaryLt, alignItems: 'center', justifyContent: 'center' },
  notifIcon:    { fontSize: 17 },

  tabScroll:  { flex: 1 },
  tabContent: { padding: 20, paddingBottom: 36 },

  greetRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  greetSub:     { fontSize: 13, color: C.textSub, marginBottom: 2 },
  greetName:    { fontSize: 22, fontWeight: '700', color: C.text, marginBottom: 8 },
  locationChip: { alignSelf: 'flex-start', backgroundColor: C.primaryLt, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: C.primaryMd },
  locationTxt:  { fontSize: 12, color: C.primary, fontWeight: '600' },
  avatarRing:   { borderWidth: 2, borderColor: C.primary, borderRadius: 30, padding: 2 },
  avatarFallback: { backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontWeight: '700', color: C.white },

  sectionLabel: { fontSize: 10, fontWeight: '700', color: C.textHint, letterSpacing: 1, marginBottom: 10 },

  // Provider stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1 },
  statNum:  { fontSize: 22, fontWeight: '800', color: C.text },
  statLbl:  { fontSize: 10, fontWeight: '700', marginTop: 2 },

  // Provider request card
  providerReqCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 12, marginBottom: 10, borderWidth: 1, gap: 10, position: 'relative', overflow: 'hidden' },

  // Compact cards
  compactCard:    { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 8, borderWidth: 1, gap: 10, position: 'relative', overflow: 'hidden' },
  pulseDot:       { width: 7, height: 7, borderRadius: 4, position: 'absolute', top: 8, right: 8 },
  compactIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  compactEmoji:   { fontSize: 18 },
  compactName:    { fontSize: 13, fontWeight: '700', marginBottom: 1 },
  compactSub:     { fontSize: 11, color: C.textSub },
  compactArrow:   { fontSize: 20, fontWeight: '600', marginLeft: 2 },

  statusChip:    { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3, alignSelf: 'center' },
  statusChipTxt: { fontSize: 10, fontWeight: '700' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48, marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  emptySub:   { fontSize: 13, color: C.textSub, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },

  // View all button
  viewAllBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 12, backgroundColor: C.primary },
  viewAllTxt: { color: C.white, fontSize: 14, fontWeight: '700' },

  // Service cards
  serviceCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 16, marginBottom: 12, gap: 14, borderWidth: 1, borderColor: C.border },
  svcIconBox:  { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  svcEmoji:    { fontSize: 24 },
  svcName:     { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  svcDesc:     { fontSize: 12, color: C.textSub },
  svcArrowBox: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  svcArrow:    { fontSize: 20, fontWeight: '700' },

  // Activity tab
  ongoingCard:  { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 14, padding: 14, marginBottom: 10, gap: 12, borderWidth: 1, borderColor: C.border },
  ongoingEmoji: { fontSize: 22 },
  ongoingType:  { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  ongoingId:    { fontSize: 12, color: C.textSub },

  // Profile
  profileHero:       { alignItems: 'center', backgroundColor: C.white, borderRadius: 20, padding: 28, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  profileAvatarRing: { borderWidth: 3, borderColor: C.primary, borderRadius: 50, padding: 3, marginBottom: 14 },
  profileName:       { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 4 },
  profileBarangay:   { fontSize: 13, color: C.textSub, marginBottom: 12 },
  verifiedBadge:     { backgroundColor: C.primaryLt, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, borderWidth: 1, borderColor: C.primaryMd },
  verifiedTxt:       { fontSize: 12, color: C.primary, fontWeight: '700' },

  card:         { backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.border, marginBottom: 14, overflow: 'hidden' },
  cardLabel:    { fontSize: 10, fontWeight: '700', color: C.textHint, letterSpacing: 0.8, padding: 16, paddingBottom: 8 },
  infoRow:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', gap: 12 },
  rowIcon:      { fontSize: 16, width: 24 },
  rowLabel:     { fontSize: 11, color: C.textHint, fontWeight: '500', marginBottom: 2 },
  rowValue:     { fontSize: 14, color: C.text, fontWeight: '600' },
  lockedBadge:  { backgroundColor: '#FEF3C7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  lockedTxt:    { fontSize: 10, color: C.warning, fontWeight: '600' },
  actionBtn:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  actionIconBox:{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  actionEmoji:  { fontSize: 18 },
  actionLabel:  { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 2 },
  actionSub:    { fontSize: 11, color: C.textHint },
  actionArrow:  { fontSize: 20, color: C.border },
  divider:      { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 16 },

  // Bottom nav
  bottomNav:     { flexDirection: 'row', backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 8, paddingBottom: 8 },
  navTab:        { flex: 1, alignItems: 'center', gap: 4 },
  navIconWrap:   { width: 48, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  navIconActive: { backgroundColor: C.primaryLt },
  navEmoji:      { fontSize: 20 },
  navLabel:      { fontSize: 11, color: C.textHint, fontWeight: '500' },
  navLabelActive:{ color: C.primary, fontWeight: '700' },
  footer:        { textAlign: 'center', fontSize: 11, color: C.textHint, marginTop: 8 },
})




















