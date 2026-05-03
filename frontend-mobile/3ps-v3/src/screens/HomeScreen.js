import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, Alert, Image,
  ActivityIndicator, RefreshControl, Animated, Easing, FlatList
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as SecureStore from 'expo-secure-store'
import { useFocusEffect } from '@react-navigation/native'
import useNotifications from '../hooks/useNotifications'
import API from '../services/api'
import ConfirmationModal from '../components/ConfirmationModal'
import AnimatedCard from '../components/AnimatedCard'
import { Animated as RNAnimated } from 'react-native'

function FadeInUp({ children, delay = 0, duration = 400 }) {
  const opacity = useRef(new RNAnimated.Value(0)).current
  const translateY = useRef(new RNAnimated.Value(20)).current

  useFocusEffect(
    useCallback(() => {
      opacity.setValue(0)
      translateY.setValue(20)
      RNAnimated.parallel([
        RNAnimated.timing(opacity, { toValue: 1, duration, delay, useNativeDriver: true }),
        RNAnimated.spring(translateY, { toValue: 0, speed: 12, bounciness: 5, delay, useNativeDriver: true })
      ]).start()
    }, [delay, duration])
  )

  return (
    <RNAnimated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </RNAnimated.View>
  )
}

const C = {
  primary:   '#F08A24',
  primaryLt: '#FFF1E2',
  primaryMd: '#F1DBC6',
  bg:        '#FFF8F0',
  white:     '#FFFFFF',
  text:      '#2C1A0E',
  textSub:   '#7B5A44',
  textHint:  '#AF8A71',
  border:    '#F1DBC6',
  danger:    '#D14343',
  green:     '#0E9F6E',
  orange:    '#E06B12',
  purple:    '#8E5A2B',
}

const SERVICES = [
  { key: 'Pasabuy', label: 'Pasabuy', sub: 'Grocery & errands', emoji: '🛒', acc: C.orange, bg: '#FFF2E7', route: 'Pasabuy' },
  { key: 'Pasakay', label: 'Pasakay', sub: 'Local transport',   emoji: '🛵', acc: C.green,  bg: '#E8FBF3', route: 'Pasakay' },
  { key: 'Padala',  label: 'Padala',  sub: 'Send a package',    emoji: '📦', acc: C.purple, bg: '#F7ECDD', route: 'Padala'  },
]

const MY_ORDERS = [
  { key: 'MyGroceryOrders',    label: 'Grocery',  emoji: '🛒', acc: C.orange, bg: '#FFF2E7' },
  { key: 'MyRides',            label: 'Rides',    emoji: '🛵', acc: C.green,  bg: '#E8FBF3' },
  { key: 'MyDeliveryRequests', label: 'Delivery', emoji: '📦', acc: C.purple, bg: '#F7ECDD' },
]

const PROVIDER_SERVICE = {
  pasabuy:  { label: 'Pasabuy', emoji: '🛒', acc: C.orange, bg: '#FFF2E7', endpoint: '/pasabuy/orders/provider/all',     responseKey: 'orders'   },
  pasakay:  { label: 'Pasakay', emoji: '🛵', acc: C.green,  bg: '#E8FBF3', endpoint: '/pasakay/rides/available/all',     responseKey: 'rides'    },
  parepair: { label: 'Padala',  emoji: '📦', acc: C.purple, bg: '#F7ECDD', endpoint: '/parepair/requests/provider/all',  responseKey: 'requests' },
}

const STATUS_STYLE = {
  pending:     { bg: '#FEF9C3', color: '#854D0E', label: 'Pending'     },
  accepted:    { bg: C.primaryLt, color: C.primary, label: 'Accepted'    },
  in_progress: { bg: '#FEF3C7', color: '#92400E', label: 'In Progress' },
  on_the_way:  { bg: C.primaryLt, color: C.primary, label: 'On the Way'  },
  completed:   { bg: '#DCFCE7', color: '#15803D', label: 'Completed'   },
  cancelled:   { bg: '#FEE2E2', color: '#B91C1C', label: 'Cancelled'   },
}

const getInitials = (name) => {
  if (!name) return '?'
  const p = name.trim().split(' ')
  return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : p[0][0].toUpperCase()
}
const getGreeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}
const getFirstName = (name) => name?.trim().split(' ')[0] ?? 'User'

