const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert('Error', 'Please fill in all fields')
    return
  }
  try {
    setLoading(true)
    const res = await API.post('/auth/login', { email, password })
    await AsyncStorage.setItem('token', res.data.token)
    await AsyncStorage.setItem('user', JSON.stringify(res.data.user))

    const role = res.data.user.role

    if (role === 'provider') {
      await AsyncStorage.setItem('service_type', res.data.user.service_type)
      navigation.replace('ProviderHome')
    } else if (role === 'resident') {
      navigation.replace('Home')
    } else if (role === 'admin') {
      navigation.replace('AdminHome')
    }
  } catch (err) {
    Alert.alert('Error', 'Invalid email or password')
  } finally {
    setLoading(false)
  }
}