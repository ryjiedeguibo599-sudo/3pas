import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
  SafeAreaView, Platform, Modal, TextInput,
  Alert, Image
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as Location from 'expo-location'
import MapView, { Marker } from 'react-native-maps'
import { useRef } from 'react'
import API from '../../services/api'

const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dkivme2vb/image/upload'
const UPLOAD_PRESET  = 'duhfdpiw'

const REPAIR_TYPES = [
  {
    key: 'home',
    label: 'Home Repair',
    icon: '🏠',
    examples: 'Broken door, leaking faucet, busted lock...',
  },
  {
    key: 'vehicle',
    label: 'Vehicle Repair',
    icon: '🔧',
    examples: 'Motorcycle won\'t start, flat tire...',
  },
  {
    key: 'appliance',
    label: 'Appliance Repair',
    icon: '📺',
    examples: 'Washing machine not spinning, TV no display...',
  },
]

const BLUE    = '#1d4ed8'
const BLUE_BG = '#eff6ff'

export default function PaRepairScreen({ navigation }) {
  const [problemTitle, setProblemTitle]   = useState('')
  const [description, setDescription]    = useState('')
  const [address, setAddress]            = useState('')
  const [repairType, setRepairType]      = useState('')
  const [photos, setPhotos]              = useState([])
  const [uploading, setUploading]        = useState(false)
  const [locLoading, setLocLoading]      = useState(false)
  const [mapVisible, setMapVisible]      = useState(false)
  const [markerCoords, setMarkerCoords]  = useState(null)
  const [region, setRegion]              = useState({
    latitude:       11.9674,
    longitude:      125.4286,
    latitudeDelta:  0.01,
    longitudeDelta: 0.01,
  })
  const mapRef = useRef(null)

  // ── Open map ─────────────────────────────────────────────────
  const openMapPicker = async () => {
    try {
      setLocLoading(true)
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission', 'Kailangan ng permission para ma-access ang location.')
        return
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      const { latitude, longitude } = loc.coords
      setRegion({ latitude, longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 })
      setMarkerCoords({ latitude, longitude })
      setMapVisible(true)
    } catch {
      setMapVisible(true)
    } finally {
      setLocLoading(false)
    }
  }

  const onMapPress = (e) => setMarkerCoords(e.nativeEvent.coordinate)

  const confirmLocation = async () => {
    if (!markerCoords) {
      Alert.alert('Walang napili', 'I-tap ang exact na lugar sa mapa.')
      return
    }
    try {
      setLocLoading(true)
      const [place] = await Location.reverseGeocodeAsync(markerCoords)
      if (place) {
        const parts = [place.name, place.street, place.district || place.subregion, place.city, place.region].filter(Boolean)
        setAddress(parts.join(', '))
      } else {
        setAddress(`${markerCoords.latitude.toFixed(6)}, ${markerCoords.longitude.toFixed(6)}`)
      }
      setMapVisible(false)
    } catch {
      Alert.alert('Error', 'Hindi ma-convert ang location. Try again.')
    } finally {
      setLocLoading(false)
    }
  }

  // ── Photo handling ───────────────────────────────────────────
  const pickImage = async () => {
    if (photos.length >= 3) { Alert.alert('Maximum', 'Hanggang 3 photos lang pwede!'); return }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) { Alert.alert('Permission', 'Kailangan ng permission para ma-access ang photos.'); return }
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.7 })
    if (!result.canceled) uploadToCloudinary(result.assets[0].uri)
  }

  const uploadToCloudinary = async (uri) => {
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', { uri, type: 'image/jpeg', name: `repair_${Date.now()}.jpg` })
      formData.append('upload_preset', UPLOAD_PRESET)
      const res  = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData })
      const data = await res.json()
      setPhotos(prev => [...prev, data.secure_url])
    } catch {
      Alert.alert('Error', 'Hindi na-upload ang photo. Try again.')
    } finally {
      setUploading(false)
    }
  }

  const removePhoto = (index) => setPhotos(prev => prev.filter((_, i) => i !== index))

  // ── Validation & Next ────────────────────────────────────────
  const handleNext = () => {
    if (!address.trim()) {
      Alert.alert('Kulang', 'Pakiusap pumili ng lokasyon.')
      return
    }
    if (!repairType) {
      Alert.alert('Kulang', 'Pakiusap piliin ang uri ng repair.')
      return
    }
    if (!problemTitle.trim()) {
      Alert.alert('Kulang', 'Pakiusap lagyan ng pamagat ang problema.')
      return
    }
    if (!description.trim()) {
      Alert.alert('Kulang', 'Pakiusap ilarawan ang problema.')
      return
    }
    navigation.navigate('ScheduleRepair', {
      address,
      repairType,
      problemTitle,
      description,
      photos,
    })
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Text style={{ fontSize: 16 }}>🔧</Text>
            </View>
            <Text style={styles.title}>Pa-Repair</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* ── Steps indicator ── */}
        <View style={styles.stepsRow}>
          {['Lokasyon', 'Uri', 'Detalye', 'Iskedyul', 'Review'].map((s, i) => (
            <View key={s} style={styles.stepItem}>
              <View style={[styles.stepDot, i < 3 && styles.stepDotActive]}>
                <Text style={[styles.stepNum, i < 3 && styles.stepNumActive]}>{i + 1}</Text>
              </View>
              <Text style={[styles.stepLabel, i < 3 && styles.stepLabelActive]}>{s}</Text>
            </View>
          ))}
        </View>

        {/* ── SCREEN 1: Service Location ── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionBadge}><Text style={styles.sectionBadgeText}>1</Text></View>
          <Text style={styles.sectionTitle}>Saan kailangan ng repair?</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Lokasyon ng Serbisyo</Text>
          <View style={styles.addressRow}>
            <Text style={styles.pinIcon}>📍</Text>
            <TextInput
              style={styles.addressInput}
              placeholder="I-tap ang mapa para pumili ng lugar..."
              placeholderTextColor="#94a3b8"
              value={address}
              onChangeText={setAddress}
            />
            {address ? (
              <TouchableOpacity onPress={() => { setAddress(''); setMarkerCoords(null) }}>
                <Text style={{ color: '#94a3b8', fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity style={styles.locBtn} onPress={openMapPicker} disabled={locLoading} activeOpacity={0.8}>
            {locLoading
              ? <ActivityIndicator size="small" color={BLUE} />
              : <Text style={styles.locBtnIcon}>🗺️</Text>
            }
            <Text style={styles.locBtnText}>
              {markerCoords ? 'Baguhin ang Lokasyon sa Mapa' : 'Pumili ng Lokasyon sa Mapa'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Map Modal ── */}
        <Modal visible={mapVisible} animationType="slide" onRequestClose={() => setMapVisible(false)}>
          <SafeAreaView style={styles.mapModal}>
            <View style={styles.mapHeader}>
              <TouchableOpacity style={styles.mapBackBtn} onPress={() => setMapVisible(false)}>
                <Text style={styles.backIcon}>✕</Text>
              </TouchableOpacity>
              <View>
                <Text style={styles.mapTitle}>Piliin ang Eksaktong Lugar</Text>
                <Text style={styles.mapSubtitle}>I-tap ang mapa para mag-pin ng lokasyon</Text>
              </View>
              <View style={{ width: 36 }} />
            </View>
            <MapView
              ref={mapRef}
              style={styles.map}
              region={region}
              onRegionChangeComplete={setRegion}
              onPress={onMapPress}
              showsUserLocation
              showsMyLocationButton
            >
              {markerCoords && (
                <Marker coordinate={markerCoords} title="Napiling Lugar" pinColor={BLUE} />
              )}
            </MapView>
            {!markerCoords && (
              <View style={styles.mapHint}>
                <Text style={styles.mapHintText}>👆 I-tap ang exact na lugar sa mapa</Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.mapConfirmBtn, !markerCoords && styles.mapConfirmBtnDisabled]}
              onPress={confirmLocation}
              disabled={!markerCoords || locLoading}
              activeOpacity={0.85}
            >
              {locLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.mapConfirmText}>✓  Gamitin ang Lugar na Ito</Text>
              }
            </TouchableOpacity>
          </SafeAreaView>
        </Modal>

        {/* ── SCREEN 2: Choose Repair Type ── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionBadge}><Text style={styles.sectionBadgeText}>2</Text></View>
          <Text style={styles.sectionTitle}>Ano ang uri ng repair?</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Piliin ang Kategorya</Text>
          <View style={styles.typeGrid}>
            {REPAIR_TYPES.map(type => (
              <TouchableOpacity
                key={type.key}
                style={[styles.typeCard, repairType === type.key && styles.typeCardActive]}
                onPress={() => setRepairType(type.key)}
                activeOpacity={0.75}
              >
                <Text style={styles.typeIcon}>{type.icon}</Text>
                <Text style={[styles.typeLabel, repairType === type.key && styles.typeLabelActive]}>
                  {type.label}
                </Text>
                <Text style={[styles.typeExamples, repairType === type.key && styles.typeExamplesActive]}>
                  {type.examples}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── SCREEN 3: Problem Details ── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionBadge}><Text style={styles.sectionBadgeText}>3</Text></View>
          <Text style={styles.sectionTitle}>Ano ang problema?</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Pamagat ng Problema</Text>
          <TextInput
            style={styles.input}
            placeholder="Hal. Leaking faucet, Sira na gripo..."
            placeholderTextColor="#94a3b8"
            value={problemTitle}
            onChangeText={setProblemTitle}
          />

          <Text style={[styles.label, { marginTop: 12 }]}>Ilarawan ang Problema</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Ilarawan nang mas detalyado ang iyong problema..."
            placeholderTextColor="#94a3b8"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <Text style={[styles.label, { marginTop: 12 }]}>Mga Larawan (Optional, Max 3)</Text>
          <View style={styles.photoRow}>
            {photos.length < 3 && (
              <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImage} disabled={uploading} activeOpacity={0.7}>
                {uploading
                  ? <ActivityIndicator color={BLUE} />
                  : <>
                      <View style={styles.addPhotoPlus}>
                        <Text style={{ color: '#fff', fontSize: 20, lineHeight: 22 }}>+</Text>
                      </View>
                      <Text style={styles.addPhotoText}>Magdagdag ng Larawan</Text>
                    </>
                }
              </TouchableOpacity>
            )}
            {photos.map((uri, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image source={{ uri }} style={styles.photo} />
                <TouchableOpacity style={styles.removeBtn} onPress={() => removePhoto(index)}>
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* ── Info ── */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Impormasyon</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>⏱️</Text>
            <Text style={styles.infoText}>Makikipag-ugnayan sa iyo sa loob ng 30 minuto</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>💳</Text>
            <Text style={styles.infoText}>Cash o GCash pagkatapos ng repair</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>⭐</Text>
            <Text style={styles.infoText}>May Rating System para sa bawat technician</Text>
          </View>
        </View>

        {/* ── Next button ── */}
        <TouchableOpacity
          style={[styles.nextBtn, uploading && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={uploading}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>Susunod: Iskedyul →</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#f8fafc' },
  container:      { flex: 1, backgroundColor: '#f8fafc' },

  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 48 : 12, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' },
  backBtn:        { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  backIcon:       { fontSize: 22, color: BLUE, fontWeight: '600', lineHeight: 28 },
  logoRow:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon:       { width: 32, height: 32, borderRadius: 8, backgroundColor: BLUE_BG, alignItems: 'center', justifyContent: 'center' },
  title:          { fontSize: 18, fontWeight: '700', color: '#0f172a' },

  // Steps
  stepsRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' },
  stepItem:       { alignItems: 'center', gap: 3 },
  stepDot:        { width: 24, height: 24, borderRadius: 12, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  stepDotActive:  { backgroundColor: BLUE, borderColor: BLUE },
  stepNum:        { fontSize: 11, fontWeight: '700', color: '#94a3b8' },
  stepNumActive:  { color: '#fff' },
  stepLabel:      { fontSize: 9, color: '#94a3b8', fontWeight: '600' },
  stepLabelActive:{ color: BLUE },

  // Section headers
  sectionHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 4 },
  sectionBadge:   { width: 28, height: 28, borderRadius: 14, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  sectionBadgeText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  sectionTitle:   { fontSize: 16, fontWeight: '700', color: '#0f172a' },

  card:           { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginHorizontal: 16, marginTop: 10, borderWidth: 0.5, borderColor: '#e2e8f0' },
  label:          { fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 8 },

  input:          { backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 0.5, borderColor: '#e2e8f0', padding: 11, fontSize: 13, color: '#0f172a' },
  textArea:       { height: 80, textAlignVertical: 'top' },

  // Repair type cards (large cards per guide)
  typeGrid:       { gap: 10 },
  typeCard:       { borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  typeCardActive: { backgroundColor: BLUE_BG, borderColor: BLUE },
  typeIcon:       { fontSize: 30 },
  typeLabel:      { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  typeLabelActive:{ color: BLUE },
  typeExamples:   { fontSize: 11, color: '#94a3b8', lineHeight: 16 },
  typeExamplesActive: { color: '#3b82f6' },

  // Location
  addressRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 0.5, borderColor: '#e2e8f0', paddingHorizontal: 10, marginBottom: 8, gap: 6 },
  pinIcon:        { fontSize: 14 },
  addressInput:   { flex: 1, fontSize: 13, color: '#0f172a', paddingVertical: 11 },
  locBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: BLUE_BG, borderRadius: 10, borderWidth: 0.5, borderColor: '#bfdbfe', paddingVertical: 10, gap: 6 },
  locBtnIcon:     { fontSize: 14 },
  locBtnText:     { fontSize: 12, fontWeight: '600', color: BLUE },

  // Photos
  photoRow:       { flexDirection: 'row', gap: 8 },
  addPhotoBtn:    { flex: 1, height: 80, borderRadius: 10, borderWidth: 1.5, borderColor: BLUE, borderStyle: 'dashed', backgroundColor: BLUE_BG, alignItems: 'center', justifyContent: 'center', gap: 4 },
  addPhotoPlus:   { width: 28, height: 28, borderRadius: 14, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  addPhotoText:   { fontSize: 10, color: BLUE, fontWeight: '600', textAlign: 'center' },
  photoContainer: { flex: 1, position: 'relative' },
  photo:          { width: '100%', height: 80, borderRadius: 10 },
  removeBtn:      { position: 'absolute', top: -6, right: -6, backgroundColor: '#ef4444', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  removeBtnText:  { color: '#fff', fontSize: 10, fontWeight: '700' },

  // Info
  infoCard:       { backgroundColor: '#f0fdf4', borderRadius: 16, padding: 14, marginHorizontal: 16, marginTop: 14, borderWidth: 0.5, borderColor: '#bbf7d0' },
  infoTitle:      { fontSize: 13, fontWeight: '700', color: '#15803d', marginBottom: 10 },
  infoRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  infoIcon:       { fontSize: 13, lineHeight: 20 },
  infoText:       { flex: 1, fontSize: 12, color: '#166534', lineHeight: 18 },

  // Map modal
  mapModal:              { flex: 1, backgroundColor: '#fff' },
  mapHeader:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' },
  mapBackBtn:            { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  mapTitle:              { fontSize: 15, fontWeight: '700', color: '#0f172a', textAlign: 'center' },
  mapSubtitle:           { fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 1 },
  map:                   { flex: 1 },
  mapHint:               { position: 'absolute', top: 80, alignSelf: 'center', backgroundColor: 'rgba(15,23,42,0.75)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  mapHintText:           { color: '#fff', fontSize: 13, fontWeight: '600' },
  mapConfirmBtn:         { backgroundColor: BLUE, marginHorizontal: 16, marginBottom: 16, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  mapConfirmBtnDisabled: { opacity: 0.4 },
  mapConfirmText:        { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Next button
  nextBtn:         { backgroundColor: BLUE, marginHorizontal: 16, marginTop: 20, borderRadius: 14, paddingVertical: 16, alignItems: 'center', shadowColor: BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  nextBtnDisabled: { opacity: 0.6 },
  nextBtnText:     { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
})