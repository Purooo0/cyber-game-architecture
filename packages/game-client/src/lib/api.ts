// Centralized API base URL.
// - In production, VITE_API_URL MUST be set to the server deployment URL.
// - In development, it can be omitted and we fall back to localhost.
const raw = import.meta.env.VITE_API_URL

export const API_URL = raw && raw.trim().length > 0
  ? raw.replace(/\/+$/, '')
  : (import.meta.env.PROD
      ? '' // same-origin (only works if you proxy /api from the same host)
      : 'http://localhost:3000')

// Safely parse JSON responses.
// Prevents "Unexpected token '<'" when an endpoint returns HTML (SPA fallback / 404 page / proxy misroute).
export async function safeJson<T = any>(response: Response, context?: string): Promise<T> {
  const contentType = response.headers.get('content-type') || ''
  const text = await response.text()

  if (
    contentType.includes('text/html') ||
    /^\s*<!doctype html/i.test(text) ||
    /^\s*<html/i.test(text) ||
    /<div\s+id=["']root["']/.test(text)
  ) {
    const message = `[safeJson] Expected JSON but received HTML${context ? ` (${context})` : ''}. status=${response.status}`
    console.warn(message, {
      url: response.url,
      contentType,
      preview: text.substring(0, 140),
    })
    throw new Error(message)
  }

  try {
    return JSON.parse(text) as T
  } catch (e) {
    const message = `[safeJson] Failed to parse JSON${context ? ` (${context})` : ''}. status=${response.status}`
    console.warn(message, {
      url: response.url,
      contentType,
      preview: text.substring(0, 180),
    })
    throw e
  }
}