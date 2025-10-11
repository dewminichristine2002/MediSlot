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

api.interceptors.request.use(cfg => {
  console.log("➡️", cfg.method?.toUpperCase(), cfg.baseURL + cfg.url);
  console.log("📦", cfg.data);
  return cfg;
});
api.interceptors.response.use(
  res => { console.log("✅", res.status, res.data); return res; },
  err => { console.log("🟥", err.response?.status, err.response?.data || err.message); return Promise.reject(err); }
);




export default api;
