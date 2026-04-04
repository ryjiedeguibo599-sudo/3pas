import React, { useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, Platform, Animated, Easing
} from 'react-native'

const GREEN       = '#16a34a'
const GREEN_LIGHT = '#dcfce7'
const BLUE        = '#1d4ed8'
const BLUE_BG     = '#eff6ff'

const REPAIR_TYPE_ICONS = {
  home:      '🏠',
  vehicle:   '🔧',
  appliance: '📺',
}

const REPAIR_TYPE_LABELS = {
  home:      'Home Repair',
  vehicle:   'Vehicle Repair',
  appliance: 'Appliance Repair',
}

export default function WaitingRepairScreen({ navigation, route }) {
  const { description, address, repairType, problemTitle, schedule, requestId } = route.params || {}

  const checkScale    = useRef(new Animated.Value(0)).current
  const checkOpacity  = useRef(new Animated.Value(0)).current
  const titleY        = useRef(new Animated.Value(20)).current
  const titleOpacity  = useRef(new Animated.Value(0)).current
  const cardY         = useRef(new Animated.Value(30)).current
  const cardOpacity   = useRef(new Animated.Value(0)).current
  const dot1Opacity   = useRef(new Animated.Value(0.3)).current
  const dot2Opacity   = useRef(new Animated.Value(0.3)).current
  const dot3Opacity   = useRef(new Animated.Value(0.3)).current
  const pulseScale    = useRef(new Animated.Value(1)).current
  const searchRotate  = useRef(new Animated.Value(0)).current

  const [requestNum] = useState(requestId || Math.floor(Math.random() * 900) + 100)

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(checkScale,   { toValue: 1, friction: 5, useNativeDriver: true }),
        Animated.timing(checkOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(titleY,       { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(titleOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardY,        { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.timing(cardOpacity,  { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
    ]).start()

    // Dots loop
    const dotLoop = () => {
      Animated.sequence([
        Animated.timing(dot1Opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(dot2Opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(dot3Opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.delay(300),
        Animated.parallel([
          Animated.timing(dot1Opacity, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.timing(dot2Opacity, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.timing(dot3Opacity, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        ]),
      ]).start(() => dotLoop())
    }
    const dotTimer = setTimeout(dotLoop, 1200)

    // Pulse
    const pulseLoop = () => {
      Animated.sequence([
        Animated.timing(pulseScale, { toValue: 1.06, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseScale, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]).start(() => pulseLoop())
    }
    const pulseTimer = setTimeout(pulseLoop, 800)

    // Search icon spin loop
    const spinLoop = () => {
      searchRotate.setValue(0)
      Animated.timing(searchRotate, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true }).start(() => spinLoop())
    }
    spinLoop()

    return () => { clearTimeout(dotTimer); clearTimeout(pulseTimer) }
  }, [])

  const spin = searchRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })
  const icon  = REPAIR_TYPE_ICONS[repairType]  || '🔧'
  const label = REPAIR_TYPE_LABELS[repairType] || 'Repair'

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* ── Checkmark ── */}
        <Animated.View style={[styles.checkWrapper, {
          opacity: checkOpacity,
          transform: [{ scale: Animated.multiply(checkScale, pulseScale) }]
        }]}>
          <View style={styles.checkCircle}>
            <Text style={styles.checkText}>✓</Text>
          </View>
        </Animated.View>

        {/* ── Title ── */}
        <Animated.View style={{ opacity: titleOpacity, transform: [{ translateY: titleY }], alignItems: 'center' }}>
          <Text style={styles.title}>Na-send na ang Request!</Text>
          <Text style={styles.requestNum}>Request #{requestNum}</Text>
        </Animated.View>

        {/* ── Request details ── */}
        <Animated.View style={[styles.detailCard, { opacity: cardOpacity, transform: [{ translateY: cardY }] }]}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailHeaderIcon}>📋</Text>
            <Text style={styles.detailHeaderText}>Detalye ng Request</Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>{icon}</Text>
            <Text style={styles.detailLabel}>Uri</Text>
            <Text style={styles.detailValue}>{label}</Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📝</Text>
            <Text style={styles.detailLabel}>Problema</Text>
            <Text style={[styles.detailValue, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
              {problemTitle || description || '—'}
            </Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📍</Text>
            <Text style={styles.detailLabel}>Lokasyon</Text>
            <Text style={[styles.detailValue, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
              {address || '—'}
            </Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>🗓️</Text>
            <Text style={styles.detailLabel}>Schedule</Text>
            <Text style={[styles.detailValue, { color: GREEN, flex: 1, textAlign: 'right' }]} numberOfLines={2}>
              {schedule || 'As soon as possible'}
            </Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>💳</Text>
            <Text style={styles.detailLabel}>Bayad</Text>
            <Text style={[styles.detailValue, { color: GREEN }]}>Cash / GCash</Text>
          </View>
        </Animated.View>

        {/* ── Matching technician card ── */}
        <Animated.View style={[styles.waitCard, { opacity: cardOpacity, transform: [{ translateY: cardY }] }]}>
          <Animated.Text style={[styles.searchIcon, { transform: [{ rotate: spin }] }]}>🔍</Animated.Text>
          <Text style={styles.waitTitle}>Naghahanap ng Technician...</Text>
          <Text style={styles.waitDesc}>
            Hihintayin ang available na{' '}
            <Text style={{ fontWeight: '700', color: BLUE }}>{label}</Text>{' '}
            technician sa iyong lugar.{'\n'}
            ETA:{' '}
            <Text style={{ fontWeight: '700', color: GREEN }}>10–30 minuto</Text>
          </Text>
          <View style={styles.dotsRow}>
            <Animated.View style={[styles.dot, { opacity: dot1Opacity, backgroundColor: BLUE }]} />
            <Animated.View style={[styles.dot, { opacity: dot2Opacity, backgroundColor: BLUE }]} />
            <Animated.View style={[styles.dot, { opacity: dot3Opacity, backgroundColor: BLUE }]} />
          </View>
        </Animated.View>

        {/* ── Buttons ── */}
        <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Home')} activeOpacity={0.85}>
          <Text style={styles.homeBtnIcon}>🏠</Text>
          <Text style={styles.homeBtnText}>Bumalik sa Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.viewBtn} onPress={() => navigation.navigate('MyRepairRequests')} activeOpacity={0.8}>
          <Text style={styles.viewBtnText}>Tingnan ang Aking Mga Request →</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: '#eff6ff' },
  container:        { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, gap: 14, paddingTop: Platform.OS === 'android' ? 32 : 0 },

  checkWrapper:     { marginBottom: 4 },
  checkCircle:      { width: 80, height: 80, borderRadius: 20, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', shadowColor: GREEN, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  checkText:        { fontSize: 40, color: '#fff', fontWeight: '700', lineHeight: 50 },

  title:            { fontSize: 22, fontWeight: '800', color: GREEN, textAlign: 'center', marginBottom: 2 },
  requestNum:       { fontSize: 13, color: '#64748b', textAlign: 'center' },

  detailCard:       { width: '100%', backgroundColor: '#fff', borderRadius: 16, borderWidth: 0.5, borderColor: '#e2e8f0', overflow: 'hidden' },
  detailHeader:     { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14 },
  detailHeaderIcon: { fontSize: 16 },
  detailHeaderText: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  detailDivider:    { height: 0.5, backgroundColor: '#f1f5f9' },
  detailRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11 },
  detailIcon:       { fontSize: 15, width: 22, textAlign: 'center' },
  detailLabel:      { fontSize: 13, color: '#64748b', minWidth: 70 },
  detailValue:      { fontSize: 13, fontWeight: '600', color: '#0f172a' },

  waitCard:         { width: '100%', backgroundColor: '#fff', borderRadius: 16, borderWidth: 0.5, borderColor: '#e2e8f0', padding: 20, alignItems: 'center', gap: 8 },
  searchIcon:       { fontSize: 36, marginBottom: 4 },
  waitTitle:        { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  waitDesc:         { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20 },
  dotsRow:          { flexDirection: 'row', gap: 8, marginTop: 6 },
  dot:              { width: 10, height: 10, borderRadius: 5 },

  homeBtn:          { width: '100%', backgroundColor: GREEN, borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: GREEN, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  homeBtnIcon:      { fontSize: 18 },
  homeBtnText:      { color: '#fff', fontSize: 16, fontWeight: '700' },
  viewBtn:          { paddingVertical: 8 },
  viewBtnText:      { fontSize: 13, color: BLUE, fontWeight: '600' },
})