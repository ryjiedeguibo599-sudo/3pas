// 📁 frontend-mobile/3ps-v3/src/navigation/AppNavigator.js

import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import * as SecureStore from 'expo-secure-store'
import { ActivityIndicator, View } from 'react-native'

import LoginScreen               from '../screens/auth/LoginScreen'
import EditProfileScreen         from '../screens/auth/EditProfileScreen'
import ChangePasswordScreen      from '../screens/auth/ChangePasswordScreen'

// ── AUTH (Welcome / Multi-step Flow) ──
import LoginWelcomeScreen        from '../screens/auth/Loginwelcomescreen'
import LoginIdentifierScreen     from '../screens/auth/Loginidentifierscreen'
import LoginPasswordScreen       from '../screens/auth/Loginpasswordscreen'

// ── REGISTER Flow ──
import RegisterScreen            from '../screens/auth/RegisterScreen'
import RegisterServiceTypeScreen from '../screens/auth/RegisterServiceTypeScreen'
import RegisterOTPScreen         from '../screens/auth/RegisterOTPScreen'
import RegisterPasswordScreen    from '../screens/auth/Registerpasswordscreen'
import RegisterPhotoScreen       from '../screens/auth/Registerphotoscreen'

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
import PasakayReviewScreen       from '../screens/pasakay/PasakayReviewScreen'
import PasakayMatchingScreen     from '../screens/pasakay/PasakayMatchingScreen'
import PasakayProviderScreen     from '../screens/pasakay/PasakayProviderScreen'
import WaitingPasakayScreen      from '../screens/pasakay/WaitingPasakayScreen'
import MyRidesScreen             from '../screens/pasakay/MyRidesScreen'
import ResidentLiveMapScreen     from '../screens/pasakay/ResidentLiveMapScreen'

// ── PADALA ──
import PadalaScreen              from '../screens/padala/PadalaScreen'
import PadalaStep2Screen         from '../screens/padala/PadalaStep2Screen'
import PadalaStep3Screen         from '../screens/padala/PadalaStep3Screen'
import ScheduleDeliveryScreen    from '../screens/padala/ScheduleDeliveryScreen'
import ConfirmDeliveryScreen     from '../screens/padala/ConfirmDeliveryScreen'
import WaitingDeliveryScreen     from '../screens/padala/WaitingDeliveryScreen'
import MyDeliveryRequestsScreen  from '../screens/padala/MyDeliveryRequestsScreen'
import AssignedProviderScreen    from '../screens/padala/AssignedProviderScreen'

// ── PROVIDER ──
import ActiveJobScreen           from '../screens/provider/ActiveJobScreen'
import ProviderRequestsScreen    from '../screens/provider/ProviderRequestsScreen'
import ProviderLiveTrackingScreen from '../screens/provider/ProviderLiveTrackingScreen'
import ChatScreen from '../screens/chat/ChatScreen'

const Stack = createStackNavigator()

export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true)
  const [userRole,  setUserRole]  = useState(null)

  useEffect(() => { checkLogin() }, [])

  const checkLogin = async () => {
    try {
      const userData = await SecureStore.getItemAsync('user')
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
    if (userRole === 'provider') return 'Home'
    if (userRole === 'resident') return 'Home'
    return 'LoginWelcome'
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFF' }}>
        <ActivityIndicator size="large" color="#1D4ED8" />
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
        <Stack.Screen name="EditProfile"    component={EditProfileScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />

        {/* ── AUTH (Welcome / Multi-step Flow) ── */}
        <Stack.Screen name="LoginWelcome"    component={LoginWelcomeScreen} />
        <Stack.Screen name="LoginIdentifier" component={LoginIdentifierScreen} />
        <Stack.Screen name="LoginPassword"   component={LoginPasswordScreen} />

        {/* ── REGISTER Flow ── */}
        <Stack.Screen name="Register"            component={RegisterScreen} />
        <Stack.Screen name="RegisterServiceType" component={RegisterServiceTypeScreen} />
        <Stack.Screen name="RegisterOTP"         component={RegisterOTPScreen} />
        <Stack.Screen name="RegisterPassword"    component={RegisterPasswordScreen} />
        <Stack.Screen name="RegisterPhoto"       component={RegisterPhotoScreen} />

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
        <Stack.Screen name="PasakayReview"      component={PasakayReviewScreen} />
        <Stack.Screen name="PasakayMatching"    component={PasakayMatchingScreen} />
        <Stack.Screen name="PasakayProvider"    component={PasakayProviderScreen} />
        <Stack.Screen name="WaitingPasakay"     component={WaitingPasakayScreen} />
        <Stack.Screen name="MyRides"            component={MyRidesScreen} />
        <Stack.Screen name="ResidentLiveMap"    component={ResidentLiveMapScreen} />

        {/* ── PADALA ── */}
        <Stack.Screen name="Padala"              component={PadalaScreen} />
        <Stack.Screen name="PadalaStep2"         component={PadalaStep2Screen} />
        <Stack.Screen name="PadalaStep3"         component={PadalaStep3Screen} />
        <Stack.Screen name="ScheduleDelivery"    component={ScheduleDeliveryScreen} />
        <Stack.Screen name="ConfirmDelivery"     component={ConfirmDeliveryScreen} />
        <Stack.Screen name="WaitingDelivery"     component={WaitingDeliveryScreen} />
        <Stack.Screen name="MyDeliveryRequests"  component={MyDeliveryRequestsScreen} />
        <Stack.Screen name="AssignedProvider"    component={AssignedProviderScreen} />

        {/* ── PROVIDER ── */}
        <Stack.Screen name="ProviderRequests" component={ProviderRequestsScreen} />
        <Stack.Screen name="ActiveJob"        component={ActiveJobScreen} />
        <Stack.Screen name="ProviderLiveTracking" component={ProviderLiveTrackingScreen} />
        <Stack.Screen name="ChatScreen" component={ChatScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  )
}