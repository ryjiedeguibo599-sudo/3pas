// 📁 src/provider/ProviderHomeScreen.js
// ✅ Premium UI — same design system as resident HomeScreen
// ✅ Profile tab — same look as resident profile (Image 4)
// ✅ Logout nasa Profile tab na lang
// ✅ Bottom nav: Home | Bookings | Profile

import React, { useState, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Platform, Image,
  Switch, ActivityIndicator, Alert, RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect } from '@react-navigation/native'
import API from '../../services/api'

// ── Design Tokens ─────────────────────────────────────────────
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
  dangerLt:   '#FEF2F2',
  warning:    '#F59E0B',
  green:      '#16A34A',
  greenLt:    '#DCFCE7',
}

// ── Service config ────────────────────────────────────────────
const SERVICE_CONFIG = {
  pasabuy: {
    emoji: '🛒', name: 'PasaBUY Orders',
    desc: 'Tingnan at i-manage ang grocery orders',
    accentBg: '#EFF6FF', accentBorder: '#B5D4F4',
    accentColor: '#2563EB',
    endpoint: '/pasabuy/orders/provider/all',
    dataKey: 'orders',
  },
  pasakay: {
    emoji: '🛵', name: 'Pasakay Bookings',
    desc: 'Tingnan at i-manage ang ride bookings',
    accentBg: '#E1F5EE', accentBorder: '#9FE1CB',
    accentColor: '#1D9E75',
    endpoint: '/pasakay/rides/provider/all',
    dataKey: 'rides',
  },
  parepair: {
    emoji: '🔧', name: 'PaRepair Requests',
    desc: 'Tingnan at i-manage ang repair requests',
    accentBg: '#FFF7ED', accentBorder: '#FAC775',
    accentColor: '#EA580C',
    endpoint: '/parepair/requests/provider/all',
    dataKey: 'requests',
  },
}

const STATUS_STYLE = {
  pending:    { bg: '#FEF9C3', color: '#854D0E', label: 'Pending'     },
  accepted:   { bg: '#DBEAFE', color: '#1D4ED8', label: 'Accepted'    },
  on_the_way: { bg: '#F3E8FF', color: '#7E22CE', label: 'On the Way'  },
  in_progress:{ bg: '#FEF3C7', color: '#92400E', label: 'In Progress' },
  completed:  { bg: '#DCFCE7', color: '#15803D', label: 'Completed'   },
  cancelled:  { bg: '#FEE2E2', color: '#B91C1C', label: 'Cancelled'   },
}

// ── Helpers ───────────────────────────────────────────────────
const getInitials = (name) => {
  if (!name) return 'P'
  return name.trim().split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}
const getFirstName = (name) => name?.trim().split(' ')[0] ?? 'Provider'
const getGreeting  = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Magandang umaga'
  if (h < 18) return 'Magandang hapon'
  return 'Magandang gabi'
}