function Avatar({ uri, name, size = 40 }) {
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
  return (
    <View style={[s.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[s.avatarInitials, { fontSize: size * 0.36 }]}>{getInitials(name)}</Text>
    </View>
  )
}

// ── HOME TAB ────────────────────────────────────────────────────────
function HomeTab({ user, pendingCounts, refreshing, onRefresh, navigation, setActiveTab }) {
  const totalPending = Object.values(pendingCounts).reduce((a, b) => a + b, 0)

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={s.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
    >
      {/* Greeting */}
      <FadeInUp delay={0}>
        <View style={s.greeting}>
          <TouchableOpacity onPress={() => setActiveTab('Profile')} activeOpacity={0.8}>
            <View style={s.avatarRing}>
              <Avatar uri={user?.profile_image} name={user?.full_name} size={44} />
            </View>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.greetSub}>{getGreeting()}</Text>
            <Text style={s.greetName}>{getFirstName(user?.full_name)} 👋</Text>
          </View>
          <View style={s.locationBadge}>
            <Text style={s.locationText}>📍 {user?.barangay || 'Bacuag'}</Text>
          </View>
        </View>
      </FadeInUp>

      {/* Quick actions */}
      <FadeInUp delay={100}>
        <View style={s.quickActionsRow}>
          <AnimatedCard style={s.quickActionBtn} onPress={() => setActiveTab('Activity')}>
            <Text style={s.quickActionEmoji}>🧾</Text>
            <Text style={s.quickActionTxt}>Track Orders</Text>
          </AnimatedCard>
          <AnimatedCard style={s.quickActionBtn} onPress={() => setActiveTab('Profile')}>
            <Text style={s.quickActionEmoji}>👤</Text>
            <Text style={s.quickActionTxt}>My Profile</Text>
          </AnimatedCard>
        </View>
      </FadeInUp>

      {/* Pending banner */}
      {totalPending > 0 && (
        <FadeInUp delay={150}>
          <View style={s.pendingBanner}>
            <Text style={s.pendingBannerDot}>●</Text>
            <Text style={s.pendingBannerText}>
              You have <Text style={{ fontWeight: '800' }}>{totalPending} pending</Text> {totalPending === 1 ? 'request' : 'requests'}
            </Text>
          </View>
        </FadeInUp>
      )}

      <FadeInUp delay={200}>
        <Text style={s.sectionLabel}>SERVICES</Text>
        {/* Services */}
        <View style={s.servicesRow}>
        {SERVICES.map(svc => (
          <AnimatedCard
            key={svc.key}
            style={[s.serviceCard, { backgroundColor: svc.bg }]}
            onPress={() => navigation.navigate(svc.route)}
          >
            <View style={[s.serviceIconBox, { backgroundColor: svc.acc + '20' }]}>
              <Text style={s.serviceEmoji}>{svc.emoji}</Text>
            </View>
            <Text style={[s.serviceName, { color: svc.acc }]}>{svc.label}</Text>
            <Text style={s.serviceSub}>{svc.sub}</Text>
          </AnimatedCard>
        ))}
        </View>
      </FadeInUp>

      <FadeInUp delay={300}>
        <Text style={s.sectionLabel}>MY REQUESTS</Text>
        {/* My Orders — compact boxes */}
        <View style={s.myOrdersRow}>
        {MY_ORDERS.map(o => {
          const count = pendingCounts[o.key] || 0
          return (
            <AnimatedCard
              key={o.key}
              style={[s.orderBox, { backgroundColor: o.bg }]}
              onPress={() => navigation.navigate(o.key)}
            >
              {count > 0 && (
                <View style={s.orderBadge}>
                  <Text style={s.orderBadgeText}>{count}</Text>
                </View>
              )}
              <View style={[s.orderBoxIcon, { backgroundColor: o.acc + '20' }]}>
                <Text style={s.orderBoxEmoji}>{o.emoji}</Text>
              </View>
              <Text style={[s.orderBoxLabel, { color: o.acc }]}>{o.label}</Text>
            </AnimatedCard>
          )
        })}
        </View>
      </FadeInUp>
    </ScrollView>
  )
}

