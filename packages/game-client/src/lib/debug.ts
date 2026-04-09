/**
 * Debug logging utility with conditional logging
 * ✅ OPTIMIZATION: Reduces console overhead in production
 * 
 * Usage:
 * debugLog('[Component] Message') // Only logs if DEBUG is true
 * debugWarn('[Component] Warning')
 * debugError('[Component] Error')
 */

// Detect if DEBUG mode is enabled via environment or localStorage
const isDebugEnabled = (): boolean => {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem('DEBUG_MODE') === 'true'
}

export const debugLog = (message: string, ...args: any[]): void => {
  if (!isDebugEnabled()) return
  console.log(`[DEBUG] ${message}`, ...args)
}

export const debugWarn = (message: string, ...args: any[]): void => {
  if (!isDebugEnabled()) return
  console.warn(`[WARN] ${message}`, ...args)
}

export const debugError = (message: string, ...args: any[]): void => {
  // Always log errors
  console.error(`[ERROR] ${message}`, ...args)
}

export const enableDebug = (): void => {
  localStorage.setItem('DEBUG_MODE', 'true')
  console.log('✅ Debug mode enabled. Reload page to apply.')
}

export const disableDebug = (): void => {
  localStorage.removeItem('DEBUG_MODE')
  console.log('✅ Debug mode disabled. Reload page to apply.')
}

export const getDebugStatus = (): boolean => {
  return isDebugEnabled()
}
