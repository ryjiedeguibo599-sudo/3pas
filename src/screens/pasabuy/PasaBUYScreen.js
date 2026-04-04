import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  ScrollView
} from 'react-native'
import API from '../../services/api'

export default function PasaBUYScreen({ navigation }) {
  const [items, setItems] = useState([
    { item_name: '', quantity: '', price: '' }
  ])
  const [loading, setLoading] = useState(false)

  const addItem = () => {
    setItems([...items, { item_name: '', quantity: '', price: '' }])
  }

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems)
  }

  const updateItem = (index, field, value) => {
    const newItems = [...items]
    newItems[index][field] = value
    setItems(newItems)
  }

  const getTotalAmount = () => {
    return items.reduce((total, item) => {
      return total + (parseFloat(item.price) * parseInt(item.quantity) || 0)
    }, 0)
  }

  const handleOrder = async () => {
    const validItems = items.filter(
      item => item.item_name && item.quantity && item.price
    )
    if (validItems.length === 0) {
      Alert.alert('Error', 'Magdagdag ng kahit isang item!')
      return
    }
    try {
      setLoading(true)
      await API.post('/pasabuy/orders', {
        total_amount: getTotalAmount(),
        items: validItems.map(item => ({
          item_name: item.item_name,
          quantity: parseInt(item.quantity),
          price: parseFloat(item.price)
        }))
      })
      Alert.alert('Success', 'Na-send na ang order mo!', [
        { text: 'OK', onPress: () => navigation.navigate('Home') }
      ])
    } catch (err) {
      Alert.alert('Error', 'Hindi na-send ang order. Try again.')
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
        <Text style={styles.title}>🛒 PasaBUY</Text>
      </View>
      <Text style={styles.sectionTitle}>Mga Kailangan Mo:</Text>
      {items.map((item, index) => (
        <View key={index} style={styles.itemCard}>
          <Text style={styles.itemNumber}>Item {index + 1}</Text>
          <TextInput
            style={styles.input}
            placeholder="Pangalan ng item (ex: Rice 5kg)"
            value={item.item_name}
            onChangeText={(val) => updateItem(index, 'item_name', val)}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Quantity"
              value={item.quantity}
              onChangeText={(val) => updateItem(index, 'quantity', val)}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Price (₱)"
              value={item.price}
              onChangeText={(val) => updateItem(index, 'price', val)}
              keyboardType="numeric"
            />
          </View>
          {items.length > 1 && (
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => removeItem(index)}
            >
              <Text style={styles.removeBtnText}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
      <TouchableOpacity style={styles.addBtn} onPress={addItem}>
        <Text style={styles.addBtnText}>+ Magdagdag ng Item</Text>
      </TouchableOpacity>
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Amount:</Text>
        <Text style={styles.totalAmount}>₱{getTotalAmount().toFixed(2)}</Text>
      </View>
      <TouchableOpacity
        style={styles.orderBtn}
        onPress={handleOrder}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.orderBtnText}>Mag-Order Na!</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 40, marginBottom: 24 },
  back: { fontSize: 24, color: '#2563EB', marginRight: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 },
  itemCard: { backgroundColor: '#EFF6FF', borderRadius: 12, padding: 16, marginBottom: 12 },
  itemNumber: { fontSize: 14, fontWeight: 'bold', color: '#2563EB', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 8, fontSize: 14 },
  row: { flexDirection: 'row', gap: 8 },
  halfInput: { flex: 1 },
  removeBtn: { alignItems: 'center', padding: 8 },
  removeBtnText: { color: '#EF4444', fontSize: 14 },
  addBtn: { borderWidth: 2, borderColor: '#2563EB', borderStyle: 'dashed', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16 },
  addBtnText: { color: '#2563EB', fontSize: 16, fontWeight: 'bold' },
  totalCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#EFF6FF', borderRadius: 12, padding: 16, marginBottom: 16 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  totalAmount: { fontSize: 16, fontWeight: 'bold', color: '#2563EB' },
  orderBtn: { backgroundColor: '#2563EB', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 32 },
  orderBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
})