// ── PROVIDER HOME TAB ────────────────────────────────────────────────
function ProviderHomeTab({ user, providerRequests, refreshing, onRefresh, navigation, isOnline, onToggleOnline, togglingOnline }) {
  const serviceType = user?.service_type?.toLowerCase()
  const svc = PROVIDER_SERVICE[serviceType]

  const pending   = providerRequests.filter(r => r.status === 'pending')
  const ongoing   = providerRequests.filter(r => ['accepted', 'in_progress', 'on_the_way'].includes(r.status))
  const completed = providerRequests.filter(r => r.status === 'completed')

  const pulseAnim = useRef(new Animated.Value(1)).current
  useEffect(() => {
    if (isOnline) {
      const loop = Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 900, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 900, easing: Easing.in(Easing.ease),  useNativeDriver: true }),
      ]))
      loop.start()
      return () => loop.stop()
    }
  }, [isOnline])

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={s.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
    >
      {/* Greeting compact */}
      <View style={s.providerGreet}>
        <View style={s.avatarRing}>
          <Avatar uri={user?.profile_image} name={user?.full_name} size={36} />
        </View>
        <View style={s.greetHeroInner}>
          <View>
            <Text style={s.greetSub}>{getGreeting()}</Text>
            <Text style={s.providerGreetName}>{getFirstName(user?.full_name)}</Text>
          </View>
          <TouchableOpacity style={s.quickActionFloatBtn} activeOpacity={0.8}>
            <Text style={s.quickActionIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── ONLINE TOGGLE CARD — hero element ── */}
      <TouchableOpacity
        style={[
          s.onlineCard,
          isOnline ? s.onlineCardActive : s.onlineCardInactive,
        ]}
        onPress={onToggleOnline}
        disabled={togglingOnline}
        activeOpacity={0.85}
      >
        <View style={s.onlineLeft}>
          <View style={s.onlineDotWrap}>
            {isOnline && (
              <Animated.View style={[s.onlinePulse, { transform: [{ scale: pulseAnim }] }]} />
            )}
            <View style={[s.onlineDot, { backgroundColor: isOnline ? '#10B981' : '#94A3B8' }]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.onlineTitle}>
              {isOnline ? "You're Online" : "You're Offline"}
            </Text>
            <Text style={s.onlineSub}>
              {isOnline
                ? 'Ready to receive new requests'
                : 'Tap to start receiving requests'}
            </Text>
          </View>
        </View>
        <View style={[s.toggleSwitch, isOnline && s.toggleSwitchOn]}>
          {togglingOnline ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <View style={[s.toggleKnob, isOnline && s.toggleKnobOn]} />
          )}
        </View>
      </TouchableOpacity>

      {/* Stats — only meaningful when online OR has ongoing */}
      <View style={s.statsRow}>
        {[
          { label: 'Pending',  count: pending.length,   bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
          { label: 'Ongoing',  count: ongoing.length,   bg: '#EFF6FF', color: C.primary, border: C.primaryMd },
          { label: 'Done',     count: completed.length, bg: '#ECFDF5', color: C.green,   border: '#BBF7D0'  },
        ].map(st => (
          <View key={st.label} style={[s.statCard, { backgroundColor: st.bg, borderColor: st.border }, !isOnline && s.statCardDim]}>
            <Text style={[s.statNum, { color: st.color }, !isOnline && { color: '#94A3B8' }]}>{st.count}</Text>
            <Text style={[s.statLabel, { color: st.color }, !isOnline && { color: '#94A3B8' }]}>{st.label}</Text>
          </View>
        ))}
      </View>

      {/* Square Dashboard Cards (only when online) */}
      {isOnline && (
        <FadeInUp delay={200}>
          <View style={s.sectionHeaderRow}>
             <Text style={s.sectionLabel}>YOUR WORKSPACE</Text>
             <Text style={s.lastUpdated}>Updated just now</Text>
          </View>
          <View style={s.squareCardsRow}>
            <TouchableOpacity
              style={s.squareCard}
              onPress={() => navigation.navigate('ProviderRequests', { type: serviceType, tab: 'new' })}
              activeOpacity={0.8}
            >
              <View style={s.squareHeaderRow}>
                <View style={s.squareIconBox}>
                  <Text style={{ fontSize: 24 }}>🛵</Text>
                  {pending.length > 0 && <View style={s.pulseBadge}><Text style={s.pulseBadgeTxt}>{pending.length}</Text></View>}
                </View>
                <Text style={s.squareArrow}>›</Text>
              </View>
              <Text style={s.squareCount}>{pending.length}</Text>
              <Text style={s.squareLabel}>New Requests</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.squareCard}
              onPress={() => navigation.navigate('ProviderRequests', { type: serviceType, tab: 'active' })}
              activeOpacity={0.8}
            >
              <View style={s.squareHeaderRow}>
                <View style={s.squareIconBox}>
                  <Text style={{ fontSize: 24 }}>⚡</Text>
                  {ongoing.length > 0 && <View style={s.greenDot} />}
                </View>
                <Text style={s.squareArrow}>›</Text>
              </View>
              <Text style={s.squareCount}>{ongoing.length}</Text>
              <Text style={s.squareLabel}>Active Jobs</Text>
            </TouchableOpacity>
          </View>

          {/* Earnings Summary Card */}
          <View style={s.sectionHeaderRow}>
             <Text style={s.sectionLabel}>DAILY EARNINGS</Text>
             <Text style={s.lastUpdated}>Updated just now</Text>
          </View>
          <View style={s.earningsCard}>
            <View style={s.earningsHeader}>
              <Text style={s.earningsLabel}>Earned Today</Text>
              <Text style={s.earningsAmount}>₱{(completed.reduce((sum, r) => sum + Number(r.fare || r.total_amount || r.price || 0), 0)).toFixed(2)}</Text>
            </View>
            <View style={s.earningsGoalRow}>
               <Text style={s.earningsGoal}>Goal: ₱1000</Text>
               <Text style={s.earningsPercent}>{Math.min((completed.reduce((sum, r) => sum + Number(r.fare || r.total_amount || r.price || 0), 0) / 1000) * 100, 100).toFixed(0)}%</Text>
            </View>
            <View style={s.progressBarBg}>
              <View style={[s.progressBarFill, { width: `${Math.min((completed.reduce((sum, r) => sum + Number(r.fare || r.total_amount || r.price || 0), 0) / 1000) * 100, 100)}%` }]} />
            </View>
            <Text style={s.earningsMotivation}>Keep it up! You're {Math.min((completed.reduce((sum, r) => sum + Number(r.fare || r.total_amount || r.price || 0), 0) / 1000) * 100, 100).toFixed(0)}% to your goal 💪</Text>
          </View>
        </FadeInUp>
      )}

      {/* Offline banner */}
      {!isOnline && (
        <FadeInUp delay={200}>
          <View style={s.offlineBanner}>
            <Text style={s.offlineBannerEmoji}>💤</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.offlineBannerTitle}>You're not receiving requests</Text>
              <Text style={s.offlineBannerSub}>Toggle online above to start.</Text>
            </View>
          </View>
        </FadeInUp>
      )}

    </ScrollView>
  )
}

// ── ACTIVITY TAB ─────────────────────────────────────────────────────
const TYPE_META = {
  pasabuy: { label: 'Papalit',  emoji: '🛒', acc: C.orange, route: 'MyGroceryOrders'    },
  pasakay: { label: 'Pasakay',  emoji: '🛵', acc: C.green, route: 'MyRides'            },
  padala:  { label: 'Padaya',   emoji: '📦', acc: C.purple, route: 'MyDeliveryRequests' },
}

