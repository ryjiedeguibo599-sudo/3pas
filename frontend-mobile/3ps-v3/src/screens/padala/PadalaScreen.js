import React, { useState, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, StatusBar, Alert, Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Location from 'expo-location'
import OSMMap from '../../components/OSMMap'
import { theme } from '../../theme/padulongTheme'

const C = {
  primary: theme.colors.primary,
  primaryLt: theme.colors.primarySoft,
  primaryMd: '#FFD4AE',
  text: theme.colors.text,
  textSub: theme.colors.textSub,
  textHint: theme.colors.textHint,
  border: theme.colors.border,
  bg: theme.colors.background,
  white: theme.colors.surface,
  green: theme.colors.success,
}

const BACUAG_REGION = {
  latitude: 9.6301, longitude: 125.9701,
  latitudeDelta: 0.05, longitudeDelta: 0.05,
}

const STEPS = ['Location + Sender', 'Item', 'Schedule', 'Review']

export function StepBar({ current }) {
  return (
    <View style={sb.row}>
      {STEPS.map((label, i) => {
        const n      = i + 1
        const active = n <= current
        return (
          <React.Fragment key={label}>
            <View style={sb.item}>
              <View style={[sb.dot, active && sb.dotActive]}>
                <Text style={[sb.num, active && sb.numActive]}>
                  {n < current ? '✓' : n}
                </Text>
              </View>
              <Text style={[sb.label, n === current && sb.labelActive]}>{label}</Text>
            </View>
            {i < STEPS.length - 1 && <View style={sb.connector} />}
          </React.Fragment>
        )
      })}
    </View>
  )
}

export default function PadalaScreen({ navigation }) {
  const [myCoords,    setMyCoords]    = useState(null)
  const [destCoords,  setDestCoords]  = useState(null)
  const [destAddress, setDestAddress] = useState('')
  const [guide,       setGuide]       = useState('')
  const [senderName, setSenderName] = useState('')
  const [senderPhone, setSenderPhone] = useState('')
  const [receiverName, setReceiverName] = useState('')
  const [receiverPhone, setReceiverPhone] = useState('')
  const [receiverNote, setReceiverNote] = useState('')
  const [locLoading,  setLocLoading]  = useState(false)
  const [region,      setRegion]      = useState(BACUAG_REGION)
  const [errors, setErrors] = useState({})
  const [isFullscreen, setIsFullscreen] = useState(false)
  const mapRef = useRef(null)
  const btnScale = useRef(new Animated.Value(1)).current

  const reverseGeocode = async (coords) => {
    try {
      const [place] = await Location.reverseGeocodeAsync(coords)
      if (place) {
        const parts = [place.name, place.street, place.district || place.subregion, place.city].filter(Boolean)
        return parts.join(', ')
      }
      return `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`
    } catch {
      return `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`
    }
  }

  const onMapPress = async (e) => {
    const coords = e.nativeEvent.coordinate
    setDestCoords(coords)
    try {
      const addr = await reverseGeocode(coords)
      setDestAddress(addr)
    } catch {
      setDestAddress(`${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`)
    }
  }

  const detectMyLocation = async () => {
    try {
      setLocLoading(true)
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is needed to detect your position.')
        return
      }
      const loc    = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude }
      setMyCoords(coords)
      setRegion({ ...coords, latitudeDelta: 0.008, longitudeDelta: 0.008 })
      mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.008, longitudeDelta: 0.008 }, 600)
    } catch {
      Alert.alert('Error', 'Unable to detect your location. Please try again.')
    } finally {
      setLocLoading(false)
    }
  }

  const handleNext = () => {
    const e = {}
    if (!destCoords) {
      e.dest = 'Please tap map to set destination.'
    }
    if (!senderName.trim()) e.senderName = 'Required'
    if (!senderPhone.trim()) e.senderPhone = 'Required'
    if (!receiverName.trim()) e.receiverName = 'Required'
    if (!receiverPhone.trim()) e.receiverPhone = 'Required'
    setErrors(e)
    if (Object.keys(e).length) return

    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start(() => {
      navigation.navigate('PadalaStep3', {
        myCoords,
        destCoords,
        destAddress,
        guide,
        senderName: senderName.trim(),
        senderPhone: senderPhone.trim(),
        receiverName: receiverName.trim(),
        receiverPhone: receiverPhone.trim(),
        receiverNote: receiverNote.trim(),
      })
    })
  }

  const clearDest = () => {
    setDestCoords(null)
    setDestAddress('')
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <StepBar current={1} />

      {/* ── Map container ── */}
      <View style={s.mapContainer}>

        <OSMMap
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          region={region}
          onPress={(coord) => onMapPress({ nativeEvent: { coordinate: coord } })}
          markers={[
            ...(myCoords ? [{ id: 'myLoc', latitude: myCoords.latitude, longitude: myCoords.longitude, color: '#2563EB', title: 'Me' }] : []),
            ...(destCoords ? [{ id: 'destLoc', latitude: destCoords.latitude, longitude: destCoords.longitude, color: '#DC2626', title: 'Destination' }] : [])
          ]}
        />

        {/* ── Floating top bar ── */}
        <View style={s.topBar}>
          <TouchableOpacity style={s.floatBtn} onPress={() => navigation.goBack()}>
            <Text style={s.floatBtnIcon}>‹</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={s.floatBtn} onPress={() => setIsFullscreen(!isFullscreen)}>
              <Text style={{ fontSize: 18 }}>{isFullscreen ? '↙️' : '↗️'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.floatBtn}
              onPress={() => navigation.navigate('MyDeliveryRequests')}
            >
              <Text style={{ fontSize: 16 }}>📋</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Map hint ── */}
        {!destCoords && !isFullscreen && (
          <View style={s.mapHint}>
            <Text style={s.mapHintText}>🚩  Tap the map to set delivery destination</Text>
          </View>
        )}

        {/* ── Detect location floating button ── */}
        <TouchableOpacity
          style={[s.detectBtn, isFullscreen && s.detectBtnFullscreen]}
          onPress={detectMyLocation}
          disabled={locLoading}
          activeOpacity={0.85}
        >
          {locLoading
            ? <ActivityIndicator size="small" color={C.white} />
            : <Text style={s.detectBtnText}>🎯  My Location</Text>
          }
        </TouchableOpacity>

        {/* ── Bottom sheet ── */}
        {!isFullscreen && (
        <View style={s.sheet}>
          <View style={s.sheetHandle} />

          <Text style={s.sectionLabel}>DESTINATION</Text>
          <View style={[s.destRow, destCoords && s.destRowActive]}>
            <View style={[s.destDot, { backgroundColor: destCoords ? C.primary : C.textHint }]} />
            <Text
              style={[s.destText, !destCoords && s.destPlaceholder]}
              numberOfLines={1}
            >
              {destAddress || 'Tap the map to set delivery address'}
            </Text>
            {destCoords && (
              <TouchableOpacity
                onPress={clearDest}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={s.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          {!!errors.dest && <Text style={s.errTxt}>{errors.dest}</Text>}

          <Text style={s.sectionLabel}>SENDER & RECEIVER</Text>
          <TextInput
            style={[s.input, errors.senderName && s.inputError]}
            placeholder="Sender full name *"
            placeholderTextColor={C.textHint}
            value={senderName}
            onChangeText={(v) => { setSenderName(v); setErrors(p => ({ ...p, senderName: null })) }}
          />
          <TextInput
            style={[s.input, errors.senderPhone && s.inputError]}
            placeholder="Sender contact number *"
            placeholderTextColor={C.textHint}
            value={senderPhone}
            onChangeText={(v) => { setSenderPhone(v); setErrors(p => ({ ...p, senderPhone: null })) }}
            keyboardType="phone-pad"
          />
          <TextInput
            style={[s.input, errors.receiverName && s.inputError]}
            placeholder="Receiver full name *"
            placeholderTextColor={C.textHint}
            value={receiverName}
            onChangeText={(v) => { setReceiverName(v); setErrors(p => ({ ...p, receiverName: null })) }}
          />
          <TextInput
            style={[s.input, errors.receiverPhone && s.inputError]}
            placeholder="Receiver contact number *"
            placeholderTextColor={C.textHint}
            value={receiverPhone}
            onChangeText={(v) => { setReceiverPhone(v); setErrors(p => ({ ...p, receiverPhone: null })) }}
            keyboardType="phone-pad"
          />
          <TextInput
            style={[s.input, s.textArea]}
            placeholder='Note for receiver/rider (optional)'
            placeholderTextColor={C.textHint}
            value={receiverNote}
            onChangeText={setReceiverNote}
            multiline
            textAlignVertical="top"
          />

          <TextInput
            style={s.guideInput}
            placeholder='Guide for rider (e.g. "Near the blue gate, 2nd house")'
            placeholderTextColor={C.textHint}
            value={guide}
            onChangeText={setGuide}
            returnKeyType="done"
          />

          {/* Next button */}
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity
              style={[s.nextBtn, !destCoords && s.nextBtnDisabled]}
              onPress={handleNext}
              disabled={!destCoords}
              activeOpacity={0.85}
            >
              <Text style={s.nextBtnText}>
                {destCoords ? 'Next: Padaya Item Details →' : 'Set a Destination First'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
        )}

      </View>
    </SafeAreaView>
  )
}

// ── Step bar styles ──────────────────────────────────────────────
const sb = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 8, backgroundColor: C.white, borderBottomWidth: 0.5, borderBottomColor: C.border },
  item:      { alignItems: 'center' },
  connector: { flex: 1, height: 1.5, backgroundColor: C.border, marginHorizontal: 3, marginBottom: 14 },
  dot:       { width: 22, height: 22, borderRadius: 11, backgroundColor: '#F1F5F9', borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  dotActive: { backgroundColor: C.primary, borderColor: C.primary },
  num:       { fontSize: 9, fontWeight: '700', color: C.textHint },
  numActive: { color: C.white },
  label:     { fontSize: 7, color: C.textHint, fontWeight: '600' },
  labelActive: { color: C.primary },
})

