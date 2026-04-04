import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  ScrollView
} from 'react-native'
import API from '../../services/api'

export default function PaRepairScreen({ navigation }) {
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRequest = async () => {
    if (!description || !address) {
      Alert.alert('Error', 'Please fill in all fields!')
      return
    }
    try {
      setLoading(true)
      await API.post('/parepair/requests', {
        description,
        address,
        photo_urls: []
      })
      Alert.alert('Success', 'Na-send na ang repair request mo!', [
        { text: 'OK', onPress: () => navigation.navigate('Home') }
      ])
    } catch (err) {
      Alert.alert('Error', 'Hindi na-send ang request. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🔧 PaRepair</Text>
      </View>
      <Text style={styles.sectionTitle}>Ano ang kailangang ayusin?</Text>
      <View style={styles.inputCard}>
        <Text style={styles.label}>Ilarawan ang problema</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="ex: Sira ang gripo sa CR, tuluy-tuloy ang tubig"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />
      </View>
      <View style={styles.inputCard}>
        <Text style={styles.label}>Address</Text>
        <TextInput
          style={styles.input}
          placeholder="ex: Brgy. Campo, Bacuag, Surigao del Norte"
          value={address}
          onChangeText={setAddress}
        />
      </View>
      <View style={styles.inputCard}>
        <Text style={styles.label}>Uri ng Repair:</Text>
        <View style={styles.categoryRow}>
          {['Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Others'].map(
            (cat) => (
              <TouchableOpacity key={cat} style={styles.categoryBtn}>
                <Text style={styles.categoryText}>{cat}</Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </View>
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Impormasyon:</Text>
        <Text style={styles.infoText}>
          • Ang repairman ay makikipag-ugnayan sa iyo sa loob ng 30 minuto
        </Text>
        <Text style={styles.infoText}>
          • Pwedeng bayaran ng cash o GCash
        </Text>
        <Text style={styles.infoText}>
          • May rating system para sa bawat repairman
        </Text>
      </View>
      <TouchableOpacity
        style={styles.submitBtn}
        onPress={handleRequest}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.submitBtnText}>Mag-Request ng Repair!</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 40, marginBottom: 24 },
  back: { fontSize: 24, color: '#EA580C', marginRight: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 },
  inputCard: { backgroundColor: '#FFF7ED', borderRadius: 12, padding: 16, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#EA580C', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 14 },
  textArea: { height: 100, textAlignVertical: 'top' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EA580C', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  categoryText: { color: '#EA580C', fontSize: 13 },
  infoCard: { backgroundColor: '#FFF7ED', borderRadius: 12, padding: 16, marginBottom: 16 },
  infoTitle: { fontSize: 14, fontWeight: 'bold', color: '#EA580C', marginBottom: 8 },
  infoText: { fontSize: 13, color: '#666', marginBottom: 4 },
  submitBtn: { backgroundColor: '#EA580C', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 32 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
})