function ActivityTab({ feed, refreshing, onRefresh, navigation }) {
  const formatDate = (d) => {
    if (!d) return ''
    const date = new Date(d)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <FlatList
      data={feed}
      keyExtractor={(item, i) => `${item._type}-${item.id}-${i}`}
      style={s.scroll}
      contentContainerStyle={s.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
      ListHeaderComponent={<Text style={[s.activityTitle, { marginBottom: 12 }]}>Order History</Text>}
      ListEmptyComponent={
        <View style={s.emptyState}>
          <Text style={s.emptyEmoji}>📋</Text>
          <Text style={s.emptyTitle}>No orders yet</Text>
          <Text style={s.emptySub}>Your orders will appear here once you make a request.</Text>
          <TouchableOpacity style={s.emptyCta} onPress={() => navigation.navigate('Pasabuy')} activeOpacity={0.8}>
            <Text style={s.emptyCtaTxt}>Start with Papalit</Text>
          </TouchableOpacity>
        </View>
      }
      renderItem={({ item }) => {
        const meta = TYPE_META[item._type] || TYPE_META.padala
        const st   = STATUS_STYLE[item.status] || { bg: '#F1F5F9', color: '#64748B', label: item.status }
        return (
          <TouchableOpacity
            style={[s.feedCard, { borderLeftColor: meta.acc, marginBottom: 10 }]}
            onPress={() => navigation.navigate(meta.route)}
            activeOpacity={0.75}
          >
            <View style={[s.feedIcon, { backgroundColor: meta.acc + '15' }]}>
              <Text style={s.feedEmoji}>{meta.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={s.feedTop}>
                <Text style={[s.feedType, { color: meta.acc }]}>{meta.label}</Text>
                <Text style={s.feedDate}>{formatDate(item._date)}</Text>
              </View>
              <Text style={s.feedId}>Request #{item.id}</Text>
              {(item.item_title || item.description || item.store || item.pickup_location) ? (
                <Text style={s.feedSub} numberOfLines={1}>
                  {item.item_title || item.description || item.store || item.pickup_location}
                </Text>
              ) : null}
            </View>
            <View style={[s.feedBadge, { backgroundColor: st.bg }]}>
              <Text style={[s.feedBadgeText, { color: st.color }]}>{st.label}</Text>
            </View>
          </TouchableOpacity>
        )
      }}
    />
  )
}

// ── PROVIDER ACTIVITY TAB ─────────────────────────────────────────────
function ProviderActivityTab({ requests, refreshing, onRefresh, navigation, serviceType }) {
  const [filter, setFilter] = useState('all')

  const filtered = requests.filter(r => {
    if (filter === 'all') return true
    if (filter === 'ongoing') return ['accepted', 'in_progress', 'on_the_way'].includes(r.status)
    return r.status === filter
  })

  const TABS = [
    { key: 'all',       label: 'All' },
    { key: 'pending',   label: 'Pending' },
    { key: 'ongoing',   label: 'Ongoing' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' }
  ]

  const formatDate = (d) => {
    if (!d) return ''
    const date = new Date(d)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={s.activityHeader}>
        <Text style={s.activityTitle}>Booking History</Text>
      </View>
      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.key}
              style={[s.filterTab, filter === t.key && s.filterTabActive]}
              onPress={() => setFilter(t.key)}
            >
              <Text style={[s.filterTabText, filter === t.key && s.filterTabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <FlatList
        data={filtered}
        keyExtractor={req => req.id?.toString()}
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingTop: 0 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Text style={s.emptyEmoji}>📋</Text>
            <Text style={s.emptyTitle}>No {filter === 'all' ? '' : filter} requests found</Text>
            <Text style={s.emptySub}>When you get requests, they will appear here.</Text>
          </View>
        }
        renderItem={({ item: req }) => {
          const st = STATUS_STYLE[req.status] || STATUS_STYLE.pending
          const isOngoing = ['accepted', 'in_progress', 'on_the_way'].includes(req.status)
          const fare = req.fare || req.total_amount || req.price || 0
          
          return (
            <AnimatedCard
              style={s.historyCard}
              onPress={() => {
                if (isOngoing) {
                  navigation.navigate('ActiveJob', { request: req, type: serviceType })
                } else {
                  navigation.navigate('ProviderRequests', { requestId: req.id, request: req })
                }
              }}
            >
              <View style={s.historyHeaderRow}>
                <Text style={s.historyId}>Request #{req.id}</Text>
                <View style={[s.statusBadge, { backgroundColor: st.bg }]}>
                  <Text style={[s.statusBadgeText, { color: st.color }]}>{st.label}</Text>
                </View>
              </View>
              
              <Text style={s.historyCustomer} numberOfLines={1}>👤 {req.customer_name || 'Resident'}</Text>
              
              <View style={s.historyFooterRow}>
                <Text style={s.historyDate}>📅 {formatDate(req.created_at || req.date)}</Text>
                <Text style={s.historyFare}>₱{Number(fare).toFixed(2)}</Text>
              </View>
            </AnimatedCard>
          )
        }}
      />
    </View>
  )
}

// ── PROFILE TAB ───────────────────────────────────────────────────────
function ProfileTab({ user, navigation, handleLogout }) {
  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Avatar + name */}
      <View style={s.profileHero}>
        <View style={s.profileAvatarRing}>
          <Avatar uri={user?.profile_image} name={user?.full_name} size={72} />
        </View>
        <Text style={s.profileName}>{user?.full_name ?? '—'}</Text>
        <Text style={s.profileSub}>📍 {user?.barangay ?? '—'}, Bacuag</Text>
        <View style={s.roleBadge}>
          <Text style={s.roleBadgeText}>
            {user?.role === 'provider' ? '🚴 Provider' : '⭐ Resident'}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={s.infoCard}>
        <Text style={s.infoCardLabel}>ACCOUNT INFO</Text>
        <ProfileRow icon="📱" label="Contact" value={user?.phone} />
        <View style={s.divider} />
        <ProfileRow icon="📍" label="Barangay" value={user?.barangay} />
        {user?.role === 'provider' && (
          <>
            <View style={s.divider} />
            <ProfileRow icon="⚙️" label="Service" value={user?.service_type} capitalize />
          </>
        )}
      </View>

      {/* Actions */}
      <View style={s.infoCard}>
        <Text style={s.infoCardLabel}>SETTINGS</Text>
        <ProfileAction emoji="✏️" label="Edit Profile"    sub="Update photo & contact"  onPress={() => navigation.navigate('EditProfile', { user })} />
        <View style={s.divider} />
        <ProfileAction emoji="🔑" label="Change Password" sub="Keep your account secure" onPress={() => navigation.navigate('ChangePassword')} />
        <View style={s.divider} />
        <ProfileAction emoji="🚪" label="Log Out"         sub="Sign out of your account" onPress={handleLogout} danger />
      </View>

      <Text style={s.footerText}>© 2026 3PS · Bacuag, Surigao del Norte</Text>
    </ScrollView>
  )
}

function ProfileRow({ icon, label, value, capitalize }) {
  return (
    <View style={s.profileRow}>
      <Text style={s.profileRowIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={s.profileRowLabel}>{label}</Text>
        <Text style={[s.profileRowValue, capitalize && { textTransform: 'capitalize' }]}>{value || '—'}</Text>
      </View>
    </View>
  )
}

function ProfileAction({ emoji, label, sub, onPress, danger }) {
  return (
    <TouchableOpacity style={s.profileAction} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.profileActionIcon, danger && { backgroundColor: '#FEF2F2' }]}>
        <Text style={{ fontSize: 17 }}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.profileActionLabel, danger && { color: C.danger }]}>{label}</Text>
        <Text style={s.profileActionSub}>{sub}</Text>
      </View>
      <Text style={s.orderChevron}>›</Text>
    </TouchableOpacity>
  )
}