// ── Sub-components ────────────────────────────────────────────
function Avatar({ uri, name, size = 44 }) {
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
  return (
    <View style={[ps.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[ps.avatarInitials, { fontSize: size * 0.36 }]}>{getInitials(name)}</Text>
    </View>
  )
}

function SectionLabel({ title }) {
  return <Text style={ps.sectionLabel}>{title}</Text>
}

function StatCard({ icon, value, label, sub, faded }) {
  return (
    <View style={[ps.statCard, faded && { opacity: 0.45 }]}>
      <Text style={ps.statIcon}>{icon}</Text>
      <Text style={ps.statValue}>{value}</Text>
      <Text style={ps.statLabel}>{label}</Text>
      {!!sub && <Text style={ps.statSub}>{sub}</Text>}
    </View>
  )
}

function RequestCard({ request, svc, onPress }) {
  const st = STATUS_STYLE[request.status] || STATUS_STYLE.pending
  const location =
    request.pickup_location  ||
    request.delivery_address ||
    request.address          ||
    'Bagong request'
  return (
    <TouchableOpacity
      style={[ps.reqCard, { backgroundColor: svc.accentBg, borderColor: svc.accentColor + '40' }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[ps.pulseDot, { backgroundColor: svc.accentColor }]} />
      <View style={[ps.reqIconBox, { backgroundColor: svc.accentColor + '18' }]}>
        <Text style={ps.reqEmoji}>{svc.emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[ps.reqTitle, { color: svc.accentColor }]}>Request #{request.id}</Text>
        <Text style={ps.reqLocation} numberOfLines={1}>{location}</Text>
      </View>
      <View style={[ps.statusChip, { backgroundColor: st.bg }]}>
        <Text style={[ps.statusChipTxt, { color: st.color }]}>{st.label}</Text>
      </View>
      <Text style={[ps.reqArrow, { color: svc.accentColor }]}>›</Text>
    </TouchableOpacity>
  )
}

function InfoRow({ icon, label, value, capitalize }) {
  return (
    <View style={ps.infoRow}>
      <Text style={ps.rowIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={ps.rowLabel}>{label}</Text>
        <Text style={[ps.rowValue, capitalize && { textTransform: 'capitalize' }]}>{value || '—'}</Text>
      </View>
    </View>
  )
}

function LockedRow({ icon, label, value }) {
  return (
    <View style={ps.infoRow}>
      <Text style={ps.rowIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={ps.rowLabel}>{label}</Text>
        <Text style={ps.rowValue}>{value || '—'}</Text>
      </View>
      <View style={ps.lockedBadge}>
        <Text style={ps.lockedTxt}>🔐 Fixed</Text>
      </View>
    </View>
  )
}

function ActionBtn({ emoji, label, sub, onPress, danger }) {
  return (
    <TouchableOpacity style={ps.actionBtn} onPress={onPress} activeOpacity={0.7}>
      <View style={[ps.actionIconBox, danger && { backgroundColor: C.dangerLt }]}>
        <Text style={ps.actionEmoji}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[ps.actionLabel, danger && { color: C.danger }]}>{label}</Text>
        <Text style={ps.actionSub}>{sub}</Text>
      </View>
      <Text style={ps.actionArrow}>›</Text>
    </TouchableOpacity>
  )
}

// ══════════════════════════════════════════════════════════════
export default function ProviderHomeScreen({ navigation, route }) {
  const [user,           setUser]           = useState(null)
  const [serviceType,    setServiceType]    = useState(null)
  const [isOnline,       setIsOnline]       = useState(false)
  const [togglingOnline, setTogglingOnline] = useState(false)
  const [allRequests,    setAllRequests]    = useState([])
  const [loading,        setLoading]        = useState(true)
  const [refreshing,     setRefreshing]     = useState(false)
  const [activeTab, setActiveTab] = useState('Home')

  useFocusEffect(
  useCallback(() => {
    loadAll()
    if (route.params?.tab) {  
      setActiveTab(route.params.tab)
    }
  }, [route.params?.tab])
)

  const loadAll = async () => {
    try {
      const userData   = await AsyncStorage.getItem('user')
      const onlineData = await AsyncStorage.getItem('provider_online')
      if (userData) {
        const u = JSON.parse(userData)
        setUser(u)
        const svcType = (u.service_type || '').toLowerCase()
        setServiceType(svcType)
        setIsOnline(onlineData === 'true')
        await fetchRequests(svcType)
      }
    } catch (e) {
      console.log('loadAll error:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchRequests = async (type) => {
    const svc = SERVICE_CONFIG[type]
    if (!svc) return
    try {
      const res  = await API.get(svc.endpoint)
      const data = res.data?.[svc.dataKey] || res.data?.orders || res.data?.rides || res.data?.requests || []
      setAllRequests(Array.isArray(data) ? data : [])
    } catch (e) {
      console.log('fetchRequests error:', e?.message)
      setAllRequests([])
    }
  }

  const onRefresh = () => { setRefreshing(true); loadAll() }

  const handleToggleOnline = async (value) => {
    setIsOnline(value)
    await AsyncStorage.setItem('provider_online', String(value))
    setTogglingOnline(true)
    try { await API.patch('/provider/status', { online: value }) }
    catch { console.log('provider/status — saved locally') }
    finally { setTogglingOnline(false) }
  }

  const handleLogout = () =>
    Alert.alert('Mag-logout?', 'Sigurado ka bang gusto mong mag-logout?', [
      { text: 'Hindi', style: 'cancel' },
      { text: 'Oo, Logout', style: 'destructive', onPress: async () => {
        await AsyncStorage.multiRemove(['token', 'user', 'service_type', 'provider_online'])
        navigation.replace('Login')
      }},
    ])

  const svc       = SERVICE_CONFIG[serviceType] || null
  const pending   = allRequests.filter(r => r.status === 'pending')
  const ongoing   = allRequests.filter(r => ['accepted', 'in_progress', 'on_the_way'].includes(r.status))
  const completed = allRequests.filter(r => r.status === 'completed')

  // ── HOME TAB ───────────────────────────────────────────────
  const HomeTab = () => (
    <ScrollView
      style={ps.tabScroll}
      contentContainerStyle={ps.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
    >
      {/* Greeting */}
      <View style={ps.greetRow}>
        <View style={{ flex: 1 }}>
          <Text style={ps.greetSub}>{getGreeting()},</Text>
          <Text style={ps.greetName}>{getFirstName(user?.full_name)} 👋</Text>
          <View style={[ps.locationChip, svc && { backgroundColor: svc.accentColor + '15', borderColor: svc.accentColor + '40' }]}>
            <Text style={[ps.locationTxt, svc && { color: svc.accentColor }]}>
              {svc?.emoji} {svc?.name ?? 'Provider'} · Bacuag
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setActiveTab('Profile')} activeOpacity={0.85}>
          <View style={ps.avatarRing}>
            <Avatar uri={user?.profile_image} name={user?.full_name} size={50} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Online toggle */}
      <View style={[ps.toggleCard, isOnline ? ps.toggleOnline : ps.toggleOffline]}>
        <View style={ps.toggleLeft}>
          <View style={[ps.toggleDot, { backgroundColor: isOnline ? C.green : C.textHint }]} />
          <View style={{ flex: 1 }}>
            <Text style={[ps.toggleLabel, { color: isOnline ? C.green : C.textSub }]}>
              {isOnline ? 'Online / Available' : 'Offline / Not Available'}
            </Text>
            <Text style={ps.toggleDesc}>
              {isOnline ? 'Ikaw ay visible para makatanggap ng bookings.' : 'Hindi ka makakatanggap ng bookings.'}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {togglingOnline && <ActivityIndicator size="small" color={C.green} style={{ marginRight: 8 }} />}
          <Switch
            value={isOnline}
            onValueChange={handleToggleOnline}
            trackColor={{ false: C.border, true: C.green }}
            thumbColor={C.white}
          />
        </View>
      </View>

      {/* Stats */}
      <SectionLabel title="QUICK OVERVIEW" />
      <View style={ps.statsRow}>
        <StatCard icon="📋" value={String(pending.length)}   label="Pending Bookings"  sub={pending.length > 0 ? 'Needs your action' : '—'} faded={!isOnline} />
        <StatCard icon="✅" value={String(completed.length)} label="Completed Today"    sub="Keep it up!" />
        <StatCard icon="💰" value="₱0"                       label="Earnings Today"     sub="—" />
      </View>

      {/* Ongoing */}
      {isOnline && ongoing.length > 0 && svc && (
        <>
          <SectionLabel title="KASALUKUYANG TINATRATAN" />
          {ongoing.map(req => (
            <RequestCard key={req.id} request={req} svc={svc}
              onPress={() => navigation.navigate('ProviderRequests', { type: serviceType })} />
          ))}
        </>
      )}

      {/* Pending */}
      {isOnline && pending.length > 0 && svc && (
        <>
          <SectionLabel title="BAGONG REQUESTS" />
          {pending.slice(0, 3).map(req => (
            <RequestCard key={req.id} request={req} svc={svc}
              onPress={() => navigation.navigate('ProviderRequests', { type: serviceType })} />
          ))}
          {pending.length > 3 && (
            <TouchableOpacity
              style={[ps.viewMoreBtn, { borderColor: svc.accentColor }]}
              onPress={() => navigation.navigate('ProviderRequests', { type: serviceType })}
            >
              <Text style={[ps.viewMoreTxt, { color: svc.accentColor }]}>
                +{pending.length - 3} pa — Tingnan lahat →
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Service card */}
      <SectionLabel title="IYONG SERBISYO" />
      {svc ? (
        <TouchableOpacity
          style={[ps.serviceCard, { backgroundColor: svc.accentBg, borderColor: svc.accentBorder }]}
          onPress={() => navigation.navigate('ProviderRequests', { type: serviceType })}
          activeOpacity={0.8}
        >
          <View style={[ps.svcIconBox, { backgroundColor: C.white }]}>
            <Text style={ps.svcEmoji}>{svc.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[ps.svcName, { color: svc.accentColor }]}>{svc.name}</Text>
            <Text style={ps.svcDesc}>{svc.desc}</Text>
            <Text style={[ps.svcMeta, { color: svc.accentColor }]}>
              {pending.length} pending · {completed.length} completed
            </Text>
          </View>
          <View style={[ps.svcArrowBox, { backgroundColor: svc.accentColor + '18' }]}>
            <Text style={[ps.svcArrow, { color: svc.accentColor }]}>›</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={ps.emptyCard}>
          <ActivityIndicator size="small" color={C.primary} />
        </View>
      )}

      {/* Empty state */}
      {pending.length === 0 && ongoing.length === 0 && (
        <View style={ps.emptyCard}>
          {!isOnline ? (
            <>
              <Text style={ps.emptyEmoji}>⏸️</Text>
              <Text style={ps.emptyTitle}>Offline ka ngayon</Text>
              <Text style={ps.emptySub}>I-on ang toggle para makatanggap ng bagong requests.</Text>
              <TouchableOpacity style={ps.goOnlineBtn} onPress={() => handleToggleOnline(true)}>
                <Text style={ps.goOnlineTxt}>Mag-online para makatanggap</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={ps.emptyEmoji}>📭</Text>
              <Text style={ps.emptyTitle}>Wala pang bagong request</Text>
              <Text style={ps.emptySub}>Hihintayin ang mga resident na mag-request.</Text>
            </>
          )}
        </View>
      )}
    </ScrollView>
  )

  // ── PROFILE TAB — same as resident ────────────────────────
  const ProfileTab = () => (
    <ScrollView
      style={ps.tabScroll}
      contentContainerStyle={ps.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
    >
      {/* Hero */}
      <View style={ps.profileHero}>
        <View style={ps.profileAvatarRing}>
          <Avatar uri={user?.profile_image} name={user?.full_name} size={80} />
        </View>
        <Text style={ps.profileName}>{user?.full_name ?? '—'}</Text>
        <Text style={ps.profileBarangay}>📍 {user?.barangay ?? '—'}, Bacuag</Text>
        <View style={ps.verifiedBadge}>
          <Text style={ps.verifiedTxt}>🔧 Verified Provider</Text>
        </View>
      </View>

      {/* Info card */}
      <View style={ps.card}>
        <Text style={ps.cardLabel}>IMPORMASYON</Text>
        <InfoRow   icon="📱" label="Contact Number" value={user?.phone} />
        <InfoRow   icon="🏷️" label="Role"           value={user?.role}         capitalize />
        <InfoRow   icon="⚙️" label="Service Type"   value={user?.service_type} capitalize />
        <LockedRow icon="👤" label="Buong Pangalan"  value={user?.full_name} />
        <LockedRow icon="📍" label="Barangay"        value={user?.barangay}  />
      </View>

      {/* Actions card */}
      <View style={ps.card}>
        <Text style={ps.cardLabel}>MGA AKSYON</Text>
        <ActionBtn
          emoji="✏️" label="I-edit ang Profile"
          sub="Baguhin ang larawan at contact"
          onPress={() => navigation.navigate('EditProfile', { user })}
        />
        <View style={ps.divider} />
        <ActionBtn
          emoji="🔑" label="Palitan ang Password"
          sub="Para sa iyong seguridad"
          onPress={() => navigation.navigate('ChangePassword')}
        />
        <View style={ps.divider} />
        <ActionBtn
          emoji="🚪" label="Mag-logout"
          sub="Lumabas sa account"
          onPress={handleLogout}
          danger
        />
      </View>

      <Text style={ps.footer}>© 2025 3PS · Bacuag, Surigao del Norte</Text>
    </ScrollView>
  )

  if (loading) {
    return (
      <View style={ps.loadingWrap}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    )
  }

  return (
    <SafeAreaView style={ps.safe}>

      {/* ── Top Bar ── */}
      <View style={ps.topBar}>
        <View style={ps.topLogoRow}>
          <View style={ps.topLogoBadge}>
            <Text style={ps.topLogoTxt}>3PS</Text>
          </View>
          <View>
            <Text style={ps.topBarTitle}>3PS App</Text>
            <Text style={ps.topBarSub}>Bacuag, Surigao del Norte</Text>
          </View>
        </View>
        <TouchableOpacity style={ps.notifBtn} activeOpacity={0.8}>
          <Text style={ps.notifIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      {/* ── Content ── */}
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        {activeTab === 'Home'     && <HomeTab />}
        {activeTab === 'Profile'  && <ProfileTab />}
      </View>

      {/* ── Bottom Nav ── */}
      <View style={ps.bottomNav}>
        {[
          { key: 'Home',     emoji: '🏠', label: 'Home'     },
          { key: 'Bookings', emoji: '📋', label: 'Bookings' },
          { key: 'Profile',  emoji: '👤', label: 'Profile'  },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={ps.navTab}
            // Sa bottom nav onPress ng Bookings, baguhin ito:
          onPress={() => {
            if (tab.key === 'Bookings') {
              if (!serviceType) {
                Alert.alert('Loading...', 'Sandali lang, nilo-load pa ang iyong service type.')
                return
              }
              navigation.navigate('ProviderRequests', { type: serviceType })
            } else {
              setActiveTab(tab.key)
            }
          }}
            activeOpacity={0.7}
          >
            <View style={[ps.navIconWrap, activeTab === tab.key && ps.navIconActive]}>
              <Text style={ps.navEmoji}>{tab.emoji}</Text>
            </View>
            <Text style={[ps.navLabel, activeTab === tab.key && ps.navLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

    </SafeAreaView>
  )
}

// ── Styles ────────────────────────────────────────────────────
const ps = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.bg },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },

  // Top bar
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

  // Greeting
  greetRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  greetSub:     { fontSize: 13, color: C.textSub, marginBottom: 2 },
  greetName:    { fontSize: 22, fontWeight: '700', color: C.text, marginBottom: 8 },
  locationChip: { alignSelf: 'flex-start', backgroundColor: C.primaryLt, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: C.primaryMd },
  locationTxt:  { fontSize: 12, color: C.primary, fontWeight: '600' },
  avatarRing:   { borderWidth: 2, borderColor: C.primary, borderRadius: 30, padding: 2 },
  avatarFallback: { backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontWeight: '700', color: C.white },

  // Online toggle
  toggleCard:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1 },
  toggleOnline:  { backgroundColor: '#E1F5EE', borderColor: '#9FE1CB' },
  toggleOffline: { backgroundColor: '#F5F4F0', borderColor: C.border },
  toggleLeft:    { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  toggleDot:     { width: 10, height: 10, borderRadius: 5 },
  toggleLabel:   { fontSize: 13, fontWeight: '700' },
  toggleDesc:    { fontSize: 11, color: C.textSub, marginTop: 2 },

  sectionLabel: { fontSize: 10, fontWeight: '700', color: C.textHint, letterSpacing: 1, marginBottom: 10 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  statCard: { flex: 1, backgroundColor: C.white, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  statIcon:  { fontSize: 16, marginBottom: 5 },
  statValue: { fontSize: 20, fontWeight: '700', color: C.text, lineHeight: 22 },
  statLabel: { fontSize: 9, color: C.textHint, textAlign: 'center', marginTop: 4, lineHeight: 13 },
  statSub:   { fontSize: 9, color: C.textHint, marginTop: 2 },

  // Request cards
  reqCard:      { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 12, marginBottom: 8, borderWidth: 1, gap: 10, position: 'relative', overflow: 'hidden' },
  pulseDot:     { width: 7, height: 7, borderRadius: 4, position: 'absolute', top: 8, right: 8 },
  reqIconBox:   { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  reqEmoji:     { fontSize: 18 },
  reqTitle:     { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  reqLocation:  { fontSize: 11, color: C.textSub },
  reqArrow:     { fontSize: 20, fontWeight: '600' },
  statusChip:   { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  statusChipTxt:{ fontSize: 10, fontWeight: '700' },

  // View more
  viewMoreBtn: { borderRadius: 10, borderWidth: 1.5, paddingVertical: 10, alignItems: 'center', marginBottom: 4 },
  viewMoreTxt: { fontSize: 13, fontWeight: '700' },

  // Service card
  serviceCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 16, marginBottom: 12, gap: 14, borderWidth: 1, borderColor: C.border },
  svcIconBox:  { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  svcEmoji:    { fontSize: 24 },
  svcName:     { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  svcDesc:     { fontSize: 12, color: C.textSub },
  svcMeta:     { fontSize: 11, fontWeight: '600', marginTop: 3 },
  svcArrowBox: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  svcArrow:    { fontSize: 20, fontWeight: '700' },

  // Empty
  emptyCard:  { backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 28, alignItems: 'center', marginTop: 8 },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: C.textSub },
  emptySub:   { fontSize: 12, color: C.textHint, marginTop: 6, textAlign: 'center', lineHeight: 18 },
  goOnlineBtn:{ marginTop: 14, backgroundColor: C.bg, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 9, borderWidth: 1, borderColor: C.border },
  goOnlineTxt:{ fontSize: 13, fontWeight: '700', color: C.textSub },

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

  footer: { textAlign: 'center', fontSize: 11, color: C.textHint, marginTop: 8 },
})