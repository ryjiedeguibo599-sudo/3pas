import React, { useEffect, useState } from 'react'
import {
  View, Text, TouchableOpacity,
  StyleSheet, ScrollView
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function HomeScreen({ navigation }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    getUser()
  }, [])

  const getUser = async () => {
    const userData = await AsyncStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token')
    await AsyncStorage.removeItem('user')
    navigation.replace('Login')
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Kumusta, {user?.full_name}! 👋
          </Text>
          <Text style={styles.subgreeting}>
            Ano ang kailangan mo ngayon?
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Services */}
      <Text style={styles.sectionTitle}>Mga Serbisyo</Text>

      {/* PasaBUY */}
      <TouchableOpacity
        style={[styles.serviceCard, { backgroundColor: '#EFF6FF' }]}
        onPress={() => navigation.navigate('PasaBUY')}
      >
        <Text style={styles.serviceEmoji}>🛒</Text>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>PasaBUY</Text>
          <Text style={styles.serviceDesc}>
            Grocery at errand services
          </Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      {/* Pasakay */}
      <TouchableOpacity
        style={[styles.serviceCard, { backgroundColor: '#F0FDF4' }]}
        onPress={() => navigation.navigate('Pasakay')}
      >
        <Text style={styles.serviceEmoji}>🛵</Text>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>Pasakay</Text>
          <Text style={styles.serviceDesc}>
            Ride services
          </Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      {/* PaRepair */}
      <TouchableOpacity
        style={[styles.serviceCard, { backgroundColor: '#FFF7ED' }]}
        onPress={() => navigation.navigate('PaRepair')}
      >
        <Text style={styles.serviceEmoji}>🔧</Text>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>PaRepair</Text>
          <Text style={styles.serviceDesc}>
            Home repair services
          </Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b'
  },
  subgreeting: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  logout: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: 'bold'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  serviceEmoji: {
    fontSize: 32,
    marginRight: 16
  },
  serviceInfo: {
    flex: 1
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b'
  },
  serviceDesc: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  arrow: {
    fontSize: 24,
    color: '#666'
  }
})
