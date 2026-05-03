import React, { useState, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, TextInput, KeyboardAvoidingView, ScrollView,
  Animated, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import OSMMap from '../../components/OSMMap'
import * as Location from 'expo-location'
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
}

const BACUAG_REGION = {
  latitude:       9.6301,
  longitude:      125.9701,
  latitudeDelta:  0.03,
  longitudeDelta: 0.03,
}

export default function PasabuyScreen({ navigation }) {
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [region,          setRegion]          = useState(BACUAG_REGION)
  const [markerCoord,     setMarkerCoord]     = useState(null)
  const [locating,        setLocating]        = useState(false)
  const [itemName,        setItemName]        = useState('')
  const [quantity,        setQuantity]        = useState(1)
  const [store,           setStore]           = useState('')
  const [budget,          setBudget]          = useState('')
  const [notes,           setNotes]           = useState('')
  const [isFullscreen,    setIsFullscreen]    = useState(false)

  const btnScale = useRef(new Animated.Value(1)).current
  const mapRef   = useRef(null)
  const quantityRef = useRef(null)
  const storeRef = useRef(null)
  const budgetRef = useRef(null)
  const notesRef = useRef(null)

  const resolveAddress = async (coords) => {
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

  const handleUseCurrent = async () => {
    try {
      setLocating(true)
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setDeliveryAddress('Location permission denied.')
        return
      }
      const loc    = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude }
      setMarkerCoord(coords)
      setRegion({ ...coords, latitudeDelta: 0.02, longitudeDelta: 0.02 })
      const addr = await resolveAddress(coords)
      setDeliveryAddress(addr)
    } catch {
      setDeliveryAddress('Unable to detect location.')
    } finally {
      setLocating(false)
    }
  }

  const handleMapPress = async (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate
    const coords = { latitude, longitude }
    setMarkerCoord(coords)
    const addr = await resolveAddress(coords)
    setDeliveryAddress(addr)
  }

  const handleContinue = () => {
    if (!deliveryAddress.trim() || !itemName.trim() || !budget.trim()) return
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1,    duration: 80, useNativeDriver: true }),
    ]).start(() => {
      navigation.navigate('PasabuyReview', {
        deliveryAddress,
        coordinates: markerCoord || { latitude: BACUAG_REGION.latitude, longitude: BACUAG_REGION.longitude },
        itemName: itemName.trim(),
        quantity,
        store: store.trim() || 'Not specified',
        budget: Number(budget).toFixed(2),
        notes: notes.trim(),
      })
    })
  }

  const canContinue = deliveryAddress.trim().length > 0 && itemName.trim().length > 0 && budget.trim().length > 0

  return (
    <SafeAreaView style={s.safe}>

      {/* Map */}
      <View style={isFullscreen ? s.mapFullscreen : s.mapArea}>
        <OSMMap
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          region={region}
          onPress={(coord) => handleMapPress({ nativeEvent: { coordinate: coord } })}
          markers={[
            ...(markerCoord ? [{ id: 'deliveryLoc', latitude: markerCoord.latitude, longitude: markerCoord.longitude, color: C.primary, title: 'Delivery Location' }] : [])
          ]}
        />

        {/* Floating nav buttons over map */}
        <View style={s.mapNav}>
          <TouchableOpacity style={s.floatBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Text style={s.floatBtnBack}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.floatBtn} onPress={() => setIsFullscreen(!isFullscreen)} activeOpacity={0.85}>
            <Text style={{ fontSize: 18 }}>{isFullscreen ? '↙️' : '↗️'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.floatBtn} onPress={() => navigation.navigate('MyGroceryOrders')} activeOpacity={0.85}>
            <Text style={{ fontSize: 16 }}>📋</Text>
          </TouchableOpacity>
        </View>

        {/* Map hint */}
        <View style={s.mapHint}>
          <Text style={s.mapHintText}>📍  Tap map to set pin</Text>
        </View>
      </View>

      {/* Combined details panel - hidden when fullscreen */}
      {!isFullscreen && (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={s.panel}
          contentContainerStyle={s.panelContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.sectionLabel}>DELIVERY ADDRESS</Text>

          <View style={s.inputRow}>
            <Text style={s.inputPin}>📍</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. Brgy. Campo, Bacuag"
              placeholderTextColor={C.textHint}
              value={deliveryAddress}
              onChangeText={(text) => {
                setDeliveryAddress(text)
                setMarkerCoord(null)
              }}
              returnKeyType="next"
              onSubmitEditing={() => quantityRef.current?.focus()}
              autoCorrect={false}
              autoCapitalize="words"
              multiline
            />
            {deliveryAddress.length > 0 && (
              <TouchableOpacity onPress={() => { setDeliveryAddress(''); setMarkerCoord(null) }}>
                <Text style={s.clearBtn}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={s.locBtn}
            onPress={handleUseCurrent}
            disabled={locating}
            activeOpacity={0.75}
          >
            {locating
              ? <ActivityIndicator size="small" color={C.primary} />
              : <Text style={s.locBtnIcon}>🎯</Text>
            }
            <Text style={s.locBtnText}>
              {locating ? 'Detecting location…' : 'Use My Current Location'}
            </Text>
          </TouchableOpacity>

          <Text style={s.sectionLabel}>PAPALIT DETAILS</Text>

          <TextInput
            style={s.textField}
            placeholder="Item name (e.g. Rice, noodles)"
            placeholderTextColor={C.textHint}
            value={itemName}
            onChangeText={setItemName}
            returnKeyType="next"
            onSubmitEditing={() => quantityRef.current?.focus()}
          />

          <View style={s.qtyRow}>
            <Text style={s.qtyLabel}>Quantity</Text>
            <View style={s.qtyControls}>
              <TouchableOpacity style={s.qtyBtn} onPress={() => setQuantity(q => Math.max(1, q - 1))} activeOpacity={0.75}>
                <Text style={s.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <TextInput
                ref={quantityRef}
                style={s.qtyValue}
                value={String(quantity)}
                onChangeText={(v) => {
                  const n = parseInt(v, 10)
                  if (!Number.isNaN(n) && n > 0) setQuantity(n)
                  if (v === '') setQuantity(1)
                }}
                keyboardType="number-pad"
                returnKeyType="next"
                onSubmitEditing={() => storeRef.current?.focus()}
              />
              <TouchableOpacity style={s.qtyBtn} onPress={() => setQuantity(q => q + 1)} activeOpacity={0.75}>
                <Text style={s.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TextInput
            ref={storeRef}
            style={s.textField}
            placeholder="Preferred store (optional)"
            placeholderTextColor={C.textHint}
            value={store}
            onChangeText={setStore}
            returnKeyType="next"
            onSubmitEditing={() => budgetRef.current?.focus()}
          />

          <View style={s.inputRowSingle}>
            <Text style={s.pesoSign}>₱</Text>
            <TextInput
              ref={budgetRef}
              style={s.input}
              placeholder="Budget amount"
              placeholderTextColor={C.textHint}
              value={budget}
              onChangeText={setBudget}
              keyboardType="numeric"
              returnKeyType="next"
              onSubmitEditing={() => notesRef.current?.focus()}
            />
          </View>

          <TextInput
            ref={notesRef}
            style={[s.textField, s.notesField]}
            placeholder="Notes / special instructions (optional)"
            placeholderTextColor={C.textHint}
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
          />

          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity
              style={[s.confirmBtn, !canContinue && s.confirmBtnDisabled]}
              onPress={handleContinue}
              disabled={!canContinue}
              activeOpacity={0.85}
            >
              <Text style={s.confirmBtnText}>
                {canContinue ? 'Next: Review Request →' : 'Complete address, item, and budget'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
      )}

    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  mapArea: { height: 250 },
  mapFullscreen: { flex: 1 },

  mapNav: {
    position: 'absolute', top: Platform.OS === 'android' ? 12 : 14,
    left: 14, right: 14,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  floatBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
  },
  floatBtnBack: { fontSize: 22, color: C.text, fontWeight: '700', lineHeight: 28 },

  mapHint: {
    position: 'absolute', bottom: 12, alignSelf: 'center',
    backgroundColor: 'rgba(15,23,42,0.6)',
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
  },
  mapHintText: { color: C.white, fontSize: 12, fontWeight: '600' },

  // Panel
  panel: {
    backgroundColor: C.white,
    borderTopWidth: 0.5, borderTopColor: C.border,
  },
  panelContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'android' ? 20 : 32,
    gap: 10,
  },

  sectionLabel: { fontSize: 10, fontWeight: '700', color: C.textHint, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 },

  inputRow:  { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: C.bg, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingTop: 4 },
  inputRowSingle: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12 },
  inputPin:  { fontSize: 15, paddingTop: 10, marginRight: 8 },
  input:     { flex: 1, fontSize: 13, color: C.text, paddingVertical: 10, textAlignVertical: 'top', minHeight: 44 },
  clearBtn:  { fontSize: 13, color: C.textHint, paddingLeft: 8, paddingTop: 13 },
  textField: { backgroundColor: C.bg, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 12, fontSize: 13, color: C.text },
  notesField: { minHeight: 82 },

  locBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.primaryLt, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14, borderWidth: 0.5, borderColor: C.primaryMd },
  locBtnIcon: { fontSize: 16 },
  locBtnText: { fontSize: 13, fontWeight: '700', color: C.primary },

  qtyRow: { marginTop: 2 },
  qtyLabel: { fontSize: 12, fontWeight: '700', color: C.textSub, marginBottom: 8 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 44, height: 44, borderRadius: 10, borderWidth: 1, borderColor: C.primaryMd, backgroundColor: C.primaryLt, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 22, color: C.primary, fontWeight: '700', lineHeight: 26 },
  qtyValue: { flex: 1, backgroundColor: C.bg, borderRadius: 10, borderWidth: 1, borderColor: C.border, textAlign: 'center', fontSize: 18, fontWeight: '700', color: C.text, paddingVertical: 10 },
  pesoSign: { fontSize: 17, fontWeight: '700', color: C.primary, marginRight: 8 },

  confirmBtn:         { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  confirmBtnDisabled: { backgroundColor: C.primaryMd, elevation: 0, shadowOpacity: 0 },
  confirmBtnText:     { color: C.white, fontSize: 15, fontWeight: '700' },
})
