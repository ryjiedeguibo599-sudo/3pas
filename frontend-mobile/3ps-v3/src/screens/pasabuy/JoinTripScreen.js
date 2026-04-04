import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, SafeAreaView,
  Platform, Alert
} from 'react-native'

const GREEN    = '#059669'
const GREEN_BG = '#ecfdf5'

export default function JoinTripScreen({ navigation, route }) {
  const { trip } = route.params || {}

  const [items, setItems] = useState([{ name: '', qty: '' }])
  const [note, setNote]   = useState('')

  const addItem = () => setItems(prev => [...prev, { name: '', qty: '' }])

  const removeItem = (index) => {
    if (items.length === 1) return
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const updateItem = (index, field, value) => {
    setItems(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  const handleSubmit = () => {
    const valid = items.filter(i => i.name.trim())
    if (valid.length === 0) {
      Alert.alert('Kulang', 'Magdagdag ng kahit isang item.')
      return
    }
    navigation.navigate('ConfirmPasaBUY', { trip, items: valid, note })
  }

  const TRIP_ICONS = {
    'Palengke': '🛒', 'Burgeran': '🍔', 'Botika': '💊',
    'Merkado': '🥬',  'Tindahan': '🏪',
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sumali sa Trip</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* ── Trip info banner ── */}
        <View style={styles.tripBanner}>
          <Text style={styles.tripBannerIcon}>
            {TRIP_ICONS[trip?.destination] || '🏪'}
          </Text>
          <View>
            <Text style={styles.tripBannerDest}>{trip?.destination || 'Trip'}</Text>
            <Text style={styles.tripBannerMeta}>🕐 {trip?.departure_time}  •  👤 {trip?.rider_name}</Text>
          </View>
        </View>

        {/* ── Items ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Ano ang ipapasabuy mo?</Text>

          {items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemNumCircle}>
                <Text style={styles.itemNum}>{index + 1}</Text>
              </View>
              <TextInput
                style={styles.itemNameInput}
                placeholder="Pangalan ng item (ex: Burger, Itlog)"
                placeholderTextColor="#94a3b8"
                value={item.name}
                onChangeText={val => updateItem(index, 'name', val)}
              />
              <TextInput
                style={styles.itemQtyInput}
                placeholder="Qty"
                placeholderTextColor="#94a3b8"
                value={item.qty}
                onChangeText={val => updateItem(index, 'qty', val)}
                keyboardType="numeric"
              />
              {items.length > 1 && (
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeItem(index)}>
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          {/* Preview of added items */}
          {items.filter(i => i.name.trim()).length > 0 && (
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>📦 Mga Ipapasabuy:</Text>
              {items.filter(i => i.name.trim()).map((item, i) => (
                <Text key={i} style={styles.previewItem}>
                  • {item.name}{item.qty ? ` — ${item.qty} pcs` : ''}
                </Text>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.addBtn} onPress={addItem} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>+ Magdagdag ng Item</Text>
          </TouchableOpacity>
        </View>

        {/* ── Note ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Espesyal na Tagubilin (optional)</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="ex: Huwag masyadong luto, walang sibuyas..."
            placeholderTextColor="#94a3b8"
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* ── COD note ── */}
        <View style={styles.codNote}>
          <Text style={styles.codIcon}>💳</Text>
          <Text style={styles.codText}>
            Bayad sa pagdating — <Text style={{ fontWeight: '700' }}>Cash on Delivery.</Text>
          </Text>
        </View>

        {/* ── Submit ── */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
          <Text style={styles.submitBtnText}>I-submit ang Request →</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#f0fdf8' },
  container:      { flex: 1 },

  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 48 : 12, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#d1fae5' },
  backBtn:        { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' },
  backIcon:       { fontSize: 22, color: GREEN, fontWeight: '600', lineHeight: 28 },
  headerTitle:    { fontSize: 16, fontWeight: '700', color: '#064e3b' },

  tripBanner:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: GREEN, margin: 16, borderRadius: 14, padding: 14 },
  tripBannerIcon: { fontSize: 36 },
  tripBannerDest: { fontSize: 17, fontWeight: '700', color: '#fff', marginBottom: 3 },
  tripBannerMeta: { fontSize: 12, color: '#a7f3d0' },

  section:        { paddingHorizontal: 16, marginBottom: 16 },
  sectionLabel:   { fontSize: 13, fontWeight: '700', color: '#064e3b', marginBottom: 10 },

  itemRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  itemNumCircle:  { width: 26, height: 26, borderRadius: 13, backgroundColor: GREEN_BG, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  itemNum:        { fontSize: 12, fontWeight: '700', color: GREEN },
  itemNameInput:  { flex: 1, backgroundColor: '#fff', borderRadius: 10, borderWidth: 0.5, borderColor: '#d1fae5', paddingHorizontal: 11, paddingVertical: 10, fontSize: 13, color: '#0f172a' },
  itemQtyInput:   { width: 52, backgroundColor: '#fff', borderRadius: 10, borderWidth: 0.5, borderColor: '#d1fae5', paddingHorizontal: 8, paddingVertical: 10, fontSize: 13, color: '#0f172a', textAlign: 'center' },
  removeBtn:      { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center' },
  removeBtnText:  { color: '#ef4444', fontSize: 13, fontWeight: '700' },

  previewCard:    { backgroundColor: GREEN_BG, borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 0.5, borderColor: '#a7f3d0' },
  previewTitle:   { fontSize: 12, fontWeight: '700', color: GREEN, marginBottom: 6 },
  previewItem:    { fontSize: 13, color: '#065f46', marginBottom: 3 },

  addBtn:         { borderWidth: 1.5, borderColor: GREEN, borderStyle: 'dashed', borderRadius: 12, padding: 13, alignItems: 'center', backgroundColor: GREEN_BG },
  addBtnText:     { color: GREEN, fontWeight: '700', fontSize: 13 },

  noteInput:      { backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5, borderColor: '#d1fae5', padding: 12, fontSize: 13, color: '#0f172a', height: 80 },

  codNote:        { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fefce8', borderRadius: 12, marginHorizontal: 16, marginBottom: 14, padding: 12, borderWidth: 0.5, borderColor: '#fde68a' },
  codIcon:        { fontSize: 16 },
  codText:        { flex: 1, fontSize: 12, color: '#92400e' },

  submitBtn:      { backgroundColor: GREEN, marginHorizontal: 16, borderRadius: 14, paddingVertical: 16, alignItems: 'center', shadowColor: GREEN, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  submitBtnText:  { color: '#fff', fontSize: 15, fontWeight: '700' },
})