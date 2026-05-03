import { useEffect, useRef } from 'react'
import { Alert, AppState } from 'react-native'
import * as Notifications from 'expo-notifications'
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
      socketRef.current.emit('join', userId)
    })

    socketRef.current.on('notification', async (data) => {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title || 'New Notification',
          body: data.message,
          data: data,
          sound: true,
        },
        trigger: null,
      });
    })

    socketRef.current.on('new_request', async (data) => {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🚨 New Request!',
          body: `A new booking request arrived.`,
          data: data,
          sound: true,
        },
        trigger: null,
      });
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