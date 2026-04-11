// Centralized API base URL.
// - In production, VITE_API_URL MUST be set to the server deployment URL.
// - In development, it can be omitted and we fall back to localhost.
const raw = import.meta.env.VITE_API_URL

export const API_URL = raw && raw.trim().length > 0
  ? raw.replace(/\/+$/, '')
  : (import.meta.env.PROD
      ? '' // same-origin (only works if you proxy /api from the same host)
      : 'http://localhost:3000')