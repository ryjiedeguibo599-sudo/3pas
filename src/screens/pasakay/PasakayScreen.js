import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  ScrollView
} from 'react-native'
import API from '../../services/api'

export default function PasakayScreen({ navigation }) {
  const [pickup, setPickup] = useState('')
  const [dropoff, setDropoff] = useState('')
  const [fare, setFare] = useState('')
  const [loading, setLoading] = useState(false)

  const handleBook = async () => {
    if (!pickup || !dropoff || !fare) {
      Alert.alert('Error', 'Please fill in all fields!')
      return
    }
    try {
      setLoading(true)
      await API.post('/pasakay/book', {
        pickup_location: pickup,
        dropoff_location: dropoff,
        fare: parseFloat(fare)
      })
      Alert.alert('Success', 'Na-book na ang ride mo!', [
        { text: 'OK', onPress: () => navigation.navigate('Home') }
      ])
    } catch (err) {
      Alert.alert('Error', 'Hindi na-book ang ride. Try again.')
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
        <Text style={styles.title}>🛵 Pasakay</Text>
      </View>
      <Text style={styles.sectionTitle}>I-book ang Ride:</Text>
      <View style={styles.inputCard}>
        <Text style={styles.label}>Pickup Location</Text>
        <TextInput
          style={styles.input}
          placeholder="ex: Brgy. Campo, Bacuag"
          value={pickup}
          onChangeText={setPickup}
        />
      </View>
      <View style={styles.inputCard}>
        <Text style={styles.label}>Dropoff Location</Text>
        <TextInput
          style={styles.input}
          placeholder="ex: Bacuag Public Market"
          value={dropoff}
          onChangeText={setDropoff}
        />
      </View>
      <View style={styles.inputCard}>
        <Text style={styles.label}>Fare (₱)</Text>
        <TextInput
          style={styles.input}
          placeholder="ex: 50"
          value={fare}
          onChangeText={setFare}
          keyboardType="numeric"
        />
      </View>
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Impormasyon:</Text>
        <Text style={styles.infoText}>
          • Ang rider ay makakarating sa iyo sa loob ng 10-15 minuto
        </Text>
        <Text style={styles.infoText}>
          • Pwedeng bayaran ng cash o GCash
        </Text>
        <Text style={styles.infoText}>
          • Makikita mo ang rider sa mapa pagka-accept
        </Text>
      </View>
      <TouchableOpacity
        style={styles.bookBtn}
        onPress={handleBook}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.bookBtnText}>Mag-Book ng Ride!</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 40, marginBottom: 24 },
  back: { fontSize: 24, color: '#16A34A', marginRight: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 },
  inputCard: { backgroundColor: '#F0FDF4', borderRadius: 12, padding: 16, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#16A34A', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 14 },
  infoCard: { backgroundColor: '#F0FDF4', borderRadius: 12, padding: 16, marginBottom: 16 },
  infoTitle: { fontSize: 14, fontWeight: 'bold', color: '#16A34A', marginBottom: 8 },
  infoText: { fontSize: 13, color: '#666', marginBottom: 4 },
  bookBtn: { backgroundColor: '#16A34A', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 32 },
  bookBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
})