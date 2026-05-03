import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  ScrollView
} from 'react-native'
import API from '../../services/api'

export default function RegisterScreen({ navigation }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [barangay, setBarangay] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    if (!fullName || !email || !phone || !barangay || !password) {
      Alert.alert('Error', 'Punan ang lahat ng fields')
      return
    }

    try {
      setLoading(true)
      console.log('Sending register request...', {
        full_name: fullName,
        email,
        phone,
        barangay,
        password,
        role: 'resident'
      })
      const response = await API.post('/auth/register', {
        full_name: fullName,
        email,
        phone,
        barangay,
        password,
        role: 'resident'
      })
      console.log('Register success:', response.data)
      Alert.alert('Success', 'Matagumpay na nairehistro! Mag-login na.')
      navigation.navigate('Login')
    } catch (err) {
      console.log('FULL ERROR:', JSON.stringify(err.response?.data))
      console.log('STATUS:', err.response?.status)
      console.log('MESSAGE:', err.message)
      const msg = err.response?.data?.message || err.message || 'Registration failed. Try again.'
      Alert.alert('Error', msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>3PS App</Text>
      <Text style={styles.subtitle}>Gumawa ng Account</Text>

      <TextInput
        style={styles.input}
        placeholder="Buong Pangalan"
        value={fullName}
        onChangeText={setFullName}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Phone Number (09XXXXXXXXX)"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="Barangay"
        value={barangay}
        onChangeText={setBarangay}
      />

      <TextInput
        style={styles.input}
        placeholder="Password (minimum 8 characters)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>Mag-Register</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.link}>
          Mayroon nang account? Mag-login
        </Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2563EB',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 32
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16
  },
  button: {
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  link: {
    textAlign: 'center',
    color: '#2563EB',
    fontSize: 14
  }
})