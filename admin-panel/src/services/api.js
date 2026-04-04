import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.1.3:5000/api', // palitan ng current IP mo
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;