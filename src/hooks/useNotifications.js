import { useEffect, useRef } from 'react'
import { Alert } from 'react-native'
import io from 'socket.io-client'
import { API_URL } from '../services/api'

export default function useNotifications(userId) {
  const socketRef = useRef(null)

  useEffect(() => {
    if (!userId) return

    socketRef.current = io(API_URL)

    // Join personal room
    socketRef.current.emit('join', userId)

    // Listen for notifications
    socketRef.current.on('notification', (data) => {
      Alert.alert(data.title, data.message)
    })

    return () => {
      socketRef.current?.disconnect()
    }
  }, [userId])

  return socketRef.current
}