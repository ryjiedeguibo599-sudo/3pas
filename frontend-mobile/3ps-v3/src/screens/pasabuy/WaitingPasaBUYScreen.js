import React, { useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, Platform, Animated, Easing
} from 'react-native'

const GREEN    = '#059669'
const GREEN_BG = '#ecfdf5'

const STATUS_STEPS = [
  { key: 'sent',     label: 'Request Sent',  emoji: '📤', desc: 'Natanggap na ang iyong order.' },
  { key: 'buying',   label: 'Binibili na',   emoji: '🛒', desc: 'Binibili na ng rider ang iyong mga items.' },
  { key: 'ontheway', label: 'On the Way',    emoji: '🛵', desc: 'Papunta na sa iyo ang rider.' },
  { key: 'delivered',label: 'Delivered',     emoji: '✅', desc: 'Natanggap mo na ang order. Bayad na!' },
]

export default function WaitingPasaBUYScreen({ navigation, route }) {
  const { trip, items = [], note } = route.params || {}
  const [currentStep, setCurrentStep] = useState(0)

  // Animations
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
  const riderX        = useRef(new Animated.Value(-40)).current
  const riderOpacity  = useRef(new Animated.Value(0)).current

  const [orderNum] = useState(Math.floor(Math.random() * 900) + 100)

  useEffect(() => {
    // Entrance sequence
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
      Animated.parallel([
        Animated.spring(riderX,       { toValue: 0, friction: 6, useNativeDriver: true }),
        Animated.timing(riderOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
    ]).start()

    // Pulsing dots
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

    // Pulse checkmark
    const pulseLoop = () => {
      Animated.sequence([
        Animated.timing(pulseScale, { toValue: 1.06, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseScale, { toValue: 1,    duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]).start(() => pulseLoop())
    }
    const pulseTimer = setTimeout(pulseLoop, 800)

    return () => { clearTimeout(dotTimer); clearTimeout(pulseTimer) }
  }, [])

  const TRIP_ICONS = { 'Palengke': '🛒', 'Burgeran': '🍔', 'Botika': '💊', 'Merkado': '🥬', 'Tindahan': '🏪' }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* ── Checkmark ── */}
        <Animated.View style={{ opacity: checkOpacity, transform: [{ scale: Animated.multiply(checkScale, pulseScale) }], marginBottom: 4 }}>
          <View style={styles.checkCircle}>
            <Text style={styles.checkText}>✓</Text>
          </View>
        </Animated.View>

        {/* ── Title ── */}
        <Animated.View style={{ opacity: titleOpacity, transform: [{ translateY: titleY }], alignItems: 'center' }}>
          <Text style={styles.title}>Na-send na ang Order!</Text>
          <Text style={styles.orderNum}>Order #{orderNum}  •  {trip?.destination}</Text>
        </Animated.View>

        {/* ── Status tracker ── */}
        <Animated.View style={[styles.statusCard, { opacity: cardOpacity, transform: [{ translateY: cardY }] }]}>
          {STATUS_STEPS.map((step, index) => {
            const done    = index < currentStep
            const current = index === currentStep
            return (
              <View key={step.key}>
                <View style={styles.stepRow}>
                  <View style={[
                    styles.stepDot,
                    done    && { backgroundColor: GREEN, borderColor: GREEN },
                    current && { backgroundColor: GREEN, borderColor: GREEN },
                  ]}>
                    <Text style={styles.stepDotText}>
                      {done ? '✓' : step.emoji}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.stepLabel, (done || current) && { color: GREEN, fontWeight: '700' }]}>
                      {step.label}
                    </Text>
                    {current && <Text style={styles.stepDesc}>{step.desc}</Text>}
                  </View>
                  {current && (
                    <View style={styles.nowBadge}>
                      <Text style={styles.nowBadgeText}>Now</Text>
                    </View>
                  )}
                </View>
                {index < STATUS_STEPS.length - 1 && (
                  <View style={[styles.stepLine, done && { backgroundColor: GREEN }]} />
                )}
              </View>
            )
          })}
        </Animated.View>

        {/* ── Rider + dots ── */}
        <Animated.View style={[styles.waitCard, { opacity: cardOpacity, transform: [{ translateY: cardY }] }]}>
          <Animated.Text style={[styles.riderEmoji, { opacity: riderOpacity, transform: [{ translateX: riderX }] }]}>
            🛵
          </Animated.Text>
          <Text style={styles.waitTitle}>Naghihintay ng Rider...</Text>
          <Text style={styles.waitDesc}>
            Manatili sa bahay.{'\n'}
            Darating ang rider pagkatapos ng trip.
          </Text>
          <View style={styles.dotsRow}>
            <Animated.View style={[styles.dot, { opacity: dot1Opacity }]} />
            <Animated.View style={[styles.dot, { opacity: dot2Opacity }]} />
            <Animated.View style={[styles.dot, { opacity: dot3Opacity }]} />
          </View>
        </Animated.View>

        {/* ── COD reminder ── */}
        <View style={styles.codNote}>
          <Text style={styles.codIcon}>💳</Text>
          <Text style={styles.codText}>
            Bayad sa pagdating — <Text style={{ fontWeight: '700' }}>Cash on Delivery.</Text>
          </Text>
        </View>

        {/* ── Home button ── */}
        <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Home')} activeOpacity={0.85}>
          <Text style={styles.homeBtnIcon}>🏠</Text>
          <Text style={styles.homeBtnText}>Bumalik sa Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.viewBtn} onPress={() => navigation.navigate('MyGroceryOrders')} activeOpacity={0.8}>
          <Text style={styles.viewBtnText}>Tingnan ang Aking mga Order →</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#f0fdf8' },
  container:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, gap: 12, paddingTop: Platform.OS === 'android' ? 32 : 0 },

  checkCircle:  { width: 80, height: 80, borderRadius: 20, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', shadowColor: GREEN, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  checkText:    { fontSize: 40, color: '#fff', fontWeight: '700', lineHeight: 50 },

  title:        { fontSize: 22, fontWeight: '800', color: GREEN, textAlign: 'center', marginBottom: 2 },
  orderNum:     { fontSize: 12, color: '#64748b' },

  statusCard:   { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 0.5, borderColor: '#d1fae5' },
  stepRow:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepDot:      { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  stepDotText:  { fontSize: 14 },
  stepLabel:    { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  stepDesc:     { fontSize: 11, color: '#64748b', marginTop: 1 },
  stepLine:     { width: 2, height: 14, backgroundColor: '#e2e8f0', marginLeft: 15, marginVertical: 3 },
  nowBadge:     { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  nowBadgeText: { fontSize: 10, fontWeight: '700', color: GREEN },

  waitCard:     { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', gap: 6, borderWidth: 0.5, borderColor: '#d1fae5' },
  riderEmoji:   { fontSize: 44, marginBottom: 4 },
  waitTitle:    { fontSize: 16, fontWeight: '700', color: '#064e3b' },
  waitDesc:     { fontSize: 12, color: '#64748b', textAlign: 'center', lineHeight: 18 },
  dotsRow:      { flexDirection: 'row', gap: 8, marginTop: 4 },
  dot:          { width: 10, height: 10, borderRadius: 5, backgroundColor: GREEN },

  codNote:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fefce8', borderRadius: 12, width: '100%', padding: 12, borderWidth: 0.5, borderColor: '#fde68a' },
  codIcon:      { fontSize: 16 },
  codText:      { flex: 1, fontSize: 12, color: '#92400e' },

  homeBtn:      { width: '100%', backgroundColor: GREEN, borderRadius: 14, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: GREEN, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  homeBtnIcon:  { fontSize: 18 },
  homeBtnText:  { color: '#fff', fontSize: 15, fontWeight: '700' },
  viewBtn:      { paddingVertical: 6 },
  viewBtnText:  { fontSize: 13, color: '#2563eb', fontWeight: '600' },
})