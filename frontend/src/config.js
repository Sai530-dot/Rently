// Same-origin requests use the development proxy and the production reverse proxy.
export const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || '/api').replace(/\/$/, '');