// ══════════════════════════════════════════════════════════════════════
export default function HomeScreen({ navigation }) {
  const [user,             setUser]             = useState(null)
  const [activeTab,        setActiveTab]        = useState('Home')
  const [loading,          setLoading]          = useState(true)
  const [refreshing,       setRefreshing]       = useState(false)
  const [providerRequests, setProviderRequests] = useState([])
  const [pendingCounts,    setPendingCounts]    = useState({ MyGroceryOrders: 0, MyRides: 0, MyDeliveryRequests: 0 })
  const [activityFeed,     setActivityFeed]     = useState([])
  const [isOnline,         setIsOnline]         = useState(false)
  const [togglingOnline,   setTogglingOnline]   = useState(false)
  const [showLogoutModal,  setShowLogoutModal]  = useState(false)
  const [showOfflineModal, setShowOfflineModal] = useState(false)

  const mountedRef = useRef(true)
  const socket = useNotifications(user?.id)

  useFocusEffect(
    useCallback(() => {
      mountedRef.current = true
      loadAll()

      return () => {
        mountedRef.current = false
      }
    }, [])
  )

  useEffect(() => {
    if (!socket || !mountedRef.current) return

    const handleNewRequest = () => {
      SecureStore.getItemAsync('user').then(raw => {
        if (!raw || !mountedRef.current) return
        const u = JSON.parse(raw)
        if (u?.role === 'provider' && u?.is_online) {
          fetchProviderRequests(u.service_type?.toLowerCase())
        }
      }).catch(() => {})
    }

    socket.on('new_request', handleNewRequest)
    socket.on('job_updated', handleNewRequest)

    return () => {
      socket.off('new_request', handleNewRequest)
      socket.off('job_updated', handleNewRequest)
    }
  }, [socket])

  const loadAll = async () => {
    try {
      const raw = await SecureStore.getItemAsync('user')
      if (raw) {
        const u = JSON.parse(raw)
        if (mountedRef.current) {
          setUser(u)
          setIsOnline(!!u.is_online)
        }
        if (u.role === 'provider') {
          if (u.is_online) await fetchProviderRequests(u.service_type?.toLowerCase())
        } else {
          await fetchPendingCounts()
        }
      }
    } catch (e) {
      console.log('loadAll error:', e)
    } finally {
      if (mountedRef.current) { setLoading(false); setRefreshing(false) }
    }
  }

  const handleToggleOnline = () => {
    if (isOnline) {
      setShowOfflineModal(true)
    } else {
      executeToggleOnline()
    }
  }

  const executeToggleOnline = async () => {
    setShowOfflineModal(false)
    if (togglingOnline) return
    const next = !isOnline
    setTogglingOnline(true)
    try {
      await API.patch('/auth/online-status', { is_online: next })
      if (!mountedRef.current) return
      setIsOnline(next)
      // Update stored user
      const raw = await SecureStore.getItemAsync('user')
      if (raw) {
        const u = JSON.parse(raw)
        u.is_online = next
        await SecureStore.setItemAsync('user', JSON.stringify(u))
        setUser(u)
      }
      if (next && user?.role === 'provider') {
        await fetchProviderRequests(user.service_type?.toLowerCase())
      } else if (!next) {
        setProviderRequests([])
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not update status. Try again.')
    } finally {
      if (mountedRef.current) setTogglingOnline(false)
    }
  }

  const fetchPendingCounts = async () => {
    try {
      const [a, b, c] = await Promise.allSettled([
        API.get('/pasabuy/orders'),
        API.get('/pasakay/rides'),
        API.get('/parepair/requests'),
      ])
      const getList = (res, key) => res.status === 'fulfilled' ? (res.value.data?.[key] || []) : []
      const pasabuy  = getList(a, 'orders').map(o => ({ ...o, _type: 'pasabuy', _date: o.created_at || o.ordered_at || o.requested_at }))
      const pasakay  = getList(b, 'rides').map(o  => ({ ...o, _type: 'pasakay', _date: o.created_at || o.booked_at   || o.requested_at }))
      const padala   = getList(c, 'requests').map(o=> ({ ...o, _type: 'padala',  _date: o.created_at || o.requested_at }))
      const combined = [...pasabuy, ...pasakay, ...padala].sort((x, y) => new Date(y._date) - new Date(x._date))
      if (mountedRef.current) {
        setPendingCounts({
          MyGroceryOrders:    pasabuy.filter(r => r.status === 'pending').length,
          MyRides:            pasakay.filter(r => r.status === 'pending').length,
          MyDeliveryRequests: padala.filter(r  => r.status === 'pending').length,
        })
        setActivityFeed(combined)
      }
    } catch {}
  }

  const fetchProviderRequests = async (serviceType) => {
    const svc = PROVIDER_SERVICE[serviceType]
    if (!svc) return
    try {
      const res  = await API.get(svc.endpoint)
      const data = res.data?.[svc.responseKey] || res.data?.orders || res.data?.rides || res.data?.requests || []
      if (mountedRef.current) setProviderRequests(Array.isArray(data) ? data : [])
    } catch { if (mountedRef.current) setProviderRequests([]) }
  }

  const onRefresh = () => { setRefreshing(true); loadAll() }

  const handleLogout = () => setShowLogoutModal(true)

  const executeLogout = async () => {
    setShowLogoutModal(false)
    mountedRef.current = false
    await SecureStore.deleteItemAsync('token')
    await SecureStore.deleteItemAsync('user')
    await SecureStore.deleteItemAsync('service_type')
    navigation.replace('LoginWelcome')
  }

  const isProvider = user?.role === 'provider'
  const residentPendingTotal = Object.values(pendingCounts).reduce((a, b) => a + b, 0)
  const providerPendingTotal = providerRequests.filter(r => r.status === 'pending').length
  const activityBadgeCount = isProvider ? providerPendingTotal : residentPendingTotal

  if (loading) return (
    <View style={s.loadingWrap}>
      <ActivityIndicator size="large" color={C.primary} />
    </View>
  )

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      {/* Top Bar */}
      <View style={s.topBar}>
        <View style={s.topLogoRow}>
          <View style={s.topLogoBadge}><Text style={s.topLogoText}>3PS</Text></View>
          <Text style={s.topBarTitle}>3PS App</Text>
        </View>
      </View>

      <View style={{ flex: 1, backgroundColor: C.bg }}>
        {activeTab === 'Home' && (
          isProvider ? (
            <ProviderHomeTab
              user={user} providerRequests={providerRequests}
              refreshing={refreshing} onRefresh={onRefresh} navigation={navigation}
              isOnline={isOnline} onToggleOnline={handleToggleOnline} togglingOnline={togglingOnline}
            />
          ) : (
            <HomeTab
              user={user} pendingCounts={pendingCounts}
              refreshing={refreshing} onRefresh={onRefresh}
              navigation={navigation} setActiveTab={setActiveTab}
            />
          )
        )}
        {activeTab === 'Activity' && (
          isProvider ? (
            <ProviderActivityTab
              requests={providerRequests}
              refreshing={refreshing}
              onRefresh={onRefresh}
              navigation={navigation}
              serviceType={user?.service_type}
            />
          ) : (
            <ActivityTab feed={activityFeed} refreshing={refreshing} onRefresh={onRefresh} navigation={navigation} />
          )
        )}
        {activeTab === 'Profile' && (
          <ProfileTab user={user} navigation={navigation} handleLogout={handleLogout} />
        )}
      </View>

      {/* Bottom Nav */}
      <View style={s.bottomNav}>
        {[
          { key: 'Home',     label: 'Home',     icon: 'home',            iconActive: 'home'            },
          { key: 'Activity', label: 'Activity', icon: 'time-outline',    iconActive: 'time'            },
          { key: 'Profile',  label: 'Profile',  icon: 'person-outline',  iconActive: 'person'          },
        ].map(tab => {
          const active = activeTab === tab.key
          const showBadge = tab.key === 'Activity' && activityBadgeCount > 0
          return (
            <TouchableOpacity
              key={tab.key}
              style={s.navTab}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.6}
            >
              {active && <View style={s.navActiveLine} />}
              {showBadge && (
                <View style={s.navBadge}>
                  <Text style={s.navBadgeTxt}>{activityBadgeCount > 99 ? '99+' : activityBadgeCount}</Text>
                </View>
              )}
              <Ionicons
                name={active ? tab.iconActive : tab.icon}
                size={22}
                color={active ? C.primary : C.textHint}
              />
              <Text style={[s.navLabel, active && s.navLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <ConfirmationModal
        visible={showLogoutModal}
        title="Log Out"
        message="Are you sure you want to log out?"
        icon="🚪"
        confirmText="Log Out"
        onConfirm={executeLogout}
        onCancel={() => setShowLogoutModal(false)}
      />

      <ConfirmationModal
        visible={showOfflineModal}
        title="Go Offline"
        message="Are you sure you want to go offline? You will stop receiving new requests."
        icon="📡"
        confirmText="Go Offline"
        onConfirm={executeToggleOnline}
        onCancel={() => setShowOfflineModal(false)}
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.bg },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },

  // Top bar
  topBar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 12, backgroundColor: C.primary },
  topLogoRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topLogoBadge: { width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  topLogoText:  { fontSize: 11, fontWeight: '800', color: '#fff' },
  topBarTitle:  { fontSize: 15, fontWeight: '700', color: '#fff' },

  // Scroll
  scroll:        { flex: 1, backgroundColor: '#FFFDF9' },
  scrollContent: { padding: 16, paddingBottom: 32, gap: 12 },

  // Greeting
  greeting:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.white, borderRadius: 16, padding: 14, borderWidth: 0.5, borderColor: C.border },
  avatarRing:   { borderWidth: 2, borderColor: C.primary, borderRadius: 26, padding: 2 },
  avatarFallback:{ backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  avatarInitials:{ fontWeight: '700', color: '#fff' },
  greetSub:     { fontSize: 11, color: C.textSub },
  greetName:    { fontSize: 17, fontWeight: '800', color: C.text },
  locationBadge:{ backgroundColor: C.primaryLt, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: C.primaryMd },
  locationText: { fontSize: 11, color: C.primary, fontWeight: '700' },

  // Pending banner
  pendingBanner:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFBEB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#FDE68A' },
  pendingBannerDot:  { fontSize: 10, color: '#F59E0B' },
  pendingBannerText: { fontSize: 13, color: '#92400E' },
  sectionLabel:      { fontSize: 11, fontWeight: '800', color: C.textHint, letterSpacing: 0.8, marginTop: 2, marginBottom: -2 },

  // Quick actions
  quickActionsRow: { flexDirection: 'row', gap: 10 },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: C.border,
    paddingVertical: 11,
  },
  quickActionEmoji: { fontSize: 16 },
  quickActionTxt: { fontSize: 12, fontWeight: '700', color: C.text },

  // Services
  servicesRow:   { flexDirection: 'row', gap: 10 },
  serviceCard:   { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center', gap: 6, borderWidth: 0.5, borderColor: C.border },
  serviceIconBox:{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  serviceEmoji:  { fontSize: 22 },
  serviceName:   { fontSize: 13, fontWeight: '800' },
  serviceSub:    { fontSize: 10, color: C.textSub, textAlign: 'center', lineHeight: 14 },

  // My Orders compact boxes
  myOrdersRow:   { flexDirection: 'row', gap: 10 },
  orderBox:      { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center', gap: 6, borderWidth: 0.5, borderColor: C.border, position: 'relative' },
  orderBoxIcon:  { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  orderBoxEmoji: { fontSize: 20 },
  orderBoxLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  orderBadge:    { position: 'absolute', top: 6, right: 8, backgroundColor: C.danger, borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  orderBadgeText:{ fontSize: 10, color: '#fff', fontWeight: '800' },

  // Square Cards
  squareCardsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  squareCard: { flex: 1, backgroundColor: '#FFF7ED', borderRadius: 14, padding: 12, borderWidth: 0.5, borderColor: '#FDBA74', shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3 },
  squareHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  squareIconBox: { position: 'relative' },
  pulseBadge: { position: 'absolute', top: -6, right: -10, backgroundColor: C.danger, borderRadius: 10, paddingHorizontal: 4, paddingVertical: 1, borderWidth: 1.5, borderColor: '#FFF7ED', minWidth: 18, alignItems: 'center' },
  pulseBadgeTxt: { color: '#fff', fontSize: 9, fontWeight: '800' },
  greenDot: { position: 'absolute', top: 0, right: -4, width: 10, height: 10, borderRadius: 5, backgroundColor: C.green, borderWidth: 1.5, borderColor: '#FFF7ED' },
  squareCount: { fontSize: 26, fontWeight: '800', color: C.text, marginBottom: 2 },
  squareLabel: { fontSize: 11, fontWeight: '700', color: C.textSub, letterSpacing: 0.3 },
  squareArrow: { fontSize: 20, color: '#FDBA74', fontWeight: '500', marginTop: -4 },
  
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
  lastUpdated: { fontSize: 10, color: C.textHint, fontWeight: '500' },

  // Earnings
  earningsCard:   { backgroundColor: C.white, borderRadius: 16, marginBottom: 16, padding: 16, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  earningsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  earningsLabel:  { fontSize: 12, fontWeight: '700', color: C.textSub },
  earningsAmount: { fontSize: 26, fontWeight: '800', color: C.primary },
  earningsGoalRow:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  earningsGoal:   { fontSize: 11, color: C.textHint },
  earningsPercent:{ fontSize: 11, color: C.primary, fontWeight: '800' },
  progressBarBg:  { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressBarFill:{ height: '100%', backgroundColor: C.primary, borderRadius: 3 },
  earningsMotivation: { fontSize: 11, color: C.textSub, fontWeight: '500', textAlign: 'center' },

  // Orders list (provider)
  ordersCard:  { backgroundColor: C.white, borderRadius: 16, borderWidth: 0.5, borderColor: C.border, overflow: 'hidden' },
  orderRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
  orderIcon:   { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  orderEmoji:  { fontSize: 18 },
  orderLabel:  { flex: 1, fontSize: 14, fontWeight: '600', color: C.text },
  orderSub:    { fontSize: 11, color: C.textSub, marginTop: 1 },
  orderChevron:{ fontSize: 20, color: C.textHint },
  divider:     { height: 0.5, backgroundColor: C.border, marginLeft: 62 },

  // Status badge
  statusBadge:    { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  statusBadgeText:{ fontSize: 10, fontWeight: '700' },

  // Provider stats
  statsRow:    { flexDirection: 'row', gap: 10 },
  statCard:    { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1 },
  statCardDim: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', opacity: 0.7 },
  statNum:     { fontSize: 22, fontWeight: '800' },
  statLabel:   { fontSize: 10, fontWeight: '700', marginTop: 2 },

  // Provider greeting (smaller variant)
  providerGreet:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4, paddingVertical: 4, marginBottom: -6 },
  providerGreetName: { fontSize: 16, fontWeight: '800', color: C.text },
  quickActionFloatBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2, marginLeft: 'auto' },
  quickActionIcon:   { fontSize: 18 },
  serviceTag:        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  serviceTagEmoji:   { fontSize: 12 },
  serviceTagText:    { fontSize: 11, fontWeight: '700' },

  // Online toggle card
  onlineCard:         { flexDirection: 'row', alignItems: 'center', borderRadius: 18, padding: 16, gap: 14, borderWidth: 1.5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
  onlineCardActive:   { backgroundColor: '#ECFDF5', borderColor: '#86EFAC' },
  onlineCardInactive: { backgroundColor: C.white,   borderColor: C.border  },
  onlineLeft:         { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  onlineDotWrap:      { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  onlineDot:          { width: 14, height: 14, borderRadius: 7 },
  onlinePulse:        { position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: '#10B98155' },
  onlineTitle:        { fontSize: 15, fontWeight: '800', color: C.text },
  onlineSub:          { fontSize: 11, color: C.textSub, marginTop: 2 },

  toggleSwitch:    { width: 50, height: 30, borderRadius: 15, backgroundColor: '#CBD5E1', justifyContent: 'center', paddingHorizontal: 3 },
  toggleSwitchOn:  { backgroundColor: '#10B981' },
  toggleKnob:      { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
  toggleKnobOn:    { transform: [{ translateX: 20 }] },

  // Offline banner
  offlineBanner:      { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F1F5F9', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border },
  offlineBannerEmoji: { fontSize: 24 },
  offlineBannerTitle: { fontSize: 13, fontWeight: '700', color: C.text },
  offlineBannerSub:   { fontSize: 11, color: C.textSub, marginTop: 2 },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  emptySub:   { fontSize: 13, color: C.textSub, textAlign: 'center' },

  viewAllBtn:  { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  viewAllText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Profile
  profileHero:      { backgroundColor: C.white, borderRadius: 16, padding: 20, alignItems: 'center', gap: 6, borderWidth: 0.5, borderColor: C.border },
  profileAvatarRing:{ borderWidth: 2.5, borderColor: C.primary, borderRadius: 40, padding: 3, marginBottom: 4 },
  profileName:      { fontSize: 18, fontWeight: '800', color: C.text },
  profileSub:       { fontSize: 12, color: C.textSub },
  roleBadge:        { backgroundColor: C.primaryLt, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, borderWidth: 1, borderColor: C.primaryMd, marginTop: 4 },
  roleBadgeText:    { fontSize: 12, color: C.primary, fontWeight: '700' },

  infoCard:      { backgroundColor: C.white, borderRadius: 16, borderWidth: 0.5, borderColor: C.border, overflow: 'hidden' },
  infoCardLabel: { fontSize: 10, fontWeight: '700', color: C.textHint, letterSpacing: 0.8, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8 },

  profileRow:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  profileRowIcon:  { fontSize: 16, width: 22 },
  profileRowLabel: { fontSize: 11, color: C.textHint, marginBottom: 2 },
  profileRowValue: { fontSize: 14, fontWeight: '600', color: C.text },

  profileAction:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
  profileActionIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  profileActionLabel:{ fontSize: 14, fontWeight: '600', color: C.text },
  profileActionSub:  { fontSize: 11, color: C.textHint },

  footerText: { textAlign: 'center', fontSize: 11, color: C.textHint, marginTop: 4 },

  // Activity feed
  activityTitle: { fontSize: 16, fontWeight: '800', color: C.text, marginBottom: -4 },
  feedCard:      { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 14, padding: 12, gap: 10, borderWidth: 0.5, borderColor: C.border, borderLeftWidth: 3 },
  feedIcon:      { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  feedEmoji:     { fontSize: 18 },
  feedTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  feedType:      { fontSize: 11, fontWeight: '700' },
  feedDate:      { fontSize: 10, color: C.textHint },
  feedId:        { fontSize: 13, fontWeight: '700', color: C.text },
  feedSub:       { fontSize: 11, color: C.textSub, marginTop: 1 },
  feedBadge:     { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  feedBadgeText: { fontSize: 10, fontWeight: '700' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  emptySub:   { fontSize: 13, color: C.textSub, textAlign: 'center', lineHeight: 20 },
  emptyCta: {
    marginTop: 8,
    backgroundColor: C.primary,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  emptyCtaTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Bottom nav
  bottomNav:      { flexDirection: 'row', backgroundColor: C.white, borderTopWidth: 0.5, borderTopColor: C.border, paddingBottom: 18 },
  navTab:         { flex: 1, alignItems: 'center', paddingTop: 12, gap: 0 },
  navActiveLine:  { position: 'absolute', top: 0, width: 24, height: 2.5, backgroundColor: C.primary, borderRadius: 2 },
  navBadge:       { position: 'absolute', top: 5, right: '28%', backgroundColor: C.danger, borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  navBadgeTxt:    { color: '#fff', fontSize: 10, fontWeight: '800' },
  navIcon:        { fontSize: 18, color: C.textHint },
  navLabel:       { fontSize: 12, color: C.textHint, fontWeight: '500', marginTop: 2 },
  navLabelActive: { color: C.primary, fontWeight: '700' },

  greetHeroInner: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },

  // Provider Activity Styles
  activityHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: C.white, borderWidth: 1, borderColor: C.border },
  filterTabActive: { backgroundColor: C.primary, borderColor: C.primary },
  filterTabText: { fontSize: 12, fontWeight: '600', color: C.textHint },
  filterTabTextActive: { color: C.white },

  historyCard: { backgroundColor: C.white, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 0.5, borderColor: C.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  historyHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  historyId: { fontSize: 13, fontWeight: '800', color: C.text },
  historyCustomer: { fontSize: 14, color: C.textSub, marginBottom: 10 },
  historyFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 0.5, borderTopColor: C.border, paddingTop: 10 },
  historyDate: { fontSize: 11, color: C.textHint },
  historyFare: { fontSize: 14, fontWeight: '800', color: C.primary },
})
