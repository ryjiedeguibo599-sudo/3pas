import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity,
  StyleSheet, Modal, TextInput,
  ActivityIndicator, Alert
} from 'react-native'
import API from '../services/api'

export default function RatingModal({ visible, onClose, serviceType, serviceId, onSuccess }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Pumili ng rating!')
      return
    }
    try {
      setLoading(true)
      await API.post('/reviews', {
        service_type: serviceType,
        service_id: serviceId,
        rating,
        comment
      })
      Alert.alert('Salamat! 🎉', 'Na-submit na ang iyong review!')
      setRating(0)
      setComment('')
      onSuccess && onSuccess()
      onClose()
    } catch (err) {
      const msg = err.response?.data?.message || 'Hindi na-submit ang review.'
      Alert.alert('Error', msg)
    } finally {
      setLoading(false)
    }
  }

  const serviceLabel = {
    pasabuy: '🛒 Grocery Order',
    pasakay: '🛵 Ride',
    parepair: '🔧 Repair Request'
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>I-rate ang iyong {serviceLabel[serviceType]}</Text>
          <Text style={styles.subtitle}>Kumusta ang iyong experience?</Text>

          {/* Stars */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)} style={styles.starBtn}>
                <Text style={[styles.star, rating >= star && styles.starActive]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>

          {rating > 0 && (
            <Text style={styles.ratingLabel}>
              {rating === 1 ? '😞 Napakasama' :
               rating === 2 ? '😕 Masama' :
               rating === 3 ? '😊 Okay lang' :
               rating === 4 ? '😄 Maganda' :
               '🤩 Napakaganda!'}
            </Text>
          )}

          <TextInput
            style={styles.input}
            placeholder="Magbigay ng komento... (optional)"
            placeholderTextColor="#94A3B8"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
          />

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Mamaya na</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, rating === 0 && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading || rating === 0}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.submitBtnText}>I-submit</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 20 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 8 },
  starBtn: { padding: 6 },
  star: { fontSize: 40, color: '#E2E8F0' },
  starActive: { color: '#F59E0B' },
  ratingLabel: { textAlign: 'center', fontSize: 14, color: '#64748B', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12, fontSize: 14, color: '#1e293b', textAlignVertical: 'top', minHeight: 80, marginBottom: 20 },
  btnRow: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 12, padding: 14, alignItems: 'center' },
  cancelBtnText: { color: '#64748B', fontWeight: 'bold' },
  submitBtn: { flex: 1, backgroundColor: '#2563EB', borderRadius: 12, padding: 14, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: '#93C5FD' },
  submitBtnText: { color: '#fff', fontWeight: 'bold' }
})