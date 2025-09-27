import api from './client';

export const createBookingApi = (payload) =>
  api.post('/api/bookings', payload);

export const myBookingsApi = (params) =>
  api.get('/api/bookings/my', { params });

// Only if you still call it somewhere:
export const checkAvailabilityApi = (params) =>
  api.get('/api/bookings/availability', { params });
