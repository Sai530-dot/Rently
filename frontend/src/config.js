// Shared API configuration for frontend calls.
// Prefer explicit env var; otherwise use localhost when running the React dev server,
// and fall back to the deployed API for production builds.
const guessLocal =
  typeof window !== 'undefined' &&
  window.location &&
  window.location.hostname === 'localhost';

export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  (guessLocal ? 'http://localhost:8000/api' : 'https://rently-bked.vercel.app/api');
