import React from 'react'
import { StatusBar } from 'expo-status-bar'
import AppNavigator from './src/navigation/AppNavigator'
import { usePushNotifications } from './src/hooks/usePushNotifications'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

export default function App() {
  usePushNotifications()

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <AppNavigator />
    </QueryClientProvider>
  )
}