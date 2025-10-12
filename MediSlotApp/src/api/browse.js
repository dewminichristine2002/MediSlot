// src/api/browse.js
import api from './client';

// GET /api/browse/centers
export const listCentersApi = () => api.get('/api/browse/centers');

// GET /api/browse/centers/:id/tests
export const listTestsForCenterApi = (centerId) =>
  api.get(`/api/browse/centers/${centerId}/tests`);

// GET /api/browse/tests/:id/slots?center=&date=YYYY-MM-DD
export const listSlotsForTestApi = (testId, centerId, date) =>
  api.get(`/api/browse/tests/${testId}/slots`, { params: { center: centerId, date } });
