import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Animated, Dimensions, ScrollView,
  Platform, ActivityIndicator, Alert, TextInput,
  FlatList, KeyboardAvoidingView
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import OSMMap from '../../components/OSMMap'
import * as Location from 'expo-location'
import { theme } from '../../theme/padulongTheme'

const { height: SCREEN_H } = Dimensions.get('window')
const SHEET_H       = SCREEN_H * 0.42
const GOOGLE_API_KEY = 'AIzaSyD6YRAdn3f001AR7t-rPp54RTS0lDxRhlM'

const C = {
  primary: theme.colors.primary,
  primaryLt: theme.colors.primarySoft,
  primaryMd: '#FFD4AE',
  pickup:    '#16A34A',
  pickupLt:  '#DCFCE7',
  dropoff:   '#DC2626',
  dropoffLt: '#FEE2E2',
  text: theme.colors.text,
  textSub: theme.colors.textSub,
  textHint: theme.colors.textHint,
  border: theme.colors.border,
  bg: theme.colors.background,
  white: theme.colors.surface,
}

const DEFAULT_REGION = {
  latitude:      9.6301,
  longitude:     125.9701,
  latitudeDelta:  0.04,
  longitudeDelta: 0.04,
}

export default function PasakayScreen({ navigation }) {
  const [pickup,         setPickup]         = useState(null)
  const [dropoff,        setDropoff]        = useState(null)
  const [pickupAddress,  setPickupAddress]  = useState('')
  const [dropoffAddress, setDropoffAddress] = useState('')
  const [selectingFor,   setSelectingFor]   = useState(null)
  const [region,         setRegion]         = useState(DEFAULT_REGION)
  const [locating,       setLocating]       = useState(true)
  const [routeCoords,    setRouteCoords]    = useState([])
  const [showMap,        setShowMap]        = useState(false)
  const [passengers,     setPassengers]     = useState(1)
  const [cargo,          setCargo]          = useState('none')
  const [searchQuery,    setSearchQuery]    = useState('')
  const [searchResults,  setSearchResults]  = useState([])
  const [searching,      setSearching]      = useState(false)
  const [isFullscreen,   setIsFullscreen]   = useState(false)

  const mapRef = useRef(null)
  const mapHeightAnim = useRef(new Animated.Value(SCREEN_H * 0.18)).current

  useEffect(() => { initLocation() }, [])
  useEffect(() => { if (pickup && dropoff) fetchRoute() }, [pickup, dropoff])
  useEffect(() => {
    Animated.timing(mapHeightAnim, {
      toValue: showMap ? SCREEN_H * 0.42 : SCREEN_H * 0.16,
      duration: 220,
      useNativeDriver: false,
    }).start()
  }, [showMap, mapHeightAnim])

  const reverseGeocode = async (coords) => {
    try {
      const [place] = await Location.reverseGeocodeAsync(coords)
      if (place) {
        return [place.name, place.street, place.district || place.subregion, place.city, place.region]
          .filter(Boolean).join(', ')
      }
      return `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`
    } catch {
      return `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`
    }
  }

  const initLocation = async () => {
    try {
      setLocating(true)
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') { setLocating(false); return }
      const loc    = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude }
      setPickup(coords)
      setRegion({ ...coords, latitudeDelta: 0.03, longitudeDelta: 0.03 })
      const addr = await reverseGeocode(coords)
      setPickupAddress(addr)
    } catch {
      setPickupAddress('Unable to detect location')
    } finally {
      setLocating(false)
    }
  }

  const fetchRoute = async () => {
    try {
      const res  = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${pickup.latitude},${pickup.longitude}&destination=${dropoff.latitude},${dropoff.longitude}&key=${GOOGLE_API_KEY}`
      )
      const data = await res.json()
      const pts  = data.routes?.[0]?.overview_polyline?.points
      if (pts) setRouteCoords(decodePolyline(pts))
    } catch {}
  }

  const decodePolyline = (encoded) => {
    let index = 0, lat = 0, lng = 0
    const coords = []
    while (index < encoded.length) {
      let b, shift = 0, result = 0
      do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5 } while (b >= 0x20)
      lat += result & 1 ? ~(result >> 1) : result >> 1
      shift = 0; result = 0
      do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5 } while (b >= 0x20)
      lng += result & 1 ? ~(result >> 1) : result >> 1
      coords.push({ latitude: lat / 1e5, longitude: lng / 1e5 })
    }
    return coords
  }

  const handleMapPress = async (e) => {
    if (!selectingFor) return
    const coords = e.nativeEvent.coordinate
    const addr   = await reverseGeocode(coords)
    if (selectingFor === 'pickup') {
      setPickup(coords); setPickupAddress(addr)
    } else {
      setDropoff(coords); setDropoffAddress(addr)
    }
    setSelectingFor(null)
  }

  const startSelecting = (type) => {
    setSelectingFor(type)
    setShowMap(true)
  }

  const cancelSelecting = () => {
    setSelectingFor(null)
    setSearchQuery('')
    setSearchResults([])
  }

  const handleSearch = async (text) => {
    setSearchQuery(text)
    if (text.length > 2) {
      setSearching(true)
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&addressdetails=1&limit=5`)
        const data = await res.json()
        setSearchResults(data)
      } catch (err) {
      } finally {
        setSearching(false)
      }
    } else {
      setSearchResults([])
    }
  }

  const selectSearchResult = (item) => {
    const coords = { latitude: parseFloat(item.lat), longitude: parseFloat(item.lon) }
    const addr = item.display_name
    if (selectingFor === 'pickup') {
      setPickup(coords); setPickupAddress(addr)
    } else {
      setDropoff(coords); setDropoffAddress(addr)
    }
    setRegion({ ...coords, latitudeDelta: 0.03, longitudeDelta: 0.03 })
    setSelectingFor(null)
    setSearchQuery('')
    setSearchResults([])
    setShowMap(false)
  }

  const handleUseCurrentForPickup = async () => {
    try {
      setLocating(true)
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is needed.')
        return
      }
      const loc    = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude }
      setPickup(coords)
      setRegion({ ...coords, latitudeDelta: 0.03, longitudeDelta: 0.03 })
      const addr = await reverseGeocode(coords)
      setPickupAddress(addr)
    } catch {
      Alert.alert('Error', 'Unable to detect your location.')
    } finally {
      setLocating(false)
    }
  }

  const handleContinue = () => {
    if (!pickup || !dropoff) {
      Alert.alert('Incomplete', 'Please select both a pickup and dropoff location.')
      return
    }
    navigation.navigate('PasakayVehicle', {
      pickup:        pickupAddress,
      dropoff:       dropoffAddress,
      pickupCoords:  pickup,
      dropoffCoords: dropoff,
      passengers,
      cargo,
    })
  }

  const isReady = pickup && dropoff

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* Map container */}
      <View style={{ flex: 1 }}>

      {/* ── MAP ── */}
      <Animated.View style={isFullscreen ? s.mapFullscreen : [s.mapShell, { height: mapHeightAnim }]}>
        <OSMMap
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          region={region}
          onPress={(coord) => handleMapPress({ nativeEvent: { coordinate: coord } })}
          markers={[
            ...(pickup  ? [{ id: 'pickup',  latitude: pickup.latitude,  longitude: pickup.longitude,  color: '#10B981', title: 'Pickup'  }] : []),
            ...(dropoff ? [{ id: 'dropoff', latitude: dropoff.latitude, longitude: dropoff.longitude, color: '#EF4444', title: 'Dropoff' }] : []),
          ]}
          polyline={routeCoords}
        />
      </Animated.View>

      {/* ── FLOATING HEADER ── */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.floatBtn} onPress={() => navigation.goBack()}>
          <Text style={s.floatBtnIcon}>‹</Text>
        </TouchableOpacity>
        <View style={s.topActions}>
          <TouchableOpacity style={s.mapToggleBtn} onPress={() => setShowMap(v => !v)} activeOpacity={0.8}>
            <Text style={s.mapToggleText}>{showMap ? 'Hide Map' : 'Show Map'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.floatBtn} onPress={() => setIsFullscreen(!isFullscreen)}>
            <Text style={{ fontSize: 18 }}>{isFullscreen ? '↙️' : '↗️'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.floatBtn} onPress={handleUseCurrentForPickup} disabled={locating}>
            {locating
              ? <ActivityIndicator size="small" color={C.primary} />
              : <Text style={{ fontSize: 18 }}>◎</Text>
            }
          </TouchableOpacity>
        </View>
      </View>

      {/* ── MAP HINT BANNER & SEARCH ── */}
      {selectingFor && (
        <View style={s.searchContainer}>
          <View style={s.mapHint}>
            <Text style={s.mapHintText}>
              {selectingFor === 'pickup'
                ? '📍 Tap map or search Pickup'
                : '🚩 Tap map or search Dropoff'}
            </Text>
            <TouchableOpacity onPress={cancelSelecting} style={s.cancelChip}>
              <Text style={s.cancelChipText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <View style={s.searchInputRow}>
            <TextInput
              style={s.searchInput}
              placeholder="Search address..."
              value={searchQuery}
              onChangeText={handleSearch}
              placeholderTextColor={C.textHint}
            />
            {searching && <ActivityIndicator size="small" color={C.primary} style={{ marginLeft: 8 }} />}
          </View>
          {searchResults.length > 0 && (
            <FlatList
              data={searchResults}
              keyExtractor={item => item.place_id.toString()}
              style={s.searchList}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity style={s.searchItem} onPress={() => selectSearchResult(item)}>
                  <Text style={s.searchItemText} numberOfLines={2}>{item.display_name}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}

      {!isFullscreen && (
      <View style={s.panel}>
        <ScrollView
          contentContainerStyle={s.panelContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {locating ? (
            <View style={s.locatingRow}>
              <ActivityIndicator size="small" color={C.primary} />
              <Text style={s.locatingText}>Detecting your location…</Text>
            </View>
          ) : (
            <>
            {/* PICKUP */}
            <TouchableOpacity
              style={[s.locationCard, { borderColor: selectingFor === 'pickup' ? C.pickup : C.pickupLt }]}
              onPress={() => startSelecting('pickup')}
              activeOpacity={0.75}
            >
              <View style={s.locationTopRow}>
                <View style={s.locationHeadLeft}>
                  <View style={[s.locDot, { backgroundColor: C.pickup }]} />
                  <Text style={[s.locLabel, { color: C.pickup }]}>PICKUP</Text>
                </View>
                <View style={[s.editChip, { backgroundColor: C.pickupLt, borderColor: '#BBF7D0' }]}>
                  <Text style={[s.editChipText, { color: C.pickup }]}>
                    {pickup ? 'Change' : 'Set'}
                  </Text>
                </View>
              </View>
              <Text style={[s.locAddr, !pickupAddress && s.locPlaceholder]} numberOfLines={1}>
                {pickupAddress || 'Tap to select on map'}
              </Text>
            </TouchableOpacity>

            {/* DROPOFF */}
            <TouchableOpacity
              style={[s.locationCard, { borderColor: selectingFor === 'dropoff' ? C.dropoff : C.dropoffLt, backgroundColor: '#FFF5F5' }]}
              onPress={() => startSelecting('dropoff')}
              activeOpacity={0.75}
            >
              <View style={s.locationTopRow}>
                <View style={s.locationHeadLeft}>
                  <View style={[s.locDot, { backgroundColor: C.dropoff }]} />
                  <Text style={[s.locLabel, { color: C.dropoff }]}>DROPOFF</Text>
                </View>
                <View style={[s.editChip, { backgroundColor: C.dropoffLt, borderColor: '#FECACA' }]}>
                  <Text style={[s.editChipText, { color: C.dropoff }]}>
                    {dropoff ? 'Change' : 'Set'}
                  </Text>
                </View>
              </View>
              <Text style={[s.locAddr, !dropoffAddress && s.locPlaceholder]} numberOfLines={1}>
                {dropoffAddress || 'Tap to select on map'}
              </Text>
            </TouchableOpacity>

            {/* Use current location (below pickup/dropoff) */}
            <TouchableOpacity
              style={s.currentBtn}
              onPress={handleUseCurrentForPickup}
              disabled={locating}
              activeOpacity={0.75}
            >
              <Text style={s.currentBtnText}>🎯  Use My Current Location as Pickup</Text>
            </TouchableOpacity>

            {/* CONTINUE */}
            <View style={s.inlineSummary}>
              <Text style={s.inlineSummaryTxt}>{passengers} {passengers === 1 ? 'passenger' : 'passengers'}</Text>
              <Text style={s.inlineSummaryDot}>•</Text>
              <Text style={s.inlineSummaryTxt}>
                {cargo === 'none' ? 'No cargo' : cargo === 'small' ? 'Small bag' : 'Large cargo'}
              </Text>
            </View>

            <View style={s.detailsCard}>
              <Text style={s.detailsTitle}>Trip Details</Text>
              <Text style={s.detailsSub}>Set passengers and cargo before selecting vehicle.</Text>

              <View style={s.paxRow}>
                {[1, 2, 3, 4, 5].map(n => {
                  const active = passengers === n
                  return (
                    <TouchableOpacity
                      key={n}
                      style={[s.paxBtn, active && s.paxBtnActive]}
                      onPress={() => setPassengers(n)}
                      activeOpacity={0.75}
                    >
                      <Text style={[s.paxNum, active && s.paxNumActive]}>{n}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>

              <View style={s.cargoRow}>
                {[
                  { key: 'none', label: 'No Cargo', emoji: '🚫' },
                  { key: 'small', label: 'Small Bag', emoji: '🎒' },
                  { key: 'bulky', label: 'Large Cargo', emoji: '📦' },
                ].map(c => {
                  const active = cargo === c.key
                  return (
                    <TouchableOpacity
                      key={c.key}
                      style={[s.cargoBtn, active && s.cargoBtnActive]}
                      onPress={() => setCargo(c.key)}
                      activeOpacity={0.75}
                    >
                      <Text style={s.cargoEmoji}>{c.emoji}</Text>
                      <Text style={[s.cargoLabel, active && s.cargoLabelActive]}>{c.label}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>

            <TouchableOpacity
              style={[s.continueBtn, !isReady && s.continueBtnDisabled]}
              onPress={handleContinue}
              disabled={!isReady}
              activeOpacity={0.85}
            >
              <Text style={s.continueBtnText}>
                {isReady ? 'Continue →' : 'Select Both Locations'}
              </Text>
            </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
      )}
      </View>
    </SafeAreaView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  mapShell: {
    marginHorizontal: 0,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#F3F3F3',
  },
  mapFullscreen: {
    flex: 1,
    marginHorizontal: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#F3F3F3',
  },
  // ── Floating Header ──
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mapToggleBtn: {
    backgroundColor: C.primaryLt,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.primaryMd,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mapToggleText: { color: C.primary, fontSize: 12, fontWeight: '700' },
  floatBtn:     { width: 48, height: 48, borderRadius: 24, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6 },
  floatBtnIcon: { fontSize: 24, color: C.text, fontWeight: '700', lineHeight: 30 },

  markerWrap: { alignItems: 'center' },

  // ── Map Hint & Search ──
  searchContainer: { position: 'absolute', top: 60, left: 20, right: 20, zIndex: 10 },
  mapHint: {
    backgroundColor: C.primary, borderRadius: 16,
    paddingVertical: 12, paddingHorizontal: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    elevation: 6, shadowColor: C.primary, shadowOpacity: 0.4, shadowRadius: 8,
    marginBottom: 8,
  },
  mapHintText:  { color: C.white, fontSize: 13, fontWeight: '600', flex: 1 },
  cancelChip:   { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginLeft: 8 },
  cancelChipText: { color: C.white, fontSize: 12, fontWeight: '700' },
  searchInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 },
  searchInput: { flex: 1, fontSize: 14, color: C.text },
  searchList: { backgroundColor: C.white, borderRadius: 14, marginTop: 8, maxHeight: 200, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 },
  searchItem: { padding: 12, borderBottomWidth: 0.5, borderBottomColor: C.border },
  searchItemText: { fontSize: 13, color: C.text },

  panel: {
    flex: 1,
    backgroundColor: C.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    marginTop: -8,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  panelContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'android' ? 24 : 34,
  },

  locatingRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8, paddingVertical: 12 },
  locatingText: { fontSize: 13, color: C.textSub },

  locationCard: {
    backgroundColor: '#F8FAFF', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 13,
    borderWidth: 1.5,
  },
  locationTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  locationHeadLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locDot:         { width: 12, height: 12, borderRadius: 6, flexShrink: 0 },
  locLabel:       { fontSize: 12, fontWeight: '700', letterSpacing: 0.4, marginBottom: 2, textTransform: 'uppercase' },
  locAddr:        { fontSize: 13, color: C.text, fontWeight: '500' },
  locPlaceholder: { color: C.textHint },
  editChip:       { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  editChipText:   { fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },

  currentBtn:     { backgroundColor: C.primaryLt, borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: C.primaryMd, marginTop: 6 },
  currentBtnText: { fontSize: 12, fontWeight: '700', color: C.primary },

  inlineSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 2 },
  inlineSummaryTxt: { fontSize: 12, fontWeight: '600', color: C.textSub },
  inlineSummaryDot: { fontSize: 12, color: C.textHint },

  detailsCard: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 12,
    gap: 10,
    marginTop: 10,
  },
  detailsTitle: { fontSize: 14, fontWeight: '800', color: C.text },
  detailsSub: { fontSize: 12, color: C.textSub },
  paxRow: { flexDirection: 'row', gap: 8 },
  paxBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
    alignItems: 'center',
    paddingVertical: 10,
  },
  paxBtnActive: { borderColor: C.primary, backgroundColor: C.primaryLt },
  paxNum: { fontSize: 16, fontWeight: '800', color: C.textSub },
  paxNumActive: { color: C.primary },
  cargoRow: { gap: 8 },
  cargoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  cargoBtnActive: { borderColor: C.primaryMd, backgroundColor: C.primaryLt },
  cargoEmoji: { fontSize: 16 },
  cargoLabel: { fontSize: 13, fontWeight: '600', color: C.textSub },
  cargoLabelActive: { color: C.primary, fontWeight: '700' },

  continueBtn:         { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 12, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  continueBtnDisabled: { backgroundColor: C.primaryMd, elevation: 0, shadowOpacity: 0 },
  continueBtnText:     { color: C.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
})
