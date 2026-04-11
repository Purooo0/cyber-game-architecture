// Prefer explicit VITE_API_URL when provided.
// If not set:
// - dev: talk to local server
// - prod (Vercel/static): use same-origin (works with rewrites/proxy if configured)
export const API_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : (import.meta.env.DEV ? 'http://localhost:3000' : '')