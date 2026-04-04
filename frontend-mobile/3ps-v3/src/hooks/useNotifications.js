import { useEffect, useRef } from 'react'
import { Alert } from 'react-native'
import { io } from 'socket.io-client'
import { API_URL } from '../services/api'

export default function useNotifications(userId) {
  const socketRef = useRef(null)

  useEffect(() => {
    if (!userId) return

    socketRef.current = io(API_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
    })

    socketRef.current.on('connect', () => {
      console.log('✅ Socket connected:', socketRef.current.id)
      // Join personal room gamit ang user_id
      socketRef.current.emit('join', userId)
    })

    socketRef.current.on('notification', (data) => {
      Alert.alert(data.title, data.message)
    })

    socketRef.current.on('disconnect', () => {
      console.log('❌ Socket disconnected')
    })

    return () => {
      socketRef.current?.disconnect()
    }
  }, [userId])

  return socketRef.current
}