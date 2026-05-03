import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

export const API_URL = 'http://192.168.1.3:5000'

const API = axios.create({
  baseURL: `${API_URL}/api`
})

API.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default API