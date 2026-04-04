// Screen 1: PasabuyScreen.js — Delivery Location
// FIXED: auto-back on keyboard, wrong coords (now Bacuag), TextInput stability

import React, { useState, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, TextInput,
  KeyboardAvoidingView, Animated,   // ✅ removed unused ScrollView
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import * as Location from 'expo-location'

const GREEN    = '#059669'
const GREEN_BG = '#ecfdf5'
const GREEN_DK = '#064e3b'

const BACUAG_REGION = {
  latitude:      9.6301,
  longitude:     125.9701,
  latitudeDelta:  0.03,
  longitudeDelta: 0.03,
}

export default function PasabuyScreen({ navigation }) {
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [usingCurrent,    setUsingCurrent]    = useState(false)
  const [region,          setRegion]          = useState(BACUAG_REGION)
  const [markerCoord,     setMarkerCoord]     = useState(null)
  const [locating,        setLocating]        = useState(false)

  const btnScale = useRef(new Animated.Value(1)).current
  const mapRef   = useRef(null)

  const handleUseCurrent = async () => {
    try {
      setLocating(true)
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setDeliveryAddress('Hindi pinayagan ang location')
        return
      }
      const loc    = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude }
      setMarkerCoord(coords)
      setRegion({ ...coords, latitudeDelta: 0.02, longitudeDelta: 0.02 })
      setUsingCurrent(true)

      const res  = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.latitude},${coords.longitude}&key=AIzaSyD6YRAdn3f001AR7t-rPp54RTS0lDxRhlM`
      )
      const data = await res.json()
      const addr = data.results?.[0]?.formatted_address
        || `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`
      setDeliveryAddress(addr)
    } catch {
      setDeliveryAddress('Hindi ma-detect ang location')
    } finally {
      setLocating(false)
    }
  }

  const handleMapPress = async (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate
    const coords = { latitude, longitude }
    setMarkerCoord(coords)
    setUsingCurrent(false)

    try {
      const res  = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyD6YRAdn3f001AR7t-rPp54RTS0lDxRhlM`
      )
      const data = await res.json()
      const addr = data.results?.[0]?.formatted_address
        || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
      setDeliveryAddress(addr)
    } catch {
      setDeliveryAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`)
    }
  }

  const handleConfirm = () => {
    if (!deliveryAddress.trim()) return
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1,    duration: 80, useNativeDriver: true }),
    ]).start(() => {
      navigation.navigate('PasabuyRequest', {
        deliveryAddress,
        coordinates: markerCoord || { latitude: BACUAG_REGION.latitude, longitude: BACUAG_REGION.longitude },
      })
    })
  }

  const canConfirm = deliveryAddress.trim().length > 0

  return (
    <SafeAreaView style={styles.safe}>
      <View style={{ flex: 1 }}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}><Text style={{ fontSize: 16 }}>🛒</Text></View>
            <Text style={styles.title}>Pasabuy</Text>
          </View>
          <TouchableOpacity style={styles.historyBtn} onPress={() => navigation.navigate('MyGroceryOrders')}>
            <Text style={styles.historyIcon}>📋</Text>
          </TouchableOpacity>
        </View>

        {/* ── Step indicator ── */}
        <View style={styles.stepRow}>
          {['Lokasyon', 'Detalye', 'Review', 'Kumpirma'].map((label, i) => (
            <View key={i} style={styles.stepItem}>
              <View style={[styles.stepDot, i === 0 && styles.stepDotActive]}>
                <Text style={[styles.stepNum, i === 0 && styles.stepNumActive]}>{i + 1}</Text>
              </View>
              <Text style={[styles.stepLabel, i === 0 && styles.stepLabelActive]}>{label}</Text>
            </View>
          ))}
        </View>

        {/* ── Map — fixed height, outside KeyboardAvoidingView ── */}
        <View style={styles.mapWrapper}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            provider={PROVIDER_GOOGLE}
            region={region}
            onPress={handleMapPress}
            moveOnMarkerPress={false}
          >
            {markerCoord && (
              <Marker coordinate={markerCoord} title="Delivery Location" pinColor={GREEN} />
            )}
          </MapView>

          {!markerCoord && (
            <View style={styles.mapHint}>
              <Text style={styles.mapHintText}>📍 I-tap ang mapa para piliin ang lokasyon</Text>
            </View>
          )}
          {markerCoord && (
            <View style={styles.mapSelected}>
              <Text style={styles.mapSelectedText}>✅ Napili na ang lokasyon</Text>
            </View>
          )}
        </View>

        {/* ── Bottom panel — KeyboardAvoidingView dito lang ── */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Saan ipapadala?</Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>📍</Text>
              <TextInput
                style={styles.input}
                placeholder="I-type ang delivery address..."
                placeholderTextColor="#94a3b8"
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                returnKeyType="done"
                blurOnSubmit={true}
                onSubmitEditing={() => {}}
                autoCorrect={false}
                autoCapitalize="none"
                textContentType="none"
                importantForAutofill="no"
              />
              {deliveryAddress.length > 0 && (
                <TouchableOpacity onPress={() => { setDeliveryAddress(''); setUsingCurrent(false); setMarkerCoord(null) }}>
                  <Text style={styles.clearIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.currentBtn}
              onPress={handleUseCurrent}
              activeOpacity={0.75}
              disabled={locating}
            >
              <Text style={styles.currentBtnText}>
                {locating
                  ? '⏳ Kinahanap ang location...'
                  : usingCurrent
                  ? '✅ Kasalukuyang lokasyon ang ginagamit'
                  : '🎯 Gamitin ang kasalukuyang lokasyon'}
              </Text>
            </TouchableOpacity>

            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity
                style={[styles.confirmBtn, !canConfirm && styles.confirmBtnDisabled]}
                onPress={handleConfirm}
                disabled={!canConfirm}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmBtnText}>
                  {canConfirm ? 'Kumpirmahin ang Lokasyon →' : 'Pumili ng Lokasyon'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>

      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 8 : 4,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5, borderBottomColor: '#d1fae5',
  },
  backBtn:    { width: 36, height: 36, borderRadius: 10, backgroundColor: GREEN_BG, alignItems: 'center', justifyContent: 'center' },
  backIcon:   { fontSize: 22, color: GREEN, fontWeight: '600', lineHeight: 28 },
  logoRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon:   { width: 32, height: 32, borderRadius: 8, backgroundColor: GREEN_BG, alignItems: 'center', justifyContent: 'center' },
  title:      { fontSize: 18, fontWeight: '700', color: GREEN_DK },
  historyBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: GREEN_BG, alignItems: 'center', justifyContent: 'center' },
  historyIcon:{ fontSize: 18 },

  stepRow:        { flexDirection: 'row', justifyContent: 'center', paddingVertical: 10, backgroundColor: '#fff' },
  stepItem:       { alignItems: 'center', width: 72 },
  stepDot:        { width: 26, height: 26, borderRadius: 13, backgroundColor: '#f1f5f9', borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  stepDotActive:  { backgroundColor: GREEN, borderColor: GREEN },
  stepNum:        { fontSize: 11, fontWeight: '700', color: '#94a3b8' },
  stepNumActive:  { color: '#fff' },
  stepLabel:      { fontSize: 9, color: '#94a3b8', fontWeight: '600' },
  stepLabelActive:{ color: GREEN },

  mapWrapper:      { height: 240, position: 'relative' },
  mapHint:         { position: 'absolute', bottom: 12, left: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, alignItems: 'center' },
  mapHintText:     { color: '#fff', fontSize: 12, fontWeight: '600' },
  mapSelected:     { position: 'absolute', bottom: 12, left: 20, right: 20, backgroundColor: GREEN, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, alignItems: 'center' },
  mapSelectedText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  panel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 20, paddingTop: 16,
    paddingBottom: Platform.OS === 'android' ? 20 : 28,
    borderTopWidth: 0.5, borderTopColor: '#e2e8f0',
    gap: 10,
  },
  panelTitle:   { fontSize: 15, fontWeight: '700', color: GREEN_DK },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 12 },
  inputIcon:    { fontSize: 16, marginRight: 8 },
  input:        { flex: 1, fontSize: 14, color: '#0f172a', paddingVertical: 12, textAlignVertical: 'center' },
  clearIcon:    { fontSize: 14, color: '#94a3b8', paddingLeft: 8, paddingVertical: 12 },

  currentBtn:         { backgroundColor: GREEN_BG, borderRadius: 12, paddingVertical: 11, alignItems: 'center', borderWidth: 1, borderColor: '#a7f3d0' },
  currentBtnText:     { fontSize: 13, color: GREEN, fontWeight: '700' },
  confirmBtn:         { backgroundColor: GREEN, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  confirmBtnDisabled: { backgroundColor: '#a7f3d0' },
  confirmBtnText:     { color: '#fff', fontSize: 15, fontWeight: '700' },
})