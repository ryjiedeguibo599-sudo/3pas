// 📁 frontend-mobile/3ps-v3/src/screens/OnboardingScreen.js

import React, { useRef, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Dimensions, StatusBar,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const { width } = Dimensions.get('window')

const C = {
  primary:   '#0D6B63',
  primaryLt: '#E6F4F2',
  white:     '#FFFFFF',
  text:      '#111827',
  textSub:   '#6B7280',
  textHint:  '#9CA3AF',
  border:    '#EEEFF2',
}

const SLIDES = [
  {
    id:    '1',
    emoji: '👋',
    title: 'Welcome sa 3PS!',
    desc:  'Ang 3PS ay isang all-in-one municipal service app para sa mga residente.',
    bg:    C.primaryLt,
    acc:   C.primary,
  },
  {
    id:    '2',
    emoji: '🛒',
    title: 'PasaBUY',
    desc:  'Mag-order ng groceries at errands — may shopper na magde-deliver sa inyo!',
    bg:    '#EFF6FF',
    acc:   '#2563EB',
  },
  {
    id:    '3',
    emoji: '🛵',
    title: 'Pasakay',
    desc:  'Mag-book ng ride kahit saan sa loob ng munisipyo — mabilis at abot-kaya!',
    bg:    '#F0FDF4',
    acc:   '#16A34A',
  },
  {
    id:    '4',
    emoji: '🔧',
    title: 'PaRepair',
    desc:  'May sirang appliance o bahay? Mag-request ng repair — darating ang technician!',
    bg:    '#FFF7ED',
    acc:   '#EA580C',
  },
]

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const flatRef = useRef(null)

  const goNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: currentIndex + 1 })
      setCurrentIndex(currentIndex + 1)
    } else {
      finish()
    }
  }

  const finish = async () => {
    await AsyncStorage.setItem('onboarded', 'true')
    navigation.replace('Home')
  }

  const onScroll = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width)
    setCurrentIndex(idx)
  }

  const isLast = currentIndex === SLIDES.length - 1
  const slide  = SLIDES[currentIndex]

  return (
    <View style={os.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      <FlatList
        ref={flatRef}
        data={SLIDES}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={[os.slide, { width, backgroundColor: item.bg }]}>
            {/* Logo badge */}
            <View style={[os.logoBadge, { backgroundColor: item.acc }]}>
              <Text style={os.logoTxt}>3PS</Text>
            </View>

            <Text style={os.slideEmoji}>{item.emoji}</Text>
            <Text style={[os.slideTitle, { color: item.acc }]}>{item.title}</Text>
            <Text style={os.slideDesc}>{item.desc}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={os.dotsRow}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              os.dot,
              {
                backgroundColor: i === currentIndex ? slide.acc : C.border,
                width: i === currentIndex ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Buttons */}
      <View style={os.btnRow}>
        {!isLast ? (
          <>
            <TouchableOpacity onPress={finish} style={os.skipBtn} activeOpacity={0.7}>
              <Text style={os.skipTxt}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={goNext}
              style={[os.nextBtn, { backgroundColor: slide.acc }]}
              activeOpacity={0.85}
            >
              <Text style={os.nextTxt}>Susunod →</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            onPress={finish}
            style={[os.startBtn, { backgroundColor: slide.acc }]}
            activeOpacity={0.85}
          >
            <Text style={os.startTxt}>Magsimula na! 🚀</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const os = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.white },

  slide: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 40, gap: 0,
  },
  logoBadge: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 32,
  },
  logoTxt:    { fontSize: 18, fontWeight: '800', color: C.white, letterSpacing: -0.5 },
  slideEmoji: { fontSize: 72, marginBottom: 24 },
  slideTitle: { fontSize: 26, fontWeight: '700', textAlign: 'center', marginBottom: 14 },
  slideDesc:  { fontSize: 15, color: C.textSub, textAlign: 'center', lineHeight: 24 },

  // Dots
  dotsRow: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 24, gap: 6,
  },
  dot: { height: 8, borderRadius: 4 },

  // Buttons
  btnRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28, paddingBottom: 48, gap: 12,
  },
  skipBtn:  { paddingVertical: 14, paddingHorizontal: 8 },
  skipTxt:  { color: C.textHint, fontSize: 15, fontWeight: '600' },
  nextBtn: {
    flex: 1, paddingVertical: 15, borderRadius: 13,
    alignItems: 'center',
  },
  nextTxt:  { color: C.white, fontSize: 15, fontWeight: '700' },
  startBtn: {
    flex: 1, paddingVertical: 15, borderRadius: 13,
    alignItems: 'center',
  },
  startTxt: { color: C.white, fontSize: 15, fontWeight: '700' },
})