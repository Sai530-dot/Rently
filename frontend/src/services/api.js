import { API_BASE_URL } from '../config';

let csrfToken;
let sessionRequest;
async function request(endpoint, options = {}) {
  const method = options.method || 'GET';
  if (method !== 'GET' && !csrfToken) await api.session();
  let response;
  try {
    response = await fetch(API_BASE_URL + endpoint, {
      ...options, credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}), ...options.headers },
    });
  } catch {
    throw new Error('Cannot reach the server. Check your connection and try again.');
  }
  const data = await response.json().catch(() => ({}));
  if (data.csrfToken) csrfToken = data.csrfToken;
  if (!response.ok) {
    if (response.status === 401 && endpoint !== '/auth/login/') window.dispatchEvent(new Event('session-expired'));
    const error = new Error(data.message || 'The request could not be completed. Please try again.');
    error.status = response.status;
    throw error;
  }
  return data;
}
const post = (url, data = {}, method = 'POST') => request(url, { method, body: JSON.stringify(data) });
export const api = {
  session: () => {
    if (!sessionRequest) sessionRequest = request('/auth/session/').finally(() => { sessionRequest = null; });
    return sessionRequest;
  },
  login: data => post('/auth/login/', data),
  logout: () => post('/auth/logout/'),
  studentSignup: data => post('/signup/student/', data),
  landlordSignup: data => post('/signup/landlord/', data),
  resetPassword: data => post('/auth/password-reset/', data),
  confirmPassword: data => post('/auth/password-confirm/', data),
  changePassword: data => post('/auth/password-change/', data),
  getUniversities: () => request('/universities/'),
  evaluateOffer: data => post('/offer-evaluation/evaluate', data),
  savePreferences: data => post('/profile/', data),
  getProperties: (mine = false) => request('/properties/' + (mine ? '?mine=true' : '')),
  analyzeLocationInsights: propertyId => post('/location-insights/analyze/', { property_id: propertyId }),
  saveProperty: id => post('/saved-properties/' + id + '/'),
  unsaveProperty: id => post('/saved-properties/' + id + '/', {}, 'DELETE'),
  getSavedProperties: () => request('/saved-properties/'),
  createProperty: data => post('/properties/', data),
  updateProperty: (id, data) => post('/properties/' + id + '/', data, 'PATCH'),
  deleteProperty: id => post('/properties/' + id + '/', {}, 'DELETE'),
  matchRoommates: () => request('/roommates/'),
  decideRoommate: (id, liked) => post('/roommates/' + id + '/decision/', { liked }),
  resetPasses: () => post('/roommates/passes/', {}, 'DELETE'),
  getConversations: () => request('/conversations/'),
  startConversation: recipient_id => post('/conversations/', { recipient_id }),
  getMessages: id => request('/conversations/' + id + '/messages/'),
  sendMessage: (id, text) => post('/conversations/' + id + '/messages/', { text }),
};