// ── Screen styles ────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: C.white },
  mapContainer: { flex: 1 },

  markerWrap: { alignItems: 'center' },

  // Floating top bar
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8,
  },
  floatBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  floatBtnIcon: { fontSize: 24, color: C.text, fontWeight: '700', lineHeight: 30 },

  // Map hint
  mapHint:     { position: 'absolute', top: 62, alignSelf: 'center', backgroundColor: 'rgba(91,53,20,0.82)', borderRadius: 22, paddingHorizontal: 18, paddingVertical: 9 },
  mapHintText: { color: C.white, fontSize: 13, fontWeight: '600' },

  // Detect location button (floating inside map)
  detectBtn:     { position: 'absolute', bottom: 230, right: 16, backgroundColor: C.primary, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, elevation: 5, shadowColor: C.primary, shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, flexDirection: 'row', alignItems: 'center' },
  detectBtnText: { color: C.white, fontSize: 13, fontWeight: '700' },
  detectBtnFullscreen: { bottom: 24 },

  // Bottom sheet
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: C.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28,
    elevation: 16, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: -4 },
    gap: 12,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 4 },

  // Destination row
  destRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.bg, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 13,
    borderWidth: 1.5, borderColor: C.border,
  },
  destRowActive:   { borderColor: C.primary, backgroundColor: C.primaryLt },
  destDot:         { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  destText:        { flex: 1, fontSize: 13, color: C.text, fontWeight: '600' },
  destPlaceholder: { color: C.textHint, fontWeight: '400' },
  clearIcon:       { fontSize: 13, color: C.textHint, fontWeight: '700' },

  // Guide input
  sectionLabel: { fontSize: 10, fontWeight: '700', color: C.textHint, letterSpacing: 0.8, marginTop: 2 },
  input: {
    backgroundColor: C.bg, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 13, color: C.text,
  },
  inputError: { borderColor: '#D14343' },
  textArea: { minHeight: 68 },
  guideInput: {
    backgroundColor: C.bg, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 13, color: C.text,
  },

  // Next button
  nextBtn:         { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  nextBtnDisabled: { backgroundColor: C.primaryMd, elevation: 0, shadowOpacity: 0 },
  nextBtnText:     { color: C.white, fontSize: 15, fontWeight: '700' },
  errTxt: { fontSize: 11, color: '#D14343', marginTop: -6 },
})
