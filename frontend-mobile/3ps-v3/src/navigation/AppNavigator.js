// 📁 frontend-mobile/3ps-v3/src/navigation/AppNavigator.js

import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ActivityIndicator, View } from 'react-native'

import LoginScreen               from '../screens/auth/LoginScreen'
import RegisterScreen            from '../screens/auth/RegisterScreen'
import EditProfileScreen         from '../screens/auth/EditProfileScreen'
import ChangePasswordScreen      from '../screens/auth/ChangePasswordScreen'

import HomeScreen                from '../screens/HomeScreen'

// ── PASABUY ──
import PasabuyScreen             from '../screens/pasabuy/PasabuyScreen'
import PasabuyRequestScreen      from '../screens/pasabuy/PasabuyRequestScreen'
import PasabuyReviewScreen       from '../screens/pasabuy/PasabuyReviewScreen'
import PasabuyMatchingScreen     from '../screens/pasabuy/PasabuyMatchingScreen'
import PasabuyProviderScreen     from '../screens/pasabuy/PasabuyProviderScreen'
import MyGroceryOrdersScreen     from '../screens/pasabuy/MyGroceryOrdersScreen'

// ── PASAKAY ──
import PasakayScreen             from '../screens/pasakay/PasakayScreen'
import PasakayTripDetails        from '../screens/pasakay/PasakayTripDetails'
import PasakayVehicleScreen      from '../screens/pasakay/PasakayVehicleScreen'
import PasakayMatchingScreen     from '../screens/pasakay/PasakayMatchingScreen'
import PasakayProviderScreen     from '../screens/pasakay/PasakayProviderScreen'
import WaitingPasakayScreen      from '../screens/pasakay/WaitingPasakayScreen'
import MyRidesScreen             from '../screens/pasakay/MyRidesScreen'

// ── PAREPAIR ──
import PaRepairScreen            from '../screens/parepair/PaRepairScreen'
import ScheduleRepairScreen      from '../screens/parepair/ScheduleRepairScreen'
import ConfirmRepairScreen       from '../screens/parepair/ConfirmRepairScreen'
import WaitingRepairScreen       from '../screens/parepair/WaitingRepairScreen'
import MyRepairRequestsScreen    from '../screens/parepair/MyRepairRequestsScreen'
import AssignedTechnicianScreen  from '../screens/parepair/AssignedTechnicianScreen'

// ── PROVIDER ──
import ProviderHomeScreen        from '../screens/provider/ProviderHomeScreen'
import ProviderRequestsScreen    from '../screens/provider/ProviderRequestsScreen'

const Stack = createStackNavigator()

export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true)
  const [userRole,  setUserRole]  = useState(null)

  useEffect(() => { checkLogin() }, [])

  const checkLogin = async () => {
    try {
      const userData = await AsyncStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        setUserRole(user.role)
      }
    } catch (err) {
      console.log('AppNavigator checkLogin error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getInitialRoute = () => {
    if (userRole === 'provider') return 'ProviderHome'
    if (userRole === 'resident') return 'Home'
    return 'Login'
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0FDFA' }}>
        <ActivityIndicator size="large" color="#0F766E" />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={getInitialRoute()}
        screenOptions={{ headerShown: false }}
      >

        {/* ── AUTH ── */}
        <Stack.Screen name="Login"          component={LoginScreen} />
        <Stack.Screen name="Register"       component={RegisterScreen} />
        <Stack.Screen name="EditProfile"    component={EditProfileScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />

        {/* ── RESIDENT HOME ── */}
        <Stack.Screen name="Home" component={HomeScreen} />

        {/* ── PASABUY ── */}
        <Stack.Screen name="Pasabuy"         component={PasabuyScreen} />
        <Stack.Screen name="PasabuyRequest"  component={PasabuyRequestScreen} />
        <Stack.Screen name="PasabuyReview"   component={PasabuyReviewScreen} />
        <Stack.Screen name="PasabuyMatching" component={PasabuyMatchingScreen} />
        <Stack.Screen name="PasabuyProvider" component={PasabuyProviderScreen} />
        <Stack.Screen name="MyGroceryOrders" component={MyGroceryOrdersScreen} />

        {/* ── PASAKAY ── */}
        <Stack.Screen name="Pasakay"            component={PasakayScreen} />
        <Stack.Screen name="PasakayTripDetails" component={PasakayTripDetails} />
        <Stack.Screen name="PasakayVehicle"     component={PasakayVehicleScreen} />
        <Stack.Screen name="PasakayMatching"    component={PasakayMatchingScreen} />
        <Stack.Screen name="PasakayProvider"    component={PasakayProviderScreen} />
        <Stack.Screen name="WaitingPasakay"     component={WaitingPasakayScreen} />
        <Stack.Screen name="MyRides"            component={MyRidesScreen} />

        {/* ── PAREPAIR ── */}
        <Stack.Screen name="PaRepair"                component={PaRepairScreen} />
        <Stack.Screen name="ScheduleRepair"          component={ScheduleRepairScreen} />
        <Stack.Screen name="ConfirmRepair"           component={ConfirmRepairScreen} />
        <Stack.Screen name="WaitingRepair"           component={WaitingRepairScreen} />
        <Stack.Screen name="MyRepairRequests"        component={MyRepairRequestsScreen} />
        <Stack.Screen name="AssignedTechnicianScreen" component={AssignedTechnicianScreen} />

        {/* ── PROVIDER ── */}
        <Stack.Screen name="ProviderHome"     component={ProviderHomeScreen} />
        <Stack.Screen name="ProviderRequests" component={ProviderRequestsScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  )
}