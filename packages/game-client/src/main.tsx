import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'
import { debugError } from './lib/debug'

// React entry point for the Vite client.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Capture unhandled promise rejections with compact diagnostics for production issues.
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
      // Avoid crashing the global error handler itself.
    }
  })
}
