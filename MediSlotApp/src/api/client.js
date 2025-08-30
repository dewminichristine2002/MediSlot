import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from '../utils/getApiBaseUrl';

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 12000,
});

const baseURL = getApiBaseUrl();
if (__DEV__) console.log('API base URL →', baseURL);

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
