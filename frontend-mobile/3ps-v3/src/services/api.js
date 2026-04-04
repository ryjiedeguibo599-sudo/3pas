import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const API_URL = 'http://192.168.1.3:5000'  // ✅ same IP mo na

const API = axios.create({
  baseURL: `${API_URL}/api`
})

API.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default API