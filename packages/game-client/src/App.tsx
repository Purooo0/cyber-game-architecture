import React, { useState, useEffect } from 'react'
import GameClientService from './services/api'
import { LandingPage } from './components/pages/LandingPage'
import { LoginPage } from './components/pages/LoginPage'
import { RegisterPage } from './components/pages/RegisterPage'
import { DashboardPage } from './components/pages/DashboardPage'
import { LeaderboardPage } from './components/pages/LeaderboardPage'
import { SettingsPage } from './components/pages/SettingsPage'
import { SimulationPage } from './components/pages/SimulationPage'
import { CafeScenarioPage } from './components/pages/CafeScenarioPage'
import { BedroomScenarioPage } from './components/pages/BedroomScenarioPage'
import AdminFeedbackPage from './components/pages/AdminFeedbackPage'

type PageName = 'landing' | 'login' | 'register' | 'dashboard' | 'simulation' | 'leaderboard' | 'settings' | 'scoring' | 'bedroom' | 'admin-feedback'

interface User {
  id: string
  email: string
  username: string
  level?: number
  totalScore?: number
  rank?: string
}

interface AppState {
  currentPage: PageName
  scenarioId?: string
  isLoading: boolean
  isAuthenticated: boolean
  user: User | null
  error: string | null
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentPage: 'landing',
    isLoading: false,
    isAuthenticated: false,
    user: null,
    error: null,
  })

  const gameClient = new GameClientService({
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000'
  })

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken')
        if (token) {
          try {
            const user = await gameClient.getCurrentUser()
            if (user) {
              setState(prev => ({
                ...prev,
                isAuthenticated: true,
                user,
                currentPage: 'dashboard'
              }))
            } else {
              // Token exists but invalid/expired - clear it silently
              localStorage.removeItem('authToken')
              // This is not an error - normal auth flow
              console.debug('[App] No valid user found, cleared invalid token')
            }
          } catch (error) {
            // Silently handle - token was invalid
            localStorage.removeItem('authToken')
            console.debug('[App] Auth check failed, cleared token:', error instanceof Error ? error.message : 'Unknown error')
          }
        }
      } catch (error) {
        // Silent error - this is part of normal auth flow
        console.debug('[App] Auth check error (expected if no session):', error instanceof Error ? error.message : 'Unknown error')
        localStorage.removeItem('authToken')
      }
    }

    checkAuth()
  }, [])

  const handleLogin = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      const result = await gameClient.login(email, password)
      
      if (result.success && result.token && result.user) {
        localStorage.setItem('authToken', result.token)
        const user = result.user as User
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          user,
          currentPage: 'dashboard',
          isLoading: false,
          error: null
        }))
      } else {
        setState(prev => ({
          ...prev,
          error: result.message || 'Login failed',
          isLoading: false
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Login failed',
        isLoading: false
      }))
    }
  }

  const handleRegister = async (username: string, email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      const result = await gameClient.register(email, password, username)
      
      if (result.success) {
        // Auto-login after register
        await handleLogin(email, password)
      } else {
        setState(prev => ({
          ...prev,
          error: result.message || 'Registration failed',
          isLoading: false
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Registration failed',
        isLoading: false
      }))
    }
  }

  const handleLogout = async () => {
    try {
      await gameClient.logout()
      localStorage.removeItem('authToken')
      setState({
        currentPage: 'landing',
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: null,
      })
    } catch (error) {
      console.error('Logout error:', error)
      setState({
        currentPage: 'landing',
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: null,
      })
    }
  }

  const navigateTo = (page: string, scenarioId?: string) => {
    // Protect dashboard and simulation pages
    if ((page === 'dashboard' || page === 'simulation') && !state.isAuthenticated) {
      setState(prev => ({ ...prev, currentPage: 'login' }))
      return
    }

    setState(prev => ({ 
      ...prev, 
      currentPage: page as PageName,
      scenarioId: scenarioId || prev.scenarioId,
      error: null
    }))
  }

  return (
    <div className="app-container">
      {state.currentPage === 'landing' && !state.isAuthenticated && (
        <LandingPage onNavigate={navigateTo} />
      )}
      {state.currentPage === 'login' && !state.isAuthenticated && (
        <LoginPage 
          onNavigate={navigateTo}
          onLogin={handleLogin}
          isLoading={state.isLoading}
          error={state.error}
        />
      )}
      {state.currentPage === 'register' && !state.isAuthenticated && (
        <RegisterPage 
          onNavigate={navigateTo}
          onRegister={handleRegister}
          isLoading={state.isLoading}
          error={state.error}
        />
      )}
      {state.currentPage === 'dashboard' && state.isAuthenticated && state.user && (
        <DashboardPage 
          onNavigate={navigateTo}
          userName={state.user.username}
          user={state.user}
          onLogout={handleLogout}
        />
      )}
      {state.currentPage === 'leaderboard' && state.isAuthenticated && (
        <LeaderboardPage 
          onNavigate={navigateTo}
          currentPlayerName={state.user?.username || 'Agent_X'}
        />
      )}
      {state.currentPage === 'settings' && state.isAuthenticated && state.user && (
        <SettingsPage 
          onNavigate={navigateTo}
          userName={state.user.username}
          onLogout={handleLogout}
        />
      )}
      {state.currentPage === 'simulation' && state.scenarioId && state.isAuthenticated && (
        <>
          {/* Scenario 1: School Phishing (original SimulationPage) */}
          {(state.scenarioId === '1' || state.scenarioId === 'emergency-school') && (
            <SimulationPage 
              scenarioId={state.scenarioId}
              onNavigate={navigateTo}
              onLogout={handleLogout}
            />
          )}
          
          {/* Scenario 2: Cafe WiFi Evil Twin Attack */}
          {(state.scenarioId === '2' || state.scenarioId === 'security-wifi') && (
            <CafeScenarioPage 
              scenarioId={state.scenarioId}
              onNavigate={navigateTo}
              onLogout={handleLogout}
            />
          )}
          
          {/* Default: SimulationPage if scenario not recognized */}
          {!(state.scenarioId === '1' || state.scenarioId === '2' || state.scenarioId === 'emergency-school' || state.scenarioId === 'security-wifi') && (
            <SimulationPage 
              scenarioId={state.scenarioId}
              onNavigate={navigateTo}
              onLogout={handleLogout}
            />
          )}
        </>
      )}
      {state.currentPage === 'bedroom' && (
        <BedroomScenarioPage />
      )}
      {state.currentPage === 'admin-feedback' && state.isAuthenticated && state.user?.email === 'admin26@gmail.com' && (
        <AdminFeedbackPage />
      )}
      {state.currentPage === 'admin-feedback' && state.isAuthenticated && state.user?.email !== 'admin26@gmail.com' && (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="font-pixel text-2xl text-destructive mb-4">ACCESS DENIED</h1>
            <p className="text-foreground/60 mb-6">Admin access only</p>
            <button 
              onClick={() => navigateTo('dashboard')}
              className="px-6 py-2 bg-primary text-primary-foreground font-pixel text-sm hover:opacity-80 transition-opacity"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
