import React, { useRef, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, ScrollView, Platform, Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { theme } from '../../theme/padulongTheme'
import ConfirmationModal from '../../components/ConfirmationModal'

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

const cargoLabel = (cargo) => {
  if (cargo === 'small') return 'Small bag'
  if (cargo === 'bulky') return 'Large cargo'
  return 'No cargo'
}

export default function PasakayReviewScreen({ navigation, route }) {
  const {
    pickup, dropoff, pickupCoords, dropoffCoords,
    passengers, cargo, vehicleType, vehicleName, vehicleEmoji, fare, distanceKm,
  } = route.params || {}

  const btnScale = useRef(new Animated.Value(1)).current
  const [confirmModal, setConfirmModal] = useState(false)

  const handleSubmit = () => setConfirmModal(true)

  const executeSubmit = () => {
    setConfirmModal(false)
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start(() => {
      navigation.navigate('PasakayMatching', {
        pickup, dropoff, pickupCoords, dropoffCoords,
        passengers, cargo, vehicleType, vehicleName, vehicleEmoji, fare, distanceKm,
      })
    })
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      <View style={s.navBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={s.navTitle}>Review Ride</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.card}>
          <Text style={s.cardTitle}>Route</Text>
          <View style={s.row}>
            <Text style={s.rowLabel}>📍 Pickup</Text>
            <Text style={s.rowValue} numberOfLines={2}>{pickup || '—'}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>🚩 Dropoff</Text>
            <Text style={s.rowValue} numberOfLines={2}>{dropoff || '—'}</Text>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Trip Details</Text>
          <View style={s.row}>
            <Text style={s.rowLabel}>👥 Passengers</Text>
            <Text style={s.rowValue}>{passengers}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>📦 Cargo</Text>
            <Text style={s.rowValue}>{cargoLabel(cargo)}</Text>
          </View>
          {distanceKm ? (
            <View style={s.row}>
              <Text style={s.rowLabel}>📏 Distance</Text>
              <Text style={s.rowValue}>{distanceKm.toFixed(1)} km</Text>
            </View>
          ) : null}
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Vehicle & Fare</Text>
          <View style={s.vehicleRow}>
            <Text style={s.vehicleEmoji}>{vehicleEmoji || '🛵'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.vehicleName}>{vehicleName || 'Selected vehicle'}</Text>
              <Text style={s.vehicleSub}>Estimated fare</Text>
            </View>
            <Text style={s.fare}>₱{fare || 0}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={s.footer}>
        <Animated.View style={{ width: '100%', transform: [{ scale: btnScale }] }}>
          <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
            <Text style={s.submitBtnTxt}>Confirm & Find Driver →</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <ConfirmationModal
        visible={confirmModal}
        title="Submit Request"
        message="Are you ready to submit this request?"
        icon="🚀"
        confirmText="Yes, Submit"
        onConfirm={executeSubmit}
        onCancel={() => setConfirmModal(false)}
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  navBar: {
    backgroundColor: C.white,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'android' ? 8 : 4,
    paddingBottom: 8,
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.primaryLt, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 22, color: C.primary, fontWeight: '700', lineHeight: 28 },
  navTitle: { fontSize: 16, fontWeight: '800', color: C.text },

  scroll: { padding: 16, gap: 12 },
  card: {
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 10,
  },
  cardTitle: { fontSize: 14, fontWeight: '800', color: C.text },
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  rowLabel: { width: 110, fontSize: 12, color: C.textSub, fontWeight: '600' },
  rowValue: { flex: 1, fontSize: 13, color: C.text, fontWeight: '600' },

  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  vehicleEmoji: { fontSize: 26 },
  vehicleName: { fontSize: 14, fontWeight: '700', color: C.text },
  vehicleSub: { fontSize: 12, color: C.textSub },
  fare: { fontSize: 22, fontWeight: '800', color: C.primary },

  footer: {
    backgroundColor: C.white,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'android' ? 20 : 32,
  },
  submitBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
})
