import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'
import { debugError } from './lib/debug'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Capture unhandled promise rejections to help diagnose production-only errors.
// Enabled without excessive noise: always logs as error, but only minimal formatting.
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    try {
      const reason: any = (event as any).reason
      debugError('Unhandled Promise Rejection', {
        message: reason?.message,
        name: reason?.name,
        stack: reason?.stack,
        reason,
      })
    } catch {
      // ignore
    }
  })
}
