import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ActivityIndicator, View } from 'react-native'

import LoginScreen from '../screens/auth/LoginScreen'
import RegisterScreen from '../screens/auth/RegisterScreen'
import HomeScreen from '../screens/HomeScreen'
import PasaBUYScreen from '../screens/pasabuy/PasaBUYScreen'
import PasakayScreen from '../screens/pasakay/PasakayScreen'
import PaRepairScreen from '../screens/parepair/PaRepairScreen'

const Stack = createStackNavigator()

export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    checkLogin()
  }, [])

  const checkLogin = async () => {
    const token = await AsyncStorage.getItem('token')
    setIsLoggedIn(!!token)
    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isLoggedIn ? 'Home' : 'Login'}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="PasaBUY" component={PasaBUYScreen} />
        <Stack.Screen name="Pasakay" component={PasakayScreen} />
        <Stack.Screen name="PaRepair" component={PaRepairScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}