import api from './client';

export const loginApi = (email, password) =>
  api.post('/api/users/auth/login', { email, password });

export const registerApi = (payload) =>
  api.post('/api/users/auth/register', payload);

export const meApi = () => api.get('/api/users/me');
