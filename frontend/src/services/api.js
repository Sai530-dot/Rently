import { API_BASE_URL } from '../config';

// Generic API call function
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
}

// API functions
export const api = {
  // University APIs
  getUniversities: () => apiCall('/universities/'),
  
  // Auth APIs
  studentSignup: (data) => apiCall('/signup/student/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  landlordSignup: (data) => apiCall('/signup/landlord/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Roommate matching
  savePreferences: (data) => apiCall('/roommate-matching/save-preferences', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  matchRoommates: (data) => apiCall('/roommate-matching/match', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};
